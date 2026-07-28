-- DOWN MIGRATION: 20260713000000_awards_mejor_gol_resueltos

DROP TABLE awards_mejor_gol_resueltos;

ALTER TABLE awards_resultados
    ADD COLUMN resultado_mejor_gol INTEGER REFERENCES estatico_jugadores(id),
    ADD COLUMN resultado_mejor_gol_posicion INTEGER;
