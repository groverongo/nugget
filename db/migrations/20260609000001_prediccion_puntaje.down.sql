ALTER TABLE prediccion
    DROP COLUMN IF EXISTS resultado,
    DROP COLUMN IF EXISTS puntos_base,
    DROP COLUMN IF EXISTS puntos_en_racha,
    DROP COLUMN IF EXISTS puntos_partidazo,
    DROP COLUMN IF EXISTS puntos_milagro,
    DROP COLUMN IF EXISTS puntos_batacazo,
    DROP COLUMN IF EXISTS puntos_el_elegido,
    DROP COLUMN IF EXISTS puntos_gran_final,
    DROP COLUMN IF EXISTS puntos_total;

DROP TYPE IF EXISTS prediccion_resultado_type;
