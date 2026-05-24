-- name: ListUsuarios :many
SELECT * FROM usuarios;

-- name: CreateUsuario :one
INSERT INTO usuarios (id, username)
VALUES (sqlc.arg(id), sqlc.arg(username))
RETURNING *;

-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = $1
WHERE id = $2;