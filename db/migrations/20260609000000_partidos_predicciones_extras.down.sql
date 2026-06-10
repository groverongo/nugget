-- DOWN MIGRATION: 20260609000000_partidos_predicciones_extras

-- Restaurar es_gran_final
ALTER TABLE estatico_fases
    ADD COLUMN IF NOT EXISTS es_gran_final BOOLEAN NOT NULL DEFAULT FALSE;

-- Revertir puntaje de predicciones
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

-- Revertir estado medio_tiempo
-- PostgreSQL no permite eliminar valores de un ENUM directamente.
-- Para revertir: recrear el tipo sin 'medio_tiempo' y migrar los datos.
ALTER TABLE partidos ALTER COLUMN estado TYPE TEXT;
DROP TYPE partidos_estado_type;
CREATE TYPE partidos_estado_type AS ENUM ('programado', 'en_vivo', 'finalizado');
UPDATE partidos SET estado = 'en_vivo' WHERE estado = 'medio_tiempo';
ALTER TABLE partidos ALTER COLUMN estado TYPE partidos_estado_type USING estado::partidos_estado_type;

-- Revertir extras de partidos
ALTER TABLE partidos
    DROP COLUMN IF EXISTS extra_partidazo,
    DROP COLUMN IF EXISTS extra_milagro,
    DROP COLUMN IF EXISTS extra_batacazo,
    DROP COLUMN IF EXISTS extra_el_elegido;
