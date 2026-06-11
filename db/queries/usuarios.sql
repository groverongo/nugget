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