-- DOWN MIGRATION: 20260523214653_usuarioscampos

ALTER TABLE usuarios
DROP COLUMN partidos_apostados,
DROP COLUMN partidos_ganados,
DROP COLUMN partidos_perdidos,
DROP COLUMN puntos,
DROP COLUMN racha,
DROP COLUMN win_rate,
DROP COLUMN premio_asociado;
