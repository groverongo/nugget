import {
	type ActualizarGolesPartidoArgs,
	type ActualizarPartidoEnVivoArgs,
	type ActualizarPartidoFinalizadoArgs,
	type ActualizarPartidoMedioTiempoArgs,
	actualizarGolesPartido,
	actualizarPartidoEnVivo,
	actualizarPartidoFinalizado,
	actualizarPartidoMedioTiempo,
	type MarcarResumenDiaEnviadoArgs,
	marcarResumenDiaEnviado,
	type ObtenerPartidoArgs,
	type ObtenerPartidoRow,
	obtenerPartido,
	type VerInformacionPartidoArgs,
	type VerInformacionPartidoRow,
	type VerPartidoParaCalculoArgs,
	type VerPartidoParaCalculoRow,
	type VerPartidosNoFinalizadosRow,
	type VerPartidosPorFechaArgs,
	type VerPartidosPorFechaRow,
	type VerResumenDiaEnviadoArgs,
	verFechasDePartidos,
	verInformacionPartido,
	verPartidoParaCalculo,
	verPartidosNoFinalizados,
	verPartidosPorFecha,
	verResumenDiaEnviado,
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

	verPartidoParaCalculo(
		args: VerPartidoParaCalculoArgs,
	): Promise<VerPartidoParaCalculoRow | null> {
		return verPartidoParaCalculo(this.pool, args);
	}

	actualizarPartidoEnVivo(args: ActualizarPartidoEnVivoArgs): Promise<void> {
		return actualizarPartidoEnVivo(this.pool, args);
	}

	actualizarPartidoFinalizado(
		args: ActualizarPartidoFinalizadoArgs,
	): Promise<void> {
		return actualizarPartidoFinalizado(this.pool, args);
	}

	actualizarPartidoMedioTiempo(
		args: ActualizarPartidoMedioTiempoArgs,
	): Promise<void> {
		return actualizarPartidoMedioTiempo(this.pool, args);
	}

	actualizarGolesPartido(args: ActualizarGolesPartidoArgs): Promise<void> {
		return actualizarGolesPartido(this.pool, args);
	}

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]> {
		return verPartidosNoFinalizados(this.pool);
	}

	marcarResumenDiaEnviado(args: MarcarResumenDiaEnviadoArgs): Promise<void> {
		return marcarResumenDiaEnviado(this.pool, args);
	}

	async verResumenDiaEnviado(args: VerResumenDiaEnviadoArgs): Promise<boolean> {
		const row = await verResumenDiaEnviado(this.pool, args);
		return row?.enviado ?? false;
	}

	withTx(tx: PoolClient): IPartidosRepository {
		return new PartidosRepository(tx);
	}
}
