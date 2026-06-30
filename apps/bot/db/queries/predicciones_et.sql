-- name: UpsertPrediccionEt :exec
INSERT INTO prediccion_et (usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (usuario_id, partido_id) DO UPDATE SET
    goles_local_adicionales = EXCLUDED.goles_local_adicionales,
    goles_visitante_adicionales = EXCLUDED.goles_visitante_adicionales,
    penales_ganador_id = EXCLUDED.penales_ganador_id;

-- name: VerPrediccionEt :one
SELECT usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id
FROM prediccion_et
WHERE usuario_id = $1 AND partido_id = $2;

-- name: VerPrediccionesEtPorPartido :many
SELECT usuario_id, partido_id, goles_local_adicionales, goles_visitante_adicionales, penales_ganador_id
FROM prediccion_et
WHERE partido_id = $1;

-- name: EliminarPrediccionesEtPorPartido :exec
DELETE FROM prediccion_et WHERE partido_id = $1;
