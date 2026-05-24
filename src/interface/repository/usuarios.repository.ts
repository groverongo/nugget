import type { PoolClient } from "pg";
import type {
	CreateUsuarioArgs,
	ListUsuariosRow,
	UpdateUsuarioUsernameArgs,
} from "../../../db/sqlcgen/usuarios_sql";

export interface IUsuariosRepository {
	create(args: CreateUsuarioArgs): Promise<void>;

	list(): Promise<ListUsuariosRow[]>;

	updateUsername(args: UpdateUsuarioUsernameArgs): Promise<void>;

	count(): Promise<number>;

	withTx(tx: PoolClient): IUsuariosRepository;
}
