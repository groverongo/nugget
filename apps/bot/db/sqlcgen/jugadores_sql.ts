import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verJugadoresPorEquipoQuery = `-- name: VerJugadoresPorEquipo :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.equipo_id = $1
ORDER BY j.posicion, j.nombre ASC`;

export interface VerJugadoresPorEquipoArgs {
    equipoId: number;
}

export interface VerJugadoresPorEquipoRow {
    id: number;
    nombre: string;
    posicion: string;
    equipoNombre: string;
}

export async function verJugadoresPorEquipo(client: Client, args: VerJugadoresPorEquipoArgs): Promise<VerJugadoresPorEquipoRow[]> {
    const result = await client.query({
        text: verJugadoresPorEquipoQuery,
        values: [args.equipoId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            posicion: row[2],
            equipoNombre: row[3]
        };
    });
}

export const buscarJugadoresQuery = `-- name: BuscarJugadores :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.nombre ILIKE '%' || $1 || '%'
ORDER BY e.nombre, j.nombre ASC
LIMIT 25`;

export interface BuscarJugadoresArgs {
    query: string | null;
}

export interface BuscarJugadoresRow {
    id: number;
    nombre: string;
    posicion: string;
    equipoNombre: string;
}

export async function buscarJugadores(client: Client, args: BuscarJugadoresArgs): Promise<BuscarJugadoresRow[]> {
    const result = await client.query({
        text: buscarJugadoresQuery,
        values: [args.query],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            posicion: row[2],
            equipoNombre: row[3]
        };
    });
}

export const verJugadoresPorIdsQuery = `-- name: VerJugadoresPorIds :many
SELECT j.id, j.nombre, j.posicion, e.nombre AS equipo_nombre, e.bandera AS equipo_bandera
FROM estatico_jugadores j
JOIN estatico_equipos e ON e.id = j.equipo_id
WHERE j.id = ANY($1::int[])
ORDER BY j.nombre ASC`;

export interface VerJugadoresPorIdsArgs {
    ids: number[];
}

export interface VerJugadoresPorIdsRow {
    id: number;
    nombre: string;
    posicion: string;
    equipoNombre: string;
    equipoBandera: string;
}

export async function verJugadoresPorIds(client: Client, args: VerJugadoresPorIdsArgs): Promise<VerJugadoresPorIdsRow[]> {
    const result = await client.query({
        text: verJugadoresPorIdsQuery,
        values: [args.ids],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            nombre: row[1],
            posicion: row[2],
            equipoNombre: row[3],
            equipoBandera: row[4]
        };
    });
}

