import type {
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasPorPartidoRow,
} from "@sqlc/timba_sql";
import type { ITimbaRepository } from "../interface/repository/timba.repository";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type {
	AceptarTimbaInput,
	AceptarTimbaResult,
	CancelarTimbaInput,
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
	) {}

	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null> {
		return this.timbaRepo.verPartidoParaTimba(partidoId);
	}

	async crearTimba(args: CrearTimbaInput): Promise<CrearTimbaResult> {
		if (args.puntos <= 0) {
			throw new Error("Los puntos deben ser mayores a 0.");
		}

		const [partido, jugadorPuntos, apuestasActivas] = await Promise.all([
			this.timbaRepo.verPartidoParaTimba(args.partidoId),
			this.usuariosRepo.obtenerPuntos(args.jugador1Id),
			this.timbaRepo.sumarApuestasActivas(args.jugador1Id),
		]);

		if (!partido) throw new Error("Partido no encontrado.");
		if (partido.estado !== "programado") {
			throw new Error("Solo puedes crear timbas para partidos programados.");
		}

		if (args.puntos > partido.puntosBase) {
			throw new Error(`Máximo ${partido.puntosBase} 💠 en esta fase.`);
		}
		const cap = Math.floor(jugadorPuntos * 0.1);
		if (cap === 0) {
			throw new Error("No tienes suficientes puntos para jugar Timba Time.");
		}
		const disponible = cap - apuestasActivas;
		if (args.puntos > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugadorPuntos} pts, pero ya tienes ${apuestasActivas} en juego).`,
			);
		}

		const created = await this.timbaRepo.crear({
			partidoId: args.partidoId,
			descripcion: args.descripcion,
			jugador1Id: args.jugador1Id,
			puntos: args.puntos,
		});
		if (!created) throw new Error("Error creando la timba.");

		const timba = await this.timbaRepo.verTimba(created.id);
		if (!timba) throw new Error("Error cargando la timba creada.");

		return {
			timbaId: created.id,
			puntos: timba.puntos,
			descripcion: timba.descripcion,
			jugador1Id: timba.jugador1Id,
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
		if (timba.jugador1Id === args.jugador2Id) {
			throw new Error("No puedes aceptar tu propio reto.");
		}
		if (timba.partidoEstado !== "programado") {
			throw new Error("El partido ya comenzó, no se puede aceptar la timba.");
		}

		const [emparejamiento, jugador2Puntos, apuestasActivas] = await Promise.all(
			[
				this.timbaRepo.checkEmparejamiento({
					partidoId: timba.partidoId,
					jugador1Id: timba.jugador1Id,
					jugador2Id: args.jugador2Id,
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
		if (timba.puntos > disponible) {
			throw new Error(
				`No puedes apostar esa cantidad de puntos. Tu máximo es **${disponible} 💠** (10% de tus ${jugador2Puntos} pts, pero ya tienes ${apuestasActivas} en juego).`,
			);
		}

		await this.timbaRepo.aceptar({
			id: args.timbaId,
			jugador2Id: args.jugador2Id,
		});

		return {
			timbaId: args.timbaId,
			puntos: timba.puntos,
			descripcion: timba.descripcion,
			jugador1Id: timba.jugador1Id,
			jugador2Id: args.jugador2Id,
			jugador1Nombre: timba.jugador1Nombre,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoLocalSiglas: timba.equipoLocalSiglas,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
			equipoVisitanteSiglas: timba.equipoVisitanteSiglas,
		};
	}

	async cancelarTimba(args: CancelarTimbaInput): Promise<void> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);

		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.jugador1Id !== args.jugador1Id) {
			throw new Error("Solo puedes cancelar tus propias timbas.");
		}
		if (timba.estado !== "abierta") {
			throw new Error(
				"Esta timba ya no puede cancelarse (ya fue aceptada o resuelta).",
			);
		}

		await this.timbaRepo.cancelar({ id: args.timbaId });
	}

	async anularTimba(timbaId: number): Promise<void> {
		await this.timbaRepo.anular({ id: timbaId });
	}

	async resolverTimba(args: ResolverTimbaInput): Promise<ResolverTimbaResult> {
		const timba = await this.timbaRepo.verTimba(args.timbaId);

		if (!timba) throw new Error("Timba no encontrada.");
		if (timba.estado !== "cerrada")
			throw new Error("Esta timba no está cerrada.");
		if (!timba.jugador2Id)
			throw new Error("La timba no tiene segundo jugador.");

		const ganadorId =
			args.ganadorJugador === "j1" ? timba.jugador1Id : timba.jugador2Id;
		const perdedorId =
			args.ganadorJugador === "j1" ? timba.jugador2Id : timba.jugador1Id;
		const ganadorNombre =
			args.ganadorJugador === "j1"
				? timba.jugador1Nombre
				: timba.jugador2Nombre;
		const perdedorNombre =
			args.ganadorJugador === "j1"
				? timba.jugador2Nombre
				: timba.jugador1Nombre;

		await Promise.all([
			this.timbaRepo.resolver({ id: args.timbaId, ganadorId }),
			this.usuariosRepo.ajustarPuntos(ganadorId, timba.puntos),
			this.usuariosRepo.ajustarPuntos(perdedorId, -timba.puntos),
		]);

		return {
			ganadorId,
			ganadorNombre,
			perdedorId,
			perdedorNombre,
			puntos: timba.puntos,
			descripcion: timba.descripcion,
			equipoLocalNombre: timba.equipoLocalNombre,
			equipoLocalBandera: timba.equipoLocalBandera,
			equipoVisitanteNombre: timba.equipoVisitanteNombre,
			equipoVisitanteBandera: timba.equipoVisitanteBandera,
		};
	}

	verTimbasCerradasPorPartido(
		partidoId: number,
	): Promise<VerTimbasCerradasPorPartidoRow[]> {
		return this.timbaRepo.verTimbasCerradasPorPartido(partidoId);
	}

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]> {
		return this.timbaRepo.verTimbasPorPartido(partidoId);
	}

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]> {
		return this.timbaRepo.verMisTimbas(jugador1Id);
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
}
