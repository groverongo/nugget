import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verEquiposQuery = `-- name: VerEquipos :many
SELECT id, nombre, bandera
FROM estatico_equipos
WHERE ($1::boolean IS NULL OR blanco = $1::boolean)
	AND ($2::boolean IS NULL OR negro = $2::boolean)
ORDER BY nombre ASC, id ASC`;

export interface VerEquiposArgs {
    blanco: boolean | null;
    negro: boolean | null;
}

export interface VerEquiposRow {
    id: number;
    nombre: string;
    bandera: string;
}

export async function verEquipos(client: Client, args: VerEquiposArgs): Promise<VerEquiposRow[]> {
    const result = await client.query({
        text: verEquiposQuery,
        values: [args.blanco, args.negro],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            bandera: row[2]
        };
    });
}

