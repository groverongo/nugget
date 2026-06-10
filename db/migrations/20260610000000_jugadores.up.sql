-- UP MIGRATION: 20260610000000_jugadores

CREATE TYPE jugador_posicion_type AS ENUM ('arquero', 'defensa', 'mediocampo', 'delantero');

CREATE TABLE estatico_jugadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    equipo_id INTEGER NOT NULL REFERENCES estatico_equipos(id),
    posicion jugador_posicion_type NOT NULL
);
