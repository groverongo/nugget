-- DOWN MIGRATION: 20260617000000_prediccion_puntos_actuales

ALTER TABLE prediccion
    DROP COLUMN IF EXISTS timba_times,
    DROP COLUMN IF EXISTS puntos_actuales;
