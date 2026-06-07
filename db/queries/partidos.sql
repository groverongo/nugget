-- name: VerPartidosPorFecha :many
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.grupo AS equipo_local_grupo,
	ev.grupo AS equipo_visitante_grupo,
	partidos.estado,
	partidos.goles_local AS partido_goles_local,
	partidos.goles_visitante AS partido_goles_visitante,
	partidos.fecha_partido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1);

-- name: ObtenerPartido :one
SELECT id, fecha_partido
FROM partidos
WHERE id = $1;

-- name: VerFechasDePartidos :many
SELECT DISTINCT DATE(fecha_partido)::TEXT AS fecha
FROM partidos
ORDER BY fecha ASC;