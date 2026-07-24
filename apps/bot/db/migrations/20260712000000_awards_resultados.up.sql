-- UP MIGRATION: 20260712000000_awards_resultados

CREATE TABLE awards_resultados (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    resultado_campeon INTEGER REFERENCES estatico_equipos(id),
    resultado_goleador INTEGER REFERENCES estatico_jugadores(id),
    resultado_mejor_jugador INTEGER REFERENCES estatico_jugadores(id),
    resultado_mejor_arquero INTEGER REFERENCES estatico_jugadores(id),
    resultado_mejor_jugador_joven INTEGER REFERENCES estatico_jugadores(id),
    resultado_mejor_gol INTEGER REFERENCES estatico_jugadores(id),
    resultado_mejor_gol_posicion INTEGER,
    resultado_seleccion_decepcion INTEGER REFERENCES estatico_equipos(id),
    resultado_seleccion_sorpresa INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_campeon INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_finalista1 INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_finalista2 INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_mejor_partido_equipo1 INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_mejor_partido_equipo2 INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_mejor_partido_mas_goles INTEGER REFERENCES estatico_equipos(id),
    resultado_ko_num_suplementarios INTEGER,
    resultado_ko_goleador INTEGER REFERENCES estatico_jugadores(id)
);

INSERT INTO awards_resultados (id) VALUES (1);
