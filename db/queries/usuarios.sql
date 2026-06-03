-- name: ListUsuarios :many
SELECT * FROM usuarios;

-- name: CreateUsuario :exec
INSERT INTO usuarios (
    id,
    username,
    partidos_apostados,
    partidos_ganados,
    partidos_perdidos,
    puntos,
    racha,
    win_rate
)
VALUES (
    sqlc.arg(id),
    sqlc.arg(username),
    sqlc.arg(partidos_apostados),
    sqlc.arg(partidos_ganados),
    sqlc.arg(partidos_perdidos),
    sqlc.arg(puntos),
    sqlc.arg(racha),
    sqlc.arg(win_rate)
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

-- name: UpdateUsuarioPremio :exec
UPDATE usuarios SET
    premio_asociado = sqlc.arg(premio_asociado)
WHERE id = sqlc.arg(id);

-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = sqlc.arg(username)
WHERE id = sqlc.arg(id);

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