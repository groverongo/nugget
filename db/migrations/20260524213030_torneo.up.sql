-- UP MIGRATION: 20260524213030_torneo

CREATE TABLE estatico_equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    puntos_fifa DECIMAL(6,2)
);

CREATE TABLE estatico_fases (
    id SERIAL PRIMARY KEY,
    nombre_fase VARCHAR(50) NOT NULL, -- Ej: 'Fase de Grupos', 'Gran Final'
    puntos_base INTEGER NOT NULL, -- 3, 4 o 5 puntos según la especificación
    puntos_buen_intento INTEGER NOT NULL -- 1, 2 o 3 puntos
);

CREATE TYPE partidos_estado_type AS ENUM ('programado', 'en_vivo', 'finalizado');

CREATE TABLE partidos (
    id SERIAL PRIMARY KEY,
    fase_id INTEGER NOT NULL REFERENCES estatico_fases(id),
    equipo_local_id INTEGER REFERENCES estatico_equipos(id),
    equipo_visitante_id INTEGER REFERENCES estatico_equipos(id),
    fecha_partido TIMESTAMP,
    
    -- Resultados (Se llenan al finalizar el partido)
    goles_local INTEGER DEFAULT NULL,
    goles_visitante INTEGER DEFAULT NULL,
    estado partidos_estado_type NOT NULL DEFAULT 'programado' -- 'PROGRAMADO', 'EN_VIVO', 'FINALIZADO'
);