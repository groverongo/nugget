import {
	type ObtenerPartidoArgs,
	type ObtenerPartidoRow,
	obtenerPartido,
	type VerPartidosPorFechaArgs,
	type VerPartidosPorFechaRow,
	verPartidosPorFecha,
} from "@sqlc/partidos_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IPartidosRepository } from "../interface/repository/partidos.repository";

export class PartidosRepository implements IPartidosRepository {
	constructor(private readonly pool: DBExecutor) {}

	verPorFecha(
		args: VerPartidosPorFechaArgs,
	): Promise<VerPartidosPorFechaRow[]> {
		return verPartidosPorFecha(this.pool, args);
	}

	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null> {
		return obtenerPartido(this.pool, args);
	}

	withTx(tx: PoolClient): IPartidosRepository {
		return new PartidosRepository(tx);
	}
}
