import type { VerInformacionPartidoRow } from "@sqlc/partidos_sql";
import type {
	VerMisPrediccionesRow,
	VerPrediccionesPorPartidoRow,
} from "@sqlc/predicciones_sql";
import { config } from "@support/config";
import { logger } from "@support/logger";
import axios from "axios";

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

	const matches = predicciones.map((p) => {
		const local = p.equipoLocalSiglas || p.equipoLocalNombre;
		const visitante = p.equipoVisitanteSiglas || p.equipoVisitanteNombre;
		return `${local} vs ${visitante}`;
	});

	const cumulativePoints = predicciones.map((p) => {
		const cumulative = parseFloat(p.puntosAcumuladosConTimba);
		return isNaN(cumulative) ? 0 : cumulative;
	});

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/evolution`,
			{
				matches,
				cumulative_points: cumulativePoints,
				title: `Evolución de puntos (predicciones + timbas) — ${usuarioUsername}`,
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
