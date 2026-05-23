import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getUsuariosQuery = `-- name: GetUsuarios :one
SELECT id_usuario, username FROM usuarios`;

export interface GetUsuariosRow {
    idUsuario: string;
    username: string;
}

export async function getUsuarios(client: Client): Promise<GetUsuariosRow | null> {
    const result = await client.query({
        text: getUsuariosQuery,
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

