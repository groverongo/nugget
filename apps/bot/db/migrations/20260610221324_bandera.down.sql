-- DOWN MIGRATION: 20260610221324_bandera

ALTER TABLE estatico_equipos
    DROP COLUMN siglas,
    DROP COLUMN bandera;