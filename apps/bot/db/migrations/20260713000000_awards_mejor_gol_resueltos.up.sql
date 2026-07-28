-- UP MIGRATION: 20260713000000_awards_mejor_gol_resueltos

-- El award de Mejor Gol tiene 10 goles nominados, cada uno con su propia
-- posicion final (1-10). Cada resolucion registra un jugador a la vez, asi
-- que el gate de "ya resuelto" no puede ser una sola columna como el resto
-- de los awards: se necesita una fila por jugador resuelto.

ALTER TABLE awards_resultados
    DROP COLUMN resultado_mejor_gol,
    DROP COLUMN resultado_mejor_gol_posicion;

CREATE TABLE awards_mejor_gol_resueltos (
    jugador_id INTEGER PRIMARY KEY REFERENCES estatico_jugadores(id),
    posicion INTEGER NOT NULL UNIQUE CHECK (posicion BETWEEN 1 AND 10),
    resuelto_en TIMESTAMP NOT NULL DEFAULT NOW()
);
