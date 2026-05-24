import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listUsuariosQuery = `-- name: ListUsuarios :one
SELECT id_usuario, username FROM usuarios`;

export interface ListUsuariosRow {
    idUsuario: string;
    username: string;
}

export async function listUsuarios(client: Client): Promise<ListUsuariosRow | null> {
    const result = await client.query({
        text: listUsuariosQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        idUsuario: row[0],
        username: row[1]
    };
}

export const createUsuarioQuery = `-- name: CreateUsuario :one
INSERT INTO usuarios (id_usuario, username)
VALUES ($1, $2)
RETURNING id_usuario, username`;

export interface CreateUsuarioArgs {
    idUsuario: string;
    username: string;
}

export interface CreateUsuarioRow {
    idUsuario: string;
    username: string;
}

export async function createUsuario(client: Client, args: CreateUsuarioArgs): Promise<CreateUsuarioRow | null> {
    const result = await client.query({
        text: createUsuarioQuery,
        values: [args.idUsuario, args.username],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        idUsuario: row[0],
        username: row[1]
    };
}

