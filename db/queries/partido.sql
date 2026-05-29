-- name: ObtenerPartido :one
SELECT id, fecha_partido
FROM partidos
WHERE id = $1;
