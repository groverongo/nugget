import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
	UpdateUsuarioUsernameArgs,
} from "@sqlc/usuarios_sql";
import type { PoolClient } from "pg";

export interface IUsuariosRepository {
	create(args: CreateUsuarioArgs): Promise<void>;

	delete(args: DeleteUsuarioArgs): Promise<void>;

	list(): Promise<ListUsuariosRow[]>;

	updateUsername(args: UpdateUsuarioUsernameArgs): Promise<void>;

	count(): Promise<number>;

	withTx(tx: PoolClient): IUsuariosRepository;
}
