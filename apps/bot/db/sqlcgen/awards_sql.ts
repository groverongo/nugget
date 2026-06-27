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

export const guardarAwardsKOQuery = `-- name: GuardarAwardsKO :exec
UPDATE usuarios SET
    award_ko_finalista1 = $1,
    award_ko_finalista2 = $2,
    award_ko_campeon = $3,
    award_ko_mejor_partido_equipo1 = $4,
    award_ko_mejor_partido_equipo2 = $5,
    award_ko_mejor_partido_mas_goles = $6,
    award_ko_num_suplementarios = $7,
    award_ko_goleador = $8
WHERE id = $9`;

export interface GuardarAwardsKOArgs {
    awardKoFinalista1: number | null;
    awardKoFinalista2: number | null;
    awardKoCampeon: number | null;
    awardKoMejorPartidoEquipo1: number | null;
    awardKoMejorPartidoEquipo2: number | null;
    awardKoMejorPartidoMasGoles: number | null;
    awardKoNumSuplementarios: number | null;
    awardKoGoleador: number | null;
    id: string;
}

export async function guardarAwardsKO(client: Client, args: GuardarAwardsKOArgs): Promise<void> {
    await client.query({
        text: guardarAwardsKOQuery,
        values: [args.awardKoFinalista1, args.awardKoFinalista2, args.awardKoCampeon, args.awardKoMejorPartidoEquipo1, args.awardKoMejorPartidoEquipo2, args.awardKoMejorPartidoMasGoles, args.awardKoNumSuplementarios, args.awardKoGoleador, args.id],
        rowMode: "array"
    });
}

export const verAwardsKODeUsuarioQuery = `-- name: VerAwardsKODeUsuario :one
SELECT
    award_ko_finalista1,
    award_ko_finalista2,
    award_ko_campeon,
    award_ko_mejor_partido_equipo1,
    award_ko_mejor_partido_equipo2,
    award_ko_mejor_partido_mas_goles,
    award_ko_num_suplementarios,
    award_ko_goleador
FROM usuarios
WHERE id = $1`;

export interface VerAwardsKODeUsuarioArgs {
    id: string;
}

export interface VerAwardsKODeUsuarioRow {
    awardKoFinalista1: number | null;
    awardKoFinalista2: number | null;
    awardKoCampeon: number | null;
    awardKoMejorPartidoEquipo1: number | null;
    awardKoMejorPartidoEquipo2: number | null;
    awardKoMejorPartidoMasGoles: number | null;
    awardKoNumSuplementarios: number | null;
    awardKoGoleador: number | null;
}

export async function verAwardsKODeUsuario(client: Client, args: VerAwardsKODeUsuarioArgs): Promise<VerAwardsKODeUsuarioRow | null> {
    const result = await client.query({
        text: verAwardsKODeUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        awardKoFinalista1: row[0],
        awardKoFinalista2: row[1],
        awardKoCampeon: row[2],
        awardKoMejorPartidoEquipo1: row[3],
        awardKoMejorPartidoEquipo2: row[4],
        awardKoMejorPartidoMasGoles: row[5],
        awardKoNumSuplementarios: row[6],
        awardKoGoleador: row[7]
    };
}

export const listUsuariosConAwardsKOQuery = `-- name: ListUsuariosConAwardsKO :many
SELECT
    id,
    username,
    puntos,
    award_ko_finalista1,
    award_ko_finalista2,
    award_ko_campeon,
    award_ko_mejor_partido_equipo1,
    award_ko_mejor_partido_equipo2,
    award_ko_mejor_partido_mas_goles,
    award_ko_num_suplementarios,
    award_ko_goleador
FROM usuarios
WHERE
    award_ko_finalista1 IS NOT NULL
    AND award_ko_finalista2 IS NOT NULL
    AND award_ko_campeon IS NOT NULL
    AND award_ko_mejor_partido_equipo1 IS NOT NULL
    AND award_ko_mejor_partido_equipo2 IS NOT NULL
    AND award_ko_num_suplementarios IS NOT NULL
    AND award_ko_goleador IS NOT NULL`;

export interface ListUsuariosConAwardsKORow {
    id: string;
    username: string;
    puntos: number;
    awardKoFinalista1: number | null;
    awardKoFinalista2: number | null;
    awardKoCampeon: number | null;
    awardKoMejorPartidoEquipo1: number | null;
    awardKoMejorPartidoEquipo2: number | null;
    awardKoMejorPartidoMasGoles: number | null;
    awardKoNumSuplementarios: number | null;
    awardKoGoleador: number | null;
}

export async function listUsuariosConAwardsKO(client: Client): Promise<ListUsuariosConAwardsKORow[]> {
    const result = await client.query({
        text: listUsuariosConAwardsKOQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            puntos: row[2],
            awardKoFinalista1: row[3],
            awardKoFinalista2: row[4],
            awardKoCampeon: row[5],
            awardKoMejorPartidoEquipo1: row[6],
            awardKoMejorPartidoEquipo2: row[7],
            awardKoMejorPartidoMasGoles: row[8],
            awardKoNumSuplementarios: row[9],
            awardKoGoleador: row[10]
        };
    });
}

