import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAlertsChannel } from "../handlers/interactions";
import { fechaADiscordTimestamp } from "../utils/fecha";

type Services = AppContext["services"];

const scheduledDates = new Set<string>();

const DELAY_MS = 15 * 60 * 1000;
const CATCHUP_WINDOW_MS = 12 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_OFFSET_DAYS = [1, 0];

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
	await services.partidos.marcarResumenDiaEnviado(date);
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
	if (await services.partidos.verResumenDiaEnviado(date)) return;

	const partidos = await services.partidos.verPartidosPorFecha({ date });
	if (partidos.length === 0) return;

	const todosFinalizados = partidos.every((p) => p.estado === "finalizado");
	if (!todosFinalizados) return;

	scheduledDates.add(date);
	logger.info({ date }, "Resumen del día programado para en 15 minutos");

	setTimeout(async () => {
		try {
			await sendResumen(date, services, client);
		} catch (err) {
			logger.error({ err, date }, "Error enviando resumen del día");
		} finally {
			scheduledDates.delete(date);
		}
	}, DELAY_MS);
}

export async function initEndOfDayScheduler(
	services: Services,
	client: Client,
): Promise<void> {
	const now = new Date();

	for (const offsetDays of CHECK_OFFSET_DAYS) {
		const checkDate = new Date(now.getTime() - offsetDays * DAY_MS);
		const date = toDatePeru(checkDate);

		if (await services.partidos.verResumenDiaEnviado(date)) continue;
		if (scheduledDates.has(date)) continue;

		const partidos = await services.partidos.verPartidosPorFecha({ date });
		if (partidos.length === 0) continue;
		const todosFinalizados = partidos.every((p) => p.estado === "finalizado");
		if (!todosFinalizados) continue;

		const maxFechaMs = Math.max(
			...partidos
				.map((p) => p.fechaPartido?.getTime() ?? 0)
				.filter((t) => t > 0),
		);
		if (maxFechaMs === 0) continue;

		const nowMs = now.getTime();

		if (nowMs < maxFechaMs + DELAY_MS) continue;
		if (nowMs > maxFechaMs + CATCHUP_WINDOW_MS) continue;

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

		const extras: string[] = [];
		if (partido.extraPartidazo) extras.push("💥 Partidazo");
		if (partido.extraMilagro) extras.push("✝️ Milagro");
		if (partido.extraBatacazo) extras.push("🎯 Batacazo");
		if (partido.extraElElegido) extras.push("👑 El Elegido");
		if (extras.length > 0) lineas.push(`_${extras.join(" · ")}_`);

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
			let puntosExactoBase = 0;
			const bienIntentos: string[] = [];
			let puntosBI = 0;
			let fallados = 0;

			for (const p of predicciones) {
				const esExacto =
					p.prediccionGolesLocal === gL && p.prediccionGolesVisitante === gV;

				if (esExacto) {
					puntosExactoBase = p.puntosTotal - p.puntosEnRacha;
					const rachaStr = p.puntosEnRacha > 0 ? ` +${p.puntosEnRacha} 🔥` : "";
					exactos.push(`<@${p.usuarioId}>${rachaStr}`);
				} else if (p.puntosTotal > 0) {
					bienIntentos.push(`<@${p.usuarioId}>`);
					puntosBI = p.puntosTotal;
				} else {
					fallados++;
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

			if (exactos.length > 0)
				lineas.push(
					`✅ Exacto (+${puntosExactoBase} 💠): ${exactos.join(", ")}`,
				);
			if (bienIntentos.length > 0)
				lineas.push(
					`⚡ Buen intento (+${puntosBI} 💠): ${bienIntentos.join(", ")}`,
				);
			if (fallados > 0 && exactos.length === 0 && bienIntentos.length === 0)
				lineas.push("❌ Fallaron todos los jugadores.");
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

				const existingGanador = ganadores.get(t.ganadorId);
				if (existingGanador) {
					existingGanador.hoy += t.puntos;
				} else {
					ganadores.set(t.ganadorId, { hoy: t.puntos, total: 0 });
				}

				const existingPerdedor = ganadores.get(perdedorId);
				if (existingPerdedor) {
					existingPerdedor.hoy -= t.puntos;
				} else {
					ganadores.set(perdedorId, { hoy: -t.puntos, total: 0 });
				}
			}
		}
	}

	if (ganadores.size > 0) {
		lineas.push("");
		lineas.push("────────────────────");
		lineas.push("✴️ ***Puntos otorgados del día:***");

		const sorted = [...ganadores.entries()].sort(
			([, a], [, b]) => b.hoy - a.hoy,
		);
		for (const [userId, { hoy, total }] of sorted) {
			const signo = hoy >= 0 ? "+" : "";
			const totalStr = total > 0 ? ` (total: ${total})` : "";
			lineas.push(`• <@${userId}> **${signo}${hoy}** 💠${totalStr}`);
		}
	}

	return lineas.join("\n");
}
