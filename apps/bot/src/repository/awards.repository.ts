import {
	type BuscarJugadoresNoEliminadosArgs,
	type BuscarJugadoresNoEliminadosRow,
	buscarJugadoresNoEliminados,
	type GuardarAwardsArgs,
	type GuardarAwardsKOArgs,
	guardarAwards,
	guardarAwardsKO,
	type ListUsuariosConAwardsKORow,
	type ListUsuariosConAwardsRow,
	listUsuariosConAwards,
	listUsuariosConAwardsKO,
	type SumarPuntosAwardArgs,
	sumarPuntosAward,
	type VerAwardsDeUsuarioArgs,
	type VerAwardsDeUsuarioRow,
	type VerAwardsKODeUsuarioArgs,
	type VerAwardsKODeUsuarioRow,
	type VerEquiposNoEliminadosRow,
	type VerPrediccionesAwardsKORow,
	type VerPrediccionesAwardsRow,
	verAwardsDeUsuario,
	verAwardsKODeUsuario,
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

	listUsuariosConAwards(): Promise<ListUsuariosConAwardsRow[]> {
		return listUsuariosConAwards(this.pool);
	}

	sumarPuntosAward(args: SumarPuntosAwardArgs): Promise<void> {
		return sumarPuntosAward(this.pool, args);
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

	listUsuariosConAwardsKO(): Promise<ListUsuariosConAwardsKORow[]> {
		return listUsuariosConAwardsKO(this.pool);
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
