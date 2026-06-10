-- UP MIGRATION: 20260523214652_usuarios

CREATE TABLE usuarios (
    id VARCHAR(64) PRIMARY KEY, -- ID de Discord (Snowflake)
    username VARCHAR(100) NOT NULL
);