export const verPrediccionesAwardsKOQuery = `-- name: VerPrediccionesAwardsKO :many
SELECT
    u.id AS usuario_id,
    ef1.nombre AS finalista1_nombre,
    ef1.bandera AS finalista1_bandera,
    ef2.nombre AS finalista2_nombre,
    ef2.bandera AS finalista2_bandera,
    ec.nombre AS campeon_nombre,
    ec.bandera AS campeon_bandera,
    emp1.nombre AS mejor_partido_equipo1_nombre,
    emp1.bandera AS mejor_partido_equipo1_bandera,
    emp2.nombre AS mejor_partido_equipo2_nombre,
    emp2.bandera AS mejor_partido_equipo2_bandera,
    emg.nombre AS mejor_partido_mas_goles_nombre,
    emg.bandera AS mejor_partido_mas_goles_bandera,
    u.award_ko_num_suplementarios,
    jg.nombre AS goleador_ko_nombre,
    jg.equipo_id AS goleador_ko_equipo_id
FROM usuarios u
JOIN estatico_equipos ef1 ON ef1.id = u.award_ko_finalista1
JOIN estatico_equipos ef2 ON ef2.id = u.award_ko_finalista2
JOIN estatico_equipos ec ON ec.id = u.award_ko_campeon
JOIN estatico_equipos emp1 ON emp1.id = u.award_ko_mejor_partido_equipo1
JOIN estatico_equipos emp2 ON emp2.id = u.award_ko_mejor_partido_equipo2
LEFT JOIN estatico_equipos emg ON emg.id = u.award_ko_mejor_partido_mas_goles
JOIN estatico_jugadores jg ON jg.id = u.award_ko_goleador
WHERE u.participante = TRUE AND u.award_ko_finalista1 IS NOT NULL`;

export interface VerPrediccionesAwardsKORow {
    usuarioId: string;
    finalista1Nombre: string;
    finalista1Bandera: string;
    finalista2Nombre: string;
    finalista2Bandera: string;
    campeonNombre: string;
    campeonBandera: string;
    mejorPartidoEquipo1Nombre: string;
    mejorPartidoEquipo1Bandera: string;
    mejorPartidoEquipo2Nombre: string;
    mejorPartidoEquipo2Bandera: string;
    mejorPartidoMasGolesNombre: string | null;
    mejorPartidoMasGolesBandera: string | null;
    awardKoNumSuplementarios: number | null;
    goleadorKoNombre: string;
    goleadorKoEquipoId: number;
}

export async function verPrediccionesAwardsKO(client: Client): Promise<VerPrediccionesAwardsKORow[]> {
    const result = await client.query({
        text: verPrediccionesAwardsKOQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            finalista1Nombre: row[1],
            finalista1Bandera: row[2],
            finalista2Nombre: row[3],
            finalista2Bandera: row[4],
            campeonNombre: row[5],
            campeonBandera: row[6],
            mejorPartidoEquipo1Nombre: row[7],
            mejorPartidoEquipo1Bandera: row[8],
            mejorPartidoEquipo2Nombre: row[9],
            mejorPartidoEquipo2Bandera: row[10],
            mejorPartidoMasGolesNombre: row[11],
            mejorPartidoMasGolesBandera: row[12],
            awardKoNumSuplementarios: row[13],
            goleadorKoNombre: row[14],
            goleadorKoEquipoId: row[15]
        };
    });
}

export const verEquiposNoEliminadosQuery = `-- name: VerEquiposNoEliminados :many
SELECT id, nombre, siglas, bandera
FROM estatico_equipos
WHERE eliminado = FALSE
ORDER BY nombre ASC`;

export interface VerEquiposNoEliminadosRow {
    id: number;
    nombre: string;
    siglas: string;
    bandera: string;
}

export async function verEquiposNoEliminados(client: Client): Promise<VerEquiposNoEliminadosRow[]> {
    const result = await client.query({
        text: verEquiposNoEliminadosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            siglas: row[2],
            bandera: row[3]
        };
    });
}

export const buscarJugadoresNoEliminadosQuery = `-- name: BuscarJugadoresNoEliminados :many
SELECT
    j.id,
    j.nombre,
    j.posicion,
    e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE e.eliminado = FALSE AND j.nombre ILIKE $1
ORDER BY j.nombre ASC
LIMIT 25`;

export interface BuscarJugadoresNoEliminadosArgs {
    query: string;
}

export interface BuscarJugadoresNoEliminadosRow {
    id: number;
    nombre: string;
    posicion: string;
    equipoNombre: string;
}

export async function buscarJugadoresNoEliminados(client: Client, args: BuscarJugadoresNoEliminadosArgs): Promise<BuscarJugadoresNoEliminadosRow[]> {
    const result = await client.query({
        text: buscarJugadoresNoEliminadosQuery,
        values: [args.query],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            posicion: row[2],
            equipoNombre: row[3]
        };
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

