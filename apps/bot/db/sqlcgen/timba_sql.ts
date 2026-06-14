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
    jugador1Id: string;
    puntos: number;
}

export interface CrearTimbaRow {
    id: number;
}

export async function crearTimba(client: Client, args: CrearTimbaArgs): Promise<CrearTimbaRow | null> {
    const result = await client.query({
        text: crearTimbaQuery,
        values: [args.partidoId, args.descripcion, args.jugador1Id, args.puntos],
        rowMode: "array"
    });
    if (result.rows.length !== 1) return null;
    const row = result.rows[0];
    return { id: row[0] };
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
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    f.puntos_base AS fase_puntos_base,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera
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
    jugador1Id: string;
    jugador2Id: string | null;
    puntos: number;
    ganadorId: string | null;
    estado: string;
    jugador1Nombre: string;
    jugador2Nombre: string;
    partidoEstado: string;
    fasePuntosBase: number;
    equipoLocalNombre: string;
    equipoLocalBandera: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
}

export async function verTimba(client: Client, args: VerTimbaArgs): Promise<VerTimbaRow | null> {
    const result = await client.query({
        text: verTimbaQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) return null;
    const row = result.rows[0];
    return {
        id: row[0],
        partidoId: row[1],
        descripcion: row[2],
        jugador1Id: row[3],
        jugador2Id: row[4],
        puntos: row[5],
        ganadorId: row[6],
        estado: row[7],
        jugador1Nombre: row[8],
        jugador2Nombre: row[9],
        partidoEstado: row[10],
        fasePuntosBase: row[11],
        equipoLocalNombre: row[12],
        equipoLocalBandera: row[13],
        equipoVisitanteNombre: row[14],
        equipoVisitanteBandera: row[15]
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
    if (result.rows.length !== 1) return null;
    const row = result.rows[0];
    return {
        partidoId: row[0],
        estado: row[1],
        puntosBase: row[2]
    };
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
    jugador1Id: string;
    jugador2Id: string;
    puntos: number;
    jugador1Nombre: string;
    jugador2Nombre: string;
}

export async function verTimbasCerradasPorPartido(client: Client, args: VerTimbasCerradasPorPartidoArgs): Promise<VerTimbasCerradasPorPartidoRow[]> {
    const result = await client.query({
        text: verTimbasCerradasPorPartidoQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        descripcion: row[1],
        jugador1Id: row[2],
        jugador2Id: row[3],
        puntos: row[4],
        jugador1Nombre: row[5],
        jugador2Nombre: row[6]
    }));
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
    jugador1Id: string;
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
        values: [args.jugador1Id],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        partidoId: row[1],
        descripcion: row[2],
        puntos: row[3],
        equipoLocalNombre: row[4],
        equipoVisitanteNombre: row[5]
    }));
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
    jugador1Id: string;
    jugador2Id: string;
}

export interface CheckEmparejamientoTimbaRow {
    count: number;
}

export async function checkEmparejamientoTimba(client: Client, args: CheckEmparejamientoTimbaArgs): Promise<CheckEmparejamientoTimbaRow | null> {
    const result = await client.query({
        text: checkEmparejamientoTimbaQuery,
        values: [args.partidoId, args.jugador1Id, args.jugador2Id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) return null;
    return { count: result.rows[0][0] };
}

export const aceptarTimbaQuery = `-- name: AceptarTimba :exec
UPDATE timba_time
SET jugador_2_id = $2, estado = 'cerrada'
WHERE id = $1`;

export interface AceptarTimbaArgs {
    id: number;
    jugador2Id: string;
}

export async function aceptarTimba(client: Client, args: AceptarTimbaArgs): Promise<void> {
    await client.query({
        text: aceptarTimbaQuery,
        values: [args.id, args.jugador2Id],
        rowMode: "array"
    });
}

export const resolverTimbaQuery = `-- name: ResolverTimba :exec
UPDATE timba_time
SET ganador_id = $2, estado = 'resuelta'
WHERE id = $1`;

export interface ResolverTimbaArgs {
    id: number;
    ganadorId: string;
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
