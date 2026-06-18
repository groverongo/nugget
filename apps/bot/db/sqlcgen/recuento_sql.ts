import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verRankingCompletoQuery = `-- name: VerRankingCompleto :many
SELECT
    id,
    username,
    puntos,
    racha,
    racha_maxima,
    win_rate::NUMERIC AS win_rate,
    partidos_apostados,
    partidos_ganados,
    partidos_perdidos,
    (partidos_apostados - partidos_ganados - partidos_perdidos) AS partidos_buen_intento,
    premio_asociado
FROM usuarios
WHERE participante = TRUE
ORDER BY
    puntos DESC,
    partidos_ganados DESC,
    win_rate DESC,
    racha_maxima DESC,
    (partidos_apostados - partidos_ganados - partidos_perdidos) DESC`;

export interface VerRankingCompletoRow {
    id: string;
    username: string;
    puntos: number;
    racha: number;
    rachaMaxima: number;
    winRate: string;
    partidosApostados: number;
    partidosGanados: number;
    partidosPerdidos: number;
    partidosBuenIntento: number;
    premioAsociado: number | null;
}

export async function verRankingCompleto(client: Client): Promise<VerRankingCompletoRow[]> {
    const result = await client.query({
        text: verRankingCompletoQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        username: row[1],
        puntos: row[2],
        racha: row[3],
        rachaMaxima: row[4],
        winRate: row[5],
        partidosApostados: row[6],
        partidosGanados: row[7],
        partidosPerdidos: row[8],
        partidosBuenIntento: row[9],
        premioAsociado: row[10]
    }));
}

export const verEstadisticasTorneoQuery = `-- name: VerEstadisticasTorneo :one
SELECT
    COUNT(*) FILTER (WHERE estado = 'finalizado')::INTEGER AS partidos_finalizados,
    COUNT(*)::INTEGER AS partidos_total
FROM partidos`;

export interface VerEstadisticasTorneoRow {
    partidosFinalizados: number;
    partidosTotal: number;
}

export async function verEstadisticasTorneo(client: Client): Promise<VerEstadisticasTorneoRow | null> {
    const result = await client.query({
        text: verEstadisticasTorneoQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) return null;
    const row = result.rows[0];
    return {
        partidosFinalizados: row[0],
        partidosTotal: row[1]
    };
}

export const verWinRateGlobalQuery = `-- name: VerWinRateGlobal :one
SELECT
    (SELECT COUNT(DISTINCT pe.partido_id)::INTEGER
     FROM prediccion pe
     JOIN usuarios u ON u.id = pe.usuario_id
     WHERE pe.resultado = 'exacto' AND u.participante = TRUE) AS exactos,
    (SELECT COUNT(*)::INTEGER FROM partidos WHERE estado = 'finalizado') AS total_finalizados`;

export interface VerWinRateGlobalRow {
    exactos: number;
    totalFinalizados: number;
}

export async function verWinRateGlobal(client: Client): Promise<VerWinRateGlobalRow | null> {
    const result = await client.query({
        text: verWinRateGlobalQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) return null;
    const row = result.rows[0];
    return {
        exactos: row[0],
        totalFinalizados: row[1]
    };
}

export const verRankingWinRateQuery = `-- name: VerRankingWinRate :many
SELECT id, username, win_rate::NUMERIC AS win_rate
FROM usuarios
WHERE participante = TRUE AND win_rate > 0
ORDER BY win_rate DESC, partidos_ganados DESC`;

export interface VerRankingWinRateRow {
    id: string;
    username: string;
    winRate: string;
}

export async function verRankingWinRate(client: Client): Promise<VerRankingWinRateRow[]> {
    const result = await client.query({
        text: verRankingWinRateQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        username: row[1],
        winRate: row[2]
    }));
}

export const verRankingRachaMaximaQuery = `-- name: VerRankingRachaMaxima :many
SELECT id, username, racha_maxima
FROM usuarios
WHERE participante = TRUE AND racha_maxima > 0
ORDER BY racha_maxima DESC, partidos_ganados DESC`;

export interface VerRankingRachaMaximaRow {
    id: string;
    username: string;
    rachaMaxima: number;
}

export async function verRankingRachaMaxima(client: Client): Promise<VerRankingRachaMaximaRow[]> {
    const result = await client.query({
        text: verRankingRachaMaximaQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        username: row[1],
        rachaMaxima: row[2]
    }));
}

export const verEquiposEliminadosQuery = `-- name: VerEquiposEliminados :many
SELECT id, nombre, siglas, bandera
FROM estatico_equipos
WHERE eliminado = TRUE
ORDER BY nombre ASC`;

export interface VerEquiposEliminadosRow {
    id: number;
    nombre: string;
    siglas: string;
    bandera: string;
}

