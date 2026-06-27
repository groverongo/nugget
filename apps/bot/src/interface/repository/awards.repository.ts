import type {
	BuscarJugadoresNoEliminadosArgs,
	BuscarJugadoresNoEliminadosRow,
	GuardarAwardsArgs,
	GuardarAwardsKOArgs,
	ListUsuariosConAwardsKORow,
	ListUsuariosConAwardsRow,
	SumarPuntosAwardArgs,
	VerAwardsDeUsuarioArgs,
	VerAwardsDeUsuarioRow,
	VerAwardsKODeUsuarioArgs,
	VerAwardsKODeUsuarioRow,
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
	listUsuariosConAwards(): Promise<ListUsuariosConAwardsRow[]>;
	sumarPuntosAward(args: SumarPuntosAwardArgs): Promise<void>;
	verPrediccionesAwards(): Promise<VerPrediccionesAwardsRow[]>;
	guardarAwardsKO(args: GuardarAwardsKOArgs): Promise<void>;
	verAwardsKODeUsuario(
		args: VerAwardsKODeUsuarioArgs,
	): Promise<VerAwardsKODeUsuarioRow | null>;
	listUsuariosConAwardsKO(): Promise<ListUsuariosConAwardsKORow[]>;
	verPrediccionesAwardsKO(): Promise<VerPrediccionesAwardsKORow[]>;
	verEquiposNoEliminados(): Promise<VerEquiposNoEliminadosRow[]>;
	buscarJugadoresNoEliminados(
		args: BuscarJugadoresNoEliminadosArgs,
	): Promise<BuscarJugadoresNoEliminadosRow[]>;
	withTx(tx: PoolClient): IAwardsRepository;
}
