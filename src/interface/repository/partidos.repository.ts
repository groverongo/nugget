import type {
	ActualizarPartidoEnVivoArgs,
	ActualizarPartidoFinalizadoArgs,
	ActualizarPartidoMedioTiempoArgs,
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	RestarGolLocalArgs,
	RestarGolVisitanteArgs,
	SumarGolLocalArgs,
	SumarGolVisitanteArgs,
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

	actualizarPartidoEnVivo(args: ActualizarPartidoEnVivoArgs): Promise<void>;

	actualizarPartidoFinalizado(
		args: ActualizarPartidoFinalizadoArgs,
	): Promise<void>;

	actualizarPartidoMedioTiempo(
		args: ActualizarPartidoMedioTiempoArgs,
	): Promise<void>;

	sumarGolLocal(args: SumarGolLocalArgs): Promise<void>;

	sumarGolVisitante(args: SumarGolVisitanteArgs): Promise<void>;

	restarGolLocal(args: RestarGolLocalArgs): Promise<void>;

	restarGolVisitante(args: RestarGolVisitanteArgs): Promise<void>;

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]>;

	withTx(tx: PoolClient): IPartidosRepository;
}
