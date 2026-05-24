import type { QueryArrayConfig, QueryArrayResult } from "pg";
import {
	type CreateUsuarioArgs,
	type CreateUsuarioRow,
	createUsuario,
	listUsuarios,
} from "../../db/sqlcgen/usuarios_sql";

type Queryable = {
	query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
};

export class UsuariosRepository {
	constructor(private readonly client: Queryable) {}

	create(args: CreateUsuarioArgs): Promise<CreateUsuarioRow | null> {
		return createUsuario(this.client, args);
	}

	list() {
		return listUsuarios(this.client);
	}
}
