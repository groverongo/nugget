-- UP MIGRATION: 20260625072815_partido_restriccion

ALTER TABLE partidos ADD CONSTRAINT unique_fase_equipo_local_equipo_visitante UNIQUE (fase_id, equipo_local_id, equipo_visitante_id);