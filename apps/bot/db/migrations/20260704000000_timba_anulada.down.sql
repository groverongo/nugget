-- DOWN MIGRATION: 20260704000000_timba_anulada

-- Postgres no permite quitar un valor de un ENUM sin recrear el tipo.
-- Ver 20260624000000_timba_contraoferta.down.sql para el mismo caso con 'contraoferta'.
