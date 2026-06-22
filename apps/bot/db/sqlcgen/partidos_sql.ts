import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verPartidosPorFechaQuery = `-- name: VerPartidosPorFecha :many
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.siglas AS equipo_local_siglas,
	ev.siglas AS equipo_visitante_siglas,
	el.bandera AS equipo_local_bandera,
	ev.bandera AS equipo_visitante_bandera,
	el.grupo AS equipo_local_grupo,
	ev.grupo AS equipo_visitante_grupo,
	partidos.estado,
	partidos.goles_local AS partido_goles_local,
	partidos.goles_visitante AS partido_goles_visitante,
	partidos.fecha_partido,
	partidos.extra_partidazo,
	partidos.extra_milagro,
	partidos.extra_batacazo,
	partidos.extra_el_elegido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1)
ORDER BY partidos.fecha_partido ASC`;

export interface VerPartidosPorFechaArgs {
    date: string;
}

export interface VerPartidosPorFechaRow {
    partidoId: number;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
    equipoLocalSiglas: string;
    equipoVisitanteSiglas: string;
    equipoLocalBandera: string;
    equipoVisitanteBandera: string;
    equipoLocalGrupo: string;
    equipoVisitanteGrupo: string;
    estado: string;
    partidoGolesLocal: number | null;
    partidoGolesVisitante: number | null;
    fechaPartido: Date | null;
    extraPartidazo: boolean;
    extraMilagro: boolean;
    extraBatacazo: boolean;
    extraElElegido: boolean;
}

export async function verPartidosPorFecha(client: Client, args: VerPartidosPorFechaArgs): Promise<VerPartidosPorFechaRow[]> {
    const result = await client.query({
        text: verPartidosPorFechaQuery,
        values: [args.date],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            equipoLocalNombre: row[1],
            equipoVisitanteNombre: row[2],
            equipoLocalSiglas: row[3],
            equipoVisitanteSiglas: row[4],
            equipoLocalBandera: row[5],
            equipoVisitanteBandera: row[6],
            equipoLocalGrupo: row[7],
            equipoVisitanteGrupo: row[8],
            estado: row[9],
            partidoGolesLocal: row[10],
            partidoGolesVisitante: row[11],
            fechaPartido: row[12],
            extraPartidazo: row[13],
            extraMilagro: row[14],
            extraBatacazo: row[15],
            extraElElegido: row[16]
        };
    });
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

export const verInformacionPartidoQuery = `-- name: VerInformacionPartido :one
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.siglas AS equipo_local_siglas,
	ev.siglas AS equipo_visitante_siglas,
	el.bandera AS equipo_local_bandera,
	ev.bandera AS equipo_visitante_bandera,
	el.grupo AS equipo_local_grupo,
	ev.grupo AS equipo_visitante_grupo,
	partidos.estado,
	partidos.goles_local AS partido_goles_local,
	partidos.goles_visitante AS partido_goles_visitante,
	partidos.fecha_partido,
	partidos.extra_partidazo,
	partidos.extra_milagro,
	partidos.extra_batacazo,
	partidos.extra_el_elegido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.id = $1`;

export interface VerInformacionPartidoArgs {
    id: number;
}

export interface VerInformacionPartidoRow {
    partidoId: number;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
    equipoLocalSiglas: string;
    equipoVisitanteSiglas: string;
    equipoLocalBandera: string;
    equipoVisitanteBandera: string;
    equipoLocalGrupo: string;
    equipoVisitanteGrupo: string;
    estado: string;
    partidoGolesLocal: number | null;
    partidoGolesVisitante: number | null;
    fechaPartido: Date | null;
    extraPartidazo: boolean;
    extraMilagro: boolean;
    extraBatacazo: boolean;
    extraElElegido: boolean;
}

export async function verInformacionPartido(client: Client, args: VerInformacionPartidoArgs): Promise<VerInformacionPartidoRow | null> {
    const result = await client.query({
        text: verInformacionPartidoQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        partidoId: row[0],
        equipoLocalNombre: row[1],
        equipoVisitanteNombre: row[2],
        equipoLocalSiglas: row[3],
        equipoVisitanteSiglas: row[4],
        equipoLocalBandera: row[5],
        equipoVisitanteBandera: row[6],
        equipoLocalGrupo: row[7],
        equipoVisitanteGrupo: row[8],
        estado: row[9],
        partidoGolesLocal: row[10],
        partidoGolesVisitante: row[11],
        fechaPartido: row[12],
        extraPartidazo: row[13],
        extraMilagro: row[14],
        extraBatacazo: row[15],
        extraElElegido: row[16]
    };
}

export const verFechasDePartidosQuery = `-- name: VerFechasDePartidos :many
SELECT DISTINCT DATE(fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM partidos
ORDER BY fecha ASC`;

export interface VerFechasDePartidosRow {
    fecha: string;
}

export async function verFechasDePartidos(client: Client): Promise<VerFechasDePartidosRow[]> {
    const result = await client.query({
        text: verFechasDePartidosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            fecha: row[0]
        };
    });
}

export const verPartidoParaCalculoQuery = `-- name: VerPartidoParaCalculo :one
SELECT
    p.id AS partido_id,
    p.fase_id,
    f.nombre AS fase_nombre,
    f.puntos_base,
    f.puntos_buen_intento,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa
FROM partidos p
JOIN estatico_fases f ON f.id = p.fase_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE p.id = $1`;

export interface VerPartidoParaCalculoArgs {
    id: number;
}

