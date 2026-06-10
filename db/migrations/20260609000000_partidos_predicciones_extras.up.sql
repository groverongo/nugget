-- UP MIGRATION: 20260609000000_partidos_predicciones_extras

-- Extras de partidos
ALTER TABLE partidos
    ADD COLUMN extra_partidazo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_milagro BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_batacazo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_el_elegido BOOLEAN NOT NULL DEFAULT FALSE;

-- Estado medio_tiempo
ALTER TYPE partidos_estado_type ADD VALUE 'medio_tiempo' BEFORE 'finalizado';

-- Puntaje de predicciones
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

-- Eliminar campo es_gran_final
ALTER TABLE estatico_fases
    DROP COLUMN IF EXISTS es_gran_final;
