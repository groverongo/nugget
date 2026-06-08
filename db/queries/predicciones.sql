-- name: AgregarPrediccion :exec
INSERT INTO prediccion (usuario_id, partido_id, goles_local, goles_visitante)
VALUES ($1, $2, $3, $4);

-- name: ActualizarPrediccion :exec
UPDATE prediccion SET
goles_local = $1,
goles_visitante = $2,
actualizado_en = NOW()
WHERE usuario_id = $3 AND partido_id = $4;

-- name: VerPrediccionPorUsuarioYPartido :one
SELECT usuario_id, partido_id
FROM prediccion
WHERE usuario_id = $1 AND partido_id = $2;

-- name: VerPrediccionesPorPartido :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
WHERE prediccion.partido_id = $1;

-- name: VerPrediccionesPorFecha :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
WHERE DATE(partidos.fecha_partido) = DATE($1);

-- name: VerPredicciones :many
SELECT 
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    partidos.equipo_local_id,
    partidos.equipo_visitante_id,
    partidos.fecha_partido,
    partidos.goles_local AS partido_goles_local,
    partidos.goles_visitante AS partido_goles_visitante,
    partidos.estado,
    el.nombre AS equipo_local_nombre,
    el.puntos_fifa AS equipo_local_puntos_fifa,
    el.grupo AS equipo_local_grupo,
    ev.nombre AS equipo_visitante_nombre,
    ev.puntos_fifa AS equipo_visitante_puntos_fifa,
    ev.grupo AS equipo_visitante_grupo
FROM prediccion
JOIN usuarios ON usuarios.id = prediccion.usuario_id
JOIN partidos ON partidos.id = prediccion.partido_id
JOIN estatico_equipos el on el.id = partidos.equipo_local_id
JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id;

-- name: VerMisPredicciones :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante
    FROM prediccion
    WHERE usuario_id = $1
) pe 
INNER JOIN (
    SELECT partidos.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM partidos 
    JOIN estatico_equipos el on el.id = partidos.equipo_local_id
    JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id;

-- name: VerMisPrediccionesPorFecha :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante
    FROM prediccion
    WHERE usuario_id = $1
) pe 
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM (
        SELECT id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, estado
        FROM partidos
        WHERE DATE(fecha_partido) = DATE($2)
    ) pa 
    JOIN estatico_equipos el on el.id = partidos.equipo_local_id
    JOIN estatico_equipos ev on ev.id = partidos.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id;
