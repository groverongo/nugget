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
