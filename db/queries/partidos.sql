-- name: VerPartidosPorFecha :many
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.siglas AS equipo_local_siglas,
	ev.siglas AS equipo_visitante_siglas,
	el.bandera AS equipo_local_bandera,
	ev.bandera AS equipo_visitante_bandera,
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

-- name: VerInformacionPartido :one
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.bandera AS equipo_local_bandera,
	ev.bandera AS equipo_visitante_bandera,
	el.grupo AS equipo_local_grupo,
	ev.grupo AS equipo_visitante_grupo,
	partidos.estado,
	partidos.goles_local AS partido_goles_local,
	partidos.goles_visitante AS partido_goles_visitante,
	partidos.fecha_partido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.id = $1;

-- name: VerFechasDePartidos :many
SELECT DISTINCT DATE(fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM partidos
ORDER BY fecha ASC;

-- name: VerPartidoParaCalculo :one
SELECT
    p.id AS partido_id,
    p.fase_id,
    f.nombre AS fase_nombre,
    f.puntos_base,
    f.puntos_buen_intento,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa
FROM partidos p
JOIN estatico_fases f ON f.id = p.fase_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE p.id = $1;

-- name: ActualizarPartidoFinalizado :exec
UPDATE partidos SET
    goles_local = $1,
    goles_visitante = $2,
    extra_milagro = $3,
    extra_partidazo = $4,
    extra_batacazo = $5,
    extra_el_elegido = $6,
    estado = 'finalizado'
WHERE id = $7;

-- name: ActualizarPartidoMedioTiempo :exec
UPDATE partidos SET
    goles_local = $1,
    goles_visitante = $2,
    estado = 'medio_tiempo'
WHERE id = $3;

-- name: ActualizarPartidoEnVivo :exec
UPDATE partidos SET estado = 'en_vivo' WHERE id = $1;

-- name: ActualizarGolesPartido :exec
UPDATE partidos SET goles_local = $1, goles_visitante = $2 WHERE id = $3;

-- name: VerPartidosNoFinalizados :many
SELECT
    partidos.id AS partido_id,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre,
    partidos.estado,
    partidos.fecha_partido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.estado != 'finalizado'
ORDER BY partidos.fecha_partido ASC;
