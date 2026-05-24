import type { PoolClient } from "pg";
import type { AgregarPuestoPremioArgs } from "../../../db/sqlcgen/usuarios_sql";

export interface IEstaticoRepository {
	limpiezaDistribucionPremios(): Promise<void>;
	agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void>;
	withTx(tx: PoolClient): IEstaticoRepository;
}
