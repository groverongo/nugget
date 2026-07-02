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
	partidos.extra_el_elegido,
	partidos.partido_original_id,
	f.nombre AS fase_nombre
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
JOIN estatico_fases f ON f.id = partidos.fase_id
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
    partidoOriginalId: number | null;
    faseNombre: string;
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
            extraElElegido: row[16],
            partidoOriginalId: row[17],
            faseNombre: row[18]
        };
    });
}

export const obtenerPartidoQuery = `-- name: ObtenerPartido :one
SELECT id, fecha_partido, estado, partido_original_id, goles_minimos_local, goles_minimos_visitante
FROM partidos
WHERE id = $1`;

export interface ObtenerPartidoArgs {
    id: number;
}

export interface ObtenerPartidoRow {
    id: number;
    fechaPartido: Date | null;
    estado: string;
    partidoOriginalId: number | null;
    golesMinimosLocal: number | null;
    golesMinimosVisitante: number | null;
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
        fechaPartido: row[1],
        estado: row[2],
        partidoOriginalId: row[3],
        golesMinimosLocal: row[4],
        golesMinimosVisitante: row[5]
    };
}

export const verInformacionPartidoQuery = `-- name: VerInformacionPartido :one
SELECT
	partidos.id AS partido_id,
	partidos.equipo_local_id,
	partidos.equipo_visitante_id,
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
	partidos.extra_el_elegido,
	partidos.partido_original_id,
	partidos.goles_minimos_local,
	partidos.goles_minimos_visitante
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.id = $1`;

export interface VerInformacionPartidoArgs {
    id: number;
}

export interface VerInformacionPartidoRow {
    partidoId: number;
    equipoLocalId: number | null;
    equipoVisitanteId: number | null;
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
    partidoOriginalId: number | null;
    golesMinimosLocal: number | null;
    golesMinimosVisitante: number | null;
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
        equipoLocalId: row[1],
        equipoVisitanteId: row[2],
        equipoLocalNombre: row[3],
        equipoVisitanteNombre: row[4],
        equipoLocalSiglas: row[5],
        equipoVisitanteSiglas: row[6],
        equipoLocalBandera: row[7],
        equipoVisitanteBandera: row[8],
        equipoLocalGrupo: row[9],
        equipoVisitanteGrupo: row[10],
        estado: row[11],
        partidoGolesLocal: row[12],
        partidoGolesVisitante: row[13],
        fechaPartido: row[14],
        extraPartidazo: row[15],
        extraMilagro: row[16],
        extraBatacazo: row[17],
        extraElElegido: row[18],
        partidoOriginalId: row[19],
        golesMinimosLocal: row[20],
        golesMinimosVisitante: row[21]
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
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    p.partido_original_id,
    p.goles_minimos_local,
    p.goles_minimos_visitante
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
    partidoOriginalId: number | null;
    golesMinimosLocal: number | null;
    golesMinimosVisitante: number | null;
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
        equipoVisitantePuntosFifa: row[6],
        partidoOriginalId: row[7],
        golesMinimosLocal: row[8],
        golesMinimosVisitante: row[9]
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
    penales_ganador_id = $7,
    estado = 'finalizado'
WHERE id = $8`;

export interface ActualizarPartidoFinalizadoArgs {
    golesLocal: number | null;
    golesVisitante: number | null;
    extraMilagro: boolean;
    extraPartidazo: boolean;
    extraBatacazo: boolean;
    extraElElegido: boolean;
    penalesGanadorId: number | null;
    id: number;
}

export async function actualizarPartidoFinalizado(client: Client, args: ActualizarPartidoFinalizadoArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoFinalizadoQuery,
        values: [args.golesLocal, args.golesVisitante, args.extraMilagro, args.extraPartidazo, args.extraBatacazo, args.extraElElegido, args.penalesGanadorId, args.id],
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
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera,
    partidos.estado,
    partidos.fecha_partido,
    partidos.partido_original_id
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.estado != 'finalizado'
ORDER BY partidos.fecha_partido ASC`;

export interface VerPartidosNoFinalizadosRow {
    partidoId: number;
    equipoLocalNombre: string;
    equipoLocalBandera: string;
    equipoVisitanteNombre: string;
    equipoVisitanteBandera: string;
    estado: string;
    fechaPartido: Date | null;
    partidoOriginalId: number | null;
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
            equipoLocalBandera: row[2],
            equipoVisitanteNombre: row[3],
            equipoVisitanteBandera: row[4],
            estado: row[5],
            fechaPartido: row[6],
            partidoOriginalId: row[7]
        };
    });
}

