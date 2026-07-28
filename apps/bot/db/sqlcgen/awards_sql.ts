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

export const listUsuariosConCamposAwardsQuery = `-- name: ListUsuariosConCamposAwards :many
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
WHERE participante = TRUE`;

export interface ListUsuariosConCamposAwardsRow {
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

export async function listUsuariosConCamposAwards(client: Client): Promise<ListUsuariosConCamposAwardsRow[]> {
    const result = await client.query({
        text: listUsuariosConCamposAwardsQuery,
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

export const sumarPuntosAwardQuery = `-- name: SumarPuntosAward :one
UPDATE usuarios SET
    puntos = puntos + $1
WHERE id = $2
RETURNING puntos`;

export interface SumarPuntosAwardArgs {
    puntos: number;
    id: string;
}

export interface SumarPuntosAwardRow {
    puntos: number;
}

export async function sumarPuntosAward(client: Client, args: SumarPuntosAwardArgs): Promise<SumarPuntosAwardRow | null> {
    const result = await client.query({
        text: sumarPuntosAwardQuery,
        values: [args.puntos, args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        puntos: row[0]
    };
}

export const verAwardsResultadosQuery = `-- name: VerAwardsResultados :one
SELECT id, resultado_campeon, resultado_goleador, resultado_mejor_jugador, resultado_mejor_arquero, resultado_mejor_jugador_joven, resultado_seleccion_decepcion, resultado_seleccion_sorpresa, resultado_ko_campeon, resultado_ko_finalista1, resultado_ko_finalista2, resultado_ko_mejor_partido_equipo1, resultado_ko_mejor_partido_equipo2, resultado_ko_mejor_partido_mas_goles, resultado_ko_num_suplementarios, resultado_ko_goleador, mejor_gol_cerrado_en FROM awards_resultados WHERE id = 1`;

export interface VerAwardsResultadosRow {
    id: number;
    resultadoCampeon: number | null;
    resultadoGoleador: number | null;
    resultadoMejorJugador: number | null;
    resultadoMejorArquero: number | null;
    resultadoMejorJugadorJoven: number | null;
    resultadoSeleccionDecepcion: number | null;
    resultadoSeleccionSorpresa: number | null;
    resultadoKoCampeon: number | null;
    resultadoKoFinalista1: number | null;
    resultadoKoFinalista2: number | null;
    resultadoKoMejorPartidoEquipo1: number | null;
    resultadoKoMejorPartidoEquipo2: number | null;
    resultadoKoMejorPartidoMasGoles: number | null;
    resultadoKoNumSuplementarios: number | null;
    resultadoKoGoleador: number | null;
    mejorGolCerradoEn: Date | null;
}

export async function verAwardsResultados(client: Client): Promise<VerAwardsResultadosRow | null> {
    const result = await client.query({
        text: verAwardsResultadosQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        resultadoCampeon: row[1],
        resultadoGoleador: row[2],
        resultadoMejorJugador: row[3],
        resultadoMejorArquero: row[4],
        resultadoMejorJugadorJoven: row[5],
        resultadoSeleccionDecepcion: row[6],
        resultadoSeleccionSorpresa: row[7],
        resultadoKoCampeon: row[8],
        resultadoKoFinalista1: row[9],
        resultadoKoFinalista2: row[10],
        resultadoKoMejorPartidoEquipo1: row[11],
        resultadoKoMejorPartidoEquipo2: row[12],
        resultadoKoMejorPartidoMasGoles: row[13],
        resultadoKoNumSuplementarios: row[14],
        resultadoKoGoleador: row[15],
        mejorGolCerradoEn: row[16]
    };
}

export const cerrarMejorGolQuery = `-- name: CerrarMejorGol :exec
UPDATE awards_resultados SET mejor_gol_cerrado_en = NOW() WHERE id = 1`;

export async function cerrarMejorGol(client: Client): Promise<void> {
    await client.query({
        text: cerrarMejorGolQuery,
        values: [],
        rowMode: "array"
    });
}

export const guardarResultadoCampeonQuery = `-- name: GuardarResultadoCampeon :exec
UPDATE awards_resultados SET resultado_campeon = $1 WHERE id = 1`;

export interface GuardarResultadoCampeonArgs {
    resultadoCampeon: number | null;
}

export async function guardarResultadoCampeon(client: Client, args: GuardarResultadoCampeonArgs): Promise<void> {
    await client.query({
        text: guardarResultadoCampeonQuery,
        values: [args.resultadoCampeon],
        rowMode: "array"
    });
}

export const guardarResultadoGoleadorQuery = `-- name: GuardarResultadoGoleador :exec
UPDATE awards_resultados SET resultado_goleador = $1 WHERE id = 1`;

export interface GuardarResultadoGoleadorArgs {
    resultadoGoleador: number | null;
}

export async function guardarResultadoGoleador(client: Client, args: GuardarResultadoGoleadorArgs): Promise<void> {
    await client.query({
        text: guardarResultadoGoleadorQuery,
        values: [args.resultadoGoleador],
        rowMode: "array"
    });
}

export const guardarResultadoMejorJugadorQuery = `-- name: GuardarResultadoMejorJugador :exec
UPDATE awards_resultados SET resultado_mejor_jugador = $1 WHERE id = 1`;

export interface GuardarResultadoMejorJugadorArgs {
    resultadoMejorJugador: number | null;
}

export async function guardarResultadoMejorJugador(client: Client, args: GuardarResultadoMejorJugadorArgs): Promise<void> {
    await client.query({
        text: guardarResultadoMejorJugadorQuery,
        values: [args.resultadoMejorJugador],
        rowMode: "array"
    });
}

export const guardarResultadoMejorArqueroQuery = `-- name: GuardarResultadoMejorArquero :exec
UPDATE awards_resultados SET resultado_mejor_arquero = $1 WHERE id = 1`;

export interface GuardarResultadoMejorArqueroArgs {
    resultadoMejorArquero: number | null;
}

export async function guardarResultadoMejorArquero(client: Client, args: GuardarResultadoMejorArqueroArgs): Promise<void> {
    await client.query({
        text: guardarResultadoMejorArqueroQuery,
        values: [args.resultadoMejorArquero],
        rowMode: "array"
    });
}

export const guardarResultadoMejorJugadorJovenQuery = `-- name: GuardarResultadoMejorJugadorJoven :exec
UPDATE awards_resultados SET resultado_mejor_jugador_joven = $1 WHERE id = 1`;

export interface GuardarResultadoMejorJugadorJovenArgs {
    resultadoMejorJugadorJoven: number | null;
}

export async function guardarResultadoMejorJugadorJoven(client: Client, args: GuardarResultadoMejorJugadorJovenArgs): Promise<void> {
    await client.query({
        text: guardarResultadoMejorJugadorJovenQuery,
        values: [args.resultadoMejorJugadorJoven],
        rowMode: "array"
    });
}

export const listMejorGolResueltosQuery = `-- name: ListMejorGolResueltos :many
SELECT jugador_id, posicion FROM awards_mejor_gol_resueltos ORDER BY posicion ASC`;

export interface ListMejorGolResueltosRow {
    jugadorId: number;
    posicion: number | null;
}

export async function listMejorGolResueltos(client: Client): Promise<ListMejorGolResueltosRow[]> {
    const result = await client.query({
        text: listMejorGolResueltosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            jugadorId: row[0],
            posicion: row[1]
        };
    });
}

export const guardarMejorGolResueltoQuery = `-- name: GuardarMejorGolResuelto :exec
INSERT INTO awards_mejor_gol_resueltos (jugador_id, posicion)
VALUES ($1, $2)`;

export interface GuardarMejorGolResueltoArgs {
    jugadorId: number;
    posicion: number | null;
}

export async function guardarMejorGolResuelto(client: Client, args: GuardarMejorGolResueltoArgs): Promise<void> {
    await client.query({
        text: guardarMejorGolResueltoQuery,
        values: [args.jugadorId, args.posicion],
        rowMode: "array"
    });
}

export const guardarResultadoSeleccionDecepcionQuery = `-- name: GuardarResultadoSeleccionDecepcion :exec
UPDATE awards_resultados SET resultado_seleccion_decepcion = $1 WHERE id = 1`;

export interface GuardarResultadoSeleccionDecepcionArgs {
    resultadoSeleccionDecepcion: number | null;
}

export async function guardarResultadoSeleccionDecepcion(client: Client, args: GuardarResultadoSeleccionDecepcionArgs): Promise<void> {
    await client.query({
        text: guardarResultadoSeleccionDecepcionQuery,
        values: [args.resultadoSeleccionDecepcion],
        rowMode: "array"
    });
}

export const guardarResultadoSeleccionSorpresaQuery = `-- name: GuardarResultadoSeleccionSorpresa :exec
UPDATE awards_resultados SET resultado_seleccion_sorpresa = $1 WHERE id = 1`;

export interface GuardarResultadoSeleccionSorpresaArgs {
    resultadoSeleccionSorpresa: number | null;
}

export async function guardarResultadoSeleccionSorpresa(client: Client, args: GuardarResultadoSeleccionSorpresaArgs): Promise<void> {
    await client.query({
        text: guardarResultadoSeleccionSorpresaQuery,
        values: [args.resultadoSeleccionSorpresa],
        rowMode: "array"
    });
}

export const guardarResultadoKoFinalistasQuery = `-- name: GuardarResultadoKoFinalistas :exec
UPDATE awards_resultados SET
    resultado_ko_finalista1 = $1,
    resultado_ko_finalista2 = $2,
    resultado_ko_campeon = $3
WHERE id = 1`;

export interface GuardarResultadoKoFinalistasArgs {
    resultadoKoFinalista1: number | null;
    resultadoKoFinalista2: number | null;
    resultadoKoCampeon: number | null;
}

export async function guardarResultadoKoFinalistas(client: Client, args: GuardarResultadoKoFinalistasArgs): Promise<void> {
    await client.query({
        text: guardarResultadoKoFinalistasQuery,
        values: [args.resultadoKoFinalista1, args.resultadoKoFinalista2, args.resultadoKoCampeon],
        rowMode: "array"
    });
}

export const guardarResultadoKoMejorPartidoQuery = `-- name: GuardarResultadoKoMejorPartido :exec
UPDATE awards_resultados SET
    resultado_ko_mejor_partido_equipo1 = $1,
    resultado_ko_mejor_partido_equipo2 = $2,
    resultado_ko_mejor_partido_mas_goles = $3
WHERE id = 1`;

export interface GuardarResultadoKoMejorPartidoArgs {
    resultadoKoMejorPartidoEquipo1: number | null;
    resultadoKoMejorPartidoEquipo2: number | null;
    resultadoKoMejorPartidoMasGoles: number | null;
}

export async function guardarResultadoKoMejorPartido(client: Client, args: GuardarResultadoKoMejorPartidoArgs): Promise<void> {
    await client.query({
        text: guardarResultadoKoMejorPartidoQuery,
        values: [args.resultadoKoMejorPartidoEquipo1, args.resultadoKoMejorPartidoEquipo2, args.resultadoKoMejorPartidoMasGoles],
        rowMode: "array"
    });
}

export const guardarResultadoKoNumSuplementariosQuery = `-- name: GuardarResultadoKoNumSuplementarios :exec
UPDATE awards_resultados SET resultado_ko_num_suplementarios = $1 WHERE id = 1`;

export interface GuardarResultadoKoNumSuplementariosArgs {
    resultadoKoNumSuplementarios: number | null;
}

export async function guardarResultadoKoNumSuplementarios(client: Client, args: GuardarResultadoKoNumSuplementariosArgs): Promise<void> {
    await client.query({
        text: guardarResultadoKoNumSuplementariosQuery,
        values: [args.resultadoKoNumSuplementarios],
        rowMode: "array"
    });
}

export const guardarResultadoKoGoleadorQuery = `-- name: GuardarResultadoKoGoleador :exec
UPDATE awards_resultados SET resultado_ko_goleador = $1 WHERE id = 1`;

export interface GuardarResultadoKoGoleadorArgs {
    resultadoKoGoleador: number | null;
}

export async function guardarResultadoKoGoleador(client: Client, args: GuardarResultadoKoGoleadorArgs): Promise<void> {
    await client.query({
        text: guardarResultadoKoGoleadorQuery,
        values: [args.resultadoKoGoleador],
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

export const listUsuariosConCamposAwardsKOQuery = `-- name: ListUsuariosConCamposAwardsKO :many
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
WHERE participante = TRUE`;

export interface ListUsuariosConCamposAwardsKORow {
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

export async function listUsuariosConCamposAwardsKO(client: Client): Promise<ListUsuariosConCamposAwardsKORow[]> {
    const result = await client.query({
        text: listUsuariosConCamposAwardsKOQuery,
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

