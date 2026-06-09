CREATE TYPE prediccion_resultado_type AS ENUM ('exacto', 'buen_intento', 'fallado');

ALTER TABLE prediccion
    ADD COLUMN resultado prediccion_resultado_type NOT NULL DEFAULT 'fallado',
    ADD COLUMN puntos_base INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_en_racha INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_partidazo INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_milagro INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_batacazo INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_el_elegido INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_gran_final INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_total INT NOT NULL DEFAULT 0;
