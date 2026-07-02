import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const agregarPrediccionQuery = `-- name: AgregarPrediccion :exec
INSERT INTO prediccion (usuario_id, partido_id, goles_local, goles_visitante, penales_ganador_id)
VALUES ($1, $2, $3, $4, $5)`;

export interface AgregarPrediccionArgs {
    usuarioId: string;
    partidoId: number;
    golesLocal: number;
    golesVisitante: number;
    penalesGanadorId: number | null;
}

export async function agregarPrediccion(client: Client, args: AgregarPrediccionArgs): Promise<void> {
    await client.query({
        text: agregarPrediccionQuery,
        values: [args.usuarioId, args.partidoId, args.golesLocal, args.golesVisitante, args.penalesGanadorId],
        rowMode: "array"
    });
}

export const monitorearAntiguaPrediccionQuery = `-- name: MonitorearAntiguaPrediccion :exec
INSERT INTO monitoreo_prediccion (usuario_id, partido_id, goles_local, goles_visitante)
VALUES ($1, $2, $3, $4)`;

export interface MonitorearAntiguaPrediccionArgs {
    usuarioId: string;
    partidoId: number;
    golesLocal: number;
    golesVisitante: number;
}

export async function monitorearAntiguaPrediccion(client: Client, args: MonitorearAntiguaPrediccionArgs): Promise<void> {
    await client.query({
        text: monitorearAntiguaPrediccionQuery,
        values: [args.usuarioId, args.partidoId, args.golesLocal, args.golesVisitante],
        rowMode: "array"
    });
}

export const actualizarPrediccionQuery = `-- name: ActualizarPrediccion :exec
UPDATE prediccion SET
goles_local = $1,
goles_visitante = $2,
penales_ganador_id = $3,
actualizado_en = NOW()
WHERE usuario_id = $4 AND partido_id = $5`;

export interface ActualizarPrediccionArgs {
    golesLocal: number;
    golesVisitante: number;
    penalesGanadorId: number | null;
    usuarioId: string;
    partidoId: number;
}

export async function actualizarPrediccion(client: Client, args: ActualizarPrediccionArgs): Promise<void> {
    await client.query({
        text: actualizarPrediccionQuery,
        values: [args.golesLocal, args.golesVisitante, args.penalesGanadorId, args.usuarioId, args.partidoId],
        rowMode: "array"
    });
}

export const verPrediccionPorUsuarioYPartidoQuery = `-- name: VerPrediccionPorUsuarioYPartido :one
SELECT usuario_id, partido_id, goles_local, goles_visitante, penales_ganador_id
FROM prediccion
WHERE usuario_id = $1 AND partido_id = $2`;

export interface VerPrediccionPorUsuarioYPartidoArgs {
    usuarioId: string;
    partidoId: number;
}

export interface VerPrediccionPorUsuarioYPartidoRow {
    usuarioId: string;
    partidoId: number;
    golesLocal: number;
    golesVisitante: number;
    penalesGanadorId: number | null;
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
        partidoId: row[1],
        golesLocal: row[2],
        golesVisitante: row[3],
        penalesGanadorId: row[4]
    };
}

export const verPrediccionesPorPartidoQuery = `-- name: VerPrediccionesPorPartido :many
SELECT
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    prediccion.penales_ganador_id AS prediccion_penales_ganador_id,
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
    prediccionPenalesGanadorId: number | null;
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
            prediccionPenalesGanadorId: row[5],
            equipoLocalId: row[6],
            equipoVisitanteId: row[7],
            fechaPartido: row[8],
            partidoGolesLocal: row[9],
            partidoGolesVisitante: row[10],
            estado: row[11],
            equipoLocalNombre: row[12],
            equipoLocalPuntosFifa: row[13],
            equipoLocalGrupo: row[14],
            equipoVisitanteNombre: row[15],
            equipoVisitantePuntosFifa: row[16],
            equipoVisitanteGrupo: row[17]
        };
    });
}

export const verPuntajesPartidoQuery = `-- name: VerPuntajesPartido :many
SELECT
    p.usuario_id,
    u.username,
    p.resultado,
    p.puntos_base,
    p.puntos_en_racha,
    p.puntos_total AS puntos_ganados,
    u.puntos AS puntos_acumulados
FROM prediccion p
JOIN usuarios u ON u.id = p.usuario_id
WHERE p.partido_id = $1 AND p.puntos_total > 0 AND u.participante = TRUE
ORDER BY p.puntos_total DESC, u.username`;

export interface VerPuntajesPartidoArgs {
    partidoId: number;
}

export interface VerPuntajesPartidoRow {
    usuarioId: string;
    username: string;
    resultado: string;
    puntosBase: number;
    puntosEnRacha: number;
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
            resultado: row[2],
            puntosBase: row[3],
            puntosEnRacha: row[4],
            puntosGanados: row[5],
            puntosAcumulados: row[6]
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
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1)
ORDER BY partidos.fecha_partido ASC`;

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
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo, equipo_local_siglas, equipo_visitante_siglas, puntos_total, SUM(puntos_total) OVER (ORDER BY fecha_partido ROWS UNBOUNDED PRECEDING) AS puntos_acumulados
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante, puntos_total
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo, el.siglas AS equipo_local_siglas, ev.siglas AS equipo_visitante_siglas
    FROM partidos pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id