export interface VerPartidoParaCalculoRow {
    partidoId: number;
    faseId: number;
    faseNombre: string;
    puntosBase: number;
    puntosBuenIntento: number;
    equipoLocalPuntosFifa: string | null;
    equipoVisitantePuntosFifa: string | null;
}

export async function verPartidoParaCalculo(client: Client, args: VerPartidoParaCalculoArgs): Promise<VerPartidoParaCalculoRow | null> {
    const result = await client.query({
        text: verPartidoParaCalculoQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        partidoId: row[0],
        faseId: row[1],
        faseNombre: row[2],
        puntosBase: row[3],
        puntosBuenIntento: row[4],
        equipoLocalPuntosFifa: row[5],
        equipoVisitantePuntosFifa: row[6]
    };
}

export const actualizarPartidoFinalizadoQuery = `-- name: ActualizarPartidoFinalizado :exec
UPDATE partidos SET
    goles_local = $1,
    goles_visitante = $2,
    extra_milagro = $3,
    extra_partidazo = $4,
    extra_batacazo = $5,
    extra_el_elegido = $6,
    estado = 'finalizado'
WHERE id = $7`;

export interface ActualizarPartidoFinalizadoArgs {
    golesLocal: number | null;
    golesVisitante: number | null;
    extraMilagro: boolean;
    extraPartidazo: boolean;
    extraBatacazo: boolean;
    extraElElegido: boolean;
    id: number;
}

export async function actualizarPartidoFinalizado(client: Client, args: ActualizarPartidoFinalizadoArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoFinalizadoQuery,
        values: [args.golesLocal, args.golesVisitante, args.extraMilagro, args.extraPartidazo, args.extraBatacazo, args.extraElElegido, args.id],
        rowMode: "array"
    });
}

export const actualizarPartidoMedioTiempoQuery = `-- name: ActualizarPartidoMedioTiempo :exec
UPDATE partidos SET
    goles_local = $1,
    goles_visitante = $2,
    estado = 'medio_tiempo'
WHERE id = $3`;

export interface ActualizarPartidoMedioTiempoArgs {
    golesLocal: number | null;
    golesVisitante: number | null;
    id: number;
}

export async function actualizarPartidoMedioTiempo(client: Client, args: ActualizarPartidoMedioTiempoArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoMedioTiempoQuery,
        values: [args.golesLocal, args.golesVisitante, args.id],
        rowMode: "array"
    });
}

export const actualizarPartidoEnVivoQuery = `-- name: ActualizarPartidoEnVivo :exec
UPDATE partidos SET estado = 'en_vivo' WHERE id = $1`;

export interface ActualizarPartidoEnVivoArgs {
    id: number;
}

export async function actualizarPartidoEnVivo(client: Client, args: ActualizarPartidoEnVivoArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoEnVivoQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const actualizarGolesPartidoQuery = `-- name: ActualizarGolesPartido :exec
UPDATE partidos SET goles_local = $1, goles_visitante = $2 WHERE id = $3`;

export interface ActualizarGolesPartidoArgs {
    golesLocal: number | null;
    golesVisitante: number | null;
    id: number;
}

export async function actualizarGolesPartido(client: Client, args: ActualizarGolesPartidoArgs): Promise<void> {
    await client.query({
        text: actualizarGolesPartidoQuery,
        values: [args.golesLocal, args.golesVisitante, args.id],
        rowMode: "array"
    });
}

export const marcarResumenDiaEnviadoQuery = `-- name: MarcarResumenDiaEnviado :exec
INSERT INTO resumen_dia (fecha) VALUES ($1) ON CONFLICT DO NOTHING`;

export interface MarcarResumenDiaEnviadoArgs {
    fecha: string;
}

export async function marcarResumenDiaEnviado(client: Client, args: MarcarResumenDiaEnviadoArgs): Promise<void> {
    await client.query({
        text: marcarResumenDiaEnviadoQuery,
        values: [args.fecha],
        rowMode: "array"
    });
}

export const verResumenDiaEnviadoQuery = `-- name: VerResumenDiaEnviado :one
SELECT EXISTS(SELECT 1 FROM resumen_dia WHERE fecha = $1)::BOOLEAN AS enviado`;

export interface VerResumenDiaEnviadoArgs {
    fecha: string;
}

export interface VerResumenDiaEnviadoRow {
    enviado: boolean;
}

export async function verResumenDiaEnviado(client: Client, args: VerResumenDiaEnviadoArgs): Promise<VerResumenDiaEnviadoRow | null> {
    const result = await client.query({
        text: verResumenDiaEnviadoQuery,
        values: [args.fecha],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        enviado: row[0]
    };
}

export const verPartidosNoFinalizadosQuery = `-- name: VerPartidosNoFinalizados :many
SELECT
    partidos.id AS partido_id,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre,
    partidos.estado,
    partidos.fecha_partido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.estado != 'finalizado'
ORDER BY partidos.fecha_partido ASC`;

export interface VerPartidosNoFinalizadosRow {
    partidoId: number;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
    estado: string;
    fechaPartido: Date | null;
}

export async function verPartidosNoFinalizados(client: Client): Promise<VerPartidosNoFinalizadosRow[]> {
    const result = await client.query({
        text: verPartidosNoFinalizadosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            equipoLocalNombre: row[1],
            equipoVisitanteNombre: row[2],
            estado: row[3],
            fechaPartido: row[4]
        };
    });
}

