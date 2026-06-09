ALTER TABLE partidos
    DROP COLUMN IF EXISTS extra_partidazo,
    DROP COLUMN IF EXISTS extra_milagro,
    DROP COLUMN IF EXISTS extra_batacazo,
    DROP COLUMN IF EXISTS extra_el_elegido;
