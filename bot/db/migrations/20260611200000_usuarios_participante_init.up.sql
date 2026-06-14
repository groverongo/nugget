-- UP MIGRATION: 20260611200000_usuarios_participante_init
UPDATE usuarios SET participante = TRUE WHERE id IN (
    SELECT DISTINCT usuario_id FROM prediccion
);
