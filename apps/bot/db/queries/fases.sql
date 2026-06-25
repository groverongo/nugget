-- name: VerFases :many
SELECT id, nombre, puntos_base, puntos_buen_intento
FROM estatico_fases
ORDER BY id ASC;
