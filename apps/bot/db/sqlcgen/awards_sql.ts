import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const guardarAwardsQuery = `-- name: GuardarAwards :exec
UPDATE usuarios SET
    award_campeon = $1,
    award_goleador = $2,
    award_mejor_jugador = $3,
    award_mejor_arquero = $4,
    award_mejor_jugador_joven = $5,
    award_mejor_gol = $6,
    award_seleccion_decepcion = $7,
    award_seleccion_sorpresa = $8
WHERE id = $9`;

export interface GuardarAwardsArgs {
    awardCampeon: number | null;
    awardGoleador: number | null;
    awardMejorJugador: number | null;
    awardMejorArquero: number | null;
    awardMejorJugadorJoven: number | null;
    awardMejorGol: number | null;
    awardSeleccionDecepcion: number | null;
    awardSeleccionSorpresa: number | null;
    id: string;
}

export async function guardarAwards(client: Client, args: GuardarAwardsArgs): Promise<void> {
    await client.query({
        text: guardarAwardsQuery,
        values: [args.awardCampeon, args.awardGoleador, args.awardMejorJugador, args.awardMejorArquero, args.awardMejorJugadorJoven, args.awardMejorGol, args.awardSeleccionDecepcion, args.awardSeleccionSorpresa, args.id],
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
    awardCampeon: number | null;
    awardGoleador: number | null;
    awardMejorJugador: number | null;
    awardMejorArquero: number | null;
    awardMejorJugadorJoven: number | null;
    awardMejorGol: number | null;
    awardSeleccionDecepcion: number | null;
    awardSeleccionSorpresa: number | null;
}

export async function verAwardsDeUsuario(client: Client, args: VerAwardsDeUsuarioArgs): Promise<VerAwardsDeUsuarioRow | null> {
    const result = await client.query({
        text: verAwardsDeUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        awardCampeon: row[0],
        awardGoleador: row[1],
        awardMejorJugador: row[2],
        awardMejorArquero: row[3],
        awardMejorJugadorJoven: row[4],
        awardMejorGol: row[5],
        awardSeleccionDecepcion: row[6],
        awardSeleccionSorpresa: row[7]
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
    awardCampeon: number | null;
    awardGoleador: number | null;
    awardMejorJugador: number | null;
    awardMejorArquero: number | null;
    awardMejorJugadorJoven: number | null;
    awardMejorGol: number | null;
    awardSeleccionDecepcion: number | null;
    awardSeleccionSorpresa: number | null;
}

export async function listUsuariosConAwards(client: Client): Promise<ListUsuariosConAwardsRow[]> {
    const result = await client.query({
        text: listUsuariosConAwardsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            puntos: row[2],
            awardCampeon: row[3],
            awardGoleador: row[4],
            awardMejorJugador: row[5],
            awardMejorArquero: row[6],
            awardMejorJugadorJoven: row[7],
            awardMejorGol: row[8],
            awardSeleccionDecepcion: row[9],
            awardSeleccionSorpresa: row[10]
        };
    });
}

export const sumarPuntosAwardQuery = `-- name: SumarPuntosAward :exec
UPDATE usuarios SET
    puntos = puntos + $1
WHERE id = $2`;

export interface SumarPuntosAwardArgs {
    puntos: number;
    id: string;
}

export async function sumarPuntosAward(client: Client, args: SumarPuntosAwardArgs): Promise<void> {
    await client.query({
        text: sumarPuntosAwardQuery,
        values: [args.puntos, args.id],
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
    return result.rows.map(row => {
        return {
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
            seleccionSorpresaBandera: row[11]
        };
    });
}

