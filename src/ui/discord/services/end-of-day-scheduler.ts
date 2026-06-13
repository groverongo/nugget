import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAlertsChannel } from "../handlers/interactions";
import { fechaADiscordTimestamp } from "../utils/fecha";

type Services = AppContext["services"];

const scheduledDates = new Set<string>();

function toDatePeru(date: Date): string {
	const peru = new Date(date.getTime() - 5 * 60 * 60 * 1000);
	return peru.toISOString().split("T")[0];
}

export async function enviarResumenDia(
	date: string,
	services: Services,
	client: Client,
): Promise<void> {
	const mensaje = await buildResumenDia(date, services);
	await sendAlertsChannel(client, mensaje);
}

export async function checkAndScheduleEndOfDay(
	fechaPartido: Date,
	services: Services,
	client: Client,
): Promise<void> {
	const date = toDatePeru(fechaPartido);
	if (scheduledDates.has(date)) return;

	const partidos = await services.partidos.verPartidosPorFecha({ date });
	if (partidos.length === 0) return;

	const todosFinalizados = partidos.every((p) => p.estado === "finalizado");
	if (!todosFinalizados) return;

	scheduledDates.add(date);
	logger.info({ date }, "Resumen del día programado para en 1 hora");

	setTimeout(
		async () => {
			try {
				const mensaje = await buildResumenDia(date, services);
				await sendAlertsChannel(client, mensaje);
			} catch (err) {
				logger.error({ err, date }, "Error enviando resumen del día");
			} finally {
				scheduledDates.delete(date);
			}
		},
		60 * 60 * 1000,
	);
}

async function buildResumenDia(
	date: string,
	services: Services,
): Promise<string> {
	const partidos = await services.partidos.verPartidosPorFecha({ date });
	const finalizados = partidos.filter((p) => p.estado === "finalizado");

	const lineas: string[] = [
		`📊 ***Resumen del día** — <t:${fechaADiscordTimestamp(date)}:D>*`,
	];

	const ganadores = new Map<string, { hoy: number; total: number }>();

	for (const partido of finalizados) {
		const gL = partido.partidoGolesLocal ?? 0;
		const gV = partido.partidoGolesVisitante ?? 0;

		lineas.push("");
		lineas.push(
			`${partido.equipoLocalBandera} **${partido.equipoLocalSiglas} ${gL}-${gV} ${partido.equipoVisitanteSiglas}** ${partido.equipoVisitanteBandera}`,
		);

		const predicciones =
			await services.predicciones.verPrediccionesResumenPartido({
				partidoId: partido.partidoId,
			});

		if (predicciones.length === 0) {
			lineas.push("_Nadie predijo este partido._");
			continue;
		}

		const exactos: string[] = [];
		const bienIntentos: string[] = [];
		let puntosBI = 0;
		const fallados: string[] = [];

		for (const p of predicciones) {
			const esExacto =
				p.prediccionGolesLocal === gL && p.prediccionGolesVisitante === gV;

			if (esExacto) {
				const bonusStr = p.puntosEnRacha > 0 ? ` +${p.puntosEnRacha} 🔥` : "";
				exactos.push(`<@${p.usuarioId}> (+${p.puntosBase} 💠${bonusStr})`);
			} else if (p.puntosTotal > 0) {
				bienIntentos.push(`<@${p.usuarioId}>`);
				puntosBI = p.puntosTotal;
			} else {
				fallados.push(`<@${p.usuarioId}>`);
			}

			if (p.puntosTotal > 0) {
				const existing = ganadores.get(p.usuarioId);
				if (existing) {
					existing.hoy += p.puntosTotal;
				} else {
					ganadores.set(p.usuarioId, {
						hoy: p.puntosTotal,
						total: p.puntosAcumulados,
					});
				}
			}
		}

		if (exactos.length > 0) lineas.push(`✅ Exacto: ${exactos.join(", ")}`);
		if (bienIntentos.length > 0)
			lineas.push(
				`⚡ Buen intento (+${puntosBI} 💠): ${bienIntentos.join(", ")}`,
			);
		if (fallados.length > 0) lineas.push(`❌ Fallaron: ${fallados.join(", ")}`);
	}

	if (ganadores.size > 0) {
		lineas.push("");
		lineas.push("────────────────────");
		lineas.push("✴️ ***Ganadores del día:***");

		const sorted = [...ganadores.entries()].sort(
			([, a], [, b]) => b.hoy - a.hoy,
		);
		for (const [userId, { hoy, total }] of sorted) {
			lineas.push(`• <@${userId}> **+${hoy}** 💠 (total: ${total})`);
		}
	}

	return lineas.join("\n");
}
