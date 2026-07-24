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

export type ResumenResolucionAward = {
	resultadoDisplay: string;
	totalUsuarios: number;
	resultados: {
		usuarioId: string;
		username: string;
		puntosGanados: number;
		puntosTotal: number;
		eleccion: string;
		aciertos: string[];
	}[];
};

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

export interface AwardsKODisplay {
	finalista1: string | null;
	finalista2: string | null;
	campeon: string | null;
	mejorPartidoEquipo1: string | null;
	mejorPartidoEquipo2: string | null;
	mejorPartidoMasGoles: string | null;
	numSuplementarios: number | null;
	goleador: string | null;
}

export interface AwardsKORaw {
	finalista1: number | null;
	finalista2: number | null;
	campeonFinal: number | null;
	mejorPartidoEquipo1: number | null;
	mejorPartidoEquipo2: number | null;
	mejorPartidoMasGoles: number | null;
	numSuplementarios: number | null;
	goleadorKO: number | null;
}

export interface IAwardsService {
	guardarAwards(input: GuardarAwardsInput): Promise<"created" | "updated">;
	guardarAwardsAdmin(input: GuardarAwardsInput): Promise<"created" | "updated">;
	verMisAwards(usuarioId: string): Promise<MisAwardsResueltos | null>;
	verEquiposWhiteHorse(): Promise<VerEquiposRow[]>;
	verEquiposDarkHorse(): Promise<VerEquiposRow[]>;
	verEquipos(): Promise<VerEquiposRow[]>;
	buscarJugadores(query: string): Promise<BuscarJugadoresRow[]>;
	verJugadoresPorEquipo(equipoId: number): Promise<VerJugadoresPorEquipoRow[]>;
	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]>;
	verMisAwardsKO(usuarioId: string): Promise<AwardsKODisplay>;
	verAwardsKORaw(usuarioId: string): Promise<AwardsKORaw>;
	guardarAwardsKOParcial(usuarioId: string, data: AwardsKORaw): Promise<void>;
	guardarAwardsKO(input: GuardarAwardsKOInput): Promise<"created" | "updated">;
	guardarAwardsKOAdmin(
		input: GuardarAwardsKOInput,
	): Promise<"created" | "updated">;
	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]>;
	buscarJugadoresNoEliminados(
		query: string,
	): Promise<BuscarJugadoresNoEliminadosRow[]>;
	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]>;

	// Resolución individual de awards
	resolverCampeon(equipoId: number): Promise<ResumenResolucionAward>;
	resolverGoleador(jugadorId: number): Promise<ResumenResolucionAward>;
	resolverMejorJugador(jugadorId: number): Promise<ResumenResolucionAward>;
	resolverMejorArquero(jugadorId: number): Promise<ResumenResolucionAward>;
	resolverMejorJugadorJoven(jugadorId: number): Promise<ResumenResolucionAward>;
	resolverMejorGol(
		jugadorId: number,
		posicion: number,
	): Promise<ResumenResolucionAward>;
	resolverSeleccionDecepcion(equipoId: number): Promise<ResumenResolucionAward>;
	resolverSeleccionSorpresa(equipoId: number): Promise<ResumenResolucionAward>;
	resolverKoFinalistas(
		finalista1: number,
		finalista2: number,
		campeon: number,
	): Promise<ResumenResolucionAward>;
	resolverKoMejorPartido(
		equipo1: number,
		equipo2: number,
		masGoles: number | null,
	): Promise<ResumenResolucionAward>;
	resolverKoNumSuplementarios(
		cantidad: number,
	): Promise<ResumenResolucionAward>;
	resolverKoGoleador(jugadorId: number): Promise<ResumenResolucionAward>;
}
