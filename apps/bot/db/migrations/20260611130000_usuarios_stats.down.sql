-- DOWN MIGRATION: 20260611130000_usuarios_stats

ALTER TABLE usuarios
    DROP COLUMN IF EXISTS partidos_apostados,
    DROP COLUMN IF EXISTS partidos_ganados,
    DROP COLUMN IF EXISTS partidos_perdidos,
    DROP COLUMN IF EXISTS puntos,
    DROP COLUMN IF EXISTS racha,
    DROP COLUMN IF EXISTS win_rate,
    DROP COLUMN IF EXISTS premio_asociado,
    DROP COLUMN IF EXISTS participante;

ALTER TABLE estatico_premios
    DROP CONSTRAINT IF EXISTS estatico_premios_pkey;
