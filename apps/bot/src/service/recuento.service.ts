import type {
	VerEquiposConEliminacionRow,
	VerPartidoFinalRow,
} from "@sqlc/recuento_sql";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IRecuentoRepository } from "../interface/repository/recuento.repository";
import type { IAwardsService } from "../interface/service/awards.service";
import type {
	DatosRecuento,
	HitMasGoles,
	IRecuentoService,
} from "../interface/service/recuento.service";

// Torneo de 48 equipos: 12 grupos (72 partidos) + 32 partidos de eliminacion directa
const TOTAL_PARTIDOS_TORNEO = 104;
// Solo los partidos de eliminacion directa (no de grupos) pueden ir a suplementario
const SUPLEMENTARIOS_POSIBLES_TORNEO = 32;

// "Seleccion Decepcion": ranking de los 16 favoritos para clasificar de grupo (White Horses).
// Gana quien apueste por el que quede eliminado antes; en empate gana el de menor numero (mas favorito).
const WH_RANK_POR_SIGLAS: Record<string, number> = {
	FRA: 1,
	ARG: 2,
	ESP: 3,
	ENG: 4,
	POR: 5,
	GER: 6,
	BRA: 7,
	NED: 8,
	BEL: 9,
	CRO: 10,
	COL: 11,
	URU: 12,
	MAR: 13,
	MEX: 14,
	USA: 15,
	JPN: 16,
};

// "Seleccion Sorpresa": ranking de los 24 equipos con menos chances de clasificar de grupo (Dark Horses).
// Gana quien apueste por el que llegue mas lejos; en empate gana el de menor numero.
const DH_RANK_POR_SIGLAS: Record<string, number> = {
	IRQ: 1,
	NZL: 2,
	HAI: 3,
	RSA: 4,
	QAT: 5,
	JOR: 6,
	CUW: 7,
	BIH: 8,
	CPV: 9,
	KSA: 10,
	GHA: 11,
	UZB: 12,
	TUN: 13,
	COD: 14,
	SCO: 15,
	CZE: 16,
	PAR: 17,
	PAN: 18,
	CIV: 19,
	NOR: 20,
	EGY: 21,
	ALG: 22,
	SWE: 23,
	CAN: 24,
};

/** Bucket de "dia" en hora Peru (UTC-5), para agrupar eliminaciones de la misma ronda como empate */
function diaEnPeru(fecha: Date): string {
	const ajustada = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
	return ajustada.toISOString().split("T")[0];
}

export class RecuentoService implements IRecuentoService {
	constructor(
		private readonly recuentoRepo: IRecuentoRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly awardsService: IAwardsService,
	) {}

	private resolverDecepcionYSorpresa(equipos: VerEquiposConEliminacionRow[]): {
		decepcionEquipoGanadorId: number | null;
		sorpresaEquipoGanadorId: number | null;
	} {
		const whEliminados = equipos
			.filter(
				(e) => e.eliminado && e.eliminadoAt && WH_RANK_POR_SIGLAS[e.siglas],
			)
			.map((e) => ({
				id: e.id,
				rank: WH_RANK_POR_SIGLAS[e.siglas],
				dia: diaEnPeru(e.eliminadoAt as Date),
			}));

		let decepcionEquipoGanadorId: number | null = null;
		if (whEliminados.length > 0) {
			whEliminados.sort((a, b) =>
				a.dia !== b.dia ? a.dia.localeCompare(b.dia) : a.rank - b.rank,
			);
			decepcionEquipoGanadorId = whEliminados[0].id;
		}

		const dhTodos = equipos.filter((e) => DH_RANK_POR_SIGLAS[e.siglas]);
		const dhVivos = dhTodos.filter((e) => !e.eliminado);

		let sorpresaEquipoGanadorId: number | null = null;
		if (dhVivos.length === 1) {
			sorpresaEquipoGanadorId = dhVivos[0].id;
		} else if (dhVivos.length === 0 && dhTodos.length > 0) {
			const dhEliminados = dhTodos
				.filter((e) => e.eliminadoAt)
				.map((e) => ({
					id: e.id,
					rank: DH_RANK_POR_SIGLAS[e.siglas],
					dia: diaEnPeru(e.eliminadoAt as Date),
				}));
			dhEliminados.sort((a, b) =>
				a.dia !== b.dia ? b.dia.localeCompare(a.dia) : a.rank - b.rank,
			);
			sorpresaEquipoGanadorId = dhEliminados[0]?.id ?? null;
		}

		return { decepcionEquipoGanadorId, sorpresaEquipoGanadorId };
	}

