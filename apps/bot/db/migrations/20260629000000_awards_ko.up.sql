ALTER TABLE usuarios
    ADD COLUMN award_ko_finalista1 INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_finalista2 INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_campeon INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_mejor_partido_equipo1 INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_mejor_partido_equipo2 INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_mejor_partido_mas_goles INTEGER REFERENCES estatico_equipos(id),
    ADD COLUMN award_ko_num_suplementarios INTEGER,
    ADD COLUMN award_ko_goleador INTEGER REFERENCES estatico_jugadores(id);
