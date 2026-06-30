import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const upsertPrediccionEtQuery = `-- name: UpsertPrediccionEt :exec
INSERT INTO prediccion_et (usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (usuario_id, partido_id) DO UPDATE SET
    goles_local_adicionales = EXCLUDED.goles_local_adicionales,
    goles_visitante_adicionales = EXCLUDED.goles_visitante_adicionales,
    penales_ganador_id = EXCLUDED.penales_ganador_id`;

export interface UpsertPrediccionEtArgs {
    usuarioId: string;
    partidoId: number;
    golesLocalAdicionales: number;
    golesVisitanteAdicionales: number;
    penalesGanadorId: number | null;
}

export async function upsertPrediccionEt(client: Client, args: UpsertPrediccionEtArgs): Promise<void> {
    await client.query({
        text: upsertPrediccionEtQuery,
        values: [args.usuarioId, args.partidoId, args.golesLocalAdicionales, args.golesVisitanteAdicionales, args.penalesGanadorId],
        rowMode: "array"
    });
}

export const verPrediccionEtQuery = `-- name: VerPrediccionEt :one
SELECT usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id
FROM prediccion_et
WHERE usuario_id = $1 AND partido_id = $2`;

export interface VerPrediccionEtArgs {
    usuarioId: string;
    partidoId: number;
}

export interface VerPrediccionEtRow {
    usuarioId: string;
    partidoId: number;
    golesLocalAdicionales: number;
    golesVisitanteAdicionales: number;
    penalesGanadorId: number | null;
}

export async function verPrediccionEt(client: Client, args: VerPrediccionEtArgs): Promise<VerPrediccionEtRow | null> {
    const result = await client.query({
        text: verPrediccionEtQuery,
        values: [args.usuarioId, args.partidoId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        usuarioId: row[0],
        partidoId: row[1],
        golesLocalAdicionales: row[2],
        golesVisitanteAdicionales: row[3],
        penalesGanadorId: row[4]
    };
}

export const verPrediccionesEtPorPartidoQuery = `-- name: VerPrediccionesEtPorPartido :many
SELECT usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id
FROM prediccion_et
WHERE partido_id = $1`;

export interface VerPrediccionesEtPorPartidoArgs {
    partidoId: number;
}

export interface VerPrediccionesEtPorPartidoRow {
    usuarioId: string;
    partidoId: number;
    golesLocalAdicionales: number;
    golesVisitanteAdicionales: number;
    penalesGanadorId: number | null;
}

export async function verPrediccionesEtPorPartido(client: Client, args: VerPrediccionesEtPorPartidoArgs): Promise<VerPrediccionesEtPorPartidoRow[]> {
    const result = await client.query({
        text: verPrediccionesEtPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            partidoId: row[1],
            golesLocalAdicionales: row[2],
            golesVisitanteAdicionales: row[3],
            penalesGanadorId: row[4]
        };
    });
}

export const eliminarPrediccionesEtPorPartidoQuery = `-- name: EliminarPrediccionesEtPorPartido :exec
DELETE FROM prediccion_et WHERE partido_id = $1`;

export interface EliminarPrediccionesEtPorPartidoArgs {
    partidoId: number;
}

export async function eliminarPrediccionesEtPorPartido(client: Client, args: EliminarPrediccionesEtPorPartidoArgs): Promise<void> {
    await client.query({
        text: eliminarPrediccionesEtPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
}
