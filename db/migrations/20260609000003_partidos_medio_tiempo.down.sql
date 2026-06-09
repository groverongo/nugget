-- PostgreSQL no permite eliminar valores de un ENUM directamente.
-- Para revertir: recrear el tipo sin 'medio_tiempo' y migrar los datos.
-- En desarrollo se puede simplemente hacer DROP y recrear el enum.
ALTER TABLE partidos ALTER COLUMN estado TYPE TEXT;
DROP TYPE partidos_estado_type;
CREATE TYPE partidos_estado_type AS ENUM ('programado', 'en_vivo', 'finalizado');
UPDATE partidos SET estado = 'en_vivo' WHERE estado = 'medio_tiempo';
ALTER TABLE partidos ALTER COLUMN estado TYPE partidos_estado_type USING estado::partidos_estado_type;
