import type {
	BuscarJugadoresNoEliminadosArgs,
	BuscarJugadoresNoEliminadosRow,
	GuardarAwardsArgs,
	GuardarAwardsKOArgs,
	GuardarResultadoCampeonArgs,
	GuardarResultadoGoleadorArgs,
	GuardarResultadoKoFinalistasArgs,
	GuardarResultadoKoGoleadorArgs,
	GuardarResultadoKoMejorPartidoArgs,
	GuardarResultadoKoNumSuplementariosArgs,
	GuardarResultadoMejorArqueroArgs,
	GuardarResultadoMejorGolArgs,
	GuardarResultadoMejorJugadorArgs,
	GuardarResultadoMejorJugadorJovenArgs,
	GuardarResultadoSeleccionDecepcionArgs,
	GuardarResultadoSeleccionSorpresaArgs,
	ListUsuariosConCamposAwardsKORow,
	ListUsuariosConCamposAwardsRow,
	SumarPuntosAwardArgs,
	VerAwardsDeUsuarioArgs,
	VerAwardsDeUsuarioRow,
	VerAwardsKODeUsuarioArgs,
	VerAwardsKODeUsuarioRow,
	VerAwardsResultadosRow,
	VerEquiposNoEliminadosRow,
	VerPrediccionesAwardsKORow,
	VerPrediccionesAwardsRow,
} from "@sqlc/awards_sql";
import type { PoolClient } from "pg";

export interface IAwardsRepository {
	guardarAwards(args: GuardarAwardsArgs): Promise<void>;
	verAwardsDeUsuario(
		args: VerAwardsDeUsuarioArgs,
	): Promise<VerAwardsDeUsuarioRow | null>;
	listUsuariosConCamposAwards(): Promise<ListUsuariosConCamposAwardsRow[]>;
	sumarPuntosAward(args: SumarPuntosAwardArgs): Promise<number>;
	verAwardsResultados(): Promise<VerAwardsResultadosRow | null>;
	guardarResultadoCampeon(args: GuardarResultadoCampeonArgs): Promise<void>;
	guardarResultadoGoleador(args: GuardarResultadoGoleadorArgs): Promise<void>;
	guardarResultadoMejorJugador(
		args: GuardarResultadoMejorJugadorArgs,
	): Promise<void>;
	guardarResultadoMejorArquero(
		args: GuardarResultadoMejorArqueroArgs,
	): Promise<void>;
	guardarResultadoMejorJugadorJoven(
		args: GuardarResultadoMejorJugadorJovenArgs,
	): Promise<void>;
	guardarResultadoMejorGol(args: GuardarResultadoMejorGolArgs): Promise<void>;
	guardarResultadoSeleccionDecepcion(
		args: GuardarResultadoSeleccionDecepcionArgs,
	): Promise<void>;
	guardarResultadoSeleccionSorpresa(
		args: GuardarResultadoSeleccionSorpresaArgs,
	): Promise<void>;
	guardarResultadoKoFinalistas(
		args: GuardarResultadoKoFinalistasArgs,
	): Promise<void>;
	guardarResultadoKoMejorPartido(
		args: GuardarResultadoKoMejorPartidoArgs,
	): Promise<void>;
	guardarResultadoKoNumSuplementarios(
		args: GuardarResultadoKoNumSuplementariosArgs,
	): Promise<void>;
	guardarResultadoKoGoleador(
		args: GuardarResultadoKoGoleadorArgs,
	): Promise<void>;
	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]>;
	guardarAwardsKO(args: GuardarAwardsKOArgs): Promise<void>;
	verAwardsKODeUsuario(
		args: VerAwardsKODeUsuarioArgs,
	): Promise<VerAwardsKODeUsuarioRow | null>;
	listUsuariosConCamposAwardsKO(): Promise<ListUsuariosConCamposAwardsKORow[]>;
	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]>;
	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]>;
	buscarJugadoresNoEliminados(
		args: BuscarJugadoresNoEliminadosArgs,
	): Promise<BuscarJugadoresNoEliminadosRow[]>;
	withTx(tx: PoolClient): IAwardsRepository;
}
