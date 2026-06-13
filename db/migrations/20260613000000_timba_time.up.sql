-- UP MIGRATION: 20260613000000_timba_time

CREATE TYPE timba_estado AS ENUM ('abierta', 'cerrada', 'resuelta', 'cancelada');

CREATE TABLE timba_time (
    id SERIAL PRIMARY KEY,
    partido_id INTEGER NOT NULL REFERENCES partidos(id),
    descripcion TEXT NOT NULL,
    jugador_1_id TEXT NOT NULL REFERENCES usuarios(id),
    jugador_2_id TEXT REFERENCES usuarios(id) DEFAULT NULL,
    puntos INTEGER NOT NULL CHECK (puntos > 0),
    ganador_id TEXT REFERENCES usuarios(id) DEFAULT NULL,
    estado timba_estado NOT NULL DEFAULT 'abierta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
