import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const guardarAwardsQuery = `-- name: GuardarAwards :exec
UPDATE usuarios SET
    award_campeon = $2,
    award_goleador = $3,
    award_mejor_jugador = $4,
    award_mejor_arquero = $5,
    award_mejor_jugador_joven = $6,
    award_mejor_gol = $7,
    award_seleccion_decepcion = $8,
    award_seleccion_sorpresa = $9
WHERE id = $1`;

export interface GuardarAwardsArgs {
    id: string;
    award_campeon: number | null;
    award_goleador: number | null;
    award_mejor_jugador: number | null;
    award_mejor_arquero: number | null;
    award_mejor_jugador_joven: number | null;
    award_mejor_gol: number | null;
    award_seleccion_decepcion: number | null;
    award_seleccion_sorpresa: number | null;
}

export async function guardarAwards(client: Client, args: GuardarAwardsArgs): Promise<void> {
    await client.query({
        text: guardarAwardsQuery,
        values: [
            args.id,
            args.award_campeon,
            args.award_goleador,
            args.award_mejor_jugador,
            args.award_mejor_arquero,
            args.award_mejor_jugador_joven,
            args.award_mejor_gol,
            args.award_seleccion_decepcion,
            args.award_seleccion_sorpresa,
        ],
        rowMode: "array"
    });
}

export const verAwardsDeUsuarioQuery = `-- name: VerAwardsDeUsuario :one
SELECT
    award_campeon,
    award_goleador,
    award_mejor_jugador,
    award_mejor_arquero,
    award_mejor_jugador_joven,
    award_mejor_gol,
    award_seleccion_decepcion,
    award_seleccion_sorpresa
FROM usuarios
WHERE id = $1`;

export interface VerAwardsDeUsuarioArgs {
    id: string;
}

export interface VerAwardsDeUsuarioRow {
    award_campeon: number | null;
    award_goleador: number | null;
    award_mejor_jugador: number | null;
    award_mejor_arquero: number | null;
    award_mejor_jugador_joven: number | null;
    award_mejor_gol: number | null;
    award_seleccion_decepcion: number | null;
    award_seleccion_sorpresa: number | null;
}

export async function verAwardsDeUsuario(client: Client, args: VerAwardsDeUsuarioArgs): Promise<VerAwardsDeUsuarioRow | null> {
    const result = await client.query({
        text: verAwardsDeUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        award_campeon: row[0],
        award_goleador: row[1],
        award_mejor_jugador: row[2],
        award_mejor_arquero: row[3],
        award_mejor_jugador_joven: row[4],
        award_mejor_gol: row[5],
        award_seleccion_decepcion: row[6],
        award_seleccion_sorpresa: row[7],
    };
}

export const listUsuariosConAwardsQuery = `-- name: ListUsuariosConAwards :many
SELECT
    id,
    username,
    puntos,
    award_campeon,
    award_goleador,
    award_mejor_jugador,
    award_mejor_arquero,
    award_mejor_jugador_joven,
    award_mejor_gol,
    award_seleccion_decepcion,
    award_seleccion_sorpresa
FROM usuarios
WHERE
    award_campeon IS NOT NULL
    AND award_goleador IS NOT NULL
    AND award_mejor_jugador IS NOT NULL
    AND award_mejor_arquero IS NOT NULL
    AND award_mejor_jugador_joven IS NOT NULL
    AND award_mejor_gol IS NOT NULL
    AND award_seleccion_decepcion IS NOT NULL
    AND award_seleccion_sorpresa IS NOT NULL`;

export interface ListUsuariosConAwardsRow {
    id: string;
    username: string;
    puntos: number;
    award_campeon: number;
    award_goleador: number;
    award_mejor_jugador: number;
    award_mejor_arquero: number;
    award_mejor_jugador_joven: number;
    award_mejor_gol: number;
    award_seleccion_decepcion: number;
    award_seleccion_sorpresa: number;
}

export async function listUsuariosConAwards(client: Client): Promise<ListUsuariosConAwardsRow[]> {
    const result = await client.query({
        text: listUsuariosConAwardsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        id: row[0],
        username: row[1],
        puntos: row[2],
        award_campeon: row[3],
        award_goleador: row[4],
        award_mejor_jugador: row[5],
        award_mejor_arquero: row[6],
        award_mejor_jugador_joven: row[7],
        award_mejor_gol: row[8],
        award_seleccion_decepcion: row[9],
        award_seleccion_sorpresa: row[10],
    }));
}

export const sumarPuntosAwardQuery = `-- name: SumarPuntosAward :exec
UPDATE usuarios SET
    puntos = puntos + $2
WHERE id = $1`;

export interface SumarPuntosAwardArgs {
    id: string;
    puntos: number;
}

export async function sumarPuntosAward(client: Client, args: SumarPuntosAwardArgs): Promise<void> {
    await client.query({
        text: sumarPuntosAwardQuery,
        values: [args.id, args.puntos],
        rowMode: "array"
    });
}

export const verPrediccionesAwardsQuery = `-- name: VerPrediccionesAwards :many
SELECT
    u.id AS usuario_id,
    ec.nombre AS campeon_nombre,
    ec.bandera AS campeon_bandera,
    jg.nombre AS goleador_nombre,
    jmj.nombre AS mejor_jugador_nombre,
    jma.nombre AS mejor_arquero_nombre,
    jmjj.nombre AS mejor_jugador_joven_nombre,
    jmg.nombre AS mejor_gol_nombre,
    esd.nombre AS seleccion_decepcion_nombre,
    esd.bandera AS seleccion_decepcion_bandera,
    ess.nombre AS seleccion_sorpresa_nombre,
    ess.bandera AS seleccion_sorpresa_bandera
FROM usuarios u
JOIN estatico_equipos ec ON ec.id = u.award_campeon
JOIN estatico_jugadores jg ON jg.id = u.award_goleador
JOIN estatico_jugadores jmj ON jmj.id = u.award_mejor_jugador
JOIN estatico_jugadores jma ON jma.id = u.award_mejor_arquero
JOIN estatico_jugadores jmjj ON jmjj.id = u.award_mejor_jugador_joven
JOIN estatico_jugadores jmg ON jmg.id = u.award_mejor_gol
JOIN estatico_equipos esd ON esd.id = u.award_seleccion_decepcion
JOIN estatico_equipos ess ON ess.id = u.award_seleccion_sorpresa
WHERE u.participante = TRUE AND u.award_campeon IS NOT NULL`;

export interface VerPrediccionesAwardsRow {
    usuarioId: string;
    campeonNombre: string;
    campeonBandera: string;
    goleadorNombre: string;
    mejorJugadorNombre: string;
    mejorArqueroNombre: string;
    mejorJugadorJovenNombre: string;
    mejorGolNombre: string;
    seleccionDecepcionNombre: string;
    seleccionDecepcionBandera: string;
    seleccionSorpresaNombre: string;
    seleccionSorpresaBandera: string;
}

export async function verPrediccionesAwards(client: Client): Promise<VerPrediccionesAwardsRow[]> {
    const result = await client.query({
        text: verPrediccionesAwardsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => ({
        usuarioId: row[0],
        campeonNombre: row[1],
        campeonBandera: row[2],
        goleadorNombre: row[3],
        mejorJugadorNombre: row[4],
        mejorArqueroNombre: row[5],
        mejorJugadorJovenNombre: row[6],
        mejorGolNombre: row[7],
        seleccionDecepcionNombre: row[8],
        seleccionDecepcionBandera: row[9],
        seleccionSorpresaNombre: row[10],
        seleccionSorpresaBandera: row[11],
    }));
}
