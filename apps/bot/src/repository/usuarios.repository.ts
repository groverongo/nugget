import {
	type ActualizarStatsUsuarioArgs,
	actualizarStatsUsuario,
	ajustarPuntosTimba,
	type CreateUsuarioArgs,
	countParticipantes,
	countUsuarios,
	createUsuario,
	type DeleteUsuarioArgs,
	deleteUsuario,
	type ListUsuariosRow,
	listUsuarios,
	obtenerPuntosUsuario,
	type UpdateUsuarioParticipanteArgs,
	type UpdateUsuarioUsernameArgs,
	updateUsuarioParticipante,
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

	actualizarParticipante(args: UpdateUsuarioParticipanteArgs): Promise<void> {
		return updateUsuarioParticipante(this.pool, args);
	}

	actualizarStats(args: ActualizarStatsUsuarioArgs): Promise<void> {
		return actualizarStatsUsuario(this.pool, args);
	}

	async obtenerPuntos(id: string): Promise<number> {
		const row = await obtenerPuntosUsuario(this.pool, { id });
		return row?.puntos ?? 0;
	}

	ajustarPuntos(id: string, delta: number): Promise<void> {
		return ajustarPuntosTimba(this.pool, { id, delta });
	}

	async count(): Promise<number> {
		const r = await countUsuarios(this.pool);
		if (r === null) return 0;
		return z.coerce.number().int().min(0).parse(r.count);
	}

	async countParticipantes(): Promise<number> {
		const r = await countParticipantes(this.pool);
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