export const agregarPartidoQuery = `-- name: AgregarPartido :exec
INSERT INTO partidos (fase_id, equipo_local_id, equipo_visitante_id, fecha_partido)
VALUES ($1, $3::INTEGER, $4::INTEGER, $2)`;

export interface AgregarPartidoArgs {
    faseId: number;
    fechaPartido: Date | null;
    equipoLocalId: number;
    equipoVisitanteId: number;
}

export async function agregarPartido(client: Client, args: AgregarPartidoArgs): Promise<void> {
    await client.query({
        text: agregarPartidoQuery,
        values: [args.faseId, args.fechaPartido, args.equipoLocalId, args.equipoVisitanteId],
        rowMode: "array"
    });
}

export const equipoJugoPartidoPorFaseQuery = `-- name: EquipoJugoPartidoPorFase :one
SELECT COUNT(1)::INTEGER AS COUNT
FROM partidos
WHERE fase_id = $1 AND (equipo_local_id = $2::INTEGER OR equipo_visitante_id = $2::INTEGER)`;

export interface EquipoJugoPartidoPorFaseArgs {
    faseId: number;
    equipoId: number;
}

export interface EquipoJugoPartidoPorFaseRow {
    count: number;
}

export async function equipoJugoPartidoPorFase(client: Client, args: EquipoJugoPartidoPorFaseArgs): Promise<EquipoJugoPartidoPorFaseRow | null> {
    const result = await client.query({
        text: equipoJugoPartidoPorFaseQuery,
        values: [args.faseId, args.equipoId],
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

export const crearPartidoSuplementarioQuery = `-- name: CrearPartidoSuplementario :one
INSERT INTO partidos (fase_id, equipo_local_id, equipo_visitante_id, fecha_partido, partido_original_id, goles_minimos_local, goles_minimos_visitante)
VALUES (
    $1::INTEGER,
    $2::INTEGER,
    $3::INTEGER,
    NOW(),
    $4::INTEGER,
    $5::INTEGER,
    $6::INTEGER
)
RETURNING id`;

export interface CrearPartidoSuplementarioArgs {
    faseId: number;
    equipoLocalId: number;
    equipoVisitanteId: number;
    partidoOriginalId: number;
    golesMinimosLocal: number;
    golesMinimosVisitante: number;
}

export interface CrearPartidoSuplementarioRow {
    id: number;
}

export async function crearPartidoSuplementario(client: Client, args: CrearPartidoSuplementarioArgs): Promise<CrearPartidoSuplementarioRow | null> {
    const result = await client.query({
        text: crearPartidoSuplementarioQuery,
        values: [args.faseId, args.equipoLocalId, args.equipoVisitanteId, args.partidoOriginalId, args.golesMinimosLocal, args.golesMinimosVisitante],
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

export const verPartidoSuplePorOriginalQuery = `-- name: VerPartidoSuplePorOriginal :one
SELECT id FROM partidos WHERE partido_original_id = $1`;

export interface VerPartidoSuplePorOriginalArgs {
    partidoOriginalId: number | null;
}

export interface VerPartidoSuplePorOriginalRow {
    id: number;
}

export async function verPartidoSuplePorOriginal(client: Client, args: VerPartidoSuplePorOriginalArgs): Promise<VerPartidoSuplePorOriginalRow | null> {
    const result = await client.query({
        text: verPartidoSuplePorOriginalQuery,
        values: [args.partidoOriginalId],
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

export const actualizarPartidoSuplementarioQuery = `-- name: ActualizarPartidoSuplementario :exec
UPDATE partidos SET estado = 'suplementario' WHERE id = $1`;

export interface ActualizarPartidoSuplementarioArgs {
    id: number;
}

export async function actualizarPartidoSuplementario(client: Client, args: ActualizarPartidoSuplementarioArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoSuplementarioQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const actualizarPartidoPenalesQuery = `-- name: ActualizarPartidoPenales :exec
UPDATE partidos SET estado = 'penales' WHERE id = $1`;

export interface ActualizarPartidoPenalesArgs {
    id: number;
}

export async function actualizarPartidoPenales(client: Client, args: ActualizarPartidoPenalesArgs): Promise<void> {
    await client.query({
        text: actualizarPartidoPenalesQuery,
        values: [args.id],
        rowMode: "array"
    });
}

