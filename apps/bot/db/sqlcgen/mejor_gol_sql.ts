import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verPuntosMejorGolPorPosicionQuery = `-- name: VerPuntosMejorGolPorPosicion :one
SELECT puntos FROM estatico_mejor_gol_puntos WHERE posicion = $1`;

export interface VerPuntosMejorGolPorPosicionArgs {
    posicion: number;
}

export interface VerPuntosMejorGolPorPosicionRow {
    puntos: number;
}

export async function verPuntosMejorGolPorPosicion(client: Client, args: VerPuntosMejorGolPorPosicionArgs): Promise<VerPuntosMejorGolPorPosicionRow | null> {
    const result = await client.query({
        text: verPuntosMejorGolPorPosicionQuery,
        values: [args.posicion],
        rowMode: "array"
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        puntos: row[0]
    };
}
