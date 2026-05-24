-- name: ListUsuarios :one
SELECT * FROM usuarios;

-- name: CreateUsuario :one
INSERT INTO usuarios (id_usuario, username)
VALUES (sqlc.arg(id_usuario), sqlc.arg(username))
RETURNING *;
