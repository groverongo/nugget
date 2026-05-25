import {
	type CreateUsuarioArgs,
	countUsuarios,
	createUsuario,
	type DeleteUsuarioArgs,
	deleteUsuario,
	type ListUsuariosRow,
	listUsuarios,
	type UpdateUsuarioUsernameArgs,
	updateUsuarioUsername,
} from "@sqlc/usuarios_sql";
import type { Pool, PoolClient } from "pg";
import z from "zod";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";

export class UsuariosRepository implements IUsuariosRepository {
	constructor(private readonly pool: Pool | PoolClient) {}

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

	delete(args: DeleteUsuarioArgs) {
		return deleteUsuario(this.pool, args);
	}

	withTx(tx: PoolClient): UsuariosRepository {
		return new UsuariosRepository(tx);
	}
}
