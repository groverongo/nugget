-- UP MIGRATION: 20260611120000_timestamptz

ALTER TABLE partidos
    ALTER COLUMN fecha_partido TYPE TIMESTAMPTZ
    USING fecha_partido AT TIME ZONE 'UTC';

ALTER TABLE prediccion
    ALTER COLUMN creado_en TYPE TIMESTAMPTZ
    USING creado_en AT TIME ZONE 'UTC',
    ALTER COLUMN actualizado_en TYPE TIMESTAMPTZ
    USING actualizado_en AT TIME ZONE 'UTC';
