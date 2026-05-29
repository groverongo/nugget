import type {
	ActualizarPrediccionArgs,
	AgregarPrediccionArgs,
} from "@sqlc/predicciones_sql";
import type { PoolClient } from "pg";

export interface IPrediccionesRepository {
	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void>;

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void>;

	withTx(tx: PoolClient): IPrediccionesRepository;
}
