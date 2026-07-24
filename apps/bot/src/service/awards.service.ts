import type {
	BuscarJugadoresNoEliminadosRow,
	VerAwardsResultadosRow,
	VerEquiposNoEliminadosRow,
	VerPrediccionesAwardsKORow,
	VerPrediccionesAwardsRow,
} from "@sqlc/awards_sql";
import type { VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	BuscarJugadoresRow,
	VerJugadoresPorEquipoRow,
} from "@sqlc/jugadores_sql";
import { config } from "@support/config";
import type { TxManager } from "@support/db.provider";
import type { IAwardsRepository } from "../interface/repository/awards.repository";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";
import type {
	AwardsKODisplay,
	AwardsKORaw,
	GuardarAwardsInput,
	GuardarAwardsKOInput,
	IAwardsService,
	MisAwardsResueltos,
	ResumenResolucionAward,
} from "../interface/service/awards.service";

type EquipoInfo = { nombre: string; bandera: string };
type JugadorInfo = {
	nombre: string;
	equipoNombre: string;
	equipoBandera: string;
};

export class AwardsService implements IAwardsService {
	constructor(
		private readonly awardsRepo: IAwardsRepository,
		private readonly estaticoRepo: IEstaticoRepository,
		private readonly txManager: TxManager,
	) {}

	async guardarAwards(
		input: GuardarAwardsInput,
	): Promise<"created" | "updated"> {
		const fechaInicio = new Date(config.polla.fecha_inicio_torneo);
		if (Date.now() >= fechaInicio.getTime()) {
			throw new Error("Las predicciones de awards ya están cerradas.");
		}

		const existing = await this.awardsRepo.verAwardsDeUsuario({
			id: input.usuarioId,
		});
		const eraVacio =
			!existing || Object.values(existing).every((v) => v === null);

		await this.awardsRepo.guardarAwards({
			id: input.usuarioId,
			awardCampeon: input.campeon,
			awardGoleador: input.goleador,
			awardMejorJugador: input.mejorJugador,
			awardMejorArquero: input.mejorArquero,
			awardMejorJugadorJoven: input.mejorJugadorJoven,
			awardMejorGol: input.mejorGol,
			awardSeleccionDecepcion: input.seleccionDecepcion,
			awardSeleccionSorpresa: input.seleccionSorpresa,
		});

		return eraVacio ? "created" : "updated";
	}

	async guardarAwardsAdmin(
		input: GuardarAwardsInput,
	): Promise<"created" | "updated"> {
		const existing = await this.awardsRepo.verAwardsDeUsuario({
			id: input.usuarioId,
		});
		const eraVacio =
			!existing || Object.values(existing).every((v) => v === null);

		await this.awardsRepo.guardarAwards({
			id: input.usuarioId,
			awardCampeon: input.campeon,
			awardGoleador: input.goleador,
			awardMejorJugador: input.mejorJugador,
			awardMejorArquero: input.mejorArquero,
			awardMejorJugadorJoven: input.mejorJugadorJoven,
			awardMejorGol: input.mejorGol,
			awardSeleccionDecepcion: input.seleccionDecepcion,
			awardSeleccionSorpresa: input.seleccionSorpresa,
		});

		return eraVacio ? "created" : "updated";
	}

	async verMisAwards(usuarioId: string): Promise<MisAwardsResueltos | null> {
		const raw = await this.awardsRepo.verAwardsDeUsuario({ id: usuarioId });
		if (!raw || Object.values(raw).every((v) => v === null)) {
			return null;
		}

		const equipos = await this.estaticoRepo.verEquipos({
			blanco: null,
			negro: null,
		});
		const equipoMap = new Map(equipos.map((e) => [e.id, e.nombre]));

		const playerIds = [
			raw.awardGoleador,
			raw.awardMejorJugador,
			raw.awardMejorArquero,
			raw.awardMejorJugadorJoven,
			raw.awardMejorGol,
		].filter((id): id is number => id !== null);

		const jugadores =
			playerIds.length > 0
				? await this.estaticoRepo.verJugadoresPorIds({ ids: playerIds })
				: [];
		const jugadorMap = new Map(jugadores.map((j) => [j.id, j]));

		const resolveJugador = (id: number | null): string | null => {
			if (id === null) return null;
			const j = jugadorMap.get(id);
			return j ? `${j.nombre} (${j.equipoNombre})` : null;
		};

		return {
			campeon: raw.awardCampeon
				? (equipoMap.get(raw.awardCampeon) ?? null)
				: null,
			goleador: resolveJugador(raw.awardGoleador),
			mejorJugador: resolveJugador(raw.awardMejorJugador),
			mejorArquero: resolveJugador(raw.awardMejorArquero),
			mejorJugadorJoven: resolveJugador(raw.awardMejorJugadorJoven),
			mejorGol: resolveJugador(raw.awardMejorGol),
			seleccionDecepcion: raw.awardSeleccionDecepcion
				? (equipoMap.get(raw.awardSeleccionDecepcion) ?? null)
				: null,
			seleccionSorpresa: raw.awardSeleccionSorpresa
				? (equipoMap.get(raw.awardSeleccionSorpresa) ?? null)
				: null,
		};
	}

