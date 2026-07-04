import type {
	MarcarEquipoEliminadoArgs,
	MarcarEquipoNoEliminadoArgs,
	VerAwardsParaRecuentoRow,
	VerEquiposConEliminacionRow,
	VerEquiposEliminadosRow,
	VerEstadisticasTorneoRow,
	VerPartidoFinalRow,
	VerRankingCompletoRow,
	VerRankingRachaMaximaRow,
	VerRankingWinRateRow,
	VerWinRateGlobalRow,
} from "@sqlc/recuento_sql";

export interface IRecuentoRepository {
	verRankingCompleto(): Promise<VerRankingCompletoRow[]>;
	verEstadisticasTorneo(): Promise<VerEstadisticasTorneoRow | null>;
	verWinRateGlobal(): Promise<VerWinRateGlobalRow | null>;
	verRankingWinRate(): Promise<VerRankingWinRateRow[]>;
	verRankingRachaMaxima(): Promise<VerRankingRachaMaximaRow[]>;
	verEquiposEliminados(): Promise<VerEquiposEliminadosRow[]>;
	verEquiposConEliminacion(): Promise<VerEquiposConEliminacionRow[]>;
	verPartidoFinal(): Promise<VerPartidoFinalRow[]>;
	marcarEquipoEliminado(args: MarcarEquipoEliminadoArgs): Promise<void>;
	marcarEquipoNoEliminado(args: MarcarEquipoNoEliminadoArgs): Promise<void>;
	verAwardsParaRecuento(): Promise<VerAwardsParaRecuentoRow[]>;
}
