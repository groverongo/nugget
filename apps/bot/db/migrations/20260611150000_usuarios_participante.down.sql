-- DOWN MIGRATION: 20260611150000_usuarios_participante
ALTER TABLE usuarios
    DROP COLUMN IF EXISTS participante;
