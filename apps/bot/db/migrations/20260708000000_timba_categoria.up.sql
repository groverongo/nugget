-- UP MIGRATION: 20260708000000_timba_categoria

CREATE TYPE timba_categoria AS ENUM ('valida', 'mafia', 'contexto');

ALTER TABLE timba_time
    ADD COLUMN categoria timba_categoria,
    ADD COLUMN justificacion TEXT;
