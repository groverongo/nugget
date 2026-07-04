-- UP MIGRATION: 20260704000000_timba_anulada

-- Nuevo estado para timbas anuladas por voto de la comunidad. A diferencia de
-- 'cancelada' (el propio creador se arrepiente antes de que alguien acepte),
-- una timba anulada SI llego a tener contrincante y puntos comprometidos, asi
-- que esos puntos quedan congelados (siguen contando en SumarApuestasActivas)
-- hasta que el partido finalice, para evitar que se vuelva a timbear lo mismo
-- apenas se anula.
ALTER TYPE timba_estado ADD VALUE 'anulada';
