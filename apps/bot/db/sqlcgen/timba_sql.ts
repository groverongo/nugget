import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const crearTimbaQuery = `-- name: CrearTimba :one
INSERT INTO timba_time (partido_id, descripcion, jugador_1_id, puntos)
VALUES ($1, $2, $3, $4)
RETURNING id`;

export interface CrearTimbaArgs {
    partidoId: number;
    descripcion: string;
    jugador_1Id: string;
    puntos: number;
}

export interface CrearTimbaRow {
    id: number;
}

export async function crearTimba(client: Client, args: CrearTimbaArgs): Promise<CrearTimbaRow | null> {
    const result = await client.query({
        text: crearTimbaQuery,
        values: [args.partidoId, args.descripcion, args.jugador_1Id, args.puntos],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0]
    };
}

export const verTimbaQuery = `-- name: VerTimba :one
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos,
    t.ganador_id,
    t.estado,
    t.discord_message_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    f.puntos_base AS fase_puntos_base,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    el.siglas AS equipo_local_siglas,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera,
    ev.siglas AS equipo_visitante_siglas
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_fases f ON f.id = p.fase_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.id = $1`;

export interface VerTimbaArgs {
    id: number;
}

export interface VerTimbaRow {
    id: number;
    partidoId: number;
    descripcion: string;
    jugador_1Id: string;
    jugador_2Id: string | null;
    puntos: number;
    ganadorId: string | null;
    estado: string;
    discordMessageId: string | null;
    jugador_1Nombre: string;
    jugador_2Nombre: string;
    partidoEstado: string;
    fasePuntosBase: number;
    equipoLocalNombre: string;
    equipoLocalBandera: string;
    equipoLocalSiglas: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
    equipoVisitanteSiglas: string;
}

export async function verTimba(client: Client, args: VerTimbaArgs): Promise<VerTimbaRow | null> {
    const result = await client.query({
        text: verTimbaQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        partidoId: row[1],
        descripcion: row[2],
        jugador_1Id: row[3],
        jugador_2Id: row[4],
        puntos: row[5],
        ganadorId: row[6],
        estado: row[7],
        discordMessageId: row[8],
        jugador_1Nombre: row[9],
        jugador_2Nombre: row[10],
        partidoEstado: row[11],
        fasePuntosBase: row[12],
        equipoLocalNombre: row[13],
        equipoLocalBandera: row[14],
        equipoLocalSiglas: row[15],
        equipoVisitanteNombre: row[16],
        equipoVisitanteBandera: row[17],
        equipoVisitanteSiglas: row[18]
    };
}

export const verPartidoParaTimbaQuery = `-- name: VerPartidoParaTimba :one
SELECT
    p.id AS partido_id,
    p.estado,
    f.puntos_base
FROM partidos p
JOIN estatico_fases f ON f.id = p.fase_id
WHERE p.id = $1`;

export interface VerPartidoParaTimbaArgs {
    id: number;
}

export interface VerPartidoParaTimbaRow {
    partidoId: number;
    estado: string;
    puntosBase: number;
}

export async function verPartidoParaTimba(client: Client, args: VerPartidoParaTimbaArgs): Promise<VerPartidoParaTimbaRow | null> {
    const result = await client.query({
        text: verPartidoParaTimbaQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        partidoId: row[0],
        estado: row[1],
        puntosBase: row[2]
    };
}

export const verTimbasPorPartidoQuery = `-- name: VerTimbasPorPartido :many
SELECT
    t.id,
    t.estado,
    t.descripcion,
    t.puntos,
    t.jugador_1_id,
    COALESCE(u2.id, '') AS jugador_2_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    el.siglas AS equipo_local_siglas,
    el.bandera AS equipo_local_bandera,
    ev.siglas AS equipo_visitante_siglas,
    ev.bandera AS equipo_visitante_bandera
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.partido_id = $1 AND t.estado IN ('abierta', 'cerrada')
ORDER BY t.created_at ASC`;

export interface VerTimbasPorPartidoArgs {
    partidoId: number;
}

export interface VerTimbasPorPartidoRow {
    id: number;
    estado: string;
    descripcion: string;
    puntos: number;
    jugador_1Id: string;
    jugador_2Id: string;
    jugador_1Nombre: string;
    jugador_2Nombre: string;
    equipoLocalSiglas: string;
    equipoLocalBandera: string;
    equipoVisitanteSiglas: string;
    equipoVisitanteBandera: string;
}

export async function verTimbasPorPartido(client: Client, args: VerTimbasPorPartidoArgs): Promise<VerTimbasPorPartidoRow[]> {
    const result = await client.query({
        text: verTimbasPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            estado: row[1],
            descripcion: row[2],
            puntos: row[3],
            jugador_1Id: row[4],
            jugador_2Id: row[5],
            jugador_1Nombre: row[6],
            jugador_2Nombre: row[7],
            equipoLocalSiglas: row[8],
            equipoLocalBandera: row[9],
            equipoVisitanteSiglas: row[10],
            equipoVisitanteBandera: row[11]
        };
    });
}

export const verTimbasCerradasPorPartidoQuery = `-- name: VerTimbasCerradasPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
WHERE t.partido_id = $1 AND t.estado = 'cerrada'
ORDER BY t.created_at ASC`;

export interface VerTimbasCerradasPorPartidoArgs {
    partidoId: number;
}

export interface VerTimbasCerradasPorPartidoRow {
    id: number;
    descripcion: string;
    jugador_1Id: string;
    jugador_2Id: string | null;
    puntos: number;
    jugador_1Nombre: string;
    jugador_2Nombre: string;
}

export async function verTimbasCerradasPorPartido(client: Client, args: VerTimbasCerradasPorPartidoArgs): Promise<VerTimbasCerradasPorPartidoRow[]> {
    const result = await client.query({
        text: verTimbasCerradasPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            descripcion: row[1],
            jugador_1Id: row[2],
            jugador_2Id: row[3],
            puntos: row[4],
            jugador_1Nombre: row[5],
            jugador_2Nombre: row[6]
        };
    });
}

