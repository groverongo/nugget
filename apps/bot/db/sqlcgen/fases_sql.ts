import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verFasesQuery = `-- name: VerFases :many
SELECT id, nombre, puntos_base, puntos_buen_intento
FROM estatico_fases
ORDER BY id ASC`;

export interface VerFasesRow {
    id: number;
    nombre: string;
    puntosBase: number;
    puntosBuenIntento: number;
}

export async function verFases(client: Client): Promise<VerFasesRow[]> {
    const result = await client.query({
        text: verFasesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            puntosBase: row[2],
            puntosBuenIntento: row[3]
        };
    });
}

