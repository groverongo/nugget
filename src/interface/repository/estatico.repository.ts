import type { AgregarPuestoPremioArgs } from "@sqlc/usuarios_sql";
import type { PoolClient } from "pg";

export interface IEstaticoRepository {
	limpiezaDistribucionPremios(): Promise<void>;
	agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void>;
	withTx(tx: PoolClient): IEstaticoRepository;
}
