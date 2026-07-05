-- name: AgregarPrediccion :exec
INSERT INTO prediccion (usuario_id, partido_id, goles_local, goles_visitante, penales_ganador_id)
VALUES ($1, $2, $3, $4, $5);

-- name: MonitorearAntiguaPrediccion :exec
INSERT INTO monitoreo_prediccion (usuario_id, partido_id, goles_local, goles_visitante)
VALUES ($1, $2, $3, $4);

-- name: ActualizarPrediccion :exec
UPDATE prediccion SET
goles_local = $1,
goles_visitante = $2,
penales_ganador_id = $3,
actualizado_en = NOW()
WHERE usuario_id = $4 AND partido_id = $5;

-- name: VerPrediccionPorUsuarioYPartido :one
SELECT usuario_id, partido_id, goles_local, goles_visitante, penales_ganador_id
FROM prediccion
WHERE usuario_id = $1 AND partido_id = $2;

-- name: VerPrediccionesPorPartido :many
SELECT
    prediccion.partido_id AS partido_id,
    prediccion.usuario_id AS usuario_id,
    usuarios.username AS username,
    prediccion.goles_local AS prediccion_goles_local,
    prediccion.goles_visitante AS prediccion_goles_visitante,
    prediccion.penales_ganador_id AS prediccion_penales_ganador_id,
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
WHERE prediccion.partido_id = $1 AND usuarios.participante = TRUE
ORDER BY (prediccion.goles_local + prediccion.goles_visitante) DESC, prediccion.goles_local DESC;

-- name: VerPuntajesPartido :many
SELECT
    p.usuario_id,
    u.username,
    p.resultado,
    p.puntos_base,
    p.puntos_en_racha,
    p.puntos_partidazo,
    p.puntos_milagro,
    p.puntos_batacazo,
    p.puntos_el_elegido,
    p.puntos_gran_final,
    p.puntos_total AS puntos_ganados,
    u.puntos AS puntos_acumulados
FROM prediccion p
JOIN usuarios u ON u.id = p.usuario_id
WHERE p.partido_id = $1 AND p.puntos_total > 0 AND u.participante = TRUE
ORDER BY p.puntos_total DESC, u.username;

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
WHERE DATE(partidos.fecha_partido - INTERVAL '5 hours') = DATE($1)
ORDER BY partidos.fecha_partido ASC;

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
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, estado, equipo_local_nombre, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_puntos_fifa, equipo_visitante_grupo, equipo_local_siglas, equipo_visitante_siglas, puntos_total, timba_delta, SUM(puntos_total + COALESCE(timba_delta, 0)) OVER (ORDER BY fecha_partido ROWS UNBOUNDED PRECEDING) AS puntos_acumulados_con_timba
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante, puntos_total
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, estado, el.nombre AS equipo_local_nombre, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo, el.siglas AS equipo_local_siglas, ev.siglas AS equipo_visitante_siglas
    FROM partidos pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id
LEFT JOIN (
    SELECT partido_id, COALESCE(SUM(
        CASE
            WHEN jugador_1_id = $1 AND ganador_id = jugador_1_id THEN puntos_arriesgados
            WHEN jugador_2_id = $1 AND ganador_id = jugador_2_id THEN puntos_propuestos
            WHEN jugador_1_id = $1 AND ganador_id = jugador_2_id THEN -puntos_propuestos
            WHEN jugador_2_id = $1 AND ganador_id = jugador_1_id THEN -puntos_arriesgados
            ELSE 0
        END
    ), 0) AS timba_delta
    FROM timba_time
    WHERE estado = 'resuelta' AND (jugador_1_id = $1 OR jugador_2_id = $1)
    GROUP BY partido_id
) timba_stats ON timba_stats.partido_id = pa_ex.partido_id
WHERE estado = 'finalizado'
ORDER BY fecha_partido ASC
LIMIT sqlc.arg('limit')::INTEGER OFFSET sqlc.arg('offset')::INTEGER;

-- name: ActualizarPuntajePrediccion :exec
UPDATE prediccion SET
    resultado = $1,
    puntos_base = $2,
    puntos_en_racha = $3,
    puntos_partidazo = $4,
    puntos_milagro = $5,
    puntos_batacazo = $6,
    puntos_el_elegido = $7,
    puntos_gran_final = $8,
    puntos_total = $9
WHERE usuario_id = $10 AND partido_id = $11;

-- name: VerResultadosRecientesUsuario :many
SELECT prediccion.resultado
FROM prediccion
JOIN partidos ON partidos.id = prediccion.partido_id
WHERE prediccion.usuario_id = $1
  AND prediccion.partido_id != $2
  AND partidos.estado = 'finalizado'
ORDER BY partidos.fecha_partido DESC
LIMIT 20;

