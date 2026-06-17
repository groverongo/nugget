-- UP MIGRATION: 20260617000000_prediccion_puntos_actuales

ALTER TABLE prediccion
    ADD COLUMN timba_times INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN puntos_actuales INTEGER DEFAULT NULL;
