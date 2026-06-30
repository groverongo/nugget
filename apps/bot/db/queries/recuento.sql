-- name: VerRankingCompleto :many
SELECT
    id,
    username,
    puntos,
    racha,
    racha_maxima,
    win_rate::NUMERIC AS win_rate,
    partidos_apostados,
    partidos_ganados,
    partidos_perdidos,
    (partidos_apostados - partidos_ganados - partidos_perdidos) AS partidos_buen_intento,
    premio_asociado
FROM usuarios
WHERE participante = TRUE
ORDER BY
    puntos DESC,
    partidos_ganados DESC,
    win_rate DESC,
    racha_maxima DESC,
    (partidos_apostados - partidos_ganados - partidos_perdidos) DESC;

-- name: VerEstadisticasTorneo :one
SELECT
    COUNT(*) FILTER (WHERE estado = 'finalizado')::INTEGER AS partidos_finalizados,
    COUNT(*)::INTEGER AS partidos_total
FROM partidos;

-- name: VerWinRateGlobal :one
SELECT
    (SELECT COUNT(DISTINCT pe.partido_id)::INTEGER
     FROM prediccion pe
     JOIN usuarios u ON u.id = pe.usuario_id
     WHERE pe.resultado = 'exacto' AND u.participante = TRUE) AS exactos,
    (SELECT COUNT(*)::INTEGER FROM partidos WHERE estado = 'finalizado') AS total_finalizados;

-- name: VerRankingWinRate :many
SELECT id, username, win_rate::NUMERIC AS win_rate
FROM usuarios
WHERE participante = TRUE AND win_rate > 0
ORDER BY win_rate DESC, partidos_ganados DESC;

-- name: VerRankingRachaMaxima :many
SELECT id, username, racha_maxima
FROM usuarios
WHERE participante = TRUE AND racha_maxima > 0
ORDER BY racha_maxima DESC, partidos_ganados DESC;

-- name: VerEquiposEliminados :many
SELECT id, nombre, siglas, bandera
FROM estatico_equipos
WHERE eliminado = TRUE
ORDER BY eliminado_at ASC NULLS LAST;

-- name: MarcarEquipoEliminado :exec
UPDATE estatico_equipos SET eliminado = TRUE, eliminado_at = NOW() WHERE id = $1;

-- name: MarcarEquipoNoEliminado :exec
UPDATE estatico_equipos SET eliminado = FALSE, eliminado_at = NULL WHERE id = $1;

-- name: VerAwardsParaRecuento :many
SELECT
    u.id AS usuario_id,
    u.username,
    u.award_campeon AS campeon_id,
    ec.bandera AS campeon_bandera,
    u.award_goleador AS goleador_id,
    jg.equipo_id AS goleador_equipo_id,
    u.award_mejor_jugador AS mejor_jugador_id,
    jmj.equipo_id AS mejor_jugador_equipo_id,
    u.award_mejor_arquero AS mejor_arquero_id,
    jma.equipo_id AS mejor_arquero_equipo_id,
    u.award_mejor_jugador_joven AS mejor_jugador_joven_id,
    jmjj.equipo_id AS mejor_jugador_joven_equipo_id,
    u.award_mejor_gol AS mejor_gol_id,
    jmg.equipo_id AS mejor_gol_equipo_id,
    u.award_seleccion_decepcion AS seleccion_decepcion_id,
    esd.bandera AS seleccion_decepcion_bandera,
    u.award_seleccion_sorpresa AS seleccion_sorpresa_id,
    ess.bandera AS seleccion_sorpresa_bandera
FROM usuarios u
LEFT JOIN estatico_equipos ec ON ec.id = u.award_campeon
LEFT JOIN estatico_jugadores jg ON jg.id = u.award_goleador
LEFT JOIN estatico_jugadores jmj ON jmj.id = u.award_mejor_jugador
LEFT JOIN estatico_jugadores jma ON jma.id = u.award_mejor_arquero
LEFT JOIN estatico_jugadores jmjj ON jmjj.id = u.award_mejor_jugador_joven
LEFT JOIN estatico_jugadores jmg ON jmg.id = u.award_mejor_gol
LEFT JOIN estatico_equipos esd ON esd.id = u.award_seleccion_decepcion
LEFT JOIN estatico_equipos ess ON ess.id = u.award_seleccion_sorpresa
WHERE u.participante = TRUE AND u.award_campeon IS NOT NULL
ORDER BY u.username;
