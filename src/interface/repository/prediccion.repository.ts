import type {
	ActualizarPrediccionArgs,
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
import type { PoolClient } from "pg";

export interface IPrediccionesRepository {
	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void>;

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void>;

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]>;

	verPrediccionesPorFecha(
		args: VerPrediccionesPorFechaArgs,
	): Promise<VerPrediccionesPorFechaRow[]>;

	verPredicciones(): Promise<VerPrediccionesRow[]>;

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]>;

	verMisPrediccionesPorFecha(
		args: VerMisPrediccionesPorFechaArgs,
	): Promise<VerMisPrediccionesPorFechaRow[]>;

	withTx(tx: PoolClient): IPrediccionesRepository;
}
