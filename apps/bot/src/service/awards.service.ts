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
	AwardGanador,
	AwardGanadoresGrupo,
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

type PuntosCalculados = { puntos: number; aciertos: string[] };

// Puntaje fijo para un nominado a Mejor Gol del que FIFA no reveló posición
// (p. ej. si solo publican el top 3 y el resto de nominados queda sin ranking).
const PUNTOS_MEJOR_GOL_NOMINADO_SIN_POSICION = 1;

// ---------------------------------------------------------------------
// Fórmulas de puntaje puras — usadas tanto por los resolverX (que además
// aplican los puntos) como por calcularGanadoresPorAward (solo lectura).
// ---------------------------------------------------------------------

function calcularPuntosPickSimple(
	pick: number | null,
	real: number,
	valorSiAcierta: number,
	etiqueta: string,
): PuntosCalculados {
	if (pick !== null && pick === real) {
		return {
			puntos: valorSiAcierta,
			aciertos: [`${etiqueta} +${valorSiAcierta}`],
		};
	}
	return { puntos: 0, aciertos: [] };
}

function calcularPuntosMejorGolDesdeMapa(
	pick: number | null,
	puntosPorJugador: Map<number, number>,
): PuntosCalculados {
	if (pick === null) return { puntos: 0, aciertos: [] };
	const puntos = puntosPorJugador.get(pick) ?? 0;
	return puntos > 0
		? { puntos, aciertos: [`Mejor gol +${puntos}`] }
		: { puntos: 0, aciertos: [] };
}

function calcularPuntosKoFinalistas(
	pickF1: number | null,
	pickF2: number | null,
	pickCampeon: number | null,
	realF1: number,
	realF2: number,
	realCampeon: number,
): PuntosCalculados {
	if (pickF1 === null || pickF2 === null) return { puntos: 0, aciertos: [] };
	const finalistasReales = new Set([realF1, realF2]);
	const finalistasUsuario = new Set([pickF1, pickF2]);
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
	if (pickCampeon !== null && pickCampeon === realCampeon) {
		puntos += 1;
		aciertos.push("Campeón +1");
	}
	return { puntos, aciertos };
}

function calcularPuntosKoMejorPartido(
	pickE1: number | null,
	pickE2: number | null,
	pickMasGoles: number | null,
	realE1: number,
	realE2: number,
	realMasGoles: number | null,
): PuntosCalculados {
	if (pickE1 === null || pickE2 === null) return { puntos: 0, aciertos: [] };
	const equiposReales = new Set([realE1, realE2]);
	const equiposUsuario = new Set([pickE1, pickE2]);
	const correctos = [...equiposUsuario].filter((e) => equiposReales.has(e));
	if (correctos.length === 2) {
		const masGolesCorr = pickMasGoles === realMasGoles;
		const puntos = masGolesCorr ? 3 : 2;
		return {
			puntos,
			aciertos: [
				`Mejor partido${masGolesCorr ? " + más goles" : ""} +${puntos}`,
			],
		};
	}
	if (correctos.length === 1) {
		const equipo = correctos[0];
		if (realMasGoles !== null && equipo === realMasGoles) {
			return {
				puntos: 2,
				aciertos: ["Mejor partido (1 equipo + más goles) +2"],
			};
		}
		return { puntos: 1, aciertos: ["Mejor partido (1 equipo) +1"] };
	}
	return { puntos: 0, aciertos: [] };
}

