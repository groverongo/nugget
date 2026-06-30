import {
	type EliminarPrediccionesEtPorPartidoArgs,
	eliminarPrediccionesEtPorPartido,
	type UpsertPrediccionEtArgs,
	upsertPrediccionEt,
	type VerPrediccionEtArgs,
	type VerPrediccionEtRow,
	type VerPrediccionesEtPorPartidoRow,
	verPrediccionEt,
	verPrediccionesEtPorPartido,
} from "@sqlc/predicciones_et_sql";
import type { Pool } from "pg";
import type { IPrediccionesEtRepository } from "../interface/repository/predicciones-et.repository";

export class PrediccionesEtRepository implements IPrediccionesEtRepository {
	constructor(private readonly pool: Pool) {}

	upsertPrediccionEt(args: UpsertPrediccionEtArgs): Promise<void> {
		return upsertPrediccionEt(this.pool, args);
	}

	verPrediccionEt(
		args: VerPrediccionEtArgs,
	): Promise<VerPrediccionEtRow | null> {
		return verPrediccionEt(this.pool, args);
	}

	verPrediccionesEtPorPartido(
		partidoId: number,
	): Promise<VerPrediccionesEtPorPartidoRow[]> {
		return verPrediccionesEtPorPartido(this.pool, { partidoId });
	}

	eliminarPrediccionesEtPorPartido(
		args: EliminarPrediccionesEtPorPartidoArgs,
	): Promise<void> {
		return eliminarPrediccionesEtPorPartido(this.pool, args);
	}
}