export const verMisTimbasQuery = `-- name: VerMisTimbas :many
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.puntos,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre
FROM timba_time t
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.jugador_1_id = $1 AND t.estado = 'abierta'
ORDER BY t.created_at ASC`;

export interface VerMisTimbasArgs {
    jugador_1Id: string;
}

export interface VerMisTimbasRow {
    id: number;
    partidoId: number;
    descripcion: string;
    puntos: number;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
}

export async function verMisTimbas(client: Client, args: VerMisTimbasArgs): Promise<VerMisTimbasRow[]> {
    const result = await client.query({
        text: verMisTimbasQuery,
        values: [args.jugador_1Id],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            partidoId: row[1],
            descripcion: row[2],
            puntos: row[3],
            equipoLocalNombre: row[4],
            equipoVisitanteNombre: row[5]
        };
    });
}

export const verFechasDeTimbasPorUsuarioQuery = `-- name: VerFechasDeTimbasPorUsuario :many
SELECT DISTINCT DATE(p.fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM timba_time t
JOIN partidos p ON p.id = t.partido_id
WHERE t.jugador_1_id = $1 OR t.jugador_2_id = $1
ORDER BY fecha ASC`;

export interface VerFechasDeTimbasPorUsuarioArgs {
    jugador_1Id: string;
}

export interface VerFechasDeTimbasPorUsuarioRow {
    fecha: string;
}

export async function verFechasDeTimbasPorUsuario(client: Client, args: VerFechasDeTimbasPorUsuarioArgs): Promise<VerFechasDeTimbasPorUsuarioRow[]> {
    const result = await client.query({
        text: verFechasDeTimbasPorUsuarioQuery,
        values: [args.jugador_1Id],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            fecha: row[0]
        };
    });
}

export const verMisTimbasPorFechaQuery = `-- name: VerMisTimbasPorFecha :many
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.puntos,
    t.estado,
    t.jugador_1_id,
    t.jugador_2_id,
    t.ganador_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    p.fecha_partido,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE (t.jugador_1_id = $1 OR t.jugador_2_id = $1)
AND DATE(p.fecha_partido - INTERVAL '5 hours') = DATE($2)
ORDER BY p.fecha_partido ASC`;

export interface VerMisTimbasPorFechaArgs {
    jugador_1Id: string;
    date: string;
}

export interface VerMisTimbasPorFechaRow {
    id: number;
    partidoId: number;
    descripcion: string;
    puntos: number;
    estado: string;
    jugador_1Id: string;
    jugador_2Id: string | null;
    ganadorId: string | null;
    jugador_1Nombre: string;
    jugador_2Nombre: string;
    partidoEstado: string;
    fechaPartido: Date | null;
    equipoLocalNombre: string;
    equipoLocalBandera: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
}

export async function verMisTimbasPorFecha(client: Client, args: VerMisTimbasPorFechaArgs): Promise<VerMisTimbasPorFechaRow[]> {
    const result = await client.query({
        text: verMisTimbasPorFechaQuery,
        values: [args.jugador_1Id, args.date],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            partidoId: row[1],
            descripcion: row[2],
            puntos: row[3],
            estado: row[4],
            jugador_1Id: row[5],
            jugador_2Id: row[6],
            ganadorId: row[7],
            jugador_1Nombre: row[8],
            jugador_2Nombre: row[9],
            partidoEstado: row[10],
            fechaPartido: row[11],
            equipoLocalNombre: row[12],
            equipoLocalBandera: row[13],
            equipoVisitanteNombre: row[14],
            equipoVisitanteBandera: row[15]
        };
    });
}

export const checkEmparejamientoTimbaQuery = `-- name: CheckEmparejamientoTimba :one
SELECT COUNT(*)::INTEGER AS count
FROM timba_time
WHERE partido_id = $1
AND estado NOT IN ('cancelada')
AND (
    (jugador_1_id = $2 AND jugador_2_id = $3)
    OR (jugador_1_id = $3 AND jugador_2_id = $2)
)`;

export interface CheckEmparejamientoTimbaArgs {
    partidoId: number;
    jugador_1Id: string;
    jugador_2Id: string | null;
}

