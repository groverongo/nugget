-- DOWN MIGRATION: 20260607054339_partidosfechapartidotimestamptz

ALTER TABLE partidos
ALTER COLUMN fecha_partido TYPE TIMESTAMP
USING fecha_partido AT TIME ZONE 'UTC';
