import {
	type ObtenerPartidoArgs,
	type ObtenerPartidoRow,
	obtenerPartido,
	type VerInformacionPartidoArgs,
	type VerInformacionPartidoRow,
	type VerPartidosPorFechaArgs,
	type VerPartidosPorFechaRow,
	verFechasDePartidos,
	verInformacionPartido,
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

	async verFechasDePartidos(): Promise<string[]> {
		const filas = await verFechasDePartidos(this.pool);
		return filas.map((fila) => fila.fecha);
	}

	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null> {
		return obtenerPartido(this.pool, args);
	}

	verInformacionPartido(
		args: VerInformacionPartidoArgs,
	): Promise<VerInformacionPartidoRow | null> {
		return verInformacionPartido(this.pool, args);
	}

	withTx(tx: PoolClient): IPartidosRepository {
		return new PartidosRepository(tx);
	}
}
