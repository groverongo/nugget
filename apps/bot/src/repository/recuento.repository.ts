import {
	type MarcarEquipoEliminadoArgs,
	type MarcarEquipoNoEliminadoArgs,
	marcarEquipoEliminado,
	marcarEquipoNoEliminado,
	type VerAwardsParaRecuentoRow,
	type VerEquiposEliminadosRow,
	type VerEstadisticasTorneoRow,
	type VerRankingCompletoRow,
	type VerRankingRachaMaximaRow,
	type VerRankingWinRateRow,
	type VerWinRateGlobalRow,
	verAwardsParaRecuento,
	verEquiposEliminados,
	verEstadisticasTorneo,
	verRankingCompleto,
	verRankingRachaMaxima,
	verRankingWinRate,
	verWinRateGlobal,
} from "@sqlc/recuento_sql";
import type { DBExecutor } from "@support/db.provider";
import type { IRecuentoRepository } from "../interface/repository/recuento.repository";

export class RecuentoRepository implements IRecuentoRepository {
	constructor(private readonly pool: DBExecutor) {}

	verRankingCompleto(): Promise<VerRankingCompletoRow[]> {
		return verRankingCompleto(this.pool);
	}

	verEstadisticasTorneo(): Promise<VerEstadisticasTorneoRow | null> {
		return verEstadisticasTorneo(this.pool);
	}

	verWinRateGlobal(): Promise<VerWinRateGlobalRow | null> {
		return verWinRateGlobal(this.pool);
	}

	verRankingWinRate(): Promise<VerRankingWinRateRow[]> {
		return verRankingWinRate(this.pool);
	}

	verRankingRachaMaxima(): Promise<VerRankingRachaMaximaRow[]> {
		return verRankingRachaMaxima(this.pool);
	}

	verEquiposEliminados(): Promise<VerEquiposEliminadosRow[]> {
		return verEquiposEliminados(this.pool);
	}

	marcarEquipoEliminado(args: MarcarEquipoEliminadoArgs): Promise<void> {
		return marcarEquipoEliminado(this.pool, args);
	}

	marcarEquipoNoEliminado(args: MarcarEquipoNoEliminadoArgs): Promise<void> {
		return marcarEquipoNoEliminado(this.pool, args);
	}

	verAwardsParaRecuento(): Promise<VerAwardsParaRecuentoRow[]> {
		return verAwardsParaRecuento(this.pool);
	}
}
