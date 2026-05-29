import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const obtenerPartidoQuery = `-- name: ObtenerPartido :one
SELECT id, fecha_partido
FROM partidos
WHERE id = $1`;

export interface ObtenerPartidoArgs {
    id: number;
}

export interface ObtenerPartidoRow {
    id: number;
    fechaPartido: Date | null;
}

export async function obtenerPartido(client: Client, args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null> {
    const result = await client.query({
        text: obtenerPartidoQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        fechaPartido: row[1]
    };
}

