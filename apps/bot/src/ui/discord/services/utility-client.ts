import type {
	VerEvolucionGrupalRow,
	VerEvolucionPorUsuarioRow,
} from "@sqlc/evolucion_sql";
import type { VerInformacionPartidoRow } from "@sqlc/partidos_sql";
import type {
	VerMisPrediccionesRow,
	VerPrediccionesPorPartidoRow,
} from "@sqlc/predicciones_sql";
import { config } from "@support/config";
import { logger } from "@support/logger";
import axios from "axios";

type MatchEntry = {
	name: string;
	accumulated_points: number;
	date: string;
};

function toPeruDateString(date: Date | null): string {
	if (!date) return "";
	return date.toLocaleDateString("sv-SE", { timeZone: "America/Lima" });
}

function matchLabel(
	localSiglas: string,
	visitanteSiglas: string,
	localNombre: string,
	visitanteNombre: string,
): string {
	const local = localSiglas || localNombre;
	const visitante = visitanteSiglas || visitanteNombre;
	return `${local} vs ${visitante}`;
}

type HeatmapRequest = {
	duples: [number, number][];
	resolution: number;
	title: string;
	x_label: string;
	y_label: string;
};

function buildHeatmapPayload(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
): HeatmapRequest {
	return {
		duples: predicciones.map((prediccion) => [
			prediccion.prediccionGolesLocal,
			prediccion.prediccionGolesVisitante,
		]),
		resolution: 300,
		title: `Predicciones para ${info.equipoLocalNombre} vs ${info.equipoVisitanteNombre}`,
		x_label: info.equipoLocalNombre,
		y_label: info.equipoVisitanteNombre,
	};
}

export async function generarHeatmapPredicciones(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
): Promise<Buffer | null> {
	if (predicciones.length === 0) {
		return null;
	}

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/heatmap`,
			buildHeatmapPayload(info, predicciones),
			{
				responseType: "arraybuffer",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		return Buffer.from(response.data);
	} catch (error) {
		logger.error(
			{
				err: error,
				partidoId: info.partidoId,
				utilityBaseUrl: config.utility.base_url,
			},
			"Error generando heatmap de predicciones",
		);
		return null;
	}
}

export async function revisarPromptTimba(
	descripcion: string,
): Promise<{ safe: boolean; reason: string | null } | null> {
	try {
		const response = await axios.post<{ safe: boolean; reason: string | null }>(
			`${config.utility.base_url}/prompt/review`,
			{ timba: descripcion },
			{ headers: { "Content-Type": "application/json" } },
		);
		return response.data;
	} catch (error) {
		logger.error(
			{ err: error, utilityBaseUrl: config.utility.base_url },
			"Error revisando prompt de timba",
		);
		return null;
	}
}

export async function revisarTimba(
	descripcion: string,
	contexto?: string,
): Promise<{
	categoria: "valida" | "mafia" | "contexto";
	justificacion: string;
} | null> {
	try {
		const response = await axios.post<{
			categoria: "valida" | "mafia" | "contexto";
			justificacion: string;
		}>(
			`${config.utility.base_url}/timba/review`,
			{ timba: descripcion, contexto: contexto ?? null },
			{ headers: { "Content-Type": "application/json" } },
		);
		return response.data;
	} catch (error) {
		logger.error(
			{ err: error, utilityBaseUrl: config.utility.base_url },
			"Error revisando timba con LLM",
		);
		return null;
	}
}

export async function generarEvolucionPredicciones(
	predicciones: VerMisPrediccionesRow[],
	usuarioUsername: string,
): Promise<Buffer | null> {
	if (predicciones.length === 0) {
		return null;
	}

	const matches: MatchEntry[] = predicciones.map((p) => ({
		name: matchLabel(
			p.equipoLocalSiglas,
			p.equipoVisitanteSiglas,
			p.equipoLocalNombre,
			p.equipoVisitanteNombre,
		),
		accumulated_points: (() => {
			const v = parseFloat(p.puntosAcumuladosConTimba);
			return isNaN(v) ? 0 : Math.round(v);
		})(),
		date: toPeruDateString(p.fechaPartido),
	}));

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/evolution`,
			{
				title: `Evolución de puntos — ${usuarioUsername}`,
				matches,
			},
			{
				responseType: "arraybuffer",
				headers: { "Content-Type": "application/json" },
			},
		);

		return Buffer.from(response.data);
	} catch (error) {
		logger.error(
			{ err: error, utilityBaseUrl: config.utility.base_url },
			"Error generando gráfico de evolución de predicciones",
		);
		return null;
	}
}

export async function generarEvolucionPorRango(
	rows: VerEvolucionPorUsuarioRow[],
	usuarioUsername: string,
): Promise<Buffer | null> {
	if (rows.length === 0) {
		return null;
	}

	let acumulado = 0;
	const matches: MatchEntry[] = rows.map((r) => {
		acumulado += r.delta;
		return {
			name: matchLabel(
				r.equipoLocalSiglas,
				r.equipoVisitanteSiglas,
				r.equipoLocalNombre,
				r.equipoVisitanteNombre,
			),
			accumulated_points: acumulado,
			date: toPeruDateString(r.fechaPartido),
		};
	});

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/evolution`,
			{
				title: `Evolución de puntos — ${usuarioUsername}`,
				matches,
			},
			{
				responseType: "arraybuffer",
				headers: { "Content-Type": "application/json" },
			},
		);

		return Buffer.from(response.data);
	} catch (error) {
		logger.error(
			{ err: error, utilityBaseUrl: config.utility.base_url },
			"Error generando gráfico de evolución por rango",
		);
		return null;
	}
}

export async function generarEvolucionGrupal(
	rows: VerEvolucionGrupalRow[],
	title: string,
): Promise<Buffer | null> {
	if (rows.length === 0) {
		return null;
	}

	// Group rows by usuario_id and compute cumulative per user
	const byUser = new Map<string, { username: string; series: MatchEntry[] }>();
	for (const row of rows) {
		if (!byUser.has(row.usuarioId)) {
			byUser.set(row.usuarioId, { username: row.username, series: [] });
		}
		const user = byUser.get(row.usuarioId)!;
		const prev = user.series.at(-1)?.accumulated_points ?? 0;
		user.series.push({
			name: matchLabel(
				row.equipoLocalSiglas,
				row.equipoVisitanteSiglas,
				row.equipoLocalNombre,
				row.equipoVisitanteNombre,
			),
			accumulated_points: prev + row.delta,
			date: toPeruDateString(row.fechaPartido),
		});
	}

	// Rank by final accumulated points → top 10 + bottom 3 (deduplicated)
	const ranked = [...byUser.values()].sort((a, b) => {
		const aFinal = a.series.at(-1)?.accumulated_points ?? 0;
		const bFinal = b.series.at(-1)?.accumulated_points ?? 0;
		return bFinal - aFinal;
	});

	const top10 = ranked.slice(0, 10);
	const bottom3 = ranked.slice(-3).filter((u) => !top10.includes(u));
	const selected = [...top10, ...bottom3];

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/evolution-group`,
			{
				title,
				users: selected.map((u) => ({
					username: u.username,
					series: u.series,
				})),
			},
			{
				responseType: "arraybuffer",
				headers: { "Content-Type": "application/json" },
			},
		);

		return Buffer.from(response.data);
	} catch (error) {
		logger.error(
			{ err: error, utilityBaseUrl: config.utility.base_url },
			"Error generando gráfico de evolución grupal",
		);
		return null;
	}
}
