import {
	type ObtenerPartidoArgs,
	type ObtenerPartidoRow,
	obtenerPartido,
} from "@sqlc/partido_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IPartidosRepository } from "../interface/repository/partido.repository";

export class PartidosRepository implements IPartidosRepository {
	constructor(private readonly pool: DBExecutor) {}

	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null> {
		return obtenerPartido(this.pool, args);
	}

	withTx(tx: PoolClient): IPartidosRepository {
		return new PartidosRepository(tx);
	}
}
