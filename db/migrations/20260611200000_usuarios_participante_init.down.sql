-- DOWN MIGRATION: 20260611200000_usuarios_participante_init
UPDATE usuarios SET participante = FALSE;
