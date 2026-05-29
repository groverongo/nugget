import {
	type ActualizarPrediccionArgs,
	type AgregarPrediccionArgs,
	actualizarPrediccion,
	agregarPrediccion,
	type VerMisPrediccionesHoyRow,
	type VerMisPrediccionesRow,
	type VerPrediccionesHoyRow,
	type VerPrediccionesPorPartidoArgs,
	type VerPrediccionesPorPartidoRow,
	type VerPrediccionesRow,
	verMisPredicciones,
	verMisPrediccionesHoy,
	verPredicciones,
	verPrediccionesHoy,
	verPrediccionesPorPartido,
} from "@sqlc/predicciones_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";

export class PrediccionesRepository implements IPrediccionesRepository {
	constructor(private readonly pool: DBExecutor) {}

	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void> {
		return agregarPrediccion(this.pool, args);
	}

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void> {
		return actualizarPrediccion(this.pool, args);
	}

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]> {
		return verPrediccionesPorPartido(this.pool, args);
	}

	verPrediccionesHoy(): Promise<VerPrediccionesHoyRow[]> {
		return verPrediccionesHoy(this.pool);
	}

	verPredicciones(): Promise<VerPrediccionesRow[]> {
		return verPredicciones(this.pool);
	}

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]> {
		return verMisPredicciones(this.pool, { usuarioId });
	}

	verMisPrediccionesHoy(
		usuarioId: string,
	): Promise<VerMisPrediccionesHoyRow[]> {
		return verMisPrediccionesHoy(this.pool, { usuarioId });
	}

	withTx(tx: PoolClient): IPrediccionesRepository {
		return new PrediccionesRepository(tx);
	}
}
