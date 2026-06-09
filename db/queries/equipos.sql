-- name: VerEquipos :many
SELECT id, nombre
FROM estatico_equipos
WHERE (sqlc.narg('blanco')::boolean IS NULL OR blanco = sqlc.narg('blanco')::boolean)
	AND (sqlc.narg('negro')::boolean IS NULL OR negro = sqlc.narg('negro')::boolean)
ORDER BY nombre ASC, id ASC;
