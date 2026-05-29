import type {
	ActualizarPrediccionArgs,
	AgregarPrediccionArgs,
	VerMisPrediccionesHoyRow,
	VerMisPrediccionesRow,
	VerPrediccionesHoyRow,
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

	verPrediccionesHoy(): Promise<VerPrediccionesHoyRow[]>;

	verPredicciones(): Promise<VerPrediccionesRow[]>;

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]>;

	verMisPrediccionesHoy(usuarioId: string): Promise<VerMisPrediccionesHoyRow[]>;

	withTx(tx: PoolClient): IPrediccionesRepository;
}
