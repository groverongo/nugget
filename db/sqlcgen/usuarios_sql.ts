import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listUsuariosQuery = `-- name: ListUsuarios :many
SELECT id, username, partidos_apostados, partidos_ganados, partidos_perdidos, puntos, racha, win_rate, premio_asociado FROM usuarios`;

export interface ListUsuariosRow {
    id: string;
    username: string;
    partidosApostados: number;
    partidosGanados: number;
    partidosPerdidos: number;
    puntos: number;
    racha: number;
    winRate: string;
    premioAsociado: string | null;
}

export async function listUsuarios(client: Client): Promise<ListUsuariosRow[]> {
    const result = await client.query({
        text: listUsuariosQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            username: row[1],
            partidosApostados: row[2],
            partidosGanados: row[3],
            partidosPerdidos: row[4],
            puntos: row[5],
            racha: row[6],
            winRate: row[7],
            premioAsociado: row[8]
        };
    });
}

export const createUsuarioQuery = `-- name: CreateUsuario :exec
INSERT INTO usuarios (
    id,
    username,
    partidos_apostados,
    partidos_ganados,
    partidos_perdidos,
    puntos,
    racha,
    win_rate
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
`;

export interface CreateUsuarioArgs {
    id: string;
    username: string;
    partidosApostados: number;
    partidosGanados: number;
    partidosPerdidos: number;
    puntos: number;
    racha: number;
    winRate: string;
}

export async function createUsuario(client: Client, args: CreateUsuarioArgs): Promise<void> {
    await client.query({
        text: createUsuarioQuery,
        values: [args.id, args.username, args.partidosApostados, args.partidosGanados, args.partidosPerdidos, args.puntos, args.racha, args.winRate],
        rowMode: "array"
    });
}

export const updateUsuarioPremioQuery = `-- name: UpdateUsuarioPremio :exec
UPDATE usuarios SET
    premio_asociado = $1
WHERE id = $2`;

export interface UpdateUsuarioPremioArgs {
    premioAsociado: string | null;
    id: string;
}

export async function updateUsuarioPremio(client: Client, args: UpdateUsuarioPremioArgs): Promise<void> {
    await client.query({
        text: updateUsuarioPremioQuery,
        values: [args.premioAsociado, args.id],
        rowMode: "array"
    });
}

export const updateUsuarioUsernameQuery = `-- name: UpdateUsuarioUsername :exec
UPDATE usuarios SET
    username = $1
WHERE id = $2`;

export interface UpdateUsuarioUsernameArgs {
    username: string;
    id: string;
}

export async function updateUsuarioUsername(client: Client, args: UpdateUsuarioUsernameArgs): Promise<void> {
    await client.query({
        text: updateUsuarioUsernameQuery,
        values: [args.username, args.id],
        rowMode: "array"
    });
}

export const deleteUsuarioQuery = `-- name: DeleteUsuario :exec
DELETE FROM usuarios
WHERE id = $1`;

export interface DeleteUsuarioArgs {
    id: string;
}

export async function deleteUsuario(client: Client, args: DeleteUsuarioArgs): Promise<void> {
    await client.query({
        text: deleteUsuarioQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const countUsuariosQuery = `-- name: CountUsuarios :one
SELECT COUNT(*) FROM usuarios`;

export interface CountUsuariosRow {
    count: string;
}

export async function countUsuarios(client: Client): Promise<CountUsuariosRow | null> {
    const result = await client.query({
        text: countUsuariosQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

export const limpiezaDistribucionPremiosQuery = `-- name: LimpiezaDistribucionPremios :exec
DELETE FROM estatico_premios`;

export async function limpiezaDistribucionPremios(client: Client): Promise<void> {
    await client.query({
        text: limpiezaDistribucionPremiosQuery,
        values: [],
        rowMode: "array"
    });
}

export const agregarPuestoPremioQuery = `-- name: AgregarPuestoPremio :exec
INSERT INTO estatico_premios (puesto, premio)
VALUES ($1, $2)`;

export interface AgregarPuestoPremioArgs {
    puesto: number;
    premio: string;
}

export async function agregarPuestoPremio(client: Client, args: AgregarPuestoPremioArgs): Promise<void> {
    await client.query({
        text: agregarPuestoPremioQuery,
        values: [args.puesto, args.premio],
        rowMode: "array"
    });
}

