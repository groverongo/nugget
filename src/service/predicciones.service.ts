import type {
	ActualizarPrediccionArgs,
	AgregarPrediccionArgs,
} from "@sqlc/predicciones_sql";
import type { TxManager } from "@support/db.provider";
import type { ObtenerPartidoRow } from "db/sqlcgen/partido_sql";
import type { IPartidosRepository } from "../interface/repository/partido.repository";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IPrediccionesService } from "../interface/service/predicciones.service";

export class PrediccionesService implements IPrediccionesService {
	constructor(
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly partidosRepo: IPartidosRepository,
		private readonly txManager: TxManager,
	) {}

	async agregarPrediccion(args: AgregarPrediccionArgs): Promise<void> {
		const partido: ObtenerPartidoRow | null =
			await this.partidosRepo.obtenerPartido({ id: args.partidoId });
		await this.assertPartidoNoIniciado(partido);
		await this.prediccionesRepo.agregarPrediccion(args);
	}

	async actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void> {
		const partido: ObtenerPartidoRow | null =
			await this.partidosRepo.obtenerPartido({ id: args.partidoId });
		await this.assertPartidoNoIniciado(partido);
		await this.prediccionesRepo.actualizarPrediccion(args);
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
