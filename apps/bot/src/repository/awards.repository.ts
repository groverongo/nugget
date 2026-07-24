import {
	type BuscarJugadoresNoEliminadosArgs,
	type BuscarJugadoresNoEliminadosRow,
	buscarJugadoresNoEliminados,
	type GuardarAwardsArgs,
	type GuardarAwardsKOArgs,
	type GuardarResultadoCampeonArgs,
	type GuardarResultadoGoleadorArgs,
	type GuardarResultadoKoFinalistasArgs,
	type GuardarResultadoKoGoleadorArgs,
	type GuardarResultadoKoMejorPartidoArgs,
	type GuardarResultadoKoNumSuplementariosArgs,
	type GuardarResultadoMejorArqueroArgs,
	type GuardarResultadoMejorGolArgs,
	type GuardarResultadoMejorJugadorArgs,
	type GuardarResultadoMejorJugadorJovenArgs,
	type GuardarResultadoSeleccionDecepcionArgs,
	type GuardarResultadoSeleccionSorpresaArgs,
	guardarAwards,
	guardarAwardsKO,
	guardarResultadoCampeon,
	guardarResultadoGoleador,
	guardarResultadoKoFinalistas,
	guardarResultadoKoGoleador,
	guardarResultadoKoMejorPartido,
	guardarResultadoKoNumSuplementarios,
	guardarResultadoMejorArquero,
	guardarResultadoMejorGol,
	guardarResultadoMejorJugador,
	guardarResultadoMejorJugadorJoven,
	guardarResultadoSeleccionDecepcion,
	guardarResultadoSeleccionSorpresa,
	type ListUsuariosConCamposAwardsKORow,
	type ListUsuariosConCamposAwardsRow,
	listUsuariosConCamposAwards,
	listUsuariosConCamposAwardsKO,
	type SumarPuntosAwardArgs,
	sumarPuntosAward,
	type VerAwardsDeUsuarioArgs,
	type VerAwardsDeUsuarioRow,
	type VerAwardsKODeUsuarioArgs,
	type VerAwardsKODeUsuarioRow,
	type VerAwardsResultadosRow,
	type VerEquiposNoEliminadosRow,
	type VerPrediccionesAwardsKORow,
	type VerPrediccionesAwardsRow,
	verAwardsDeUsuario,
	verAwardsKODeUsuario,
	verAwardsResultados,
	verEquiposNoEliminados,
	verPrediccionesAwards,
	verPrediccionesAwardsKO,
} from "@sqlc/awards_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IAwardsRepository } from "../interface/repository/awards.repository";

export class AwardsRepository implements IAwardsRepository {
	constructor(private readonly pool: DBExecutor) {}

	guardarAwards(args: GuardarAwardsArgs): Promise<void> {
		return guardarAwards(this.pool, args);
	}

	verAwardsDeUsuario(
		args: VerAwardsDeUsuarioArgs,
	): Promise<VerAwardsDeUsuarioRow | null> {
		return verAwardsDeUsuario(this.pool, args);
	}

	listUsuariosConCamposAwards(): Promise<ListUsuariosConCamposAwardsRow[]> {
		return listUsuariosConCamposAwards(this.pool);
	}

	async sumarPuntosAward(args: SumarPuntosAwardArgs): Promise<number> {
		const row = await sumarPuntosAward(this.pool, args);
		return row?.puntos ?? 0;
	}

	verAwardsResultados(): Promise<VerAwardsResultadosRow | null> {
		return verAwardsResultados(this.pool);
	}

	guardarResultadoCampeon(args: GuardarResultadoCampeonArgs): Promise<void> {
		return guardarResultadoCampeon(this.pool, args);
	}

	guardarResultadoGoleador(args: GuardarResultadoGoleadorArgs): Promise<void> {
		return guardarResultadoGoleador(this.pool, args);
	}

	guardarResultadoMejorJugador(
		args: GuardarResultadoMejorJugadorArgs,
	): Promise<void> {
		return guardarResultadoMejorJugador(this.pool, args);
	}

	guardarResultadoMejorArquero(
		args: GuardarResultadoMejorArqueroArgs,
	): Promise<void> {
		return guardarResultadoMejorArquero(this.pool, args);
	}

	guardarResultadoMejorJugadorJoven(
		args: GuardarResultadoMejorJugadorJovenArgs,
	): Promise<void> {
		return guardarResultadoMejorJugadorJoven(this.pool, args);
	}

	guardarResultadoMejorGol(args: GuardarResultadoMejorGolArgs): Promise<void> {
		return guardarResultadoMejorGol(this.pool, args);
	}

	guardarResultadoSeleccionDecepcion(
		args: GuardarResultadoSeleccionDecepcionArgs,
	): Promise<void> {
		return guardarResultadoSeleccionDecepcion(this.pool, args);
	}

	guardarResultadoSeleccionSorpresa(
		args: GuardarResultadoSeleccionSorpresaArgs,
	): Promise<void> {
		return guardarResultadoSeleccionSorpresa(this.pool, args);
	}

	guardarResultadoKoFinalistas(
		args: GuardarResultadoKoFinalistasArgs,
	): Promise<void> {
		return guardarResultadoKoFinalistas(this.pool, args);
	}

	guardarResultadoKoMejorPartido(
		args: GuardarResultadoKoMejorPartidoArgs,
	): Promise<void> {
		return guardarResultadoKoMejorPartido(this.pool, args);
	}

	guardarResultadoKoNumSuplementarios(
		args: GuardarResultadoKoNumSuplementariosArgs,
	): Promise<void> {
		return guardarResultadoKoNumSuplementarios(this.pool, args);
	}

	guardarResultadoKoGoleador(
		args: GuardarResultadoKoGoleadorArgs,
	): Promise<void> {
		return guardarResultadoKoGoleador(this.pool, args);
	}

	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]> {
		return verPrediccionesAwards(this.pool);
	}

	guardarAwardsKO(args: GuardarAwardsKOArgs): Promise<void> {
		return guardarAwardsKO(this.pool, args);
	}

	verAwardsKODeUsuario(
		args: VerAwardsKODeUsuarioArgs,
	): Promise<VerAwardsKODeUsuarioRow | null> {
		return verAwardsKODeUsuario(this.pool, args);
	}

	listUsuariosConCamposAwardsKO(): Promise<ListUsuariosConCamposAwardsKORow[]> {
		return listUsuariosConCamposAwardsKO(this.pool);
	}

	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]> {
		return verPrediccionesAwardsKO(this.pool);
	}

	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]> {
		return verEquiposNoEliminados(this.pool);
	}

	buscarJugadoresNoEliminados(
		args: BuscarJugadoresNoEliminadosArgs,
	): Promise<BuscarJugadoresNoEliminadosRow[]> {
		return buscarJugadoresNoEliminados(this.pool, args);
	}

	withTx(tx: PoolClient) {
		return new AwardsRepository(tx);
	}
}
