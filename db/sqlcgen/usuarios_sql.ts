import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listUsuariosQuery = `-- name: ListUsuarios :many
SELECT id, username FROM usuarios`;

export interface ListUsuariosRow {
    id: string;
    username: string;
}

export async function listUsuarios(client: Client): Promise<ListUsuariosRow[]> {
    const result = await client.query({
        text: listUsuariosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1]
        };
    });
}

export const createUsuarioQuery = `-- name: CreateUsuario :one
INSERT INTO usuarios (id, username)
VALUES ($1, $2)
RETURNING id, username`;

export interface CreateUsuarioArgs {
    id: string;
    username: string;
}

export interface CreateUsuarioRow {
    id: string;
    username: string;
}

export async function createUsuario(client: Client, args: CreateUsuarioArgs): Promise<CreateUsuarioRow | null> {
    const result = await client.query({
        text: createUsuarioQuery,
        values: [args.id, args.username],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        username: row[1]
    };
}

export const updateUsuarioUsernameQuery = `-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = $1
WHERE id = $2`;

export interface UpdateUsuarioUsernameArgs {
    username: string;
    id: string;
}

export async function updateUsuarioUsername(client: Client, args: UpdateUsuarioUsernameArgs): Promise<void> {
    await client.query({
        text: updateUsuarioUsernameQuery,
        values: [args.username, args.id],
        rowMode: "array"
    });
}

