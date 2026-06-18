import type {
	VerAwardsParaRecuentoRow,
	VerEquiposEliminadosRow,
	VerRankingCompletoRow,
	VerRankingRachaMaximaRow,
	VerRankingWinRateRow,
} from "@sqlc/recuento_sql";

export interface HitMasGoles {
	totalGoles: number;
	partidos: string[];
	usuarios: { usuarioId: string }[];
}

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
	hitMasGoles: HitMasGoles | null;
}

export interface IRecuentoService {
	obtenerDatosRecuento(
		titulo: string,
		totalPartidos?: number,
	): Promise<DatosRecuento>;
	marcarEquipoEliminado(equipoId: number): Promise<void>;
	marcarEquipoNoEliminado(equipoId: number): Promise<void>;
}