export async function verEquiposEliminados(client: Client): Promise<VerEquiposEliminadosRow[]> {
    const result = await client.query({
        text: verEquiposEliminadosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        nombre: row[1],
        siglas: row[2],
        bandera: row[3]
    }));
}

export const marcarEquipoEliminadoQuery = `-- name: MarcarEquipoEliminado :exec
UPDATE estatico_equipos SET eliminado = TRUE WHERE id = $1`;

export interface MarcarEquipoEliminadoArgs {
    id: number;
}

export async function marcarEquipoEliminado(client: Client, args: MarcarEquipoEliminadoArgs): Promise<void> {
    await client.query({
        text: marcarEquipoEliminadoQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const marcarEquipoNoEliminadoQuery = `-- name: MarcarEquipoNoEliminado :exec
UPDATE estatico_equipos SET eliminado = FALSE WHERE id = $1`;

export interface MarcarEquipoNoEliminadoArgs {
    id: number;
}

export async function marcarEquipoNoEliminado(client: Client, args: MarcarEquipoNoEliminadoArgs): Promise<void> {
    await client.query({
        text: marcarEquipoNoEliminadoQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const verAwardsParaRecuentoQuery = `-- name: VerAwardsParaRecuento :many
SELECT
    u.id AS usuario_id,
    u.username,
    u.award_campeon AS campeon_id,
    ec.bandera AS campeon_bandera,
    u.award_goleador AS goleador_id,
    jg.equipo_id AS goleador_equipo_id,
    u.award_mejor_jugador AS mejor_jugador_id,
    jmj.equipo_id AS mejor_jugador_equipo_id,
    u.award_mejor_arquero AS mejor_arquero_id,
    jma.equipo_id AS mejor_arquero_equipo_id,
    u.award_mejor_jugador_joven AS mejor_jugador_joven_id,
    jmjj.equipo_id AS mejor_jugador_joven_equipo_id,
    u.award_mejor_gol AS mejor_gol_id,
    jmg.equipo_id AS mejor_gol_equipo_id,
    u.award_seleccion_decepcion AS seleccion_decepcion_id,
    esd.bandera AS seleccion_decepcion_bandera,
    u.award_seleccion_sorpresa AS seleccion_sorpresa_id,
    ess.bandera AS seleccion_sorpresa_bandera
FROM usuarios u
LEFT JOIN estatico_equipos ec ON ec.id = u.award_campeon
LEFT JOIN estatico_jugadores jg ON jg.id = u.award_goleador
LEFT JOIN estatico_jugadores jmj ON jmj.id = u.award_mejor_jugador
LEFT JOIN estatico_jugadores jma ON jma.id = u.award_mejor_arquero
LEFT JOIN estatico_jugadores jmjj ON jmjj.id = u.award_mejor_jugador_joven
LEFT JOIN estatico_jugadores jmg ON jmg.id = u.award_mejor_gol
LEFT JOIN estatico_equipos esd ON esd.id = u.award_seleccion_decepcion
LEFT JOIN estatico_equipos ess ON ess.id = u.award_seleccion_sorpresa
WHERE u.participante = TRUE AND u.award_campeon IS NOT NULL
ORDER BY u.username`;

export interface VerAwardsParaRecuentoRow {
    usuarioId: string;
    username: string;
    campeonId: number | null;
    campeonBandera: string | null;
    goleadorId: number | null;
    goleadorEquipoId: number | null;
    mejorJugadorId: number | null;
    mejorJugadorEquipoId: number | null;
    mejorArqueroId: number | null;
    mejorArqueroEquipoId: number | null;
    mejorJugadorJovenId: number | null;
    mejorJugadorJovenEquipoId: number | null;
    mejorGolId: number | null;
    mejorGolEquipoId: number | null;
    seleccionDecepcionId: number | null;
    seleccionDecepcionBandera: string | null;
    seleccionSorpresaId: number | null;
    seleccionSorpresaBandera: string | null;
}

export async function verAwardsParaRecuento(client: Client): Promise<VerAwardsParaRecuentoRow[]> {
    const result = await client.query({
        text: verAwardsParaRecuentoQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        usuarioId: row[0],
        username: row[1],
        campeonId: row[2],
        campeonBandera: row[3],
        goleadorId: row[4],
        goleadorEquipoId: row[5],
        mejorJugadorId: row[6],
        mejorJugadorEquipoId: row[7],
        mejorArqueroId: row[8],
        mejorArqueroEquipoId: row[9],
        mejorJugadorJovenId: row[10],
        mejorJugadorJovenEquipoId: row[11],
        mejorGolId: row[12],
        mejorGolEquipoId: row[13],
        seleccionDecepcionId: row[14],
        seleccionDecepcionBandera: row[15],
        seleccionSorpresaId: row[16],
        seleccionSorpresaBandera: row[17]
    }));
}
