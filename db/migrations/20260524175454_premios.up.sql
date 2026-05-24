-- UP MIGRATION: 20260524175454_premios

CREATE TABLE estatico_premios (
    puesto INTEGER NOT NULL,
    premio DECIMAL NOT NULL
);