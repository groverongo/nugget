import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAlertsChannel } from "../handlers/interactions";
import { fechaADiscordTimestamp } from "../utils/fecha";

type Services = AppContext["services"];

const scheduledDates = new Set<string>();

const SENT_DATES_FILE = join(process.cwd(), ".resumen-sent-dates.json");

function loadSentDates(): Set<string> {
	try {
		if (!existsSync(SENT_DATES_FILE)) return new Set();
		const arr = JSON.parse(readFileSync(SENT_DATES_FILE, "utf-8")) as string[];
		return new Set(arr);
	} catch {
		return new Set();
	}
}

function markDateSent(date: string): void {
	const dates = loadSentDates();
	dates.add(date);
	const sorted = [...dates].sort().slice(-60);
	try {
		writeFileSync(SENT_DATES_FILE, JSON.stringify(sorted));
	} catch (err) {
		logger.warn({ err }, "No se pudo guardar resumen-sent-dates");
	}
}

function toDatePeru(date: Date): string {
	const peru = new Date(date.getTime() - 5 * 60 * 60 * 1000);
	return peru.toISOString().split("T")[0];
}

async function sendResumen(
	date: string,
	services: Services,
	client: Client,
): Promise<void> {
	const mensaje = await buildResumenDia(date, services);
	await sendAlertsChannel(client, mensaje);
	markDateSent(date);
}

export async function enviarResumenDia(
	date: string,
	services: Services,
	client: Client,
): Promise<void> {
	await sendResumen(date, services, client);
}

export async function checkAndScheduleEndOfDay(
	fechaPartido: Date,
	services: Services,
	client: Client,
): Promise<void> {
	const date = toDatePeru(fechaPartido);
	if (scheduledDates.has(date)) return;
	if (loadSentDates().has(date)) return;

	const partidos = await services.partidos.verPartidosPorFecha({ date });
	if (partidos.length === 0) return;

	const todosFinalizados = partidos.every((p) => p.estado === "finalizado");
	if (!todosFinalizados) return;

	scheduledDates.add(date);
	logger.info({ date }, "Resumen del día programado para en 1 hora");

	setTimeout(
		async () => {
			try {
				await sendResumen(date, services, client);
			} catch (err) {
				logger.error({ err, date }, "Error enviando resumen del día");
			} finally {
				scheduledDates.delete(date);
			}
		},
		60 * 60 * 1000,
	);
}

export async function initEndOfDayScheduler(
	services: Services,
	client: Client,
): Promise<void> {
	const now = new Date();
	const sent = loadSentDates();

	for (const offsetDays of [1, 0]) {
		const checkDate = new Date(
			now.getTime() - offsetDays * 24 * 60 * 60 * 1000,
		);
		const date = toDatePeru(checkDate);
		if (sent.has(date)) continue;
		if (scheduledDates.has(date)) continue;

		const partidos = await services.partidos.verPartidosPorFecha({ date });
		if (partidos.length === 0) continue;
		const todosFinalizados = partidos.every((p) => p.estado === "finalizado");
		if (!todosFinalizados) continue;

		// Find latest fecha_partido to estimate when summary should have fired
		const maxFechaMs = Math.max(
			...partidos
				.map((p) => p.fechaPartido?.getTime() ?? 0)
				.filter((t) => t > 0),
		);
		if (maxFechaMs === 0) continue;

		// Summary should fire 1h after admin finalizes last match.
		// Estimate: match ends ~2h after start, admin finalizes ~30min later,
		// so summary expected at fechaPartido + 3.5h. We catch up if within 12h.
		const expectedResumenMs = maxFechaMs + 3.5 * 60 * 60 * 1000;
		const nowMs = now.getTime();

		if (nowMs < maxFechaMs + 60 * 60 * 1000) continue; // too early, normal flow handles it
		if (nowMs > expectedResumenMs + 12 * 60 * 60 * 1000) continue; // too late, assume sent

		scheduledDates.add(date);
		logger.info({ date }, "Startup: recuperando resumen del día perdido");

		setTimeout(async () => {
			try {
				await sendResumen(date, services, client);
			} catch (err) {
				logger.error({ err, date }, "Error recuperando resumen del día");
			} finally {
				scheduledDates.delete(date);
			}
		}, 15_000);
	}
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

		const [predicciones, timbas] = await Promise.all([
			services.predicciones.verPrediccionesResumenPartido({
				partidoId: partido.partidoId,
			}),
			services.timba.verTimbasResueltasPorPartido(partido.partidoId),
		]);

		if (predicciones.length === 0) {
			lineas.push("_Nadie predijo este partido._");
		} else {
			const exactos: string[] = [];
			const bienIntentos: string[] = [];
			let puntosBI = 0;
			const fallados: string[] = [];

			for (const p of predicciones) {
				const esExacto =
					p.prediccionGolesLocal === gL && p.prediccionGolesVisitante === gV;

				if (esExacto) {
					const bonusStr = p.puntosEnRacha > 0 ? " 🔥" : "";
					exactos.push(`<@${p.usuarioId}> (+${p.puntosTotal} 💠${bonusStr})`);
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
						existing.total = p.puntosAcumulados;
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
			if (fallados.length > 0)
				lineas.push(`❌ Fallaron: ${fallados.join(", ")}`);
		}

		if (timbas.length > 0) {
			lineas.push("🎰 Timba Times:");
			for (const t of timbas) {
				const ganadorMencion = `<@${t.ganadorId}>`;
				const perdedorId =
					t.ganadorId === t.jugador1Id ? t.jugador2Id : t.jugador1Id;
				lineas.push(
					`• ${ganadorMencion} 👑 le robó **${t.puntos} 💠** a <@${perdedorId}> — "${t.descripcion}"`,
				);
			}
		}
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
