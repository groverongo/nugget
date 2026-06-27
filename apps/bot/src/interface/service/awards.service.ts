import type {
	BuscarJugadoresNoEliminadosRow,
	VerEquiposNoEliminadosRow,
	VerPrediccionesAwardsKORow,
	VerPrediccionesAwardsRow,
} from "@sqlc/awards_sql";
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

export interface MisAwardsResueltos {
	campeon: string | null;
	goleador: string | null;
	mejorJugador: string | null;
	mejorArquero: string | null;
	mejorJugadorJoven: string | null;
	mejorGol: string | null;
	seleccionDecepcion: string | null;
	seleccionSorpresa: string | null;
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

export interface GuardarAwardsKOInput {
	usuarioId: string;
	finalista1: number;
	finalista2: number;
	campeonFinal: number;
	mejorPartidoEquipo1: number;
	mejorPartidoEquipo2: number;
	mejorPartidoMasGoles: number | null;
	numSuplementarios: number;
	goleadorKO: number;
}

export interface ResultadosAwardsKO {
	finalista1: number;
	finalista2: number;
	campeon: number;
	mejorPartidoEquipo1: number;
	mejorPartidoEquipo2: number;
	mejorPartidoMasGoles: number | null;
	numSuplementarios: number;
	goleadorKO: number;
}

export interface ResumenActualizacionAwardsKO {
	totalUsuarios: number;
	resultados: {
		usuarioId: string;
		username: string;
		puntosGanados: number;
		aciertos: string[];
	}[];
}

export interface IAwardsService {
	guardarAwards(input: GuardarAwardsInput): Promise<"created" | "updated">;
	guardarAwardsAdmin(input: GuardarAwardsInput): Promise<"created" | "updated">;
	actualizarAwards(
		resultados: ResultadosAwards,
	): Promise<ResumenActualizacionAwards>;
	verMisAwards(usuarioId: string): Promise<MisAwardsResueltos | null>;
	verEquiposWhiteHorse(): Promise<VerEquiposRow[]>;
	verEquiposDarkHorse(): Promise<VerEquiposRow[]>;
	verEquipos(): Promise<VerEquiposRow[]>;
	buscarJugadores(query: string): Promise<BuscarJugadoresRow[]>;
	verJugadoresPorEquipo(equipoId: number): Promise<VerJugadoresPorEquipoRow[]>;
	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]>;
	guardarAwardsKO(input: GuardarAwardsKOInput): Promise<"created" | "updated">;
	guardarAwardsKOAdmin(
		input: GuardarAwardsKOInput,
	): Promise<"created" | "updated">;
	actualizarAwardsKO(
		resultados: ResultadosAwardsKO,
	): Promise<ResumenActualizacionAwardsKO>;
	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]>;
	buscarJugadoresNoEliminados(
		query: string,
	): Promise<BuscarJugadoresNoEliminadosRow[]>;
	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]>;
}
