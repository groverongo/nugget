-- UP MIGRATION: 20260630000001_prediccion_et

CREATE TABLE prediccion_et (
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    partido_id INTEGER NOT NULL REFERENCES partidos(id),
    goles_local_adicionales INTEGER NOT NULL DEFAULT 0 CHECK (goles_local_adicionales >= 0),
    goles_visitante_adicionales INTEGER NOT NULL DEFAULT 0 CHECK (goles_visitante_adicionales >= 0),
    penales_ganador_id INTEGER REFERENCES estatico_equipos(id),
    PRIMARY KEY (usuario_id, partido_id)
);
