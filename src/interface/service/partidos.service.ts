import type {
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "@sqlc/partidos_sql";

export interface IPartidosService {
	verFechasDePartidos(): Promise<string[]>;

	verPartidosPorFecha(
		args: VerPartidosPorFechaArgs,
	): Promise<VerPartidosPorFechaRow[]>;

	verInformacionPartido(
		args: VerInformacionPartidoArgs,
	): Promise<VerInformacionPartidoRow | null>;
}
