-- UP MIGRATION: 20260626000000_suplementario

ALTER TYPE partidos_estado_type ADD VALUE 'suplementario' AFTER 'en_vivo';
ALTER TYPE partidos_estado_type ADD VALUE 'penales' AFTER 'suplementario';

ALTER TABLE partidos
    ADD COLUMN partido_original_id INT REFERENCES partidos(id),
    ADD COLUMN goles_minimos_local INT,
    ADD COLUMN goles_minimos_visitante INT;

-- La constraint única se relaja: solo aplica a partidos normales (no suples)
ALTER TABLE partidos DROP CONSTRAINT unique_fase_equipo_local_equipo_visitante;
CREATE UNIQUE INDEX unique_fase_equipos_no_suple
    ON partidos (fase_id, equipo_local_id, equipo_visitante_id)
    WHERE partido_original_id IS NULL;

ALTER TABLE prediccion
    ADD COLUMN penales_ganador_id INT REFERENCES estatico_equipos(id);
