import type {
	ActualizarGolesPartidoArgs,
	ActualizarPartidoEnVivoArgs,
	ActualizarPartidoFinalizadoArgs,
	ActualizarPartidoMedioTiempoArgs,
	AgregarPartidoArgs,
	MarcarResumenDiaEnviadoArgs,
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidoParaCalculoArgs,
	VerPartidoParaCalculoRow,
	VerPartidosNoFinalizadosRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
	VerResumenDiaEnviadoArgs,
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

	actualizarPartidoEnVivo(args: ActualizarPartidoEnVivoArgs): Promise<void>;

	actualizarPartidoFinalizado(
		args: ActualizarPartidoFinalizadoArgs,
	): Promise<void>;

	actualizarPartidoMedioTiempo(
		args: ActualizarPartidoMedioTiempoArgs,
	): Promise<void>;

	actualizarGolesPartido(args: ActualizarGolesPartidoArgs): Promise<void>;

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]>;

	marcarResumenDiaEnviado(args: MarcarResumenDiaEnviadoArgs): Promise<void>;

	verResumenDiaEnviado(args: VerResumenDiaEnviadoArgs): Promise<boolean>;

	agregarPartido(args: AgregarPartidoArgs): Promise<void>;

	withTx(tx: PoolClient): IPartidosRepository;
}
