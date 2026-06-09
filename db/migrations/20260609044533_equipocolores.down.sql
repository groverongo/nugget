-- DOWN MIGRATION: 20260609044533_equipocolores

ALTER TABLE estatico_equipos
DROP COLUMN blanco,
DROP COLUMN negro;
