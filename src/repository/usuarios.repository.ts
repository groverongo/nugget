import type { PoolClient } from "pg";
import z from "zod";
import {
	type CreateUsuarioArgs,
	countUsuarios,
	createUsuario,
	type ListUsuariosRow,
	listUsuarios,
	type UpdateUsuarioUsernameArgs,
	updateUsuarioUsername,
} from "../../db/sqlcgen/usuarios_sql";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";

export class UsuariosRepository implements IUsuariosRepository {
	constructor(private readonly pool: PoolClient) {}

	create(args: CreateUsuarioArgs): Promise<void> {
		return createUsuario(this.pool, args);
	}

	list(): Promise<ListUsuariosRow[]> {
		return listUsuarios(this.pool);
	}

	updateUsername(args: UpdateUsuarioUsernameArgs): Promise<void> {
		return updateUsuarioUsername(this.pool, args);
	}

	async count(): Promise<number> {
		const r = await countUsuarios(this.pool);
		if (r === null) return 0;
		return z.coerce.number().int().min(0).parse(r.count);
	}
}
