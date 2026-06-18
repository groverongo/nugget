import type { VerGanadoresHitMasGolesRow } from "@sqlc/predicciones_sql";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IRecuentoRepository } from "../interface/repository/recuento.repository";
import type {
	DatosRecuento,
	IRecuentoService,
} from "../interface/service/recuento.service";

export class RecuentoService implements IRecuentoService {
	constructor(
		private readonly recuentoRepo: IRecuentoRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
	) {}

	async obtenerDatosRecuento(titulo: string): Promise<DatosRecuento> {
		const [
			stats,
			winRate,
			ranking,
			rankingWinRate,
			rankingRacha,
			eliminados,
			awards,
			hitRaw,
		] = await Promise.all([
			this.recuentoRepo.verEstadisticasTorneo(),
			this.recuentoRepo.verWinRateGlobal(),
			this.recuentoRepo.verRankingCompleto(),
			this.recuentoRepo.verRankingWinRate(),
			this.recuentoRepo.verRankingRachaMaxima(),
			this.recuentoRepo.verEquiposEliminados(),
			this.recuentoRepo.verAwardsParaRecuento(),
			this.prediccionesRepo.verGanadoresHitMasGoles(),
		]);

		const hitMasGoles = hitRaw.map((r: VerGanadoresHitMasGolesRow) => ({
			usuarioId: r.usuarioId,
			username: r.username,
			totalGoles: r.totalGoles,
			partido: `${r.equipoLocalBandera} ${r.equipoLocalSiglas} ${r.golesLocal}-${r.golesVisitante} ${r.equipoVisitanteSiglas} ${r.equipoVisitanteBandera}`,
		}));

		return {
			titulo,
			partidosFinalizados: stats?.partidosFinalizados ?? 0,
			partidosTotal: stats?.partidosTotal ?? 0,
			exactos: winRate?.exactos ?? 0,
			totalFinalizados: winRate?.totalFinalizados ?? 0,
			ranking,
			rankingWinRate,
			rankingRacha,
			eliminados,
			awards,
			hitMasGoles,
		};
	}

	marcarEquipoEliminado(equipoId: number): Promise<void> {
		return this.recuentoRepo.marcarEquipoEliminado({ id: equipoId });
	}

	marcarEquipoNoEliminado(equipoId: number): Promise<void> {
		return this.recuentoRepo.marcarEquipoNoEliminado({ id: equipoId });
	}
}
