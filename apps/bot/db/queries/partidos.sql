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
	partidos.fecha_partido,
	partidos.extra_partidazo,
	partidos.extra_milagro,
	partidos.extra_batacazo,
	partidos.extra_el_elegido,
	partidos.partido_original_id,
	f.nombre AS fase_nombre
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
JOIN estatico_fases f ON f.id = partidos.fase_id
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1)
ORDER BY partidos.fecha_partido ASC;

-- name: ObtenerPartido :one
SELECT id, fecha_partido, estado, partido_original_id, goles_minimos_local, goles_minimos_visitante
FROM partidos
WHERE id = $1;

-- name: VerInformacionPartido :one
SELECT
	partidos.id AS partido_id,
	partidos.equipo_local_id,
	partidos.equipo_visitante_id,
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
	partidos.fecha_partido,
	partidos.extra_partidazo,
	partidos.extra_milagro,
	partidos.extra_batacazo,
	partidos.extra_el_elegido,
	partidos.partido_original_id,
	partidos.goles_minimos_local,
	partidos.goles_minimos_visitante
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
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    p.partido_original_id,
    p.goles_minimos_local,
    p.goles_minimos_visitante
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

-- name: MarcarResumenDiaEnviado :exec
INSERT INTO resumen_dia (fecha) VALUES ($1) ON CONFLICT DO NOTHING;

-- name: VerResumenDiaEnviado :one
SELECT EXISTS(SELECT 1 FROM resumen_dia WHERE fecha = $1)::BOOLEAN AS enviado;

-- name: VerPartidosNoFinalizados :many
SELECT
    partidos.id AS partido_id,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera,
    partidos.estado,
    partidos.fecha_partido,
    partidos.partido_original_id
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE partidos.estado != 'finalizado'
ORDER BY partidos.fecha_partido ASC;

-- name: AgregarPartido :exec
INSERT INTO partidos (fase_id, equipo_local_id, equipo_visitante_id, fecha_partido)
VALUES ($1, sqlc.arg('equipo_local_id')::INTEGER, sqlc.arg('equipo_visitante_id')::INTEGER, $2);

-- name: EquipoJugoPartidoPorFase :one
SELECT COUNT(1)::INTEGER AS COUNT
FROM partidos
WHERE fase_id = $1 AND (equipo_local_id = sqlc.arg('equipo_id')::INTEGER OR equipo_visitante_id = sqlc.arg('equipo_id')::INTEGER);

-- name: CrearPartidoSuplementario :one
INSERT INTO partidos (fase_id, equipo_local_id, equipo_visitante_id, fecha_partido, partido_original_id, goles_minimos_local, goles_minimos_visitante)
VALUES (
    sqlc.arg('fase_id')::INTEGER,
    sqlc.arg('equipo_local_id')::INTEGER,
    sqlc.arg('equipo_visitante_id')::INTEGER,
    NOW(),
    sqlc.arg('partido_original_id')::INTEGER,
    sqlc.arg('goles_minimos_local')::INTEGER,
    sqlc.arg('goles_minimos_visitante')::INTEGER
)
RETURNING id;

-- name: VerPartidoSuplePorOriginal :one
SELECT id FROM partidos WHERE partido_original_id = $1;

-- name: ActualizarPartidoSuplementario :exec
UPDATE partidos SET estado = 'suplementario' WHERE id = $1;

-- name: ActualizarPartidoPenales :exec
UPDATE partidos SET estado = 'penales' WHERE id = $1;