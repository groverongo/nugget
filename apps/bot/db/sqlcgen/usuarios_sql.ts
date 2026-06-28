import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listUsuariosQuery = `-- name: ListUsuarios :many
SELECT id, username, award_campeon, award_goleador, award_mejor_jugador, award_mejor_arquero, award_mejor_jugador_joven, award_mejor_gol, award_seleccion_decepcion, award_seleccion_sorpresa, partidos_apostados, partidos_ganados, partidos_perdidos, puntos, racha, win_rate, premio_asociado, participante, racha_maxima, award_ko_finalista1, award_ko_finalista2, award_ko_campeon, award_ko_mejor_partido_equipo1, award_ko_mejor_partido_equipo2, award_ko_mejor_partido_mas_goles, award_ko_num_suplementarios, award_ko_goleador FROM usuarios`;

export interface ListUsuariosRow {
    id: string;
    username: string;
    awardCampeon: number | null;
    awardGoleador: number | null;
    awardMejorJugador: number | null;
    awardMejorArquero: number | null;
    awardMejorJugadorJoven: number | null;
    awardMejorGol: number | null;
    awardSeleccionDecepcion: number | null;
    awardSeleccionSorpresa: number | null;
    partidosApostados: number;
    partidosGanados: number;
    partidosPerdidos: number;
    puntos: number;
    racha: number;
    winRate: string;
    premioAsociado: number | null;
    participante: boolean;
    rachaMaxima: number;
    awardKoFinalista1: number | null;
    awardKoFinalista2: number | null;
    awardKoCampeon: number | null;
    awardKoMejorPartidoEquipo1: number | null;
    awardKoMejorPartidoEquipo2: number | null;
    awardKoMejorPartidoMasGoles: number | null;
    awardKoNumSuplementarios: number | null;
    awardKoGoleador: number | null;
}

export async function listUsuarios(client: Client): Promise<ListUsuariosRow[]> {
    const result = await client.query({
        text: listUsuariosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            awardCampeon: row[2],
            awardGoleador: row[3],
            awardMejorJugador: row[4],
            awardMejorArquero: row[5],
            awardMejorJugadorJoven: row[6],
            awardMejorGol: row[7],
            awardSeleccionDecepcion: row[8],
            awardSeleccionSorpresa: row[9],
            partidosApostados: row[10],
            partidosGanados: row[11],
            partidosPerdidos: row[12],
            puntos: row[13],
            racha: row[14],
            winRate: row[15],
            premioAsociado: row[16],
            participante: row[17],
            rachaMaxima: row[18],
            awardKoFinalista1: row[19],
            awardKoFinalista2: row[20],
            awardKoCampeon: row[21],
            awardKoMejorPartidoEquipo1: row[22],
            awardKoMejorPartidoEquipo2: row[23],
            awardKoMejorPartidoMasGoles: row[24],
            awardKoNumSuplementarios: row[25],
            awardKoGoleador: row[26]
        };
    });
}

export const createUsuarioQuery = `-- name: CreateUsuario :exec
INSERT INTO usuarios (id, username)
VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username`;

export interface CreateUsuarioArgs {
    id: string;
    username: string;
}

export async function createUsuario(client: Client, args: CreateUsuarioArgs): Promise<void> {
    await client.query({
        text: createUsuarioQuery,
        values: [args.id, args.username],
        rowMode: "array"
    });
}

export const updateUsuarioPremioQuery = `-- name: UpdateUsuarioPremio :exec
UPDATE usuarios SET
    premio_asociado = $1
WHERE id = $2`;

export interface UpdateUsuarioPremioArgs {
    premioAsociado: number | null;
    id: string;
}

export async function updateUsuarioPremio(client: Client, args: UpdateUsuarioPremioArgs): Promise<void> {
    await client.query({
        text: updateUsuarioPremioQuery,
        values: [args.premioAsociado, args.id],
        rowMode: "array"
    });
}

export const updateUsuarioUsernameQuery = `-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = $1
WHERE id = $2`;

export interface UpdateUsuarioUsernameArgs {
    username: string;
    id: string;
}

export async function updateUsuarioUsername(client: Client, args: UpdateUsuarioUsernameArgs): Promise<void> {
    await client.query({
        text: updateUsuarioUsernameQuery,
        values: [args.username, args.id],
        rowMode: "array"
    });
}

export const updateUsuarioParticipanteQuery = `-- name: UpdateUsuarioParticipante :exec
UPDATE usuarios SET
    participante = $1
WHERE id = $2`;

export interface UpdateUsuarioParticipanteArgs {
    participante: boolean;
    id: string;
}

export async function updateUsuarioParticipante(client: Client, args: UpdateUsuarioParticipanteArgs): Promise<void> {
    await client.query({
        text: updateUsuarioParticipanteQuery,
        values: [args.participante, args.id],
        rowMode: "array"
    });
}

export const actualizarStatsUsuarioQuery = `-- name: ActualizarStatsUsuario :exec
UPDATE usuarios SET
    partidos_apostados = partidos_apostados + 1,
    partidos_ganados   = partidos_ganados + $2,
    partidos_perdidos  = partidos_perdidos + $3,
    puntos             = puntos + $4,
    racha              = $5,
    racha_maxima       = GREATEST(racha_maxima, $5),
    win_rate           = CASE
        WHEN (partidos_apostados + 1) = 0 THEN 0
        ELSE ROUND(((partidos_ganados + $2)::NUMERIC / (partidos_apostados + 1)) * 100, 2)
    END
WHERE id = $1`;

