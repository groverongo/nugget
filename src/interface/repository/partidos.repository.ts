import type {
	ActualizarPartidoFinalizadoArgs,
	ActualizarPartidoMedioTiempoArgs,
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidoParaCalculoArgs,
	VerPartidoParaCalculoRow,
	VerPartidosNoFinalizadosRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "@sqlc/partidos_sql";
import type { PoolClient } from "pg";

export interface IPartidosRepository {
	obtenerPartido(args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null>;

	verInformacionPartido(
		args: VerInformacionPartidoArgs,
	): Promise<VerInformacionPartidoRow | null>;

	verFechasDePartidos(): Promise<string[]>;

	verPorFecha(args: VerPartidosPorFechaArgs): Promise<VerPartidosPorFechaRow[]>;

	verPartidoParaCalculo(
		args: VerPartidoParaCalculoArgs,
	): Promise<VerPartidoParaCalculoRow | null>;

	actualizarPartidoFinalizado(
		args: ActualizarPartidoFinalizadoArgs,
	): Promise<void>;

	actualizarPartidoMedioTiempo(
		args: ActualizarPartidoMedioTiempoArgs,
	): Promise<void>;

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]>;

	withTx(tx: PoolClient): IPartidosRepository;
}