WHERE estado = 'finalizado'
ORDER BY fecha_partido ASC
LIMIT $3::INTEGER OFFSET $2::INTEGER`;

export interface VerMisPrediccionesArgs {
    usuarioId: string;
    offset: number;
    limit: number;
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
    equipoLocalSiglas: string;
    equipoVisitanteSiglas: string;
    puntosTotal: number;
    puntosAcumulados: string;
}

export async function verMisPredicciones(client: Client, args: VerMisPrediccionesArgs): Promise<VerMisPrediccionesRow[]> {
    const result = await client.query({
        text: verMisPrediccionesQuery,
        values: [args.usuarioId, args.offset, args.limit],
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
            equipoVisitanteGrupo: row[14],
            equipoLocalSiglas: row[15],
            equipoVisitanteSiglas: row[16],
            puntosTotal: row[17],
            puntosAcumulados: row[18]
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
        values: [args.resultado, args.puntosBase, args.puntosEnRacha, args.puntosPartidazo, args.puntosMilagro, args.puntosBatacazo, args.puntosElElegido, args.puntosGranFinal, args.puntosTotal, args.usuarioId, args.partidoId],
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

export const verParticipantesSinPrediccionQuery = `-- name: VerParticipantesSinPrediccion :many
SELECT u.id, u.username
FROM usuarios u
WHERE u.participante = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM prediccion p
    WHERE p.usuario_id = u.id AND p.partido_id = $1
  )
ORDER BY u.username`;

export interface VerParticipantesSinPrediccionArgs {
    partidoId: number;
}

export interface VerParticipantesSinPrediccionRow {
    id: string;
    username: string;
}

export async function verParticipantesSinPrediccion(client: Client, args: VerParticipantesSinPrediccionArgs): Promise<VerParticipantesSinPrediccionRow[]> {
    const result = await client.query({
        text: verParticipantesSinPrediccionQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1]
        };
    });
}

export const verPrediccionesResumenPartidoQuery = `-- name: VerPrediccionesResumenPartido :many
SELECT
    pe.usuario_id,
    u.username,
    pe.goles_local AS prediccion_goles_local,
    pe.goles_visitante AS prediccion_goles_visitante,
    COALESCE(pe.puntos_base, 0)::INTEGER AS puntos_base,
    COALESCE(pe.puntos_en_racha, 0)::INTEGER AS puntos_en_racha,
    COALESCE(pe.puntos_total, 0)::INTEGER AS puntos_total,
    u.puntos AS puntos_acumulados
FROM prediccion pe
JOIN usuarios u ON u.id = pe.usuario_id
WHERE pe.partido_id = $1 AND u.participante = TRUE
ORDER BY COALESCE(pe.puntos_total, 0) DESC, u.username`;

export interface VerPrediccionesResumenPartidoArgs {
    partidoId: number;
}

export interface VerPrediccionesResumenPartidoRow {
    usuarioId: string;
    username: string;
    prediccionGolesLocal: number;
    prediccionGolesVisitante: number;
    puntosBase: number;
    puntosEnRacha: number;
    puntosTotal: number;
    puntosAcumulados: number;
}

export async function verPrediccionesResumenPartido(client: Client, args: VerPrediccionesResumenPartidoArgs): Promise<VerPrediccionesResumenPartidoRow[]> {
    const result = await client.query({
        text: verPrediccionesResumenPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            username: row[1],
            prediccionGolesLocal: row[2],
            prediccionGolesVisitante: row[3],
            puntosBase: row[4],
            puntosEnRacha: row[5],
            puntosTotal: row[6],
            puntosAcumulados: row[7]
        };
    });
}

export const verMisPrediccionesPorFechaQuery = `-- name: VerMisPrediccionesPorFecha :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, prediccion_penales_ganador_id, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, partido_penales_ganador_id, partido_original_id, estado, equipo_local_nombre, equipo_local_bandera, equipo_local_siglas, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_bandera, equipo_visitante_siglas, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante, penales_ganador_id AS prediccion_penales_ganador_id
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, penales_ganador_id AS partido_penales_ganador_id, partido_original_id, estado, el.nombre AS equipo_local_nombre, el.bandera AS equipo_local_bandera, el.siglas AS equipo_local_siglas, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.bandera AS equipo_visitante_bandera, ev.siglas AS equipo_visitante_siglas, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM (
        SELECT id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, penales_ganador_id, partido_original_id, estado
        FROM partidos
        WHERE DATE(fecha_partido - INTERVAL '5 hours') = DATE($2)
    ) pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id