export interface ActualizarStatsUsuarioArgs {
    id: string;
    partidosGanados: number;
    partidosPerdidos: number;
    puntos: number;
    racha: number;
}

export async function actualizarStatsUsuario(client: Client, args: ActualizarStatsUsuarioArgs): Promise<void> {
    await client.query({
        text: actualizarStatsUsuarioQuery,
        values: [args.id, args.partidosGanados, args.partidosPerdidos, args.puntos, args.racha],
        rowMode: "array"
    });
}

export const deleteUsuarioQuery = `-- name: DeleteUsuario :exec
DELETE FROM usuarios
WHERE id = $1`;

export interface DeleteUsuarioArgs {
    id: string;
}

export async function deleteUsuario(client: Client, args: DeleteUsuarioArgs): Promise<void> {
    await client.query({
        text: deleteUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const countUsuariosQuery = `-- name: CountUsuarios :one
SELECT COUNT(*) FROM usuarios`;

export interface CountUsuariosRow {
    count: string;
}

export async function countUsuarios(client: Client): Promise<CountUsuariosRow | null> {
    const result = await client.query({
        text: countUsuariosQuery,
        values: [],
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

export const countParticipantesQuery = `-- name: CountParticipantes :one
SELECT COUNT(*) FROM usuarios WHERE participante = TRUE`;

export interface CountParticipantesRow {
    count: string;
}

export async function countParticipantes(client: Client): Promise<CountParticipantesRow | null> {
    const result = await client.query({
        text: countParticipantesQuery,
        values: [],
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

export const limpiezaDistribucionPremiosQuery = `-- name: LimpiezaDistribucionPremios :exec
DELETE FROM estatico_premios`;

export async function limpiezaDistribucionPremios(client: Client): Promise<void> {
    await client.query({
        text: limpiezaDistribucionPremiosQuery,
        values: [],
        rowMode: "array"
    });
}

export const agregarPuestoPremioQuery = `-- name: AgregarPuestoPremio :exec
INSERT INTO estatico_premios (puesto, premio)
VALUES ($1, $2)`;

export interface AgregarPuestoPremioArgs {
    puesto: number;
    premio: string;
}

export async function agregarPuestoPremio(client: Client, args: AgregarPuestoPremioArgs): Promise<void> {
    await client.query({
        text: agregarPuestoPremioQuery,
        values: [args.puesto, args.premio],
        rowMode: "array"
    });
}

export const obtenerPuntosUsuarioQuery = `-- name: ObtenerPuntosUsuario :one
SELECT id, puntos FROM usuarios WHERE id = $1`;

export interface ObtenerPuntosUsuarioArgs {
    id: string;
}

export interface ObtenerPuntosUsuarioRow {
    id: string;
    puntos: number;
}

export async function obtenerPuntosUsuario(client: Client, args: ObtenerPuntosUsuarioArgs): Promise<ObtenerPuntosUsuarioRow | null> {
    const result = await client.query({
        text: obtenerPuntosUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        puntos: row[1]
    };
}

export const ajustarPuntosTimbaQuery = `-- name: AjustarPuntosTimba :exec
UPDATE usuarios SET puntos = puntos + $2 WHERE id = $1`;

export interface AjustarPuntosTimbaArgs {
    id: string;
    delta: number;
}

export async function ajustarPuntosTimba(client: Client, args: AjustarPuntosTimbaArgs): Promise<void> {
    await client.query({
        text: ajustarPuntosTimbaQuery,
        values: [args.id, args.delta],
        rowMode: "array"
    });
}

export const verGanadoresMayorWinRateQuery = `-- name: VerGanadoresMayorWinRate :many
SELECT id, username, win_rate::NUMERIC AS win_rate
FROM usuarios
WHERE participante = TRUE
  AND win_rate = (SELECT MAX(win_rate) FROM usuarios WHERE participante = TRUE AND win_rate > 0)`;

export interface VerGanadoresMayorWinRateRow {
    id: string;
    username: string;
    winRate: string;
}

export async function verGanadoresMayorWinRate(client: Client): Promise<VerGanadoresMayorWinRateRow[]> {
    const result = await client.query({
        text: verGanadoresMayorWinRateQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            winRate: row[2]
        };
    });
}

export const verGanadoresRachaMaximaQuery = `-- name: VerGanadoresRachaMaxima :many
SELECT id, username, racha_maxima
FROM usuarios
WHERE participante = TRUE
  AND racha_maxima = (SELECT MAX(racha_maxima) FROM usuarios WHERE participante = TRUE AND racha_maxima > 0)`;

export interface VerGanadoresRachaMaximaRow {
    id: string;
    username: string;
    rachaMaxima: number;
}

export async function verGanadoresRachaMaxima(client: Client): Promise<VerGanadoresRachaMaximaRow[]> {
    const result = await client.query({
        text: verGanadoresRachaMaximaQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            rachaMaxima: row[2]
        };
    });
}

