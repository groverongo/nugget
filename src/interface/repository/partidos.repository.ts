import type {
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "@sqlc/partidos_sql";
import type { PoolClient } from "pg";

export interface IPartidosRepository {
	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null>;

	verFechasDePartidos(): Promise<string[]>;

	verPorFecha(args: VerPartidosPorFechaArgs): Promise<VerPartidosPorFechaRow[]>;

	withTx(tx: PoolClient): IPartidosRepository;
}