	async resolverGanadoresDecepcionYSorpresa(): Promise<{
		decepcionEquipoGanadorId: number | null;
		sorpresaEquipoGanadorId: number | null;
	}> {
		const equipos = await this.recuentoRepo.verEquiposConEliminacion();
		return this.resolverDecepcionYSorpresa(equipos);
	}

	private resolverFinalistasYCampeon(partidoFinal: VerPartidoFinalRow[]): {
		finalistaIds: [number, number] | null;
		campeonKOId: number | null;
	} {
		if (partidoFinal.length === 0) {
			return { finalistaIds: null, campeonKOId: null };
		}

		const { equipoLocalId, equipoVisitanteId } = partidoFinal[0];
		const finalistaIds: [number, number] | null =
			equipoLocalId !== null && equipoVisitanteId !== null
				? [equipoLocalId, equipoVisitanteId]
				: null;

		// La ultima fila es la mas avanzada (el suplementario, si el partido fue a ET)
		const filaDecisiva = partidoFinal[partidoFinal.length - 1];
		let campeonKOId: number | null = null;
		if (
			filaDecisiva.estado === "finalizado" &&
			filaDecisiva.golesLocal !== null &&
			filaDecisiva.golesVisitante !== null
		) {
			if (filaDecisiva.golesLocal > filaDecisiva.golesVisitante) {
				campeonKOId = filaDecisiva.equipoLocalId;
			} else if (filaDecisiva.golesLocal < filaDecisiva.golesVisitante) {
				campeonKOId = filaDecisiva.equipoVisitanteId;
			} else {
				campeonKOId = filaDecisiva.penalesGanadorId;
			}
		}

		return { finalistaIds, campeonKOId };
	}

	async resolverFinalistasYCampeonKO(): Promise<{
		finalistaIds: [number, number] | null;
		campeonKOId: number | null;
	}> {
		const partidoFinal = await this.recuentoRepo.verPartidoFinal();
		return this.resolverFinalistasYCampeon(partidoFinal);
	}

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
			equiposConEliminacion,
			partidoFinal,
			awardsGanadores,
		] = await Promise.all([
			this.recuentoRepo.verEstadisticasTorneo(),
			this.recuentoRepo.verWinRateGlobal(),
			this.recuentoRepo.verRankingCompleto(),
			this.recuentoRepo.verRankingWinRate(),
			this.recuentoRepo.verRankingRachaMaxima(),
			this.recuentoRepo.verEquiposEliminados(),
			this.recuentoRepo.verAwardsParaRecuento(),
			this.prediccionesRepo.verGanadoresHitMasGoles(),
			this.recuentoRepo.verEquiposConEliminacion(),
			this.recuentoRepo.verPartidoFinal(),
			this.awardsService.calcularGanadoresPorAward(),
		]);

		const { decepcionEquipoGanadorId, sorpresaEquipoGanadorId } =
			this.resolverDecepcionYSorpresa(equiposConEliminacion);
		const { finalistaIds, campeonKOId } =
			this.resolverFinalistasYCampeon(partidoFinal);

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
			partidosTotal: totalPartidos ?? TOTAL_PARTIDOS_TORNEO,
			suplementariosOcurridos: stats?.suplementariosOcurridos ?? 0,
			suplementariosPosibles: SUPLEMENTARIOS_POSIBLES_TORNEO,
			exactos: winRate?.exactos ?? 0,
			totalFinalizados: winRate?.totalFinalizados ?? 0,
			ranking,
			rankingWinRate,
			rankingRacha,
			eliminados,
			awards,
			hitMasGoles,
			decepcionEquipoGanadorId,
			sorpresaEquipoGanadorId,
			finalistaIds,
			campeonKOId,
			awardsGanadores,
		};
	}

	verEquiposEliminados() {
		return this.recuentoRepo.verEquiposEliminados();
	}

	verAwardsParaRecuento() {
		return this.recuentoRepo.verAwardsParaRecuento();
	}

	marcarEquipoEliminado(equipoId: number): Promise<void> {
		return this.recuentoRepo.marcarEquipoEliminado({ id: equipoId });
	}

	marcarEquipoNoEliminado(equipoId: number): Promise<void> {
		return this.recuentoRepo.marcarEquipoNoEliminado({ id: equipoId });
	}
}
