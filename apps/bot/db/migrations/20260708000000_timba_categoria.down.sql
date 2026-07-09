-- DOWN MIGRATION: 20260708000000_timba_categoria

ALTER TABLE timba_time
    DROP COLUMN IF EXISTS justificacion,
    DROP COLUMN IF EXISTS categoria;

DROP TYPE IF EXISTS timba_categoria;
