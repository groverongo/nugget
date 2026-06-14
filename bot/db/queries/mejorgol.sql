-- name: VerPuntosMejorGolPorPosicion :one
SELECT puntos FROM estatico_mejor_gol_puntos WHERE posicion = sqlc.arg(posicion);
