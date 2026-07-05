-- name: PoblarEvolucion :exec
INSERT INTO estatico_evolucion (partido_id, usuario_id, delta)
SELECT
    p.partido_id,
    p.usuario_id,
    COALESCE(p.puntos_total, 0) + COALESCE(ts.timba_delta, 0) AS delta
FROM prediccion p
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(
        CASE
            WHEN t.jugador_1_id = p.usuario_id AND t.ganador_id = t.jugador_1_id THEN t.puntos_arriesgados
            WHEN t.jugador_2_id = p.usuario_id AND t.ganador_id = t.jugador_2_id THEN t.puntos_propuestos
            WHEN t.jugador_1_id = p.usuario_id AND t.ganador_id = t.jugador_2_id THEN -t.puntos_propuestos
            WHEN t.jugador_2_id = p.usuario_id AND t.ganador_id = t.jugador_1_id THEN -t.puntos_arriesgados
            ELSE 0
        END
    ), 0) AS timba_delta
    FROM timba_time t
    WHERE t.estado = 'resuelta'
      AND t.partido_id = p.partido_id
      AND (t.jugador_1_id = p.usuario_id OR t.jugador_2_id = p.usuario_id)
) ts ON true
WHERE p.partido_id = $1
ON CONFLICT (partido_id, usuario_id) DO UPDATE SET delta = EXCLUDED.delta;

-- name: VerEvolucionPorUsuario :many
SELECT
    e.partido_id,
    e.delta,
    pa.fecha_partido,
    el.nombre AS equipo_local_nombre,
    el.siglas AS equipo_local_siglas,
    ev.nombre AS equipo_visitante_nombre,
    ev.siglas AS equipo_visitante_siglas
FROM estatico_evolucion e
JOIN partidos pa ON pa.id = e.partido_id
JOIN estatico_equipos el ON el.id = pa.equipo_local_id
JOIN estatico_equipos ev ON ev.id = pa.equipo_visitante_id
WHERE e.usuario_id = $1
  AND ($2::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE >= $2::DATE)
  AND ($3::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE <= $3::DATE)
ORDER BY pa.fecha_partido ASC
LIMIT sqlc.arg('limit')::INTEGER OFFSET sqlc.arg('offset')::INTEGER;

-- name: VerEvolucionGrupal :many
SELECT
    e.usuario_id,
    u.username,
    e.partido_id,
    e.delta,
    pa.fecha_partido,
    el.siglas AS equipo_local_siglas,
    ev.siglas AS equipo_visitante_siglas,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre
FROM estatico_evolucion e
JOIN usuarios u ON u.id = e.usuario_id
JOIN partidos pa ON pa.id = e.partido_id
JOIN estatico_equipos el ON el.id = pa.equipo_local_id
JOIN estatico_equipos ev ON ev.id = pa.equipo_visitante_id
WHERE u.participante = TRUE
  AND ($1::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE >= $1::DATE)
  AND ($2::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE <= $2::DATE)
ORDER BY u.username ASC, pa.fecha_partido ASC;
