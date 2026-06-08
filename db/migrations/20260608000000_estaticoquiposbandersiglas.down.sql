-- DOWN MIGRATION: 20260608000000_estaticoquiposbandersiglas

ALTER TABLE estatico_equipos
DROP COLUMN bandera,
DROP COLUMN siglas;
