ALTER TABLE timba_time RENAME COLUMN puntos TO puntos_propuestos;

ALTER TABLE timba_time ADD COLUMN puntos_arriesgados INTEGER;
UPDATE timba_time SET puntos_arriesgados = puntos_propuestos;
ALTER TABLE timba_time ALTER COLUMN puntos_arriesgados SET NOT NULL;
