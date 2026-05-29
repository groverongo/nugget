import {
	type ActualizarPrediccionArgs,
	type AgregarPrediccionArgs,
	actualizarPrediccion,
	agregarPrediccion,
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

	withTx(tx: PoolClient): IPrediccionesRepository {
		return new PrediccionesRepository(tx);
	}
}
