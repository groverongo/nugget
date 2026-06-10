-- name: VerJugadoresPorEquipo :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.equipo_id = sqlc.arg(equipo_id)
ORDER BY j.posicion, j.nombre ASC;

-- name: BuscarJugadores :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.nombre ILIKE '%' || sqlc.arg(query) || '%'
ORDER BY e.nombre, j.nombre ASC
LIMIT 25;

-- name: VerJugadoresPorIds :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.id = ANY(sqlc.arg(ids)::int[])
ORDER BY j.nombre ASC;
