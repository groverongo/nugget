-- DOWN MIGRATION: 20260626000000_suplementario

ALTER TABLE prediccion DROP COLUMN penales_ganador_id;

DROP INDEX IF EXISTS unique_fase_equipos_no_suple;
ALTER TABLE partidos ADD CONSTRAINT unique_fase_equipo_local_equipo_visitante
    UNIQUE (fase_id, equipo_local_id, equipo_visitante_id);

ALTER TABLE partidos
    DROP COLUMN partido_original_id,
    DROP COLUMN goles_minimos_local,
    DROP COLUMN goles_minimos_visitante;

-- PostgreSQL no permite eliminar valores de enums; los dejamos y son ignorados por el código
