-- name: ListUsuarios :many
SELECT * FROM usuarios;

-- name: CreateUsuario :exec
INSERT INTO usuarios (id, username)
VALUES (sqlc.arg(id), sqlc.arg(username));

-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = $1
WHERE id = $2;

-- name: CountUsuarios :one
SELECT COUNT(*) FROM usuarios;

-- name: LimpiezaDistribucionPremios :exec
DELETE FROM estatico_premios;

-- name: AgregarPuestoPremio :exec
INSERT INTO estatico_premios (puesto, premio)
VALUES ($1, $2);