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

export async function generarEvolucionPredicciones(
	predicciones: VerMisPrediccionesRow[],
	usuarioUsername: string,
): Promise<Buffer | null> {
	const finalizadas = predicciones
		.filter((p) => p.estado === "finalizado")
		.sort(
			(a, b) =>
				(a.fechaPartido?.getTime() ?? 0) - (b.fechaPartido?.getTime() ?? 0),
		);

	if (finalizadas.length === 0) {
		return null;
	}

	const matches = finalizadas.map((p) => {
		const local = p.equipoLocalSiglas || p.equipoLocalNombre;
		const visitante = p.equipoVisitanteSiglas || p.equipoVisitanteNombre;
		return `${local} vs ${visitante}`;
	});

	const cumulativePoints: number[] = [];
	let running = 0;
	for (const p of finalizadas) {
		running += p.puntosTotal;
		cumulativePoints.push(running);
	}

	try {
		const response = await axios.post<ArrayBuffer>(
			`${config.utility.base_url}/evolution`,
			{
				matches,
				cumulative_points: cumulativePoints,
				title: `Evolución de puntos — ${usuarioUsername}`,
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