-- name: VerFechasDePrediccionesPorUsuario :many
SELECT DISTINCT DATE(partidos.fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM prediccion
JOIN partidos ON partidos.id = prediccion.partido_id
WHERE prediccion.usuario_id = $1
ORDER BY fecha ASC;

-- name: VerParticipantesSinPrediccion :many
SELECT u.id, u.username
FROM usuarios u
WHERE u.participante = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM prediccion p
    WHERE p.usuario_id = u.id AND p.partido_id = $1
  )
ORDER BY u.username;

-- name: VerPrediccionesResumenPartido :many
SELECT
    pe.usuario_id,
    u.username,
    pe.goles_local AS prediccion_goles_local,
    pe.goles_visitante AS prediccion_goles_visitante,
    COALESCE(pe.puntos_base, 0)::INTEGER AS puntos_base,
    COALESCE(pe.puntos_en_racha, 0)::INTEGER AS puntos_en_racha,
    COALESCE(pe.puntos_total, 0)::INTEGER AS puntos_total,
    u.puntos AS puntos_acumulados
FROM prediccion pe
JOIN usuarios u ON u.id = pe.usuario_id
WHERE pe.partido_id = $1 AND u.participante = TRUE
ORDER BY COALESCE(pe.puntos_total, 0) DESC, u.username;

-- name: VerMisPrediccionesPorFecha :many
SELECT pe.partido_id AS partido_id, prediccion_goles_local, prediccion_goles_visitante, prediccion_penales_ganador_id, equipo_local_id, equipo_visitante_id, fecha_partido, partido_goles_local, partido_goles_visitante, partido_penales_ganador_id, partido_original_id, estado, equipo_local_nombre, equipo_local_bandera, equipo_local_siglas, equipo_local_puntos_fifa, equipo_local_grupo, equipo_visitante_nombre, equipo_visitante_bandera, equipo_visitante_siglas, equipo_visitante_puntos_fifa, equipo_visitante_grupo
FROM (
    SELECT partido_id, goles_local AS prediccion_goles_local, goles_visitante AS prediccion_goles_visitante, penales_ganador_id AS prediccion_penales_ganador_id
    FROM prediccion
    WHERE usuario_id = $1
) pe
INNER JOIN (
    SELECT pa.id AS partido_id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local AS partido_goles_local, goles_visitante AS partido_goles_visitante, penales_ganador_id AS partido_penales_ganador_id, partido_original_id, estado, el.nombre AS equipo_local_nombre, el.bandera AS equipo_local_bandera, el.siglas AS equipo_local_siglas, el.puntos_fifa AS equipo_local_puntos_fifa, el.grupo AS equipo_local_grupo, ev.nombre AS equipo_visitante_nombre, ev.bandera AS equipo_visitante_bandera, ev.siglas AS equipo_visitante_siglas, ev.puntos_fifa AS equipo_visitante_puntos_fifa, ev.grupo AS equipo_visitante_grupo
    FROM (
        SELECT id, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, penales_ganador_id, partido_original_id, estado
        FROM partidos
        WHERE DATE(fecha_partido - INTERVAL '5 hours') = DATE($2)
    ) pa
    JOIN estatico_equipos el on el.id = pa.equipo_local_id
    JOIN estatico_equipos ev on ev.id = pa.equipo_visitante_id
) pa_ex ON pe.partido_id = pa_ex.partido_id
ORDER BY fecha_partido ASC;

-- name: ActualizarPuntosActualesPrediccion :exec
UPDATE prediccion SET
    puntos_actuales = $1
WHERE usuario_id = $2 AND partido_id = $3;

-- name: ActualizarPuntosActualesUsuario :exec
UPDATE prediccion SET
    puntos_actuales = $1
WHERE usuario_id = $2;

-- name: VerGanadoresHitMasGoles :many
SELECT DISTINCT pe.usuario_id, u.username,
       (p.goles_local + p.goles_visitante)::INTEGER AS total_goles,
       el.siglas AS equipo_local_siglas,
       ev.siglas AS equipo_visitante_siglas,
       el.bandera AS equipo_local_bandera,
       ev.bandera AS equipo_visitante_bandera,
       p.goles_local::INTEGER AS goles_local,
       p.goles_visitante::INTEGER AS goles_visitante
FROM prediccion pe
JOIN partidos p ON p.id = pe.partido_id
JOIN usuarios u ON u.id = pe.usuario_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE pe.resultado = 'exacto'
  AND u.participante = TRUE
  AND p.partido_original_id IS NULL
  AND (p.goles_local + p.goles_visitante) = (
    SELECT MAX(p2.goles_local + p2.goles_visitante)
    FROM prediccion pe2
    JOIN partidos p2 ON p2.id = pe2.partido_id
    WHERE pe2.resultado = 'exacto'
      AND p2.partido_original_id IS NULL
  );