	verEquiposWhiteHorse(): Promise<VerEquiposRow[]> {
		return this.estaticoRepo.verEquipos({ blanco: true, negro: null });
	}

	verEquiposDarkHorse(): Promise<VerEquiposRow[]> {
		return this.estaticoRepo.verEquipos({ blanco: null, negro: true });
	}

	verEquipos(): Promise<VerEquiposRow[]> {
		return this.estaticoRepo.verEquipos({ blanco: null, negro: null });
	}

	buscarJugadores(query: string): Promise<BuscarJugadoresRow[]> {
		return this.estaticoRepo.buscarJugadores({ query });
	}

	verJugadoresPorEquipo(equipoId: number): Promise<VerJugadoresPorEquipoRow[]> {
		return this.estaticoRepo.verJugadoresPorEquipo({ equipoId: equipoId });
	}

	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]> {
		return this.awardsRepo.verPrediccionesAwards();
	}

	async verMisAwardsKO(usuarioId: string): Promise<AwardsKODisplay> {
		const raw = await this.awardsRepo.verAwardsKODeUsuario({ id: usuarioId });

		const empty = {
			finalista1: null,
			finalista2: null,
			campeon: null,
			mejorPartidoEquipo1: null,
			mejorPartidoEquipo2: null,
			mejorPartidoMasGoles: null,
			numSuplementarios: null,
			goleador: null,
		};

		if (!raw) return empty;

		const equipoIds = [
			raw.awardKoFinalista1,
			raw.awardKoFinalista2,
			raw.awardKoCampeon,
			raw.awardKoMejorPartidoEquipo1,
			raw.awardKoMejorPartidoEquipo2,
			raw.awardKoMejorPartidoMasGoles,
		].filter((id): id is number => id !== null);

		const [equipos, jugadores] = await Promise.all([
			equipoIds.length > 0
				? this.estaticoRepo.verEquipos({ blanco: null, negro: null })
				: Promise.resolve([]),
			raw.awardKoGoleador !== null
				? this.estaticoRepo.verJugadoresPorIds({ ids: [raw.awardKoGoleador] })
				: Promise.resolve([]),
		]);

		const equipoMap = new Map(equipos.map((e) => [e.id, e.nombre]));
		const goleador = jugadores[0]
			? `${jugadores[0].nombre} (${jugadores[0].equipoNombre})`
			: null;

		return {
			finalista1: raw.awardKoFinalista1
				? (equipoMap.get(raw.awardKoFinalista1) ?? null)
				: null,
			finalista2: raw.awardKoFinalista2
				? (equipoMap.get(raw.awardKoFinalista2) ?? null)
				: null,
			campeon: raw.awardKoCampeon
				? (equipoMap.get(raw.awardKoCampeon) ?? null)
				: null,
			mejorPartidoEquipo1: raw.awardKoMejorPartidoEquipo1
				? (equipoMap.get(raw.awardKoMejorPartidoEquipo1) ?? null)
				: null,
			mejorPartidoEquipo2: raw.awardKoMejorPartidoEquipo2
				? (equipoMap.get(raw.awardKoMejorPartidoEquipo2) ?? null)
				: null,
			mejorPartidoMasGoles: raw.awardKoMejorPartidoMasGoles
				? (equipoMap.get(raw.awardKoMejorPartidoMasGoles) ?? null)
				: null,
			numSuplementarios: raw.awardKoNumSuplementarios,
			goleador,
		};
	}

	async verAwardsKORaw(usuarioId: string): Promise<AwardsKORaw> {
		const raw = await this.awardsRepo.verAwardsKODeUsuario({ id: usuarioId });
		if (!raw) {
			return {
				finalista1: null,
				finalista2: null,
				campeonFinal: null,
				mejorPartidoEquipo1: null,
				mejorPartidoEquipo2: null,
				mejorPartidoMasGoles: null,
				numSuplementarios: null,
				goleadorKO: null,
			};
		}
		return {
			finalista1: raw.awardKoFinalista1,
			finalista2: raw.awardKoFinalista2,
			campeonFinal: raw.awardKoCampeon,
			mejorPartidoEquipo1: raw.awardKoMejorPartidoEquipo1,
			mejorPartidoEquipo2: raw.awardKoMejorPartidoEquipo2,
			mejorPartidoMasGoles: raw.awardKoMejorPartidoMasGoles,
			numSuplementarios: raw.awardKoNumSuplementarios,
			goleadorKO: raw.awardKoGoleador,
		};
	}

	async guardarAwardsKOParcial(
		usuarioId: string,
		data: AwardsKORaw,
	): Promise<void> {
		const fechaCierre = new Date(config.polla.fecha_cierre_awards_ko);
		if (Date.now() >= fechaCierre.getTime()) {
			throw new Error("Las predicciones de awards KO ya están cerradas.");
		}
		await this.awardsRepo.guardarAwardsKO({
			id: usuarioId,
			awardKoFinalista1: data.finalista1,
			awardKoFinalista2: data.finalista2,
			awardKoCampeon: data.campeonFinal,
			awardKoMejorPartidoEquipo1: data.mejorPartidoEquipo1,
			awardKoMejorPartidoEquipo2: data.mejorPartidoEquipo2,
			awardKoMejorPartidoMasGoles: data.mejorPartidoMasGoles,
			awardKoNumSuplementarios: data.numSuplementarios,
			awardKoGoleador: data.goleadorKO,
		});
	}

	async guardarAwardsKO(
		input: GuardarAwardsKOInput,
	): Promise<"created" | "updated"> {
		const fechaCierre = new Date(config.polla.fecha_cierre_awards_ko);
		if (Date.now() >= fechaCierre.getTime()) {
			throw new Error("Las predicciones de awards KO ya están cerradas.");
		}

		if (
			input.campeonFinal !== input.finalista1 &&
			input.campeonFinal !== input.finalista2
		) {
			throw new Error(
				"El campeón debe ser uno de los dos finalistas que elegiste.",
			);
		}

		const existing = await this.awardsRepo.verAwardsKODeUsuario({
			id: input.usuarioId,
		});
		const eraVacio =
			!existing || Object.values(existing).every((v) => v === null);

		await this.awardsRepo.guardarAwardsKO({
			id: input.usuarioId,
			awardKoFinalista1: input.finalista1,
			awardKoFinalista2: input.finalista2,
			awardKoCampeon: input.campeonFinal,
			awardKoMejorPartidoEquipo1: input.mejorPartidoEquipo1,
			awardKoMejorPartidoEquipo2: input.mejorPartidoEquipo2,
			awardKoMejorPartidoMasGoles: input.mejorPartidoMasGoles,
			awardKoNumSuplementarios: input.numSuplementarios,
			awardKoGoleador: input.goleadorKO,
		});

		return eraVacio ? "created" : "updated";
	}

	async guardarAwardsKOAdmin(
		input: GuardarAwardsKOInput,
	): Promise<"created" | "updated"> {
		if (
			input.campeonFinal !== input.finalista1 &&
			input.campeonFinal !== input.finalista2
		) {
			throw new Error(
				"El campeón debe ser uno de los dos finalistas que elegiste.",
			);
		}

		const existing = await this.awardsRepo.verAwardsKODeUsuario({
			id: input.usuarioId,
		});
		const eraVacio =
			!existing || Object.values(existing).every((v) => v === null);

		await this.awardsRepo.guardarAwardsKO({
			id: input.usuarioId,
			awardKoFinalista1: input.finalista1,
			awardKoFinalista2: input.finalista2,
			awardKoCampeon: input.campeonFinal,
			awardKoMejorPartidoEquipo1: input.mejorPartidoEquipo1,
			awardKoMejorPartidoEquipo2: input.mejorPartidoEquipo2,
			awardKoMejorPartidoMasGoles: input.mejorPartidoMasGoles,
			awardKoNumSuplementarios: input.numSuplementarios,
			awardKoGoleador: input.goleadorKO,
		});

		return eraVacio ? "created" : "updated";
	}

	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]> {
		return this.awardsRepo.verEquiposNoEliminados();
	}

	buscarJugadoresNoEliminados(
		query: string,
	): Promise<BuscarJugadoresNoEliminadosRow[]> {
		return this.awardsRepo.buscarJugadoresNoEliminados({
			query: `%${query}%`,
		});
	}

	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]> {
		return this.awardsRepo.verPrediccionesAwardsKO();
	}

	// ---------------------------------------------------------------------
	// Resolución individual de awards
	// ---------------------------------------------------------------------

	private async obtenerResultados(
		repo: IAwardsRepository,
	): Promise<VerAwardsResultadosRow> {
		const actual = await repo.verAwardsResultados();
		if (!actual) {
			throw new Error(
				"No se encontró la fila de awards_resultados (¿faltó correr la migración?).",
			);
		}
		return actual;
	}

	private async equipoMap(): Promise<Map<number, EquipoInfo>> {
		const equipos = await this.verEquipos();
		return new Map(
			equipos.map((e) => [e.id, { nombre: e.nombre, bandera: e.bandera }]),
		);
	}

	private displayEquipo(map: Map<number, EquipoInfo>, id: number): string {
		const e = map.get(id);
		return e ? `${e.bandera} ${e.nombre}` : `#${id}`;
	}

	private async jugadorMap(ids: number[]): Promise<Map<number, JugadorInfo>> {
		if (ids.length === 0) return new Map();
		const jugadores = await this.estaticoRepo.verJugadoresPorIds({ ids });
		return new Map(
			jugadores.map((j) => [
				j.id,
				{
					nombre: j.nombre,
					equipoNombre: j.equipoNombre,
					equipoBandera: j.equipoBandera,
				},
			]),
		);
	}

	private displayJugador(map: Map<number, JugadorInfo>, id: number): string {
		const j = map.get(id);
		return j ? `${j.nombre} (${j.equipoBandera} ${j.equipoNombre})` : `#${id}`;
	}

	async resolverCampeon(equipoId: number): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoCampeon !== null) {
				throw new Error("El award de Campeón ya fue resuelto.");
			}
			const equipos = await this.equipoMap();
			const usuarios = await repo.listUsuariosConCamposAwards();
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: this.displayEquipo(equipos, equipoId),
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardCampeon === null) continue;
				resumen.totalUsuarios++;
				const acierto = u.awardCampeon === equipoId;
				const puntos = acierto ? 10 : 0;
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: this.displayEquipo(equipos, u.awardCampeon),
					aciertos: acierto ? ["Campeón +10"] : [],
				});
			}
			await repo.guardarResultadoCampeon({ resultadoCampeon: equipoId });
			return resumen;
		});
	}

	private async resolverJugadorSimple(
		campo:
			| "awardGoleador"
			| "awardMejorJugador"
			| "awardMejorArquero"
			| "awardMejorJugadorJoven",
		gate: (r: VerAwardsResultadosRow) => number | null,
		guardar: (repo: IAwardsRepository, jugadorId: number) => Promise<void>,
		yaResueltoMsg: string,
		puntosPorAcierto: number,
		etiqueta: string,
		jugadorId: number,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (gate(actual) !== null) {
				throw new Error(yaResueltoMsg);
			}
			const usuarios = await repo.listUsuariosConCamposAwards();
			const ids = new Set<number>([jugadorId]);
			for (const u of usuarios) {
				const valor = u[campo];
				if (valor !== null) ids.add(valor);
			}
			const jugadores = await this.jugadorMap([...ids]);
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: this.displayJugador(jugadores, jugadorId),
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				const valor = u[campo];
				if (valor === null) continue;
				resumen.totalUsuarios++;
				const acierto = valor === jugadorId;
				const puntos = acierto ? puntosPorAcierto : 0;
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: this.displayJugador(jugadores, valor),
					aciertos: acierto ? [`${etiqueta} +${puntos}`] : [],
				});
			}
			await guardar(repo, jugadorId);
			return resumen;
		});
	}

	resolverGoleador(jugadorId: number): Promise<ResumenResolucionAward> {
		return this.resolverJugadorSimple(
			"awardGoleador",
			(r) => r.resultadoGoleador,
			(repo, id) => repo.guardarResultadoGoleador({ resultadoGoleador: id }),
			"El award de Goleador ya fue resuelto.",
			5,
			"Goleador",
			jugadorId,
		);
	}

	resolverMejorJugador(jugadorId: number): Promise<ResumenResolucionAward> {
		return this.resolverJugadorSimple(
			"awardMejorJugador",
			(r) => r.resultadoMejorJugador,
			(repo, id) =>
				repo.guardarResultadoMejorJugador({ resultadoMejorJugador: id }),
			"El award de Mejor Jugador ya fue resuelto.",
			5,
			"Mejor jugador",
			jugadorId,
		);
	}

	resolverMejorArquero(jugadorId: number): Promise<ResumenResolucionAward> {
		return this.resolverJugadorSimple(
			"awardMejorArquero",
			(r) => r.resultadoMejorArquero,
			(repo, id) =>
				repo.guardarResultadoMejorArquero({ resultadoMejorArquero: id }),
			"El award de Mejor Arquero ya fue resuelto.",
			3,
			"Mejor arquero",
			jugadorId,
		);
	}

	resolverMejorJugadorJoven(
		jugadorId: number,
	): Promise<ResumenResolucionAward> {
		return this.resolverJugadorSimple(
			"awardMejorJugadorJoven",
			(r) => r.resultadoMejorJugadorJoven,
			(repo, id) =>
				repo.guardarResultadoMejorJugadorJoven({
					resultadoMejorJugadorJoven: id,
				}),
			"El award de Mejor Jugador Joven ya fue resuelto.",
			3,
			"Mejor jugador joven",
			jugadorId,
		);
	}

	async resolverMejorGol(
		jugadorId: number,
		posicion: number,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoMejorGol !== null) {
				throw new Error("El award de Mejor Gol ya fue resuelto.");
			}
			const fila =
				await this.estaticoRepo.verPuntosMejorGolPorPosicion(posicion);
			const puntosMejorGol = fila?.puntos ?? 0;
			const usuarios = await repo.listUsuariosConCamposAwards();
			const ids = new Set<number>([jugadorId]);
			for (const u of usuarios) {
				if (u.awardMejorGol !== null) ids.add(u.awardMejorGol);
			}
			const jugadores = await this.jugadorMap([...ids]);
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: `${this.displayJugador(jugadores, jugadorId)} (posición ${posicion})`,
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardMejorGol === null) continue;
				resumen.totalUsuarios++;
				const acierto = u.awardMejorGol === jugadorId && puntosMejorGol > 0;
				const puntos = acierto ? puntosMejorGol : 0;
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: this.displayJugador(jugadores, u.awardMejorGol),
					aciertos: acierto ? [`Mejor gol +${puntos}`] : [],
				});
			}
			await repo.guardarResultadoMejorGol({
				resultadoMejorGol: jugadorId,
				resultadoMejorGolPosicion: posicion,
			});
			return resumen;
		});
	}

	private async resolverEquipoSimple(
		campo: "awardSeleccionDecepcion" | "awardSeleccionSorpresa",
		gate: (r: VerAwardsResultadosRow) => number | null,
		guardar: (repo: IAwardsRepository, equipoId: number) => Promise<void>,
		yaResueltoMsg: string,
		puntosPorAcierto: number,
		etiqueta: string,
		equipoId: number,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (gate(actual) !== null) {
				throw new Error(yaResueltoMsg);
			}
			const equipos = await this.equipoMap();
			const usuarios = await repo.listUsuariosConCamposAwards();
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: this.displayEquipo(equipos, equipoId),
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				const valor = u[campo];
				if (valor === null) continue;
				resumen.totalUsuarios++;
				const acierto = valor === equipoId;
				const puntos = acierto ? puntosPorAcierto : 0;
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: this.displayEquipo(equipos, valor),
					aciertos: acierto ? [`${etiqueta} +${puntos}`] : [],
				});
			}
			await guardar(repo, equipoId);
			return resumen;
		});
	}

	resolverSeleccionDecepcion(
		equipoId: number,
	): Promise<ResumenResolucionAward> {
		return this.resolverEquipoSimple(
			"awardSeleccionDecepcion",
			(r) => r.resultadoSeleccionDecepcion,
			(repo, id) =>
				repo.guardarResultadoSeleccionDecepcion({
					resultadoSeleccionDecepcion: id,
				}),
			"El award de Selección Decepción ya fue resuelto.",
			5,
			"Selección Decepción",
			equipoId,
		);
	}

	resolverSeleccionSorpresa(equipoId: number): Promise<ResumenResolucionAward> {
		return this.resolverEquipoSimple(
			"awardSeleccionSorpresa",
			(r) => r.resultadoSeleccionSorpresa,
			(repo, id) =>
				repo.guardarResultadoSeleccionSorpresa({
					resultadoSeleccionSorpresa: id,
				}),
			"El award de Selección Sorpresa ya fue resuelto.",
			5,
			"Selección Sorpresa",
			equipoId,
		);
	}

	async resolverKoFinalistas(
		finalista1: number,
		finalista2: number,
		campeon: number,
	): Promise<ResumenResolucionAward> {
		if (campeon !== finalista1 && campeon !== finalista2) {
			throw new Error("El campeón debe ser uno de los dos finalistas.");
		}
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoKoFinalista1 !== null) {
				throw new Error("El award de Finalistas ya fue resuelto.");
			}
			const equipos = await this.equipoMap();
			const finalistasReales = new Set([finalista1, finalista2]);
			const usuarios = await repo.listUsuariosConCamposAwardsKO();
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: `${this.displayEquipo(equipos, finalista1)}/${this.displayEquipo(equipos, finalista2)} (campeón: ${this.displayEquipo(equipos, campeon)})`,
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardKoFinalista1 === null || u.awardKoFinalista2 === null) {
					continue;
				}
				resumen.totalUsuarios++;
				const finalistasUsuario = new Set([
					u.awardKoFinalista1,
					u.awardKoFinalista2,
				]);
				const aciertosFinalistas = [...finalistasUsuario].filter((f) =>
					finalistasReales.has(f),
				).length;
				let puntos = aciertosFinalistas * 2;
				const aciertos =
					aciertosFinalistas > 0
						? [
								`Finalistas: ${aciertosFinalistas} acertado(s) +${aciertosFinalistas * 2}`,
							]
						: [];
				if (u.awardKoCampeon !== null && u.awardKoCampeon === campeon) {
					puntos += 1;
					aciertos.push("Campeón +1");
				}
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				const eleccionCampeon =
					u.awardKoCampeon !== null
						? this.displayEquipo(equipos, u.awardKoCampeon)
						: "—";
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: `${this.displayEquipo(equipos, u.awardKoFinalista1)}/${this.displayEquipo(equipos, u.awardKoFinalista2)} (campeón: ${eleccionCampeon})`,
					aciertos,
				});
			}
			await repo.guardarResultadoKoFinalistas({
				resultadoKoFinalista1: finalista1,
				resultadoKoFinalista2: finalista2,
				resultadoKoCampeon: campeon,
			});
			return resumen;
		});
	}

	async resolverKoMejorPartido(
		equipo1: number,
		equipo2: number,
		masGoles: number | null,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoKoMejorPartidoEquipo1 !== null) {
				throw new Error("El award de Mejor Partido ya fue resuelto.");
			}
			const equipos = await this.equipoMap();
			const equiposReales = new Set([equipo1, equipo2]);
			const usuarios = await repo.listUsuariosConCamposAwardsKO();
			const masGolesDisplay =
				masGoles !== null ? this.displayEquipo(equipos, masGoles) : "empate";
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: `${this.displayEquipo(equipos, equipo1)}/${this.displayEquipo(equipos, equipo2)} (más goles: ${masGolesDisplay})`,
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (
					u.awardKoMejorPartidoEquipo1 === null ||
					u.awardKoMejorPartidoEquipo2 === null
				) {
					continue;
				}
				resumen.totalUsuarios++;
				const equiposUsuario = new Set([
					u.awardKoMejorPartidoEquipo1,
					u.awardKoMejorPartidoEquipo2,
				]);
				const correctos = [...equiposUsuario].filter((e) =>
					equiposReales.has(e),
				);
				let puntos = 0;
				const aciertos: string[] = [];
				if (correctos.length === 2) {
					const masGolesCorr = u.awardKoMejorPartidoMasGoles === masGoles;
					puntos = masGolesCorr ? 3 : 2;
					aciertos.push(
						`Mejor partido${masGolesCorr ? " + más goles" : ""} +${puntos}`,
					);
				} else if (correctos.length === 1) {
					const equipo = correctos[0];
					if (masGoles !== null && equipo === masGoles) {
						puntos = 2;
						aciertos.push("Mejor partido (1 equipo + más goles) +2");
					} else {
						puntos = 1;
						aciertos.push("Mejor partido (1 equipo) +1");
					}
				}
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				const eleccionMasGoles =
					u.awardKoMejorPartidoMasGoles !== null
						? this.displayEquipo(equipos, u.awardKoMejorPartidoMasGoles)
						: "empate";
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: `${this.displayEquipo(equipos, u.awardKoMejorPartidoEquipo1)}/${this.displayEquipo(equipos, u.awardKoMejorPartidoEquipo2)} (más goles: ${eleccionMasGoles})`,
					aciertos,
				});
			}
			await repo.guardarResultadoKoMejorPartido({
				resultadoKoMejorPartidoEquipo1: equipo1,
				resultadoKoMejorPartidoEquipo2: equipo2,
				resultadoKoMejorPartidoMasGoles: masGoles,
			});
			return resumen;
		});
	}

	async resolverKoNumSuplementarios(
		cantidad: number,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoKoNumSuplementarios !== null) {
				throw new Error(
					"El award de Número de Suplementarios ya fue resuelto.",
				);
			}
			const usuarios = await repo.listUsuariosConCamposAwardsKO();
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: `${cantidad} suplementarios`,
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardKoNumSuplementarios === null) continue;
				resumen.totalUsuarios++;
				const diff = Math.abs(u.awardKoNumSuplementarios - cantidad);
				let puntos = 0;
				const aciertos: string[] = [];
				if (diff === 0) {
					puntos = 3;
					aciertos.push("Suplementarios exacto +3");
				} else if (diff === 1) {
					puntos = 2;
					aciertos.push("Suplementarios ±1 +2");
				} else if (diff === 2) {
					puntos = 1;
					aciertos.push("Suplementarios ±2 +1");
				}
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: `${u.awardKoNumSuplementarios} suplementarios`,
					aciertos,
				});
			}
			await repo.guardarResultadoKoNumSuplementarios({
				resultadoKoNumSuplementarios: cantidad,
			});
			return resumen;
		});
	}

	async resolverKoGoleador(jugadorId: number): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.resultadoKoGoleador !== null) {
				throw new Error("El award de Goleador KO ya fue resuelto.");
			}
			const usuarios = await repo.listUsuariosConCamposAwardsKO();
			const ids = new Set<number>([jugadorId]);
			for (const u of usuarios) {
				if (u.awardKoGoleador !== null) ids.add(u.awardKoGoleador);
			}
			const jugadores = await this.jugadorMap([...ids]);
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: this.displayJugador(jugadores, jugadorId),
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardKoGoleador === null) continue;
				resumen.totalUsuarios++;
				const acierto = u.awardKoGoleador === jugadorId;
				const puntos = acierto ? 3 : 0;
				const puntosTotal =
					puntos > 0
						? await repo.sumarPuntosAward({ id: u.id, puntos })
						: u.puntos;
				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados: puntos,
					puntosTotal,
					eleccion: this.displayJugador(jugadores, u.awardKoGoleador),
					aciertos: acierto ? ["Goleador KO +3"] : [],
				});
			}
			await repo.guardarResultadoKoGoleador({ resultadoKoGoleador: jugadorId });
			return resumen;
		});
	}
}
