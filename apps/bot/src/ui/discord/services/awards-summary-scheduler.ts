import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import type { AwardGanadoresGrupo } from "../../../interface/service/awards.service";
import { sendAlertsChannel } from "../handlers/interactions";

type Services = AppContext["services"];

const RESUMEN_FINAL_DELAY_MS = 5 * 60 * 1000;

let resumenFinalProgramado = false;

function buildResumenFinalMessage(grupos: AwardGanadoresGrupo[]): string {
	const porUsuario = new Map<
		string,
		{ username: string; puntos: number; detalles: string[] }
	>();

	for (const grupo of grupos) {
		for (const g of grupo.ganadores) {
			const actual = porUsuario.get(g.usuarioId) ?? {
				username: g.username,
				puntos: 0,
				detalles: [],
			};
			actual.puntos += g.puntos;
			actual.detalles.push(g.detalle);
			porUsuario.set(g.usuarioId, actual);
		}
	}

	if (porUsuario.size === 0) {
		return "🏆 _**Resumen final de Awards**_\n\n_Nadie ganó puntos de awards._";
	}

	const ranking = [...porUsuario.entries()]
		.sort(([, a], [, b]) => b.puntos - a.puntos)
		.map(
			([usuarioId, r], index) =>
				`${index + 1}. <@${usuarioId}> **+${r.puntos}** 💠 (${r.detalles.join(", ")})`,
		);

	return ["🏆 _**Resumen final de Awards**_", "", ...ranking].join("\n");
}

export async function enviarResumenFinalAwards(
	services: Services,
	client: Client,
): Promise<void> {
	const grupos = await services.awards.calcularGanadoresPorAward();
	await sendAlertsChannel(client, buildResumenFinalMessage(grupos));
}

export async function verificarYProgramarResumenFinal(
	services: Services,
	client: Client,
): Promise<void> {
	if (resumenFinalProgramado) return;

	const grupos = await services.awards.calcularGanadoresPorAward();
	if (!grupos.every((g) => g.resuelto)) return;

	resumenFinalProgramado = true;
	logger.info(
		"Los 12 awards quedaron resueltos, programando resumen final en 5 minutos.",
	);

	setTimeout(() => {
		enviarResumenFinalAwards(services, client).catch((err) =>
			logger.error({ err }, "Error enviando el resumen final de awards"),
		);
	}, RESUMEN_FINAL_DELAY_MS);
}
