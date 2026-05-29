import type { ObtenerPartidoArgs, ObtenerPartidoRow } from "@sqlc/partido_sql";
import type { PoolClient } from "pg";

export interface IPartidosRepository {
	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null>;

	withTx(tx: PoolClient): IPartidosRepository;
}
