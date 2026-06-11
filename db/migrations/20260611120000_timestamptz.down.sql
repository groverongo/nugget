-- DOWN MIGRATION: 20260611120000_timestamptz

ALTER TABLE prediccion
    ALTER COLUMN actualizado_en TYPE TIMESTAMP
    USING actualizado_en AT TIME ZONE 'UTC',
    ALTER COLUMN creado_en TYPE TIMESTAMP
    USING creado_en AT TIME ZONE 'UTC';

ALTER TABLE partidos
    ALTER COLUMN fecha_partido TYPE TIMESTAMP
    USING fecha_partido AT TIME ZONE 'UTC';
