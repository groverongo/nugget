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

-- name: ListUsuariosConAwards :many
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
    AND award_seleccion_sorpresa IS NOT NULL;

-- name: SumarPuntosAward :exec
UPDATE usuarios SET
    puntos = puntos + sqlc.arg(puntos)
WHERE id = sqlc.arg(id);

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
