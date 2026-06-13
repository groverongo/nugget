-- name: CrearTimba :one
INSERT INTO timba_time (partido_id, descripcion, jugador_1_id, puntos)
VALUES ($1, $2, $3, $4)
RETURNING id;

-- name: VerTimba :one
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos,
    t.ganador_id,
    t.estado,
    u1.username AS jugador_1_nombre,
    COALESCE(u2.username, '') AS jugador_2_nombre,
    p.estado AS partido_estado,
    f.puntos_base AS fase_puntos_base,
    el.nombre AS equipo_local_nombre,
    el.bandera AS equipo_local_bandera,
    ev.nombre AS equipo_visitante_nombre,
    ev.bandera AS equipo_visitante_bandera
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

-- name: VerTimbasCerradasPorPartido :many
SELECT
    t.id,
    t.descripcion,
    t.jugador_1_id,
    t.jugador_2_id,
    t.puntos,
    u1.username AS jugador_1_nombre,
    u2.username AS jugador_2_nombre
FROM timba_time t
JOIN usuarios u1 ON u1.id = t.jugador_1_id
JOIN usuarios u2 ON u2.id = t.jugador_2_id
WHERE t.partido_id = $1 AND t.estado = 'cerrada'
ORDER BY t.created_at ASC;

-- name: VerMisTimbas :many
SELECT
    t.id,
    t.partido_id,
    t.descripcion,
    t.puntos,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre
FROM timba_time t
JOIN partidos p ON p.id = t.partido_id
JOIN estatico_equipos el ON el.id = p.equipo_local_id
JOIN estatico_equipos ev ON ev.id = p.equipo_visitante_id
WHERE t.jugador_1_id = $1 AND t.estado = 'abierta'
ORDER BY t.created_at ASC;

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

-- name: ResolverTimba :exec
UPDATE timba_time
SET ganador_id = $2, estado = 'resuelta'
WHERE id = $1;

-- name: CancelarTimba :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE id = $1;

-- name: AnularTimba :exec
DELETE FROM timba_time WHERE id = $1;

-- name: CancelarTimbasAbiertasPorPartido :exec
UPDATE timba_time
SET estado = 'cancelada'
WHERE partido_id = $1 AND estado = 'abierta';
