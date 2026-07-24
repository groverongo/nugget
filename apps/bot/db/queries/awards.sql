-- name: GuardarAwards :exec
UPDATE usuarios SET
    award_campeon = sqlc.narg(award_campeon),
    award_goleador = sqlc.narg(award_goleador),
    award_mejor_jugador = sqlc.narg(award_mejor_jugador),
    award_mejor_arquero = sqlc.narg(award_mejor_arquero),
    award_mejor_jugador_joven = sqlc.narg(award_mejor_jugador_joven),
    award_mejor_gol = sqlc.narg(award_mejor_gol),
    award_seleccion_decepcion = sqlc.narg(award_seleccion_decepcion),
    award_seleccion_sorpresa = sqlc.narg(award_seleccion_sorpresa)
WHERE id = sqlc.arg(id);

-- name: VerAwardsDeUsuario :one
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
WHERE id = sqlc.arg(id);

-- name: ListUsuariosConCamposAwards :many
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
WHERE participante = TRUE;

-- name: SumarPuntosAward :one
UPDATE usuarios SET
    puntos = puntos + sqlc.arg(puntos)
WHERE id = sqlc.arg(id)
RETURNING puntos;

-- name: VerAwardsResultados :one
SELECT * FROM awards_resultados WHERE id = 1;

-- name: GuardarResultadoCampeon :exec
UPDATE awards_resultados SET resultado_campeon = sqlc.arg(resultado_campeon) WHERE id = 1;

-- name: GuardarResultadoGoleador :exec
UPDATE awards_resultados SET resultado_goleador = sqlc.arg(resultado_goleador) WHERE id = 1;

-- name: GuardarResultadoMejorJugador :exec
UPDATE awards_resultados SET resultado_mejor_jugador = sqlc.arg(resultado_mejor_jugador) WHERE id = 1;

-- name: GuardarResultadoMejorArquero :exec
UPDATE awards_resultados SET resultado_mejor_arquero = sqlc.arg(resultado_mejor_arquero) WHERE id = 1;

-- name: GuardarResultadoMejorJugadorJoven :exec
UPDATE awards_resultados SET resultado_mejor_jugador_joven = sqlc.arg(resultado_mejor_jugador_joven) WHERE id = 1;

-- name: GuardarResultadoMejorGol :exec
UPDATE awards_resultados SET
    resultado_mejor_gol = sqlc.arg(resultado_mejor_gol),
    resultado_mejor_gol_posicion = sqlc.arg(resultado_mejor_gol_posicion)
WHERE id = 1;

-- name: GuardarResultadoSeleccionDecepcion :exec
UPDATE awards_resultados SET resultado_seleccion_decepcion = sqlc.arg(resultado_seleccion_decepcion) WHERE id = 1;

-- name: GuardarResultadoSeleccionSorpresa :exec
UPDATE awards_resultados SET resultado_seleccion_sorpresa = sqlc.arg(resultado_seleccion_sorpresa) WHERE id = 1;

-- name: GuardarResultadoKoFinalistas :exec
UPDATE awards_resultados SET
    resultado_ko_finalista1 = sqlc.arg(resultado_ko_finalista1),
    resultado_ko_finalista2 = sqlc.arg(resultado_ko_finalista2),
    resultado_ko_campeon = sqlc.arg(resultado_ko_campeon)
WHERE id = 1;

-- name: GuardarResultadoKoMejorPartido :exec
UPDATE awards_resultados SET
    resultado_ko_mejor_partido_equipo1 = sqlc.arg(resultado_ko_mejor_partido_equipo1),
    resultado_ko_mejor_partido_equipo2 = sqlc.arg(resultado_ko_mejor_partido_equipo2),
    resultado_ko_mejor_partido_mas_goles = sqlc.narg(resultado_ko_mejor_partido_mas_goles)
WHERE id = 1;

-- name: GuardarResultadoKoNumSuplementarios :exec
UPDATE awards_resultados SET resultado_ko_num_suplementarios = sqlc.arg(resultado_ko_num_suplementarios) WHERE id = 1;

-- name: GuardarResultadoKoGoleador :exec
UPDATE awards_resultados SET resultado_ko_goleador = sqlc.arg(resultado_ko_goleador) WHERE id = 1;

-- name: GuardarAwardsKO :exec
UPDATE usuarios SET
    award_ko_finalista1 = sqlc.narg(award_ko_finalista1),
    award_ko_finalista2 = sqlc.narg(award_ko_finalista2),
    award_ko_campeon = sqlc.narg(award_ko_campeon),
    award_ko_mejor_partido_equipo1 = sqlc.narg(award_ko_mejor_partido_equipo1),
    award_ko_mejor_partido_equipo2 = sqlc.narg(award_ko_mejor_partido_equipo2),
    award_ko_mejor_partido_mas_goles = sqlc.narg(award_ko_mejor_partido_mas_goles),
    award_ko_num_suplementarios = sqlc.narg(award_ko_num_suplementarios),
    award_ko_goleador = sqlc.narg(award_ko_goleador)
WHERE id = sqlc.arg(id);

-- name: VerAwardsKODeUsuario :one
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
WHERE id = sqlc.arg(id);

-- name: ListUsuariosConCamposAwardsKO :many
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
WHERE participante = TRUE;

-- name: VerPrediccionesAwardsKO :many
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
WHERE u.participante = TRUE AND u.award_ko_finalista1 IS NOT NULL;

-- name: VerEquiposNoEliminados :many
SELECT id, nombre, siglas, bandera
FROM estatico_equipos
WHERE eliminado = FALSE
ORDER BY nombre ASC;

-- name: BuscarJugadoresNoEliminados :many
SELECT
    j.id,
    j.nombre,
    j.posicion,
    e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE e.eliminado = FALSE AND j.nombre ILIKE sqlc.arg(query)
ORDER BY j.nombre ASC
LIMIT 25;

-- name: VerPrediccionesAwards :many
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
WHERE u.participante = TRUE AND u.award_campeon IS NOT NULL;
