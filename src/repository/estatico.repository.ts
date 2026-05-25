import {
	type AgregarPuestoPremioArgs,
	agregarPuestoPremio,
	limpiezaDistribucionPremios,
} from "@sqlc/usuarios_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";

export class EstaticoRepository implements IEstaticoRepository {
	constructor(private readonly pool: DBExecutor) {}

	limpiezaDistribucionPremios(): Promise<void> {
		return limpiezaDistribucionPremios(this.pool);
	}

	async agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void> {
		for (const arg of args) {
			await agregarPuestoPremio(this.pool, arg);
		}
	}

	withTx(tx: PoolClient) {
		return new EstaticoRepository(tx);
	}
}
