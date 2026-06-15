-- name: ListUsuarios :many
SELECT * FROM usuarios;

-- name: CreateUsuario :exec
INSERT INTO usuarios (id, username)
VALUES (sqlc.arg(id), sqlc.arg(username))
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

-- name: UpdateUsuarioPremio :exec
UPDATE usuarios SET
    premio_asociado = sqlc.narg(premio_asociado)
WHERE id = sqlc.arg(id);

-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = sqlc.arg(username)
WHERE id = sqlc.arg(id);

-- name: UpdateUsuarioParticipante :exec
UPDATE usuarios SET
    participante = sqlc.arg(participante)
WHERE id = sqlc.arg(id);

-- name: ActualizarStatsUsuario :exec
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
WHERE id = $1;

-- name: DeleteUsuario :exec
DELETE FROM usuarios
WHERE id = $1;

-- name: CountUsuarios :one
SELECT COUNT(*) FROM usuarios;

-- name: CountParticipantes :one
SELECT COUNT(*) FROM usuarios WHERE participante = TRUE;

-- name: LimpiezaDistribucionPremios :exec
DELETE FROM estatico_premios;

-- name: AgregarPuestoPremio :exec
INSERT INTO estatico_premios (puesto, premio)
VALUES ($1, $2);

-- name: ObtenerPuntosUsuario :one
SELECT id, puntos FROM usuarios WHERE id = $1;

-- name: AjustarPuntosTimba :exec
UPDATE usuarios SET puntos = puntos + $2 WHERE id = $1;

-- name: VerGanadoresMayorWinRate :many
SELECT id, username, win_rate::NUMERIC AS win_rate
FROM usuarios
WHERE participante = TRUE
  AND win_rate = (SELECT MAX(win_rate) FROM usuarios WHERE participante = TRUE AND win_rate > 0);

-- name: VerGanadoresRachaMaxima :many
SELECT id, username, racha_maxima
FROM usuarios
WHERE participante = TRUE
  AND racha_maxima = (SELECT MAX(racha_maxima) FROM usuarios WHERE participante = TRUE AND racha_maxima > 0);