import type { VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	BuscarJugadoresRow,
	VerJugadoresPorEquipoRow,
} from "@sqlc/jugadores_sql";

export interface GuardarAwardsInput {
	usuarioId: string;
	campeon: number;
	goleador: number;
	mejorJugador: number;
	mejorArquero: number;
	mejorJugadorJoven: number;
	mejorGol: number;
	seleccionDecepcion: number;
	seleccionSorpresa: number;
}

export interface ResultadosAwards {
	campeon: number;
	goleador: number;
	mejorJugador: number;
	mejorArquero: number;
	mejorJugadorJoven: number;
	mejorGolJugadorId: number;
	mejorGolPosicion: number;
	seleccionDecepcion: number;
	seleccionSorpresa: number;
}

export interface ResumenActualizacionAwards {
	totalUsuarios: number;
	resultados: {
		usuarioId: string;
		username: string;
		puntosGanados: number;
		aciertos: string[];
	}[];
}

export interface IAwardsService {
	guardarAwards(input: GuardarAwardsInput): Promise<void>;
	actualizarAwards(
		resultados: ResultadosAwards,
	): Promise<ResumenActualizacionAwards>;
	verEquiposWhiteHorse(): Promise<VerEquiposRow[]>;
	verEquiposDarkHorse(): Promise<VerEquiposRow[]>;
	verEquipos(): Promise<VerEquiposRow[]>;
	buscarJugadores(query: string): Promise<BuscarJugadoresRow[]>;
	verJugadoresPorEquipo(equipoId: number): Promise<VerJugadoresPorEquipoRow[]>;
}
