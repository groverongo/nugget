ALTER TABLE partidos ADD COLUMN penales_ganador_id INT REFERENCES estatico_equipos(id);
