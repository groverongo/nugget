import type { VerPrediccionesAwardsRow } from "@sqlc/awards_sql";
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
	GuardarAwardsInput,
	IAwardsService,
	MisAwardsResueltos,
	ResultadosAwards,
	ResumenActualizacionAwards,
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
			award_campeon: input.campeon,
			award_goleador: input.goleador,
			award_mejor_jugador: input.mejorJugador,
			award_mejor_arquero: input.mejorArquero,
			award_mejor_jugador_joven: input.mejorJugadorJoven,
			award_mejor_gol: input.mejorGol,
			award_seleccion_decepcion: input.seleccionDecepcion,
			award_seleccion_sorpresa: input.seleccionSorpresa,
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
			raw.award_goleador,
			raw.award_mejor_jugador,
			raw.award_mejor_arquero,
			raw.award_mejor_jugador_joven,
			raw.award_mejor_gol,
		].filter((id): id is number => id !== null);

		const jugadores =
			playerIds.length > 0
				? await this.estaticoRepo.verJugadoresPorIds({ ids: playerIds })
				: [];
		const jugadorMap = new Map(jugadores.map((j) => [j.id, j]));

		const resolveJugador = (id: number | null): string | null => {
			if (id === null) return null;
			const j = jugadorMap.get(id);
			return j ? `${j.nombre} (${j.equipo_nombre})` : null;
		};

		return {
			campeon: raw.award_campeon
				? (equipoMap.get(raw.award_campeon) ?? null)
				: null,
			goleador: resolveJugador(raw.award_goleador),
			mejorJugador: resolveJugador(raw.award_mejor_jugador),
			mejorArquero: resolveJugador(raw.award_mejor_arquero),
			mejorJugadorJoven: resolveJugador(raw.award_mejor_jugador_joven),
			mejorGol: resolveJugador(raw.award_mejor_gol),
			seleccionDecepcion: raw.award_seleccion_decepcion
				? (equipoMap.get(raw.award_seleccion_decepcion) ?? null)
				: null,
			seleccionSorpresa: raw.award_seleccion_sorpresa
				? (equipoMap.get(raw.award_seleccion_sorpresa) ?? null)
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

				if (u.award_campeon === resultados.campeon) {
					puntosGanados += 10;
					aciertos.push("Campeón +10");
				}
				if (u.award_goleador === resultados.goleador) {
					puntosGanados += 5;
					aciertos.push("Goleador +5");
				}
				if (u.award_mejor_jugador === resultados.mejorJugador) {
					puntosGanados += 5;
					aciertos.push("Mejor jugador +5");
				}
				if (u.award_mejor_arquero === resultados.mejorArquero) {
					puntosGanados += 3;
					aciertos.push("Mejor arquero +3");
				}
				if (u.award_mejor_jugador_joven === resultados.mejorJugadorJoven) {
					puntosGanados += 3;
					aciertos.push("Mejor jugador joven +3");
				}
				if (
					u.award_mejor_gol === resultados.mejorGolJugadorId &&
					puntosMejorGol > 0
				) {
					puntosGanados += puntosMejorGol;
					aciertos.push(`Mejor gol +${puntosMejorGol}`);
				}
				if (u.award_seleccion_decepcion === resultados.seleccionDecepcion) {
					puntosGanados += 5;
					aciertos.push("Selección Decepción +5");
				}
				if (u.award_seleccion_sorpresa === resultados.seleccionSorpresa) {
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
		return this.estaticoRepo.verJugadoresPorEquipo({ equipo_id: equipoId });
	}

	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]> {
		return this.awardsRepo.verPrediccionesAwards();
	}
}
