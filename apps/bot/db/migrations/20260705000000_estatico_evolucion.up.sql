-- UP MIGRATION: 20260705000000_estatico_evolucion
CREATE TABLE estatico_evolucion (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id),
  usuario_id VARCHAR NOT NULL REFERENCES usuarios(id),
  delta INTEGER NOT NULL DEFAULT 0,
  UNIQUE (partido_id, usuario_id)
);
