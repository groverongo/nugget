import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const poblarEvolucionQuery = `-- name: PoblarEvolucion :exec
INSERT INTO estatico_evolucion (partido_id, usuario_id, delta)
SELECT
    p.partido_id,
    p.usuario_id,
    COALESCE(p.puntos_total, 0) + COALESCE(ts.timba_delta, 0) AS delta
FROM prediccion p
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(
        CASE
            WHEN t.jugador_1_id = p.usuario_id AND t.ganador_id = t.jugador_1_id THEN t.puntos_arriesgados
            WHEN t.jugador_2_id = p.usuario_id AND t.ganador_id = t.jugador_2_id THEN t.puntos_propuestos
            WHEN t.jugador_1_id = p.usuario_id AND t.ganador_id = t.jugador_2_id THEN -t.puntos_propuestos
            WHEN t.jugador_2_id = p.usuario_id AND t.ganador_id = t.jugador_1_id THEN -t.puntos_arriesgados
            ELSE 0
        END
    ), 0) AS timba_delta
    FROM timba_time t
    WHERE t.estado = 'resuelta'
      AND t.partido_id = p.partido_id
      AND (t.jugador_1_id = p.usuario_id OR t.jugador_2_id = p.usuario_id)
) ts ON true
WHERE p.partido_id = $1
ON CONFLICT (partido_id, usuario_id) DO UPDATE SET delta = EXCLUDED.delta`;

export interface PoblarEvolucionArgs {
    partidoId: number;
}

export async function poblarEvolucion(client: Client, args: PoblarEvolucionArgs): Promise<void> {
    await client.query({
        text: poblarEvolucionQuery,
        values: [args.partidoId],
        rowMode: "array"
    });
}

export const verEvolucionPorUsuarioQuery = `-- name: VerEvolucionPorUsuario :many
SELECT
    e.partido_id,
    e.delta,
    pa.fecha_partido,
    el.nombre AS equipo_local_nombre,
    el.siglas AS equipo_local_siglas,
    ev.nombre AS equipo_visitante_nombre,
    ev.siglas AS equipo_visitante_siglas
FROM estatico_evolucion e
JOIN partidos pa ON pa.id = e.partido_id
JOIN estatico_equipos el ON el.id = pa.equipo_local_id
JOIN estatico_equipos ev ON ev.id = pa.equipo_visitante_id
WHERE e.usuario_id = $1
  AND ($2::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE >= $2::DATE)
  AND ($3::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE <= $3::DATE)
ORDER BY pa.fecha_partido ASC
LIMIT $5::INTEGER OFFSET $4::INTEGER`;

export interface VerEvolucionPorUsuarioArgs {
    usuarioId: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    offset: number;
    limit: number;
}

export interface VerEvolucionPorUsuarioRow {
    partidoId: number;
    delta: number;
    fechaPartido: Date | null;
    equipoLocalNombre: string;
    equipoLocalSiglas: string;
    equipoVisitanteNombre: string;
    equipoVisitanteSiglas: string;
}

export async function verEvolucionPorUsuario(client: Client, args: VerEvolucionPorUsuarioArgs): Promise<VerEvolucionPorUsuarioRow[]> {
    const result = await client.query({
        text: verEvolucionPorUsuarioQuery,
        values: [args.usuarioId, args.fechaInicio, args.fechaFin, args.offset, args.limit],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            partidoId: row[0],
            delta: row[1],
            fechaPartido: row[2],
            equipoLocalNombre: row[3],
            equipoLocalSiglas: row[4],
            equipoVisitanteNombre: row[5],
            equipoVisitanteSiglas: row[6]
        };
    });
}

export const verEvolucionGrupalQuery = `-- name: VerEvolucionGrupal :many
SELECT
    e.usuario_id,
    u.username,
    e.partido_id,
    e.delta,
    pa.fecha_partido,
    el.siglas AS equipo_local_siglas,
    ev.siglas AS equipo_visitante_siglas,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre
FROM estatico_evolucion e
JOIN usuarios u ON u.id = e.usuario_id
JOIN partidos pa ON pa.id = e.partido_id
JOIN estatico_equipos el ON el.id = pa.equipo_local_id
JOIN estatico_equipos ev ON ev.id = pa.equipo_visitante_id
WHERE u.participante = TRUE
  AND ($1::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE >= $1::DATE)
  AND ($2::DATE IS NULL OR (pa.fecha_partido AT TIME ZONE 'America/Lima')::DATE <= $2::DATE)
ORDER BY u.username ASC, pa.fecha_partido ASC`;

export interface VerEvolucionGrupalArgs {
    fechaInicio: string | null;
    fechaFin: string | null;
}

export interface VerEvolucionGrupalRow {
    usuarioId: string;
    username: string;
    partidoId: number;
    delta: number;
    fechaPartido: Date | null;
    equipoLocalSiglas: string;
    equipoVisitanteSiglas: string;
    equipoLocalNombre: string;
    equipoVisitanteNombre: string;
}

export async function verEvolucionGrupal(client: Client, args: VerEvolucionGrupalArgs): Promise<VerEvolucionGrupalRow[]> {
    const result = await client.query({
        text: verEvolucionGrupalQuery,
        values: [args.fechaInicio, args.fechaFin],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            usuarioId: row[0],
            username: row[1],
            partidoId: row[2],
            delta: row[3],
            fechaPartido: row[4],
            equipoLocalSiglas: row[5],
            equipoVisitanteSiglas: row[6],
            equipoLocalNombre: row[7],
            equipoVisitanteNombre: row[8]
        };
    });
}
