import type { VerEquiposArgs, VerEquiposRow } from "@sqlc/equipos_sql";
import type { AgregarPuestoPremioArgs } from "@sqlc/usuarios_sql";
import type { PoolClient } from "pg";

export interface IEstaticoRepository {
	limpiezaDistribucionPremios(): Promise<void>;
	agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void>;
	verEquipos(args: VerEquiposArgs): Promise<VerEquiposRow[]>;
	withTx(tx: PoolClient): IEstaticoRepository;
}
