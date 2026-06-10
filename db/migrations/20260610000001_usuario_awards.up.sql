-- UP MIGRATION: 20260610000001_usuario_awards

ALTER TABLE usuarios
    ADD COLUMN award_campeon INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL,
    ADD COLUMN award_goleador INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_jugador INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_arquero INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_jugador_joven INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_gol INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_seleccion_decepcion INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL,
    ADD COLUMN award_seleccion_sorpresa INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL;
