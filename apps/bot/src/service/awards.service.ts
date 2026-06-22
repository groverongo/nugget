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
}
