import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const verPartidosPorFechaQuery = `-- name: VerPartidosPorFecha :many
SELECT
	partidos.id AS partido_id,
	el.nombre AS equipo_local_nombre,
	ev.nombre AS equipo_visitante_nombre,
	el.grupo AS equipo_local_grupo,
	ev.grupo AS equipo_visitante_grupo,
	partidos.estado,
	partidos.goles_local AS partido_goles_local,
	partidos.goles_visitante AS partido_goles_visitante,
	partidos.fecha_partido
FROM partidos
JOIN estatico_equipos el ON el.id = partidos.equipo_local_id
JOIN estatico_equipos ev ON ev.id = partidos.equipo_visitante_id
WHERE DATE(partidos.fecha_partido) = DATE($1)`;

export interface VerPartidosPorFechaArgs {
    date: string;
}

export interface VerPartidosPorFechaRow {
    partidoId: number;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
    equipoLocalGrupo: string;
    equipoVisitanteGrupo: string;
    estado: string;
    partidoGolesLocal: number | null;
    partidoGolesVisitante: number | null;
    fechaPartido: Date | null;
}

export async function verPartidosPorFecha(client: Client, args: VerPartidosPorFechaArgs): Promise<VerPartidosPorFechaRow[]> {
    const result = await client.query({
        text: verPartidosPorFechaQuery,
        values: [args.date],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            equipoLocalNombre: row[1],
            equipoVisitanteNombre: row[2],
            equipoLocalGrupo: row[3],
            equipoVisitanteGrupo: row[4],
            estado: row[5],
            partidoGolesLocal: row[6],
            partidoGolesVisitante: row[7],
            fechaPartido: row[8]
        };
    });
}

export const obtenerPartidoQuery = `-- name: ObtenerPartido :one
SELECT id, fecha_partido
FROM partidos
WHERE id = $1`;

export interface ObtenerPartidoArgs {
    id: number;
}

export interface ObtenerPartidoRow {
    id: number;
    fechaPartido: Date | null;
}

export async function obtenerPartido(client: Client, args: ObtenerPartidoArgs): Promise<ObtenerPartidoRow | null> {
    const result = await client.query({
        text: obtenerPartidoQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        fechaPartido: row[1]
    };
}

