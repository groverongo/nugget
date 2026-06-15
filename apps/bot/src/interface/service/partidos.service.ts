import type {
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidosNoFinalizadosRow,
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

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]>;

	actualizarPartidoEnVivo(id: number): Promise<void>;

	sumarGol(partidoId: number, equipo: "local" | "visitante"): Promise<void>;

	restarGol(partidoId: number, equipo: "local" | "visitante"): Promise<void>;
}
