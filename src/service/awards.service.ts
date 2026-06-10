import type { VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	BuscarJugadoresRow,
	VerJugadoresPorEquipoRow,
} from "@sqlc/jugadores_sql";
import type { TxManager } from "@support/db.provider";
import type { IAwardsRepository } from "../interface/repository/awards.repository";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";
import type {
	GuardarAwardsInput,
	IAwardsService,
	ResultadosAwards,
	ResumenActualizacionAwards,
} from "../interface/service/awards.service";

const PUNTOS_MEJOR_GOL: Record<number, number> = {
	1: 8,
	2: 5,
	3: 3,
	4: 2,
	5: 2,
	6: 2,
	7: 1,
	8: 1,
	9: 1,
	10: 1,
};

export class AwardsService implements IAwardsService {
	constructor(
		private readonly awardsRepo: IAwardsRepository,
		private readonly estaticoRepo: IEstaticoRepository,
		private readonly txManager: TxManager,
	) {}

	async guardarAwards(input: GuardarAwardsInput): Promise<void> {
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
	}

	async actualizarAwards(
		resultados: ResultadosAwards,
	): Promise<ResumenActualizacionAwards> {
		const puntosMejorGol = PUNTOS_MEJOR_GOL[resultados.mejorGolPosicion] ?? 0;

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
}
