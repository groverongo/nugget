import {
	type GuardarAwardsArgs,
	guardarAwards,
	type ListUsuariosConAwardsRow,
	listUsuariosConAwards,
	type SumarPuntosAwardArgs,
	sumarPuntosAward,
	type VerAwardsDeUsuarioArgs,
	type VerAwardsDeUsuarioRow,
	verAwardsDeUsuario,
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

	withTx(tx: PoolClient) {
		return new AwardsRepository(tx);
	}
}