ORDER BY fecha_partido ASC`;

export interface VerMisPrediccionesPorFechaArgs {
    usuarioId: string;
    date: string;
}

export interface VerMisPrediccionesPorFechaRow {
    partidoId: number;
    prediccionGolesLocal: number;
    prediccionGolesVisitante: number;
    prediccionPenalesGanadorId: number | null;
    equipoLocalId: number | null;
    equipoVisitanteId: number | null;
    fechaPartido: Date | null;
    partidoGolesLocal: number | null;
    partidoGolesVisitante: number | null;
    partidoPenalesGanadorId: number | null;
    partidoOriginalId: number | null;
    estado: string;
    equipoLocalNombre: string;
    equipoLocalBandera: string;
    equipoLocalSiglas: string;
    equipoLocalPuntosFifa: string | null;
    equipoLocalGrupo: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
    equipoVisitanteSiglas: string;
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
            prediccionPenalesGanadorId: row[3],
            equipoLocalId: row[4],
            equipoVisitanteId: row[5],
            fechaPartido: row[6],
            partidoGolesLocal: row[7],
            partidoGolesVisitante: row[8],
            partidoPenalesGanadorId: row[9],
            partidoOriginalId: row[10],
            estado: row[11],
            equipoLocalNombre: row[12],
            equipoLocalBandera: row[13],
            equipoLocalSiglas: row[14],
            equipoLocalPuntosFifa: row[15],
            equipoLocalGrupo: row[16],
            equipoVisitanteNombre: row[17],
            equipoVisitanteBandera: row[18],
            equipoVisitanteSiglas: row[19],
            equipoVisitantePuntosFifa: row[20],
            equipoVisitanteGrupo: row[21]
        };
    });
}

export const actualizarPuntosActualesPrediccionQuery = `-- name: ActualizarPuntosActualesPrediccion :exec
UPDATE prediccion SET
    puntos_actuales = $1
WHERE usuario_id = $2 AND partido_id = $3`;

export interface ActualizarPuntosActualesPrediccionArgs {
    puntosActuales: number | null;
    usuarioId: string;
    partidoId: number;
}

export async function actualizarPuntosActualesPrediccion(client: Client, args: ActualizarPuntosActualesPrediccionArgs): Promise<void> {
    await client.query({
        text: actualizarPuntosActualesPrediccionQuery,
        values: [args.puntosActuales, args.usuarioId, args.partidoId],
        rowMode: "array"
    });
}

export const actualizarPuntosActualesUsuarioQuery = `-- name: ActualizarPuntosActualesUsuario :exec
UPDATE prediccion SET
    puntos_actuales = $1
WHERE usuario_id = $2`;

export interface ActualizarPuntosActualesUsuarioArgs {
    puntosActuales: number | null;
    usuarioId: string;
}

export async function actualizarPuntosActualesUsuario(client: Client, args: ActualizarPuntosActualesUsuarioArgs): Promise<void> {
    await client.query({
        text: actualizarPuntosActualesUsuarioQuery,
        values: [args.puntosActuales, args.usuarioId],
        rowMode: "array"
    });
}

export const verGanadoresHitMasGolesQuery = `-- name: VerGanadoresHitMasGoles :many
SELECT DISTINCT pe.usuario_id, u.username,
       (p.goles_local + p.goles_visitante)::INTEGER AS total_goles,
       el.siglas AS equipo_local_siglas,
       ev.siglas AS equipo_visitante_siglas,
       el.bandera AS equipo_local_bandera,
       ev.bandera AS equipo_visitante_bandera,
       p.goles_local::INTEGER AS goles_local,
       p.goles_visitante::INTEGER AS goles_visitante
FROM prediccion pe
JOIN partidos p ON p.id = pe.partido_id
JOIN usuarios u ON u.id = pe.usuario_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE pe.resultado = 'exacto'
  AND u.participante = TRUE
  AND (p.goles_local + p.goles_visitante) = (
    SELECT MAX(p2.goles_local + p2.goles_visitante)
    FROM prediccion pe2
    JOIN partidos p2 ON p2.id = pe2.partido_id
    WHERE pe2.resultado = 'exacto'
  )`;

export interface VerGanadoresHitMasGolesRow {
    usuarioId: string;
    username: string;
    totalGoles: number;
    equipoLocalSiglas: string;
    equipoVisitanteSiglas: string;
    equipoLocalBandera: string;
    equipoVisitanteBandera: string;
    golesLocal: number;
    golesVisitante: number;
}

export async function verGanadoresHitMasGoles(client: Client): Promise<VerGanadoresHitMasGolesRow[]> {
    const result = await client.query({
        text: verGanadoresHitMasGolesQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            username: row[1],
            totalGoles: row[2],
            equipoLocalSiglas: row[3],
            equipoVisitanteSiglas: row[4],
            equipoLocalBandera: row[5],
            equipoVisitanteBandera: row[6],
            golesLocal: row[7],
            golesVisitante: row[8]
        };
    });
}

