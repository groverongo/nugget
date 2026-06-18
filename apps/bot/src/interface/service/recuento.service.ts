import type {
	VerAwardsParaRecuentoRow,
	VerEquiposEliminadosRow,
	VerRankingCompletoRow,
	VerRankingRachaMaximaRow,
	VerRankingWinRateRow,
} from "@sqlc/recuento_sql";

export interface DatosRecuento {
	titulo: string;
	partidosFinalizados: number;
	partidosTotal: number;
	exactos: number;
	totalFinalizados: number;
	ranking: VerRankingCompletoRow[];
	rankingWinRate: VerRankingWinRateRow[];
	rankingRacha: VerRankingRachaMaximaRow[];
	eliminados: VerEquiposEliminadosRow[];
	awards: VerAwardsParaRecuentoRow[];
	hitMasGoles: {
		usuarioId: string;
		username: string;
		totalGoles: number;
		partido: string;
	}[];
}

export interface IRecuentoService {
	obtenerDatosRecuento(titulo: string): Promise<DatosRecuento>;
	marcarEquipoEliminado(equipoId: number): Promise<void>;
	marcarEquipoNoEliminado(equipoId: number): Promise<void>;
}
