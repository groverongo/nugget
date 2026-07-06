import type {
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasMedioTiempoPorPartidoRow,
	VerTimbasPorPartidoRow,
	VerTimbasResueltasPorPartidoRow,
	VerTodasLasTimbasRow,
} from "@sqlc/timba_sql";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { ITimbaRepository } from "../interface/repository/timba.repository";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type {
	AceptarContraofertaInput,
	AceptarTimbaInput,
	AceptarTimbaResult,
	AnularTimbaResult,
	CancelarTimbaInput,
	CancelarTimbaResult,
	CrearContraofertaInput,
	CrearContraofertaResult,
	CrearTimbaInput,
	CrearTimbaResult,
	ITimbaService,
	ResolverTimbaInput,
	ResolverTimbaResult,
} from "../interface/service/timba.service";

export class TimbaService implements ITimbaService {
	constructor(
		private readonly timbaRepo: ITimbaRepository,
		private readonly usuariosRepo: IUsuariosRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
	) {}

	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null> {
		return this.timbaRepo.verPartidoParaTimba(partidoId);
	}

	verTimba(timbaId: number): Promise<VerTimbaRow | null> {
		return this.timbaRepo.verTimba(timbaId);
	}

	async crearTimba(args: CrearTimbaInput): Promise<CrearTimbaResult> {
		const puntosArriesgados = args.puntosArriesgados ?? args.puntosPropuestos;

		if (args.puntosPropuestos <= 0 || puntosArriesgados <= 0) {
			throw new Error("Los puntos deben ser mayores a 0.");
		}

		const [partido, jugadorPuntos, apuestasActivas] = await Promise.all([
			this.timbaRepo.verPartidoParaTimba(args.partidoId),
			this.usuariosRepo.obtenerPuntos(args.jugador1Id),
			this.timbaRepo.sumarApuestasActivas(args.jugador1Id),
		]);

		if (!partido) throw new Error("Partido no encontrado.");
		if (
			partido.estado !== "programado" &&
			partido.estado !== "medio_tiempo" &&
			partido.estado !== "penales"
		) {
			throw new Error(
				"Solo puedes crear timbas para partidos programados o en medio tiempo.",
			);
		}

		const prediccion =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.jugador1Id,
				partidoId: args.partidoId,
			});
		if (!prediccion) {
			throw new Error(
				"Debes tener una predicción para este partido antes de crear una timba.",
			);
		}

		if (
			args.puntosPropuestos > partido.puntosBase ||
			puntosArriesgados > partido.puntosBase
		) {
			throw new Error(
				`Máximo ${partido.puntosBase} 💠 por jugador en esta fase.`,
			);
		}
		const cap = Math.floor(jugadorPuntos * 0.1);
		if (cap === 0) {
			throw new Error("No tienes suficientes puntos para jugar Timba Time.");
		}
		const disponible = cap - apuestasActivas;
		if (args.puntosPropuestos > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugadorPuntos} pts, pero ya tienes ${apuestasActivas} en juego).`,
			);
		}

		const created = await this.timbaRepo.crear({
			partidoId: args.partidoId,
			descripcion: args.descripcion,
			jugador_1Id: args.jugador1Id,
			puntosPropuestos: args.puntosPropuestos,
			puntosArriesgados,
		});
		if (!created) throw new Error("Error creando la timba.");

		const timba = await this.timbaRepo.verTimba(created.id);
		if (!timba) throw new Error("Error cargando la timba creada.");

		return {
			timbaId: created.id,
			puntosPropuestos: timba.puntosPropuestos,
			puntosArriesgados: timba.puntosArriesgados,
			descripcion: timba.descripcion,
			jugador1Id: timba.jugador_1Id,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoLocalSiglas: timba.equipoLocalSiglas,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			equipoVisitanteSiglas: timba.equipoVisitanteSiglas,
		};
	}

	async aceptarTimba(args: AceptarTimbaInput): Promise<AceptarTimbaResult> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);

		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.estado !== "abierta")
			throw new Error("Esta timba ya no está disponible.");
		if (timba.jugador_1Id === args.jugador2Id) {
			throw new Error("No puedes aceptar tu propio reto.");
		}
		if (
			timba.partidoEstado !== "programado" &&
			timba.partidoEstado !== "medio_tiempo" &&
			timba.partidoEstado !== "penales"
		) {
			throw new Error("El partido ya comenzó, no se puede aceptar la timba.");
		}

		const prediccion =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.jugador2Id,
				partidoId: timba.partidoId,
			});
		if (!prediccion) {
			throw new Error(
				"Debes tener una predicción para este partido antes de aceptar una timba.",
			);
		}

		const [emparejamiento, jugador2Puntos, apuestasActivas] = await Promise.all(
			[
				this.timbaRepo.checkEmparejamiento({
					partidoId: timba.partidoId,
					jugador_1Id: timba.jugador_1Id,
					jugador_2Id: args.jugador2Id,
				}),
				this.usuariosRepo.obtenerPuntos(args.jugador2Id),
				this.timbaRepo.sumarApuestasActivas(args.jugador2Id),
			],
		);

		if (emparejamiento > 0) {
			throw new Error(
				"Ya existe una timba activa entre ustedes para este partido.",
			);
		}

		const cap = Math.floor(jugador2Puntos * 0.1);
		if (cap === 0) {
			throw new Error("No tienes suficientes puntos para jugar Timba Time.");
		}
		const disponible = cap - apuestasActivas;
		if (timba.puntosArriesgados > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugador2Puntos} pts, pero ya tienes ${apuestasActivas} en juego).`,
			);
		}

		const contraofertasPendientes =
			await this.timbaRepo.verContraofertasMensajesPorTimba(args.timbaId);

		await Promise.all([
			this.timbaRepo.aceptar({
				id: args.timbaId,
				jugador_2Id: args.jugador2Id,
			}),
			this.timbaRepo.cancelarContraofertasPorTimba(args.timbaId),
		]);

		return {
			timbaId: args.timbaId,
			puntosPropuestos: timba.puntosPropuestos,
			puntosArriesgados: timba.puntosArriesgados,
			descripcion: timba.descripcion,
			jugador1Id: timba.jugador_1Id,
			jugador2Id: args.jugador2Id,
			jugador1Nombre: timba.jugador_1Nombre,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoLocalSiglas: timba.equipoLocalSiglas,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			equipoVisitanteSiglas: timba.equipoVisitanteSiglas,
			cancelledContraofertaMessageIds: contraofertasPendientes
				.map((c) => c.discordMessageId)
				.filter((id): id is string => id !== null),
		};
	}

	async cancelarTimba(args: CancelarTimbaInput): Promise<CancelarTimbaResult> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);

		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.jugador_1Id !== args.jugador1Id) {
			throw new Error("Solo puedes cancelar tus propias timbas.");
		}
		if (timba.estado !== "abierta" && timba.estado !== "contraoferta") {
			throw new Error(
				"Esta timba ya no puede cancelarse (ya fue aceptada o resuelta).",
			);
		}

		const contraofertasPendientes =
			await this.timbaRepo.verContraofertasMensajesPorTimba(args.timbaId);

		await Promise.all([
			this.timbaRepo.cancelar({ id: args.timbaId }),
			this.timbaRepo.cancelarContraofertasPorTimba(args.timbaId),
		]);

		return {
			jugador_1Id: timba.jugador_1Id,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoLocalSiglas: timba.equipoLocalSiglas,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			equipoVisitanteSiglas: timba.equipoVisitanteSiglas,
			discordMessageId: timba.discordMessageId,
			cancelledContraofertaMessageIds: contraofertasPendientes
				.map((c) => c.discordMessageId)
				.filter((id): id is string => id !== null),
		};
	}

	async anularTimba(timbaId: number): Promise<AnularTimbaResult> {
		const timba = await this.timbaRepo.verTimba(timbaId);
		if (!timba) throw new Error("Timba no encontrada.");
		await this.timbaRepo.anular({ id: timbaId });
		return {
			jugador_1Id: timba.jugador_1Id,
			jugador_2Id: timba.jugador_2Id,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			descripcion: timba.descripcion,
			discordMessageId: timba.discordMessageId,
		};
	}

	// A diferencia de anularTimba (voto comunitario), esto usa 'cancelada' en
	// vez de 'anulada' para que los puntos se liberen de inmediato en lugar de
	// quedar congelados hasta que finalice el partido.
	async anularTimbaAdmin(timbaId: number): Promise<AnularTimbaResult> {
		const timba = await this.timbaRepo.verTimba(timbaId);
		if (!timba) throw new Error("Timba no encontrada.");
		await this.timbaRepo.cancelar({ id: timbaId });
		return {
			jugador_1Id: timba.jugador_1Id,
			jugador_2Id: timba.jugador_2Id,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			descripcion: timba.descripcion,
			discordMessageId: timba.discordMessageId,
		};
	}

	async resolverTimba(args: ResolverTimbaInput): Promise<ResolverTimbaResult> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);

		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.estado !== "cerrada")
			throw new Error("Esta timba no está cerrada.");
		if (!timba.jugador_2Id)
			throw new Error("La timba no tiene segundo jugador.");

		const ganadorId =
			args.ganadorJugador === "j1" ? timba.jugador_1Id : timba.jugador_2Id;
		const perdedorId =
			args.ganadorJugador === "j1" ? timba.jugador_2Id : timba.jugador_1Id;
		const ganadorNombre =
			args.ganadorJugador === "j1"
				? timba.jugador_1Nombre
				: timba.jugador_2Nombre;
		const perdedorNombre =
			args.ganadorJugador === "j1"
				? timba.jugador_2Nombre
				: timba.jugador_1Nombre;

		// J1 gana → le roba puntosArriesgados a J2; J2 gana → le roba puntosPropuestos a J1
		const puntosRobados =
			args.ganadorJugador === "j1"
				? timba.puntosArriesgados
				: timba.puntosPropuestos;

		await Promise.all([
			this.timbaRepo.resolver({ id: args.timbaId, ganadorId }),
			this.usuariosRepo.ajustarPuntos(ganadorId, puntosRobados),
			this.usuariosRepo.ajustarPuntos(perdedorId, -puntosRobados),
		]);

		const [puntosGanador, puntosPerdedor] = await Promise.all([
			this.usuariosRepo.obtenerPuntos(ganadorId),
			this.usuariosRepo.obtenerPuntos(perdedorId),
		]);

		await Promise.all([
			this.prediccionesRepo.actualizarPuntosActualesPrediccion({
				puntosActuales: puntosGanador,
				usuarioId: ganadorId,
				partidoId: timba.partidoId,
			}),
			this.prediccionesRepo.actualizarPuntosActualesPrediccion({
				puntosActuales: puntosPerdedor,
				usuarioId: perdedorId,
				partidoId: timba.partidoId,
			}),
		]);

		return {
			ganadorId,
			ganadorNombre,
			perdedorId,
			perdedorNombre,
			puntosRobados,
			descripcion: timba.descripcion,
			equipoLocalSiglas: timba.equipoLocalSiglas,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoVisitanteSiglas: timba.equipoVisitanteSiglas,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
		};
	}

	verTimbasCerradasPorPartido(
		partidoId: number,
	): Promise<VerTimbasCerradasPorPartidoRow[]> {
		return this.timbaRepo.verTimbasCerradasPorPartido(partidoId);
	}

	verTimbasResueltasPorPartido(
		partidoId: number,
	): Promise<VerTimbasResueltasPorPartidoRow[]> {
		return this.timbaRepo.verTimbasResueltasPorPartido(partidoId);
	}

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]> {
		return this.timbaRepo.verTimbasPorPartido(partidoId);
	}

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]> {
		return this.timbaRepo.verMisTimbas(jugador1Id);
	}

	verTodasLasTimbas(): Promise<VerTodasLasTimbasRow[]> {
		return this.timbaRepo.verTodasLasTimbas();
	}

	verFechasDeTimbasPorUsuario(jugador1Id: string): Promise<string[]> {
		return this.timbaRepo.verFechasDeTimbasPorUsuario(jugador1Id);
	}

	verMisTimbasPorFecha(
		args: VerMisTimbasPorFechaArgs,
	): Promise<VerMisTimbasPorFechaRow[]> {
		return this.timbaRepo.verMisTimbasPorFecha(args);
	}

	cancelarTimbasAbiertas(partidoId: number): Promise<void> {
		return this.timbaRepo.cancelarTimbasAbiertasPorPartido(partidoId);
	}

	verTimbasMedioTiempoPorPartido(
		partidoId: number,
	): Promise<VerTimbasMedioTiempoPorPartidoRow[]> {
		return this.timbaRepo.verTimbasMedioTiempoPorPartido(partidoId);
	}

	async resolverTimbaMedioTiempo(
		args: ResolverTimbaInput,
	): Promise<ResolverTimbaResult> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);
		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.estado !== "cerrada" && timba.estado !== "resuelta")
			throw new Error("La timba no está en estado válido para resolver.");

		if (timba.estado === "resuelta" && timba.ganadorId) {
			const prevPerdedorId =
				timba.jugador_1Id === timba.ganadorId
					? timba.jugador_2Id!
					: timba.jugador_1Id;
			const prevPuntosRobados =
				timba.ganadorId === timba.jugador_1Id
					? timba.puntosArriesgados
					: timba.puntosPropuestos;
			await Promise.all([
				this.timbaRepo.revertir({ id: args.timbaId }),
				this.usuariosRepo.ajustarPuntos(timba.ganadorId, -prevPuntosRobados),
				this.usuariosRepo.ajustarPuntos(prevPerdedorId, prevPuntosRobados),
			]);
		}

		return this.resolverTimba(args);
	}

	async revertirTimba(timbaId: number): Promise<void> {
		const timba = await this.timbaRepo.verTimba(timbaId);
		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.estado !== "resuelta" || !timba.ganadorId)
			throw new Error("La timba no está resuelta.");

		const perdedorId =
			timba.jugador_1Id === timba.ganadorId
				? timba.jugador_2Id!
				: timba.jugador_1Id;
		const puntosRobados =
			timba.ganadorId === timba.jugador_1Id
				? timba.puntosArriesgados
				: timba.puntosPropuestos;

		await Promise.all([
			this.timbaRepo.revertir({ id: timbaId }),
			this.usuariosRepo.ajustarPuntos(timba.ganadorId, -puntosRobados),
			this.usuariosRepo.ajustarPuntos(perdedorId, puntosRobados),
		]);
	}

	guardarMensajeTimba(timbaId: number, messageId: string): Promise<void> {
		return this.timbaRepo.guardarMensaje({
			id: timbaId,
			discordMessageId: messageId,
		});
	}

	async crearContraoferta(
		args: CrearContraofertaInput,
	): Promise<CrearContraofertaResult> {
		if (args.puntosPropuestos <= 0 || args.puntosArriesgados <= 0) {
			throw new Error("Los puntos deben ser mayores a 0.");
		}

		const timbaOriginal = await this.timbaRepo.verTimba(args.timbaOriginalId);
		if (!timbaOriginal) throw new Error("Timba no encontrada.");
		if (
			timbaOriginal.estado !== "abierta" &&
			timbaOriginal.estado !== "contraoferta"
		) {
			throw new Error("La timba ya no acepta contraofertas.");
		}
		if (timbaOriginal.jugador_1Id === args.jugador1Id) {
			throw new Error("No puedes hacerle contraoferta a tu propia timba.");
		}
		if (
			timbaOriginal.partidoEstado !== "programado" &&
			timbaOriginal.partidoEstado !== "medio_tiempo" &&
			timbaOriginal.partidoEstado !== "penales"
		) {
			throw new Error(
				"El partido ya comenzó, no se puede crear una contraoferta.",
			);
		}

		const [partido, jugadorPuntos, apuestasActivas, timbaRaiz] =
			await Promise.all([
				this.timbaRepo.verPartidoParaTimba(timbaOriginal.partidoId),
				this.usuariosRepo.obtenerPuntos(args.jugador1Id),
				this.timbaRepo.sumarApuestasActivas(args.jugador1Id),
				timbaOriginal.timbaOriginalId
					? this.timbaRepo.verTimba(timbaOriginal.timbaOriginalId)
					: Promise.resolve(null),
			]);

		if (!partido) throw new Error("Partido no encontrado.");

		const prediccion =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.jugador1Id,
				partidoId: timbaOriginal.partidoId,
			});
		if (!prediccion) {
			throw new Error(
				"Debes tener una predicción para este partido antes de hacer una contraoferta.",
			);
		}

		if (
			args.puntosPropuestos > partido.puntosBase ||
			args.puntosArriesgados > partido.puntosBase
		) {
			throw new Error(
				`Máximo ${partido.puntosBase} 💠 por jugador en esta fase.`,
			);
		}
		const cap = Math.floor(jugadorPuntos * 0.1);
		if (cap === 0) {
			throw new Error("No tienes suficientes puntos para jugar Timba Time.");
		}
		// Si J1 está contraofertando una contraoferta de su propia timba,
		// su timba raíz será cancelada al aceptarse, así que no cuenta contra el cap.
		const puntosRaizExcluir =
			timbaRaiz?.jugador_1Id === args.jugador1Id
				? timbaRaiz.puntosPropuestos
				: 0;
		const apuestasEfectivas = apuestasActivas - puntosRaizExcluir;
		const disponible = cap - apuestasEfectivas;
		if (args.puntosPropuestos > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugadorPuntos} pts, pero ya tienes ${apuestasEfectivas} en juego).`,
			);
		}

		const created = await this.timbaRepo.crearContraoferta({
			partidoId: timbaOriginal.partidoId,
			descripcion: args.descripcion,
			jugador_1Id: args.jugador1Id,
			puntosPropuestos: args.puntosPropuestos,
			puntosArriesgados: args.puntosArriesgados,
			timbaOriginalId: args.timbaOriginalId,
		});
		if (!created) throw new Error("Error creando la contraoferta.");

		return {
			contraofertaId: created.id,
			puntosPropuestos: args.puntosPropuestos,
			puntosArriesgados: args.puntosArriesgados,
			descripcion: args.descripcion,
			jugador1Id: args.jugador1Id,
			equipoLocalNombre: timbaOriginal.equipoLocalNombre,
			equipoLocalBandera: timbaOriginal.equipoLocalBandera,
			equipoLocalSiglas: timbaOriginal.equipoLocalSiglas,
			equipoVisitanteNombre: timbaOriginal.equipoVisitanteNombre,
			equipoVisitanteBandera: timbaOriginal.equipoVisitanteBandera,
			equipoVisitanteSiglas: timbaOriginal.equipoVisitanteSiglas,
			timbaOriginalId: args.timbaOriginalId,
			timbaOriginalJugador1Id: timbaOriginal.jugador_1Id,
		};
	}

	async aceptarContraoferta(
		args: AceptarContraofertaInput,
	): Promise<AceptarTimbaResult> {
		const contraoferta = await this.timbaRepo.verTimba(args.contraofertaId);
		if (!contraoferta) throw new Error("Contraoferta no encontrada.");
		if (contraoferta.estado !== "contraoferta") {
			throw new Error("Esta contraoferta ya no está disponible.");
		}
		if (!contraoferta.timbaOriginalId) {
			throw new Error("Contraoferta inválida: no tiene timba original.");
		}

		const timbaOriginal = await this.timbaRepo.verTimba(
			contraoferta.timbaOriginalId,
		);
		if (!timbaOriginal) throw new Error("Timba original no encontrada.");
		if (timbaOriginal.jugador_1Id !== args.jugador1OriginalId) {
			throw new Error(
				"Solo el creador de la timba original puede aceptar contraofertas.",
			);
		}
		if (
			timbaOriginal.partidoEstado !== "programado" &&
			timbaOriginal.partidoEstado !== "medio_tiempo" &&
			timbaOriginal.partidoEstado !== "penales"
		) {
			throw new Error("El partido ya comenzó, no se puede aceptar la timba.");
		}

		const prediccion =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.jugador1OriginalId,
				partidoId: timbaOriginal.partidoId,
			});
		if (!prediccion) {
			throw new Error(
				"Debes tener una predicción para este partido antes de aceptar una contraoferta.",
			);
		}

		const [jugadorPuntos, apuestasActivas] = await Promise.all([
			this.usuariosRepo.obtenerPuntos(args.jugador1OriginalId),
			this.timbaRepo.sumarApuestasActivas(args.jugador1OriginalId),
		]);

		const cap = Math.floor(jugadorPuntos * 0.1);
		if (cap === 0) {
			throw new Error("No tienes suficientes puntos para jugar Timba Time.");
		}
		// La timba original se cancelará al aceptar, descontarla de las apuestas activas
		const apuestasEfectivas = apuestasActivas - timbaOriginal.puntosPropuestos;
		const disponible = cap - apuestasEfectivas;
		// jugador1OriginalId paga puntosArriesgados de la contraoferta (J2 de la contraoferta)
		if (contraoferta.puntosArriesgados > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugadorPuntos} pts, pero ya tienes ${apuestasActivas} en juego).`,
			);
		}

		// Walk the whole chain up to the root timba, plus every sibling
		// contraoferta at each level and any counters made against the one
		// being accepted — all of it must die when this contraoferta wins.
		const cadenaACancelar =
			await this.timbaRepo.verCadenaContraofertasParaCancelar({
				timbaOriginalId: contraoferta.timbaOriginalId,
				contraofertaId: args.contraofertaId,
			});

		await Promise.all([
			this.timbaRepo.cancelarCadenaContraofertasParaAceptar({
				timbaOriginalId: contraoferta.timbaOriginalId,
				contraofertaId: args.contraofertaId,
			}),
			this.timbaRepo.aceptar({
				id: args.contraofertaId,
				jugador_2Id: args.jugador1OriginalId,
			}),
		]);

		return {
			timbaId: args.contraofertaId,
			puntosPropuestos: contraoferta.puntosPropuestos,
			puntosArriesgados: contraoferta.puntosArriesgados,
			descripcion: contraoferta.descripcion,
			jugador1Id: contraoferta.jugador_1Id,
			jugador2Id: args.jugador1OriginalId,
			jugador1Nombre: contraoferta.jugador_1Nombre,
			equipoLocalNombre: contraoferta.equipoLocalNombre,
			equipoLocalBandera: contraoferta.equipoLocalBandera,
			equipoLocalSiglas: contraoferta.equipoLocalSiglas,
			equipoVisitanteNombre: contraoferta.equipoVisitanteNombre,
			equipoVisitanteBandera: contraoferta.equipoVisitanteBandera,
			equipoVisitanteSiglas: contraoferta.equipoVisitanteSiglas,
			cancelledContraofertaMessageIds: cadenaACancelar
				.map((c) => c.discordMessageId)
				.filter((id): id is string => id !== null),
		};
	}

	async rechazarContraoferta(args: {
		contraofertaId: number;
		jugador1OriginalId: string;
	}): Promise<CancelarTimbaResult> {
		const contraoferta = await this.timbaRepo.verTimba(args.contraofertaId);
		if (!contraoferta) throw new Error("Contraoferta no encontrada.");
		if (contraoferta.estado !== "contraoferta") {
			throw new Error("Esta contraoferta ya no está disponible.");
		}
		if (!contraoferta.timbaOriginalId) {
			throw new Error("Contraoferta inválida: no tiene timba original.");
		}

		const timbaOriginal = await this.timbaRepo.verTimba(
			contraoferta.timbaOriginalId,
		);
		if (!timbaOriginal) throw new Error("Timba original no encontrada.");
		if (timbaOriginal.jugador_1Id !== args.jugador1OriginalId) {
			throw new Error(
				"Solo el creador de la timba original puede rechazar contraofertas.",
			);
		}

		const subContraofertasPendientes =
			await this.timbaRepo.verContraofertasMensajesPorTimba(
				args.contraofertaId,
			);

		// Cancel contraoferta and its own sub-contraofertas
		await Promise.all([
			this.timbaRepo.cancelar({ id: args.contraofertaId }),
			this.timbaRepo.cancelarContraofertasPorTimba(args.contraofertaId),
		]);

		return {
			jugador_1Id: contraoferta.jugador_1Id,
			equipoLocalNombre: contraoferta.equipoLocalNombre,
			equipoLocalBandera: contraoferta.equipoLocalBandera,
			equipoLocalSiglas: contraoferta.equipoLocalSiglas,
			equipoVisitanteNombre: contraoferta.equipoVisitanteNombre,
			equipoVisitanteBandera: contraoferta.equipoVisitanteBandera,
			equipoVisitanteSiglas: contraoferta.equipoVisitanteSiglas,
			discordMessageId: contraoferta.discordMessageId,
			cancelledContraofertaMessageIds: subContraofertasPendientes
				.map((c) => c.discordMessageId)
				.filter((id): id is string => id !== null),
		};
	}

	async verTimbaIdPorDiscordMessageId(
		discordMessageId: string,
	): Promise<number | null> {
		const row =
			await this.timbaRepo.verTimbaIdPorDiscordMessageId(discordMessageId);
		return row?.id ?? null;
	}
}
