import type {
	VerMisPrediccionesPorFechaArgs,
	VerMisPrediccionesPorFechaRow,
	VerMisPrediccionesRow,
	VerParticipantesSinPrediccionArgs,
	VerParticipantesSinPrediccionRow,
	VerPrediccionesPorFechaArgs,
	VerPrediccionesPorFechaRow,
	VerPrediccionesPorPartidoArgs,
	VerPrediccionesPorPartidoRow,
	VerPrediccionesResumenPartidoArgs,
	VerPrediccionesResumenPartidoRow,
	VerPrediccionesRow,
	VerPuntajesPartidoArgs,
	VerPuntajesPartidoRow,
} from "@sqlc/predicciones_sql";
import type { TxManager } from "@support/db.provider";
import type { ObtenerPartidoRow } from "db/sqlcgen/partidos_sql";
import type { IPartidosRepository } from "src/interface/repository/partidos.repository";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IPrediccionesService } from "../interface/service/predicciones.service";

export interface GuardarPrediccionArgs {
	usuarioId: string;
	partidoId: number;
	golesLocal: number;
	golesVisitante: number;
	penalesGanadorId?: number | null;
}

export class PrediccionesService implements IPrediccionesService {
	constructor(
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly partidosRepo: IPartidosRepository,
		private readonly txManager: TxManager,
	) {}

	async guardarPrediccion(
		args: GuardarPrediccionArgs,
	): Promise<"created" | "updated"> {
		const partido: ObtenerPartidoRow | null =
			await this.partidosRepo.obtenerPartido({ id: args.partidoId });

		await this.assertPrediccionPermitida(partido, args);

		const penalesGanadorId = args.penalesGanadorId ?? null;

		const prediccionExistente =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.usuarioId,
				partidoId: args.partidoId,
			});

		if (prediccionExistente) {
			this.txManager.runInTx(async (tx) => {
				const prediccionRepo = this.prediccionesRepo.withTx(tx);
				await prediccionRepo.actualizarPrediccion({
					golesLocal: args.golesLocal,
					golesVisitante: args.golesVisitante,
					penalesGanadorId,
					usuarioId: args.usuarioId,
					partidoId: args.partidoId,
				});
				await prediccionRepo.agregarHistoriaPrediccion({
					golesLocal: prediccionExistente.golesLocal,
					golesVisitante: prediccionExistente.golesVisitante,
					partidoId: args.partidoId,
					usuarioId: args.usuarioId,
				});
			});
			return "updated";
		}

		await this.prediccionesRepo.agregarPrediccion({
			usuarioId: args.usuarioId,
			partidoId: args.partidoId,
			golesLocal: args.golesLocal,
			golesVisitante: args.golesVisitante,
			penalesGanadorId,
		});
		return "created";
	}

	private async assertPrediccionPermitida(
		partido: ObtenerPartidoRow | null,
		args: GuardarPrediccionArgs,
	): Promise<void> {
		if (!partido) {
			throw new Error("El partido no existe.");
		}

		const esSuple = partido.partidoOriginalId !== null;

		if (esSuple) {
			// Suples: se puede predecir solo cuando está programado
			if (partido.estado !== "programado") {
				throw new Error("El suplementario ya comenzó.");
			}
			// Validar goles mínimos
			const minLocal = Number(partido.golesMinimosLocal ?? 0);
			const minVisitante = Number(partido.golesMinimosVisitante ?? 0);
			if (args.golesLocal < minLocal || args.golesVisitante < minVisitante) {
				throw new Error(
					`En suplementario no puedes apostar menos goles que el marcador actual (${minLocal}-${minVisitante}).`,
				);
			}
			// Si predice empate, requiere ganador de penales
			if (args.golesLocal === args.golesVisitante && !args.penalesGanadorId) {
				throw new Error(
					"Si predices empate en suplementario, debes indicar quién gana los penales.",
				);
			}
		} else {
			// Partido normal: validar por fecha
			const fechaPartido = partido.fechaPartido;
			if (fechaPartido !== null && fechaPartido.getTime() <= Date.now()) {
				throw new Error("El partido ya inició.");
			}
		}
	}

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]> {
		return this.prediccionesRepo.verPrediccionesPorPartido(args);
	}

	verPrediccionesPorFecha(
		args: VerPrediccionesPorFechaArgs,
	): Promise<VerPrediccionesPorFechaRow[]> {
		return this.prediccionesRepo.verPrediccionesPorFecha(args);
	}

	verPredicciones(): Promise<VerPrediccionesRow[]> {
		return this.prediccionesRepo.verPredicciones();
	}

	verMisPredicciones(
		usuarioId: string,
		limit: number,
		offset: number,
	): Promise<VerMisPrediccionesRow[]> {
		return this.prediccionesRepo.verMisPredicciones(usuarioId, limit, offset);
	}

	verFechasDePrediccionesPorUsuario(usuarioId: string): Promise<string[]> {
		return this.prediccionesRepo.verFechasDePrediccionesPorUsuario(usuarioId);
	}

	verMisPrediccionesPorFecha(
		args: VerMisPrediccionesPorFechaArgs,
	): Promise<VerMisPrediccionesPorFechaRow[]> {
		return this.prediccionesRepo.verMisPrediccionesPorFecha(args);
	}

	verPuntajesPartido(
		args: VerPuntajesPartidoArgs,
	): Promise<VerPuntajesPartidoRow[]> {
		return this.prediccionesRepo.verPuntajesPartido(args);
	}

	verPrediccionesResumenPartido(
		args: VerPrediccionesResumenPartidoArgs,
	): Promise<VerPrediccionesResumenPartidoRow[]> {
		return this.prediccionesRepo.verPrediccionesResumenPartido(args);
	}

	verParticipantesSinPrediccion(
		args: VerParticipantesSinPrediccionArgs,
	): Promise<VerParticipantesSinPrediccionRow[]> {
		return this.prediccionesRepo.verParticipantesSinPrediccion(args);
	}
}
