-- UP MIGRATION: 20260714000000_mejor_gol_nominado

-- Permite resolver un nominado a Mejor Gol sin posicion confirmada (FIFA no
-- siempre revela el ranking completo). posicion = NULL representa "nominado,
-- sin posicion revelada" y se puntua con un valor fijo en vez de la tabla
-- estatico_mejor_gol_puntos. El CHECK existente (posicion BETWEEN 1 AND 10)
-- ya deja pasar NULL (la semantica de CHECK en Postgres no rechaza NULL), y
-- el UNIQUE permite multiples NULL, asi que solo hace falta soltar el NOT NULL.

ALTER TABLE awards_mejor_gol_resueltos
    ALTER COLUMN posicion DROP NOT NULL;
