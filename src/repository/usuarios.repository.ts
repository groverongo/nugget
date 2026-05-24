import type { QueryArrayConfig, QueryArrayResult } from "pg";
import {
	type CreateUsuarioArgs,
	createUsuario,
	listUsuarios,
	type UpdateUsuarioUsernameArgs,
	updateUsuarioUsername,
} from "../../db/sqlcgen/usuarios_sql";

type Queryable = {
	query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
};

export class UsuariosRepository {
	constructor(private readonly client: Queryable) {}

	create(args: CreateUsuarioArgs) {
		return createUsuario(this.client, args);
	}

	list() {
		return listUsuarios(this.client);
	}

	updateUsername(args: UpdateUsuarioUsernameArgs) {
		return updateUsuarioUsername(this.client, args);
	}
}
