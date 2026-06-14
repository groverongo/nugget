-- UP MIGRATION: 20260526042256_predicciones

CREATE TABLE prediccion (
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id),
    partido_id INT NOT NULL REFERENCES partidos(id),
    goles_local INT NOT NULL,
    goles_visitante INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY(usuario_id, partido_id) -- Un usuario solo puede tener una predicción por partido
);