export interface CheckEmparejamientoTimbaRow {
    count: number;
}

export async function checkEmparejamientoTimba(client: Client, args: CheckEmparejamientoTimbaArgs): Promise<CheckEmparejamientoTimbaRow | null> {
    const result = await client.query({
        text: checkEmparejamientoTimbaQuery,
        values: [args.partidoId, args.jugador_1Id, args.jugador_2Id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

export const aceptarTimbaQuery = `-- name: AceptarTimba :exec
UPDATE timba_time
SET jugador_2_id = $2, estado = 'cerrada'
WHERE id = $1`;

export interface AceptarTimbaArgs {
    id: number;
    jugador_2Id: string | null;
}

export async function aceptarTimba(client: Client, args: AceptarTimbaArgs): Promise<void> {
    await client.query({
        text: aceptarTimbaQuery,
        values: [args.id, args.jugador_2Id],
        rowMode: "array"
    });
}

export const verTimbasResueltasPorPartidoQuery = `-- name: VerTimbasResueltasPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.puntos,
    t.jugador_1_id,
    t.jugador_2_id,
    t.ganador_id,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre,
    ug.username AS ganador_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN usuarios ug ON ug.id = t.ganador_id
WHERE t.partido_id = $1 AND t.estado = 'resuelta'
ORDER BY t.created_at ASC`;

export interface VerTimbasResueltasPorPartidoArgs {
    partidoId: number;
}

export interface VerTimbasResueltasPorPartidoRow {
    id: number;
    descripcion: string;
    puntos: number;
    jugador_1Id: string;
    jugador_2Id: string | null;
    ganadorId: string | null;
    jugador_1Nombre: string;
    jugador_2Nombre: string;
    ganadorNombre: string;
}

export async function verTimbasResueltasPorPartido(client: Client, args: VerTimbasResueltasPorPartidoArgs): Promise<VerTimbasResueltasPorPartidoRow[]> {
    const result = await client.query({
        text: verTimbasResueltasPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            descripcion: row[1],
            puntos: row[2],
            jugador_1Id: row[3],
            jugador_2Id: row[4],
            ganadorId: row[5],
            jugador_1Nombre: row[6],
            jugador_2Nombre: row[7],
            ganadorNombre: row[8]
        };
    });
}

export const resolverTimbaQuery = `-- name: ResolverTimba :exec
UPDATE timba_time
SET ganador_id = $2, estado = 'resuelta'
WHERE id = $1`;

export interface ResolverTimbaArgs {
    id: number;
    ganadorId: string | null;
}

export async function resolverTimba(client: Client, args: ResolverTimbaArgs): Promise<void> {
    await client.query({
        text: resolverTimbaQuery,
        values: [args.id, args.ganadorId],
        rowMode: "array"
    });
}

export const cancelarTimbaQuery = `-- name: CancelarTimba :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE id = $1`;

export interface CancelarTimbaArgs {
    id: number;
}

export async function cancelarTimba(client: Client, args: CancelarTimbaArgs): Promise<void> {
    await client.query({
        text: cancelarTimbaQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const guardarMensajeTimbaQuery = `-- name: GuardarMensajeTimba :exec
UPDATE timba_time
SET discord_message_id = $2
WHERE id = $1`;

export interface GuardarMensajeTimbaArgs {
    id: number;
    discordMessageId: string | null;
}

export async function guardarMensajeTimba(client: Client, args: GuardarMensajeTimbaArgs): Promise<void> {
    await client.query({
        text: guardarMensajeTimbaQuery,
        values: [args.id, args.discordMessageId],
        rowMode: "array"
    });
}

export const anularTimbaQuery = `-- name: AnularTimba :exec
DELETE FROM timba_time WHERE id = $1`;

export interface AnularTimbaArgs {
    id: number;
}

export async function anularTimba(client: Client, args: AnularTimbaArgs): Promise<void> {
    await client.query({
        text: anularTimbaQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const cancelarTimbasAbiertasPorPartidoQuery = `-- name: CancelarTimbasAbiertasPorPartido :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE partido_id = $1 AND estado = 'abierta'`;

export interface CancelarTimbasAbiertasPorPartidoArgs {
    partidoId: number;
}

export async function cancelarTimbasAbiertasPorPartido(client: Client, args: CancelarTimbasAbiertasPorPartidoArgs): Promise<void> {
    await client.query({
        text: cancelarTimbasAbiertasPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
}

export const sumarApuestasActivasQuery = `-- name: SumarApuestasActivas :one
SELECT COALESCE(SUM(puntos), 0)::INTEGER AS total
FROM timba_time
WHERE (jugador_1_id = $1 OR jugador_2_id = $1)
AND estado IN ('abierta', 'cerrada')`;

export interface SumarApuestasActivasArgs {
    userId: string;
}

export interface SumarApuestasActivasRow {
    total: number;
}

export async function sumarApuestasActivas(client: Client, args: SumarApuestasActivasArgs): Promise<SumarApuestasActivasRow | null> {
    const result = await client.query({
        text: sumarApuestasActivasQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        total: row[0]
    };
}

