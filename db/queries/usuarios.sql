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

-- name: LimpiezaDistribucionPremios :exec
DELETE FROM estatico_premios;

-- name: AgregarPuestoPremio :exec
INSERT INTO estatico_premios (puesto, premio)
VALUES ($1, $2);