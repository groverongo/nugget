-- UP MIGRATION: 20260607054339_partidosfechapartidotimestamptz

ALTER TABLE partidos
ALTER COLUMN fecha_partido TYPE TIMESTAMPTZ
USING fecha_partido AT TIME ZONE 'UTC';
