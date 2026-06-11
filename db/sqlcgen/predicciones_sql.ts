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

export const verPrediccionPorUsuarioYPartidoQuery = `-- name: VerPrediccionPorUsuarioYPartido :one
SELECT usuario_id, partido_id
FROM prediccion
WHERE usuario_id = $1 AND partido_id = $2`;

export interface VerPrediccionPorUsuarioYPartidoArgs {
    usuarioId: string;
    partidoId: number;
}

export interface VerPrediccionPorUsuarioYPartidoRow {
    usuarioId: string;
    partidoId: number;
}

export async function verPrediccionPorUsuarioYPartido(client: Client, args: VerPrediccionPorUsuarioYPartidoArgs): Promise<VerPrediccionPorUsuarioYPartidoRow | null> {
    const result = await client.query({
        text: verPrediccionPorUsuarioYPartidoQuery,
        values: [args.usuarioId, args.partidoId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        usuarioId: row[0],
        partidoId: row[1]
    };
}

export const verPrediccionesPorPartidoQuery = `-- name: VerPrediccionesPorPartido :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
WHERE prediccion.partido_id = $1 AND usuarios.participante = TRUE
ORDER BY (prediccion.goles_local + prediccion.goles_visitante) DESC, prediccion.goles_local DESC`;

export interface VerPrediccionesPorPartidoArgs {
    partidoId: number;
}

export interface VerPrediccionesPorPartidoRow {
    partidoId: number;
    usuarioId: string;
    username: string;
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

export async function verPrediccionesPorPartido(client: Client, args: VerPrediccionesPorPartidoArgs): Promise<VerPrediccionesPorPartidoRow[]> {
    const result = await client.query({
        text: verPrediccionesPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            usuarioId: row[1],
            username: row[2],
            prediccionGolesLocal: row[3],
            prediccionGolesVisitante: row[4],
            equipoLocalId: row[5],
            equipoVisitanteId: row[6],
            fechaPartido: row[7],
            partidoGolesLocal: row[8],
            partidoGolesVisitante: row[9],
            estado: row[10],
            equipoLocalNombre: row[11],
            equipoLocalPuntosFifa: row[12],
            equipoLocalGrupo: row[13],
            equipoVisitanteNombre: row[14],
            equipoVisitantePuntosFifa: row[15],
            equipoVisitanteGrupo: row[16]
        };
    });
}

export const verPrediccionesPorFechaQuery = `-- name: VerPrediccionesPorFecha :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1)`;

export interface VerPrediccionesPorFechaArgs {
    date: string;
}

export interface VerPrediccionesPorFechaRow {
    partidoId: number;
    usuarioId: string;
    username: string;
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

export async function verPrediccionesPorFecha(client: Client, args: VerPrediccionesPorFechaArgs): Promise<VerPrediccionesPorFechaRow[]> {
    const result = await client.query({
        text: verPrediccionesPorFechaQuery,
        values: [args.date],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            usuarioId: row[1],
            username: row[2],
            prediccionGolesLocal: row[3],
            prediccionGolesVisitante: row[4],
            equipoLocalId: row[5],
            equipoVisitanteId: row[6],
            fechaPartido: row[7],
            partidoGolesLocal: row[8],
            partidoGolesVisitante: row[9],
            estado: row[10],
            equipoLocalNombre: row[11],
            equipoLocalPuntosFifa: row[12],
            equipoLocalGrupo: row[13],
            equipoVisitanteNombre: row[14],
            equipoVisitantePuntosFifa: row[15],
            equipoVisitanteGrupo: row[16]
        };
    });
}

export const verPrediccionesQuery = `-- name: VerPredicciones :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id`;

export interface VerPrediccionesRow {
    partidoId: number;
    usuarioId: string;
    username: string;
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

export async function verPredicciones(client: Client): Promise<VerPrediccionesRow[]> {
    const result = await client.query({
        text: verPrediccionesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            usuarioId: row[1],
            username: row[2],
            prediccionGolesLocal: row[3],
            prediccionGolesVisitante: row[4],
            equipoLocalId: row[5],
            equipoVisitanteId: row[6],
            fechaPartido: row[7],
            partidoGolesLocal: row[8],
            partidoGolesVisitante: row[9],
            estado: row[10],
            equipoLocalNombre: row[11],
            equipoLocalPuntosFifa: row[12],
            equipoLocalGrupo: row[13],
            equipoVisitanteNombre: row[14],
            equipoVisitantePuntosFifa: row[15],
            equipoVisitanteGrupo: row[16]
        };
    });
}

export const verMisPrediccionesQuery = `-- name: VerMisPredicciones :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM partidos pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id`;

export interface VerMisPrediccionesArgs {
    usuarioId: string;
}

export interface VerMisPrediccionesRow {
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

export async function verMisPredicciones(client: Client, args: VerMisPrediccionesArgs): Promise<VerMisPrediccionesRow[]> {
    const result = await client.query({
        text: verMisPrediccionesQuery,
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

export const verFechasDePrediccionesPorUsuarioQuery = `-- name: VerFechasDePrediccionesPorUsuario :many
SELECT DISTINCT DATE(partidos.fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM prediccion
JOIN partidos ON partidos.id = prediccion.partido_id
WHERE prediccion.usuario_id = $1
ORDER BY fecha ASC`;

export interface VerFechasDePrediccionesPorUsuarioArgs {
    usuarioId: string;
}

export interface VerFechasDePrediccionesPorUsuarioRow {
    fecha: string;
}

export async function verFechasDePrediccionesPorUsuario(client: Client, args: VerFechasDePrediccionesPorUsuarioArgs): Promise<VerFechasDePrediccionesPorUsuarioRow[]> {
    const result = await client.query({
        text: verFechasDePrediccionesPorUsuarioQuery,
        values: [args.usuarioId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            fecha: row[0]
        };
    });
}

export const verMisPrediccionesPorFechaQuery = `-- name: VerMisPrediccionesPorFecha :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_bandera, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_bandera, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.bandera AS equipo_local_bandera, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.bandera AS equipo_visitante_bandera, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM (
        SELECT id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, estado
        FROM partidos
        WHERE DATE(fecha_partido - INTERVAL '5 hours') = DATE($2)
    ) pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id`;

export interface VerMisPrediccionesPorFechaArgs {
    usuarioId: string;
    date: string;
}

export interface VerMisPrediccionesPorFechaRow {
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
    equipoLocalBandera: string;
    equipoLocalPuntosFifa: string | null;
    equipoLocalGrupo: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
    equipoVisitantePuntosFifa: string | null;
    equipoVisitanteGrupo: string;
}

export async function verMisPrediccionesPorFecha(client: Client, args: VerMisPrediccionesPorFechaArgs): Promise<VerMisPrediccionesPorFechaRow[]> {
    const result = await client.query({
        text: verMisPrediccionesPorFechaQuery,
        values: [args.usuarioId, args.date],
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
            equipoLocalBandera: row[10],
            equipoLocalPuntosFifa: row[11],
            equipoLocalGrupo: row[12],
            equipoVisitanteNombre: row[13],
            equipoVisitanteBandera: row[14],
            equipoVisitantePuntosFifa: row[15],
            equipoVisitanteGrupo: row[16]
        };
    });
}

export const actualizarPuntajePrediccionQuery = `-- name: ActualizarPuntajePrediccion :exec
UPDATE prediccion SET
    resultado = $1,
    puntos_base = $2,
    puntos_en_racha = $3,
    puntos_partidazo = $4,
    puntos_milagro = $5,
    puntos_batacazo = $6,
    puntos_el_elegido = $7,
    puntos_gran_final = $8,
    puntos_total = $9
WHERE usuario_id = $10 AND partido_id = $11`;

export interface ActualizarPuntajePrediccionArgs {
    resultado: string;
    puntosBase: number;
    puntosEnRacha: number;
    puntosPartidazo: number;
    puntosMilagro: number;
    puntosBatacazo: number;
    puntosElElegido: number;
    puntosGranFinal: number;
    puntosTotal: number;
    usuarioId: string;
    partidoId: number;
}

export async function actualizarPuntajePrediccion(client: Client, args: ActualizarPuntajePrediccionArgs): Promise<void> {
    await client.query({
        text: actualizarPuntajePrediccionQuery,
        values: [
            args.resultado, args.puntosBase, args.puntosEnRacha, args.puntosPartidazo,
            args.puntosMilagro, args.puntosBatacazo, args.puntosElElegido,
            args.puntosGranFinal, args.puntosTotal, args.usuarioId, args.partidoId
        ],
        rowMode: "array"
    });
}

export const verResultadosRecientesUsuarioQuery = `-- name: VerResultadosRecientesUsuario :many
SELECT prediccion.resultado
FROM prediccion
JOIN partidos ON partidos.id = prediccion.partido_id
WHERE prediccion.usuario_id = $1
  AND prediccion.partido_id != $2
  AND partidos.estado = 'finalizado'
ORDER BY partidos.fecha_partido DESC
LIMIT 20`;

export interface VerResultadosRecientesUsuarioArgs {
    usuarioId: string;
    partidoId: number;
}

export interface VerResultadosRecientesUsuarioRow {
    resultado: string;
}

export async function verResultadosRecientesUsuario(client: Client, args: VerResultadosRecientesUsuarioArgs): Promise<VerResultadosRecientesUsuarioRow[]> {
    const result = await client.query({
        text: verResultadosRecientesUsuarioQuery,
        values: [args.usuarioId, args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            resultado: row[0]
        };
    });
}

export const verPuntajesPartidoQuery = `-- name: VerPuntajesPartido :many
SELECT
    p.usuario_id,
    u.username,
    p.puntos_total AS puntos_ganados,
    totales.total AS puntos_acumulados
FROM prediccion p
JOIN usuarios u ON u.id = p.usuario_id
JOIN (
    SELECT usuario_id, SUM(puntos_total)::INTEGER AS total
    FROM prediccion
    GROUP BY usuario_id
) totales ON totales.usuario_id = p.usuario_id
WHERE p.partido_id = $1 AND p.puntos_total > 0 AND u.participante = TRUE
ORDER BY p.puntos_total DESC, u.username`;

export interface VerPuntajesPartidoArgs {
    partidoId: number;
}

export interface VerPuntajesPartidoRow {
    usuarioId: string;
    username: string;
    puntosGanados: number;
    puntosAcumulados: number;
}

export async function verPuntajesPartido(client: Client, args: VerPuntajesPartidoArgs): Promise<VerPuntajesPartidoRow[]> {
    const result = await client.query({
        text: verPuntajesPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            username: row[1],
            puntosGanados: row[2],
            puntosAcumulados: row[3]
        };
    });
}
