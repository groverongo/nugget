-- name: CrearTimba :one
INSERT INTO timba_time (partido_id, descripcion, jugador_1_id, puntos_propuestos, puntos_arriesgados)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- name: VerTimba :one
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    t.ganador_id,
    t.estado,
    t.discord_message_id,
    t.timba_original_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    f.puntos_base AS fase_puntos_base,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    el.siglas AS equipo_local_siglas,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera,
    ev.siglas AS equipo_visitante_siglas
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_fases f ON f.id = p.fase_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.id = $1;

-- name: VerPartidoParaTimba :one
SELECT
    p.id AS partido_id,
    p.estado,
    f.puntos_base
FROM partidos p
JOIN estatico_fases f ON f.id = p.fase_id
WHERE p.id = $1;

-- name: VerTimbasPorPartido :many
SELECT
    t.id,
    t.estado,
    t.descripcion,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    t.jugador_1_id,
    COALESCE(u2.id, '') AS jugador_2_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    el.siglas AS equipo_local_siglas,
    el.bandera AS equipo_local_bandera,
    ev.siglas AS equipo_visitante_siglas,
    ev.bandera AS equipo_visitante_bandera,
    t.timba_original_id
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.partido_id = $1 AND t.estado IN ('abierta', 'cerrada', 'contraoferta')
AND u1.participante = TRUE
AND (t.jugador_2_id IS NULL OR u2.participante = TRUE)
ORDER BY t.created_at ASC;

-- name: VerTimbasCerradasPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
WHERE t.partido_id = $1 AND t.estado = 'cerrada'
AND u1.participante = TRUE AND u2.participante = TRUE
ORDER BY t.created_at ASC;

-- name: VerMisTimbas :many
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre
FROM timba_time t
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.jugador_1_id = $1 AND t.estado IN ('abierta', 'contraoferta')
ORDER BY t.created_at ASC;

-- name: VerFechasDeTimbasPorUsuario :many
SELECT DISTINCT DATE(p.fecha_partido - INTERVAL '5 hours')::TEXT AS fecha
FROM timba_time t
JOIN partidos p ON p.id = t.partido_id
WHERE t.jugador_1_id = $1 OR t.jugador_2_id = $1
ORDER BY fecha ASC;

-- name: VerMisTimbasPorFecha :many
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    t.estado,
    t.jugador_1_id,
    t.jugador_2_id,
    t.ganador_id,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    p.fecha_partido,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
LEFT JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE (t.jugador_1_id = $1 OR t.jugador_2_id = $1)
AND DATE(p.fecha_partido - INTERVAL '5 hours') = DATE($2)
ORDER BY p.fecha_partido ASC;

-- name: CheckEmparejamientoTimba :one
SELECT COUNT(*)::INTEGER AS count
FROM timba_time
WHERE partido_id = $1
AND estado NOT IN ('cancelada')
AND (
    (jugador_1_id = $2 AND jugador_2_id = $3)
    OR (jugador_1_id = $3 AND jugador_2_id = $2)
);

-- name: AceptarTimba :exec
UPDATE timba_time
SET jugador_2_id = $2, estado = 'cerrada'
WHERE id = $1;

-- name: VerTimbasResueltasPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    t.jugador_1_id,
    t.jugador_2_id,
    t.ganador_id,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre,
    ug.username AS ganador_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
JOIN usuarios ug ON ug.id = t.ganador_id
WHERE t.partido_id = $1 AND t.estado = 'resuelta'
ORDER BY t.created_at ASC;

-- name: ResolverTimba :exec
UPDATE timba_time
SET ganador_id = $2, estado = 'resuelta'
WHERE id = $1;

-- name: CancelarTimba :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE id = $1;

-- name: GuardarMensajeTimba :exec
UPDATE timba_time
SET discord_message_id = $2
WHERE id = $1;

-- name: AnularTimba :exec
DELETE FROM timba_time WHERE id = $1;

-- name: CancelarTimbasAbiertasPorPartido :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE partido_id = $1 AND estado = 'abierta';

-- name: VerTimbasMedioTiempoPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.puntos_propuestos,
    t.puntos_arriesgados,
    t.jugador_1_id,
    t.jugador_2_id,
    t.ganador_id,
    t.estado,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre,
    COALESCE(ug.username, '') AS ganador_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
LEFT JOIN usuarios ug ON ug.id = t.ganador_id
WHERE t.partido_id = $1 AND t.estado IN ('cerrada', 'resuelta')
AND u1.participante = TRUE AND u2.participante = TRUE
ORDER BY t.created_at ASC;

-- name: RevertirTimba :exec
UPDATE timba_time
SET ganador_id = NULL, estado = 'cerrada'
WHERE id = $1;

-- name: SumarApuestasActivas :one
SELECT COALESCE(SUM(
    CASE WHEN jugador_1_id = sqlc.arg('user_id') THEN puntos_propuestos
         ELSE puntos_arriesgados
    END
), 0)::INTEGER AS total
FROM timba_time
WHERE (jugador_1_id = sqlc.arg('user_id') OR jugador_2_id = sqlc.arg('user_id'))
AND estado IN ('abierta', 'cerrada', 'contraoferta');

-- name: VerContraofertasMensajesPorTimba :many
SELECT id, discord_message_id
FROM timba_time
WHERE timba_original_id = $1 AND estado = 'contraoferta';

-- name: CrearContraoferta :one
INSERT INTO timba_time (partido_id, descripcion, jugador_1_id, puntos_propuestos, puntos_arriesgados, estado, timba_original_id)
VALUES ($1, $2, $3, $4, $5, 'contraoferta', $6)
RETURNING id;

-- name: CancelarContraofertasPorTimba :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE timba_original_id = $1 AND estado = 'contraoferta';

-- name: CancelarContraofertasEnCascadaPorTimba :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE timba_original_id IN (
    SELECT id FROM timba_time AS t WHERE t.timba_original_id = $1
) AND estado = 'contraoferta';

-- name: CancelarTimbasContraofertaAbiertasPorPartido :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE partido_id = $1 AND estado IN ('abierta', 'contraoferta');
