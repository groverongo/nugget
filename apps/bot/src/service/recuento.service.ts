import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IRecuentoRepository } from "../interface/repository/recuento.repository";
import type {
	DatosRecuento,
	HitMasGoles,
	IRecuentoService,
} from "../interface/service/recuento.service";

export class RecuentoService implements IRecuentoService {
	constructor(
		private readonly recuentoRepo: IRecuentoRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
	) {}

	async obtenerDatosRecuento(
		titulo: string,
		totalPartidos?: number,
	): Promise<DatosRecuento> {
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

		let hitMasGoles: HitMasGoles | null = null;
		if (hitRaw.length > 0) {
			const totalGoles = hitRaw[0].totalGoles;
			const seenUsuarios = new Set<string>();
			const seenPartidos = new Set<string>();
			const usuarios: { usuarioId: string }[] = [];
			const partidos: string[] = [];

			for (const r of hitRaw) {
				const partidoStr = `${r.equipoLocalBandera} ${r.equipoLocalSiglas} ${r.golesLocal}-${r.golesVisitante} ${r.equipoVisitanteSiglas} ${r.equipoVisitanteBandera}`;
				if (!seenPartidos.has(partidoStr)) {
					seenPartidos.add(partidoStr);
					partidos.push(partidoStr);
				}
				if (!seenUsuarios.has(r.usuarioId)) {
					seenUsuarios.add(r.usuarioId);
					usuarios.push({ usuarioId: r.usuarioId });
				}
			}
			hitMasGoles = { totalGoles, partidos, usuarios };
		}

		return {
			titulo,
			partidosFinalizados: stats?.partidosFinalizados ?? 0,
			partidosTotal: totalPartidos ?? stats?.partidosTotal ?? 0,
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
