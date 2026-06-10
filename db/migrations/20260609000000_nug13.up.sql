-- UP MIGRATION: 20260609000000_nug13

-- Extras de partidos
ALTER TABLE partidos
    ADD COLUMN extra_partidazo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_milagro BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_batacazo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN extra_el_elegido BOOLEAN NOT NULL DEFAULT FALSE;

-- Estado medio_tiempo
ALTER TYPE partidos_estado_type ADD VALUE 'medio_tiempo' BEFORE 'finalizado';

-- Puntaje de predicciones
CREATE TYPE prediccion_resultado_type AS ENUM ('exacto', 'buen_intento', 'fallado');

ALTER TABLE prediccion
    ADD COLUMN resultado prediccion_resultado_type NOT NULL DEFAULT 'fallado',
    ADD COLUMN puntos_base INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_en_racha INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_partidazo INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_milagro INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_batacazo INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_el_elegido INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_gran_final INT NOT NULL DEFAULT 0,
    ADD COLUMN puntos_total INT NOT NULL DEFAULT 0;

-- Eliminar campo es_gran_final de estatico_fases
ALTER TABLE estatico_fases
    DROP COLUMN IF EXISTS es_gran_final;

-- Colores de equipos
ALTER TABLE estatico_equipos
    ADD COLUMN blanco BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN negro BOOLEAN NOT NULL DEFAULT FALSE;

-- Jugadores
CREATE TYPE jugador_posicion_type AS ENUM ('arquero', 'defensa', 'mediocampo', 'delantero');

CREATE TABLE estatico_jugadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    equipo_id INTEGER NOT NULL REFERENCES estatico_equipos(id),
    posicion jugador_posicion_type NOT NULL
);

-- Awards de usuarios
ALTER TABLE usuarios
    ADD COLUMN award_campeon INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL,
    ADD COLUMN award_goleador INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_jugador INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_arquero INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_jugador_joven INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_mejor_gol INTEGER REFERENCES estatico_jugadores(id) DEFAULT NULL,
    ADD COLUMN award_seleccion_decepcion INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL,
    ADD COLUMN award_seleccion_sorpresa INTEGER REFERENCES estatico_equipos(id) DEFAULT NULL;

-- Puntos por posición en mejor gol
CREATE TABLE estatico_mejor_gol_puntos (
    posicion INTEGER PRIMARY KEY,
    puntos INTEGER NOT NULL
);
