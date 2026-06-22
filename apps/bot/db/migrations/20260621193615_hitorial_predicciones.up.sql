-- UP MIGRATION: 20260621193615_hitorial_predicciones
CREATE TABLE
    monitoreo_prediccion (
        usuario_id VARCHAR(64) NOT NULL,
        partido_id INTEGER NOT NULL,
        goles_local INTEGER NOT NULL,
        goles_visitante INTEGER NOT NULL
    );

ALTER TABLE monitoreo_prediccion ADD CONSTRAINT fk_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios (id);

ALTER TABLE monitoreo_prediccion ADD CONSTRAINT fk_partido_id FOREIGN KEY (partido_id) REFERENCES partidos (id);