function calcularPuntosKoNumSuplementarios(
	pick: number | null,
	real: number,
): PuntosCalculados {
	if (pick === null) return { puntos: 0, aciertos: [] };
	const diff = Math.abs(pick - real);
	if (diff === 0) return { puntos: 3, aciertos: ["Suplementarios exacto +3"] };
	if (diff === 1) return { puntos: 2, aciertos: ["Suplementarios ±1 +2"] };
	if (diff === 2) return { puntos: 1, aciertos: ["Suplementarios ±2 +1"] };
	return { puntos: 0, aciertos: [] };
}

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
				const { puntos, aciertos } = calcularPuntosPickSimple(
					u.awardCampeon,
					equipoId,
					10,
					"Campeón",
				);
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
					aciertos,
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
				const { puntos, aciertos } = calcularPuntosPickSimple(
					valor,
					jugadorId,
					puntosPorAcierto,
					etiqueta,
				);
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
					aciertos,
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
		posicion: number | null,
	): Promise<ResumenResolucionAward> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const resueltos = await repo.listMejorGolResueltos();
			if (resueltos.some((r) => r.jugadorId === jugadorId)) {
				throw new Error("Ese jugador ya fue resuelto para Mejor Gol.");
			}
			if (posicion !== null && resueltos.some((r) => r.posicion === posicion)) {
				throw new Error(
					`La posición ${posicion} ya fue asignada a otro jugador.`,
				);
			}
			let puntosMejorGol: number;
			if (posicion !== null) {
				const fila =
					await this.estaticoRepo.verPuntosMejorGolPorPosicion(posicion);
				puntosMejorGol = fila?.puntos ?? 0;
			} else {
				puntosMejorGol = PUNTOS_MEJOR_GOL_NOMINADO_SIN_POSICION;
			}
			const usuarios = await repo.listUsuariosConCamposAwards();
			const jugadores = await this.jugadorMap([jugadorId]);
			const etiquetaResultado =
				posicion !== null
					? `${this.displayJugador(jugadores, jugadorId)} (posición ${posicion})`
					: `${this.displayJugador(jugadores, jugadorId)} (nominado, sin posición revelada)`;
			const resumen: ResumenResolucionAward = {
				resultadoDisplay: `${etiquetaResultado} — ${resueltos.length + 1} nominado(s) resueltos`,
				totalUsuarios: 0,
				resultados: [],
			};
			for (const u of usuarios) {
				if (u.awardMejorGol !== jugadorId) continue;
				resumen.totalUsuarios++;
				const { puntos, aciertos } = calcularPuntosPickSimple(
					u.awardMejorGol,
					jugadorId,
					puntosMejorGol,
					"Mejor gol",
				);
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
					aciertos,
				});
			}
			await repo.guardarMejorGolResuelto({ jugadorId, posicion });
			return resumen;
		});
	}

	async cerrarMejorGol(): Promise<void> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const actual = await this.obtenerResultados(repo);
			if (actual.mejorGolCerradoEn !== null) {
				throw new Error("El award de Mejor Gol ya fue cerrado.");
			}
			await repo.cerrarMejorGol();
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
				const { puntos, aciertos } = calcularPuntosPickSimple(
					valor,
					equipoId,
					puntosPorAcierto,
					etiqueta,
				);
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
					aciertos,
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
				const { puntos, aciertos } = calcularPuntosKoFinalistas(
					u.awardKoFinalista1,
					u.awardKoFinalista2,
					u.awardKoCampeon,
					finalista1,
					finalista2,
					campeon,
				);
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
				const { puntos, aciertos } = calcularPuntosKoMejorPartido(
					u.awardKoMejorPartidoEquipo1,
					u.awardKoMejorPartidoEquipo2,
					u.awardKoMejorPartidoMasGoles,
					equipo1,
					equipo2,
					masGoles,
				);
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
				const { puntos, aciertos } = calcularPuntosKoNumSuplementarios(
					u.awardKoNumSuplementarios,
					cantidad,
				);
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
				const { puntos, aciertos } = calcularPuntosPickSimple(
					u.awardKoGoleador,
					jugadorId,
					3,
					"Goleador KO",
				);
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
					aciertos,
				});
			}
			await repo.guardarResultadoKoGoleador({ resultadoKoGoleador: jugadorId });
			return resumen;
		});
	}

	// ---------------------------------------------------------------------
	// Cálculo de solo lectura — no aplica puntos, solo re-deriva quién ganó
	// cada award ya resuelto. Usado por el resumen final y por /recuento.
	// ---------------------------------------------------------------------

	async calcularGanadoresPorAward(): Promise<AwardGanadoresGrupo[]> {
		const actual = await this.obtenerResultados(this.awardsRepo);
		const mejorGolResueltos = await this.awardsRepo.listMejorGolResueltos();
		const usuarios = await this.awardsRepo.listUsuariosConCamposAwards();
		const usuariosKO = await this.awardsRepo.listUsuariosConCamposAwardsKO();

		const equipos = await this.equipoMap();
		const jugadorIds = [
			actual.resultadoGoleador,
			actual.resultadoMejorJugador,
			actual.resultadoMejorArquero,
			actual.resultadoMejorJugadorJoven,
			actual.resultadoKoGoleador,
			...mejorGolResueltos.map((r) => r.jugadorId),
		].filter((id): id is number => id !== null);
		const jugadores = await this.jugadorMap(jugadorIds);

		const ganador = (
			usuarioId: string,
			username: string,
			r: PuntosCalculados,
		): AwardGanador => ({
			usuarioId,
			username,
			puntos: r.puntos,
			detalle: r.aciertos.join(", "),
		});

		const grupos: AwardGanadoresGrupo[] = [];

		grupos.push({
			key: "campeon",
			etiqueta: "Campeón",
			resuelto: actual.resultadoCampeon !== null,
			resultadoDisplay:
				actual.resultadoCampeon !== null
					? this.displayEquipo(equipos, actual.resultadoCampeon)
					: null,
			ganadores:
				actual.resultadoCampeon !== null
					? usuarios
							.map((u) =>
								ganador(
									u.id,
									u.username,
									calcularPuntosPickSimple(
										u.awardCampeon,
										actual.resultadoCampeon as number,
										10,
										"Campeón",
									),
								),
							)
							.filter((g) => g.puntos > 0)
					: [],
		});

		const jugadorSimple = (
			key: string,
			etiqueta: string,
			resultado: number | null,
			campo:
				| "awardGoleador"
				| "awardMejorJugador"
				| "awardMejorArquero"
				| "awardMejorJugadorJoven",
			puntosPorAcierto: number,
		): AwardGanadoresGrupo => ({
			key,
			etiqueta,
			resuelto: resultado !== null,
			resultadoDisplay:
				resultado !== null ? this.displayJugador(jugadores, resultado) : null,
			ganadores:
				resultado !== null
					? usuarios
							.map((u) =>
								ganador(
									u.id,
									u.username,
									calcularPuntosPickSimple(
										u[campo],
										resultado,
										puntosPorAcierto,
										etiqueta,
									),
								),
							)
							.filter((g) => g.puntos > 0)
					: [],
		});

		grupos.push(
			jugadorSimple(
				"goleador",
				"Goleador",
				actual.resultadoGoleador,
				"awardGoleador",
				5,
			),
		);
		grupos.push(
			jugadorSimple(
				"mejor-jugador",
				"Mejor Jugador",
				actual.resultadoMejorJugador,
				"awardMejorJugador",
				5,
			),
		);
		grupos.push(
			jugadorSimple(
				"mejor-arquero",
				"Mejor Arquero",
				actual.resultadoMejorArquero,
				"awardMejorArquero",
				3,
			),
		);
		grupos.push(
			jugadorSimple(
				"mejor-jugador-joven",
				"Mejor Jugador Joven",
				actual.resultadoMejorJugadorJoven,
				"awardMejorJugadorJoven",
				3,
			),
		);

		// "Resuelto" se da por: (a) el admin lo cerró explícitamente
		// (cerrarMejorGol, para cuando FIFA no revela más nominados), o (b)
		// todo jugador que alguien eligió como Mejor Gol ya tiene una
		// resolución (con posición o nominado) — por si se resolvió todo sin
		// necesidad de cerrar a mano. (a) es la señal principal: depender solo
		// de (b) se puede trabar para siempre si algún usuario eligió un
		// jugador que en realidad nunca fue nominado.
		const picksUnicosMejorGol = new Set(
			usuarios
				.map((u) => u.awardMejorGol)
				.filter((id): id is number => id !== null),
		);
		const mejorGolResueltosSet = new Set(
			mejorGolResueltos.map((r) => r.jugadorId),
		);
		const mejorGolResuelto =
			actual.mejorGolCerradoEn !== null ||
			(picksUnicosMejorGol.size > 0 &&
				[...picksUnicosMejorGol].every((id) => mejorGolResueltosSet.has(id)));

		const puntosPorJugadorMejorGol = new Map<number, number>();
		for (const r of mejorGolResueltos) {
			if (r.posicion !== null) {
				const fila = await this.estaticoRepo.verPuntosMejorGolPorPosicion(
					r.posicion,
				);
				puntosPorJugadorMejorGol.set(r.jugadorId, fila?.puntos ?? 0);
			} else {
				puntosPorJugadorMejorGol.set(
					r.jugadorId,
					PUNTOS_MEJOR_GOL_NOMINADO_SIN_POSICION,
				);
			}
		}
		const mejorGolOrdenados = [...mejorGolResueltos].sort((a, b) => {
			if (a.posicion === null) return b.posicion === null ? 0 : 1;
			if (b.posicion === null) return -1;
			return a.posicion - b.posicion;
		});
		grupos.push({
			key: "mejor-gol",
			etiqueta: "Mejor Gol",
			resuelto: mejorGolResuelto,
			resultadoDisplay: mejorGolResuelto
				? mejorGolOrdenados
						.map((r) =>
							r.posicion !== null
								? `${r.posicion}° ${this.displayJugador(jugadores, r.jugadorId)}`
								: `${this.displayJugador(jugadores, r.jugadorId)} (nominado)`,
						)
						.join(", ")
				: null,
			ganadores: mejorGolResuelto
				? usuarios
						.map((u) =>
							ganador(
								u.id,
								u.username,
								calcularPuntosMejorGolDesdeMapa(
									u.awardMejorGol,
									puntosPorJugadorMejorGol,
								),
							),
						)
						.filter((g) => g.puntos > 0)
				: [],
		});

		const equipoSimple = (
			key: string,
			etiqueta: string,
			resultado: number | null,
			campo: "awardSeleccionDecepcion" | "awardSeleccionSorpresa",
			puntosPorAcierto: number,
		): AwardGanadoresGrupo => ({
			key,
			etiqueta,
			resuelto: resultado !== null,
			resultadoDisplay:
				resultado !== null ? this.displayEquipo(equipos, resultado) : null,
			ganadores:
				resultado !== null
					? usuarios
							.map((u) =>
								ganador(
									u.id,
									u.username,
									calcularPuntosPickSimple(
										u[campo],
										resultado,
										puntosPorAcierto,
										etiqueta,
									),
								),
							)
							.filter((g) => g.puntos > 0)
					: [],
		});

		grupos.push(
			equipoSimple(
				"seleccion-decepcion",
				"Selección Decepción",
				actual.resultadoSeleccionDecepcion,
				"awardSeleccionDecepcion",
				5,
			),
		);
		grupos.push(
			equipoSimple(
				"seleccion-sorpresa",
				"Selección Sorpresa",
				actual.resultadoSeleccionSorpresa,
				"awardSeleccionSorpresa",
				5,
			),
		);

		const koFinalistasResuelto = actual.resultadoKoFinalista1 !== null;
		grupos.push({
			key: "ko-finalistas",
			etiqueta: "Finalistas",
			resuelto: koFinalistasResuelto,
			resultadoDisplay: koFinalistasResuelto
				? `${this.displayEquipo(equipos, actual.resultadoKoFinalista1 as number)}/${this.displayEquipo(equipos, actual.resultadoKoFinalista2 as number)} (campeón: ${this.displayEquipo(equipos, actual.resultadoKoCampeon as number)})`
				: null,
			ganadores: koFinalistasResuelto
				? usuariosKO
						.map((u) =>
							ganador(
								u.id,
								u.username,
								calcularPuntosKoFinalistas(
									u.awardKoFinalista1,
									u.awardKoFinalista2,
									u.awardKoCampeon,
									actual.resultadoKoFinalista1 as number,
									actual.resultadoKoFinalista2 as number,
									actual.resultadoKoCampeon as number,
								),
							),
						)
						.filter((g) => g.puntos > 0)
				: [],
		});

		const koMejorPartidoResuelto =
			actual.resultadoKoMejorPartidoEquipo1 !== null;
		const masGolesDisplay =
			actual.resultadoKoMejorPartidoMasGoles !== null
				? this.displayEquipo(equipos, actual.resultadoKoMejorPartidoMasGoles)
				: "empate";
		grupos.push({
			key: "ko-mejor-partido",
			etiqueta: "Mejor Partido",
			resuelto: koMejorPartidoResuelto,
			resultadoDisplay: koMejorPartidoResuelto
				? `${this.displayEquipo(equipos, actual.resultadoKoMejorPartidoEquipo1 as number)}/${this.displayEquipo(equipos, actual.resultadoKoMejorPartidoEquipo2 as number)} (más goles: ${masGolesDisplay})`
				: null,
			ganadores: koMejorPartidoResuelto
				? usuariosKO
						.map((u) =>
							ganador(
								u.id,
								u.username,
								calcularPuntosKoMejorPartido(
									u.awardKoMejorPartidoEquipo1,
									u.awardKoMejorPartidoEquipo2,
									u.awardKoMejorPartidoMasGoles,
									actual.resultadoKoMejorPartidoEquipo1 as number,
									actual.resultadoKoMejorPartidoEquipo2 as number,
									actual.resultadoKoMejorPartidoMasGoles,
								),
							),
						)
						.filter((g) => g.puntos > 0)
				: [],
		});

		grupos.push({
			key: "ko-num-suplementarios",
			etiqueta: "Número de Suplementarios",
			resuelto: actual.resultadoKoNumSuplementarios !== null,
			resultadoDisplay:
				actual.resultadoKoNumSuplementarios !== null
					? `${actual.resultadoKoNumSuplementarios} suplementarios`
					: null,
			ganadores:
				actual.resultadoKoNumSuplementarios !== null
					? usuariosKO
							.map((u) =>
								ganador(
									u.id,
									u.username,
									calcularPuntosKoNumSuplementarios(
										u.awardKoNumSuplementarios,
										actual.resultadoKoNumSuplementarios as number,
									),
								),
							)
							.filter((g) => g.puntos > 0)
					: [],
		});

		grupos.push({
			key: "ko-goleador",
			etiqueta: "Goleador KO",
			resuelto: actual.resultadoKoGoleador !== null,
			resultadoDisplay:
				actual.resultadoKoGoleador !== null
					? this.displayJugador(jugadores, actual.resultadoKoGoleador)
					: null,
			ganadores:
				actual.resultadoKoGoleador !== null
					? usuariosKO
							.map((u) =>
								ganador(
									u.id,
									u.username,
									calcularPuntosPickSimple(
										u.awardKoGoleador,
										actual.resultadoKoGoleador as number,
										3,
										"Goleador KO",
									),
								),
							)
							.filter((g) => g.puntos > 0)
					: [],
		});

		return grupos;
	}
}
