import type {
	VerAwardsParaRecuentoRow,
	VerEquiposEliminadosRow,
	VerRankingCompletoRow,
	VerRankingRachaMaximaRow,
	VerRankingWinRateRow,
} from "@sqlc/recuento_sql";
import type { AwardGanadoresGrupo } from "./awards.service";

export type { VerAwardsParaRecuentoRow, VerEquiposEliminadosRow };

export interface HitMasGoles {
	totalGoles: number;
	partidos: string[];
	usuarios: { usuarioId: string }[];
}

export interface DatosRecuento {
	titulo: string;
	partidosFinalizados: number;
	partidosTotal: number;
	suplementariosOcurridos: number;
	suplementariosPosibles: number;
	exactos: number;
	totalFinalizados: number;
	ranking: VerRankingCompletoRow[];
	rankingWinRate: VerRankingWinRateRow[];
	rankingRacha: VerRankingRachaMaximaRow[];
	eliminados: VerEquiposEliminadosRow[];
	awards: VerAwardsParaRecuentoRow[];
	hitMasGoles: HitMasGoles | null;
	decepcionEquipoGanadorId: number | null;
	sorpresaEquipoGanadorId: number | null;
	finalistaIds: [number, number] | null;
	campeonKOId: number | null;
	awardsGanadores: AwardGanadoresGrupo[];
}

export interface IRecuentoService {
	obtenerDatosRecuento(
		titulo: string,
		totalPartidos?: number,
	): Promise<DatosRecuento>;
	verEquiposEliminados(): Promise<VerEquiposEliminadosRow[]>;
	verAwardsParaRecuento(): Promise<VerAwardsParaRecuentoRow[]>;
	marcarEquipoEliminado(equipoId: number): Promise<void>;
	marcarEquipoNoEliminado(equipoId: number): Promise<void>;
	resolverGanadoresDecepcionYSorpresa(): Promise<{
		decepcionEquipoGanadorId: number | null;
		sorpresaEquipoGanadorId: number | null;
	}>;
	resolverFinalistasYCampeonKO(): Promise<{
		finalistaIds: [number, number] | null;
		campeonKOId: number | null;
	}>;
}
