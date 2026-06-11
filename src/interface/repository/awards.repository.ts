import type {
	GuardarAwardsArgs,
	ListUsuariosConAwardsRow,
	SumarPuntosAwardArgs,
	VerAwardsDeUsuarioArgs,
	VerAwardsDeUsuarioRow,
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
	withTx(tx: PoolClient): IAwardsRepository;
}
