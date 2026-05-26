import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const agregarPrediccionQuery = `-- name: AgregarPrediccion :exec
INSERT INTO prediccion (usuario_id, partido_id, goles_local, goles_visitante)
VALUES ($1, $2, $3, $4)`;

export interface AgregarPrediccionArgs {
    usuarioId: string;
    partidoId: number;
    golesLocal: number;
    golesVisitante: number;
}

export async function agregarPrediccion(client: Client, args: AgregarPrediccionArgs): Promise<void> {
    await client.query({
        text: agregarPrediccionQuery,
        values: [args.usuarioId, args.partidoId, args.golesLocal, args.golesVisitante],
        rowMode: "array"
    });
}

export const actualizarPrediccionQuery = `-- name: ActualizarPrediccion :exec
UPDATE prediccion SET
goles_local = $1,
goles_visitante = $2,
actualizado_en = NOW()
WHERE usuario_id = $3 AND partido_id = $4`;

export interface ActualizarPrediccionArgs {
    golesLocal: number;
    golesVisitante: number;
    usuarioId: string;
    partidoId: number;
}

export async function actualizarPrediccion(client: Client, args: ActualizarPrediccionArgs): Promise<void> {
    await client.query({
        text: actualizarPrediccionQuery,
        values: [args.golesLocal, args.golesVisitante, args.usuarioId, args.partidoId],
        rowMode: "array"
    });
}

export const verPrediccionesPorPartidoQuery = `-- name: VerPrediccionesPorPartido :many
SELECT usuario_id, goles_local, goles_visitante
FROM prediccion
WHERE partido_id = $1`;

export interface VerPrediccionesPorPartidoArgs {
    partidoId: number;
}

export interface VerPrediccionesPorPartidoRow {
    usuarioId: string;
    golesLocal: number;
    golesVisitante: number;
}

export async function verPrediccionesPorPartido(client: Client, args: VerPrediccionesPorPartidoArgs): Promise<VerPrediccionesPorPartidoRow[]> {
    const result = await client.query({
        text: verPrediccionesPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            golesLocal: row[1],
            golesVisitante: row[2]
        };
    });
}

export const verMisPrediccionesQuery = `-- name: VerMisPredicciones :many
SELECT partido_id, goles_local, goles_visitante
FROM prediccion
WHERE usuario_id = $1`;

export interface VerMisPrediccionesArgs {
    usuarioId: string;
}

export interface VerMisPrediccionesRow {
    partidoId: number;
    golesLocal: number;
    golesVisitante: number;
}

export async function verMisPredicciones(client: Client, args: VerMisPrediccionesArgs): Promise<VerMisPrediccionesRow[]> {
    const result = await client.query({
        text: verMisPrediccionesQuery,
        values: [args.usuarioId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            golesLocal: row[1],
            golesVisitante: row[2]
        };
    });
}

export const verMisPrediccionesHoyQuery = `-- name: VerMisPrediccionesHoy :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante
    FROM prediccion
    WHERE usuario_id = $1
) pe 
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM (
        SELECT id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, estado
        FROM partidos
        WHERE DATE(fecha_partido) = CURRENT_DATE
    ) pa 
    JOIN estatico_equipos el on el.id = partidos.equipo_local_id
    JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id`;

export interface VerMisPrediccionesHoyArgs {
    usuarioId: string;
}

export interface VerMisPrediccionesHoyRow {
    partidoId: number;
    prediccionGolesLocal: number;
    prediccionGolesVisitante: number;
    equipoLocalId: number | null;
    equipoVisitanteId: number | null;
    fechaPartido: Date | null;
    partidoGolesLocal: number | null;
    partidoGolesVisitante: number | null;
    estado: string;
    equipoLocalNombre: string;
    equipoLocalPuntosFifa: string | null;
    equipoLocalGrupo: string;
    equipoVisitanteNombre: string;
    equipoVisitantePuntosFifa: string | null;
    equipoVisitanteGrupo: string;
}

export async function verMisPrediccionesHoy(client: Client, args: VerMisPrediccionesHoyArgs): Promise<VerMisPrediccionesHoyRow[]> {
    const result = await client.query({
        text: verMisPrediccionesHoyQuery,
        values: [args.usuarioId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            prediccionGolesLocal: row[1],
            prediccionGolesVisitante: row[2],
            equipoLocalId: row[3],
            equipoVisitanteId: row[4],
            fechaPartido: row[5],
            partidoGolesLocal: row[6],
            partidoGolesVisitante: row[7],
            estado: row[8],
            equipoLocalNombre: row[9],
            equipoLocalPuntosFifa: row[10],
            equipoLocalGrupo: row[11],
            equipoVisitanteNombre: row[12],
            equipoVisitantePuntosFifa: row[13],
            equipoVisitanteGrupo: row[14]
        };
    });
}

