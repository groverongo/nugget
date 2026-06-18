-- DOWN MIGRATION: 20260618000000_recuento

ALTER TABLE estatico_equipos
    DROP COLUMN IF EXISTS eliminado;
