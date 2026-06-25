-- DOWN MIGRATION: 20260625072815_partido_restriccion

ALTER TABLE partidos DROP CONSTRAINT unique_fase_equipo_local_equipo_visitante;