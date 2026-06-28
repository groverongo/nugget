import type {
	BuscarJugadoresNoEliminadosRow,
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
	ResultadosAwards,
	ResultadosAwardsKO,
	ResumenActualizacionAwards,
	ResumenActualizacionAwardsKO,
} from "../interface/service/awards.service";

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

	async actualizarAwards(
		resultados: ResultadosAwards,
	): Promise<ResumenActualizacionAwards> {
		const fila = await this.estaticoRepo.verPuntosMejorGolPorPosicion(
			resultados.mejorGolPosicion,
		);
		const puntosMejorGol = fila?.puntos ?? 0;

		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const usuarios = await repo.listUsuariosConAwards();

			const resumen: ResumenActualizacionAwards = {
				totalUsuarios: usuarios.length,
				resultados: [],
			};

			for (const u of usuarios) {
				let puntosGanados = 0;
				const aciertos: string[] = [];

				if (u.awardCampeon === resultados.campeon) {
					puntosGanados += 10;
					aciertos.push("Campeón +10");
				}
				if (u.awardGoleador === resultados.goleador) {
					puntosGanados += 5;
					aciertos.push("Goleador +5");
				}
				if (u.awardMejorJugador === resultados.mejorJugador) {
					puntosGanados += 5;
					aciertos.push("Mejor jugador +5");
				}
				if (u.awardMejorArquero === resultados.mejorArquero) {
					puntosGanados += 3;
					aciertos.push("Mejor arquero +3");
				}
				if (u.awardMejorJugadorJoven === resultados.mejorJugadorJoven) {
					puntosGanados += 3;
					aciertos.push("Mejor jugador joven +3");
				}
				if (
					u.awardMejorGol === resultados.mejorGolJugadorId &&
					puntosMejorGol > 0
				) {
					puntosGanados += puntosMejorGol;
					aciertos.push(`Mejor gol +${puntosMejorGol}`);
				}
				if (u.awardSeleccionDecepcion === resultados.seleccionDecepcion) {
					puntosGanados += 5;
					aciertos.push("Selección Decepción +5");
				}
				if (u.awardSeleccionSorpresa === resultados.seleccionSorpresa) {
					puntosGanados += 5;
					aciertos.push("Selección Sorpresa +5");
				}

				if (puntosGanados > 0) {
					await repo.sumarPuntosAward({ id: u.id, puntos: puntosGanados });
				}

				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados,
					aciertos,
				});
			}

			return resumen;
		});
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

	async actualizarAwardsKO(
		resultados: ResultadosAwardsKO,
	): Promise<ResumenActualizacionAwardsKO> {
		return this.txManager.runInTx(async (tx) => {
			const repo = this.awardsRepo.withTx(tx);
			const usuarios = await repo.listUsuariosConAwardsKO();

			const resumen: ResumenActualizacionAwardsKO = {
				totalUsuarios: usuarios.length,
				resultados: [],
			};

			const finalistasReales = new Set([
				resultados.finalista1,
				resultados.finalista2,
			]);

			for (const u of usuarios) {
				let puntosGanados = 0;
				const aciertos: string[] = [];

				// Finalistas
				const f1 = u.awardKoFinalista1 ?? 0;
				const f2 = u.awardKoFinalista2 ?? 0;
				const campeonPred = u.awardKoCampeon ?? 0;
				const correctos = [f1, f2].filter((f) => finalistasReales.has(f));

				if (correctos.length === 2) {
					puntosGanados += 4;
					aciertos.push("Finalistas +4");
				} else if (correctos.length === 1) {
					const esElCampeon = correctos[0] === resultados.campeon;
					const pts = esElCampeon ? 3 : 2;
					puntosGanados += pts;
					aciertos.push(`Finalista${esElCampeon ? " (campeón)" : ""} +${pts}`);
				}

				if (campeonPred === resultados.campeon) {
					puntosGanados += 5;
					aciertos.push("Campeón final +5");
				}

				// Mejor partido
				const mp1 = u.awardKoMejorPartidoEquipo1 ?? 0;
				const mp2 = u.awardKoMejorPartidoEquipo2 ?? 0;
				const mpReal = new Set([
					resultados.mejorPartidoEquipo1,
					resultados.mejorPartidoEquipo2,
				]);
				const mpCorrectos = [mp1, mp2].filter((e) => mpReal.has(e));

				if (mpCorrectos.length === 2) {
					const masGolesCorr =
						u.awardKoMejorPartidoMasGoles === resultados.mejorPartidoMasGoles;
					const pts = masGolesCorr ? 3 : 2;
					puntosGanados += pts;
					aciertos.push(
						`Mejor partido${masGolesCorr ? " + más goles" : ""} +${pts}`,
					);
				} else if (mpCorrectos.length === 1) {
					// +2 si el único equipo que acertó es el que hizo más goles
					const equipo = mpCorrectos[0];
					if (
						resultados.mejorPartidoMasGoles !== null &&
						equipo === resultados.mejorPartidoMasGoles
					) {
						puntosGanados += 2;
						aciertos.push("Mejor partido (1 equipo + más goles) +2");
					} else {
						puntosGanados += 1;
						aciertos.push("Mejor partido (1 equipo) +1");
					}
				}

				// Número de suplementarios
				const numPred = u.awardKoNumSuplementarios ?? -99;
				const diff = Math.abs(numPred - resultados.numSuplementarios);
				if (diff === 0) {
					puntosGanados += 3;
					aciertos.push("Suplementarios exacto +3");
				} else if (diff === 1) {
					puntosGanados += 2;
					aciertos.push("Suplementarios ±1 +2");
				} else if (diff === 2) {
					puntosGanados += 1;
					aciertos.push("Suplementarios ±2 +1");
				}

				// Goleador KO
				if (u.awardKoGoleador === resultados.goleadorKO) {
					puntosGanados += 3;
					aciertos.push("Goleador KO +3");
				}

				if (puntosGanados > 0) {
					await repo.sumarPuntosAward({ id: u.id, puntos: puntosGanados });
				}

				resumen.resultados.push({
					usuarioId: u.id,
					username: u.username,
					puntosGanados,
					aciertos,
				});
			}

			return resumen;
		});
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
}
