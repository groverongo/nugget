-- UP MIGRATION: 20260523214652_usuarios

CREATE TABLE usuarios (
    id VARCHAR(64) PRIMARY KEY, -- ID de Discord (Snowflake)
    username VARCHAR(100) NOT NULL,
    partidos_apostados INTEGER NOT NULL DEFAULT 0,
    partidos_ganados INTEGER NOT NULL DEFAULT 0,
    partidos_perdidos INTEGER NOT NULL DEFAULT 0,
    puntos INTEGER NOT NULL DEFAULT 0,
    racha INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    premio_asociado DECIMAL(10, 2) DEFAULT NULL
);