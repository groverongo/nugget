import type {
	AgregarPrediccionArgs,
	VerMisPrediccionesPorFechaArgs,
	VerMisPrediccionesPorFechaRow,
	VerMisPrediccionesRow,
	VerPrediccionesPorFechaArgs,
	VerPrediccionesPorFechaRow,
	VerPrediccionesPorPartidoArgs,
	VerPrediccionesPorPartidoRow,
	VerPrediccionesRow,
} from "@sqlc/predicciones_sql";
import type { TxManager } from "@support/db.provider";
import type { ObtenerPartidoRow } from "db/sqlcgen/partidos_sql";
import type { IPartidosRepository } from "src/interface/repository/partidos.repository";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IPrediccionesService } from "../interface/service/predicciones.service";

export class PrediccionesService implements IPrediccionesService {
	constructor(
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly partidosRepo: IPartidosRepository,
		// biome-ignore lint/correctness/noUnusedPrivateClassMembers: <Es el estandar para la capa de servicios>
		private readonly txManager: TxManager,
	) {}

	async guardarPrediccion(
		args: AgregarPrediccionArgs,
	): Promise<"created" | "updated"> {
		const partido: ObtenerPartidoRow | null =
			await this.partidosRepo.obtenerPartido({ id: args.partidoId });
		await this.assertPartidoNoIniciado(partido);

		const prediccionExistente =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.usuarioId,
				partidoId: args.partidoId,
			});

		if (prediccionExistente) {
			await this.prediccionesRepo.actualizarPrediccion(args);
			return "updated";
		}

		await this.prediccionesRepo.agregarPrediccion(args);
		return "created";
	}

	async guardarPrediccionAdmin(
		args: AgregarPrediccionArgs,
	): Promise<"created" | "updated"> {
		const prediccionExistente =
			await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
				usuarioId: args.usuarioId,
				partidoId: args.partidoId,
			});

		if (prediccionExistente) {
			await this.prediccionesRepo.actualizarPrediccion(args);
			return "updated";
		}

		await this.prediccionesRepo.agregarPrediccion(args);
		return "created";
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

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]> {
		return this.prediccionesRepo.verMisPredicciones(usuarioId);
	}

	verFechasDePrediccionesPorUsuario(usuarioId: string): Promise<string[]> {
		return this.prediccionesRepo.verFechasDePrediccionesPorUsuario(usuarioId);
	}

	verMisPrediccionesPorFecha(
		args: VerMisPrediccionesPorFechaArgs,
	): Promise<VerMisPrediccionesPorFechaRow[]> {
		return this.prediccionesRepo.verMisPrediccionesPorFecha(args);
	}

	private async assertPartidoNoIniciado(
		partido: ObtenerPartidoRow | null,
	): Promise<void> {
		if (!partido) {
			throw new Error("El partido no existe.");
		}

		const fechaPartido = partido.fechaPartido;

		if (fechaPartido !== null && fechaPartido.getTime() <= Date.now()) {
			throw new Error("El partido ya inició.");
		}
	}
}
