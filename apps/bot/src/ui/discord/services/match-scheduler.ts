import type { VerInformacionPartidoRow } from "@sqlc/partidos_sql";
import type {
	VerParticipantesSinPrediccionRow,
	VerPrediccionesPorPartidoRow,
} from "@sqlc/predicciones_sql";
import type { VerTimbasCerradasPorPartidoRow } from "@sqlc/timba_sql";
import { logger } from "@support/logger";
import { AttachmentBuilder, type Client } from "discord.js";
import type { AppContext } from "../../../app";
import {
	sendAlertsChannel,
	sendAlertsChannelWithFiles,
	sendAnnouncementChannel,
} from "../handlers/interactions";
import { buildAlertaGol } from "../utils/match-announcement";
import { generarHeatmapPredicciones } from "./utility-client";

type Services = AppContext["services"];

function buildAlertaPartido(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
): string {
	const lineas = [
		"🕛 **¡EMPEZÓ EL PARTIDO!**",
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}***`,
		"*Ya no más apuestas* 🙅",
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = new Map<string, string[]>();
	for (const p of predicciones) {
		const key = `${p.prediccionGolesLocal}-${p.prediccionGolesVisitante}`;
		const group = grouped.get(key) ?? [];
		group.push(`<@${p.usuarioId}>`);
		grouped.set(key, group);
	}

	const sorted = [...grouped.entries()].sort(([a], [b]) => {
		const [aL, aV] = a.split("-").map(Number);
		const [bL, bV] = b.split("-").map(Number);
		const totalDiff = bL + bV - (aL + aV);
		return totalDiff !== 0 ? totalDiff : bL - aL;
	});

	for (const [resultado, menciones] of sorted) {
		lineas.push(`${resultado}: ${menciones.join("/")}`);
	}

	return lineas.join("\n");
}

function buildAlertaPrePartido(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
	sinPrediccion: VerParticipantesSinPrediccionRow[],
): string {
	const totalParticipantes = predicciones.length + sinPrediccion.length;
	const count = predicciones.length;

	const timestamp = info.fechaPartido
		? Math.floor(info.fechaPartido.getTime() / 1000)
		: null;
	const horaStr = timestamp ? `<t:${timestamp}:t>` : "";

	const lineas: string[] = [
		"📊 ***Estadísticas pre-partido***",
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}** ${horaStr}*`,
	];

	let sinApostarStr = "";
	if (sinPrediccion.length > 0) {
		sinApostarStr =
			sinPrediccion.length <= 7
				? ` (*Sin apostar:* ${sinPrediccion.map((u) => `<@${u.id}>`).join(", ")})`
				: ` (*Sin apostar:* ${sinPrediccion.length} personas)`;
	}
	lineas.push(
		`- **Total de apuestas:** ${count}/${totalParticipantes}${sinApostarStr}`,
	);

	if (count === 0) return lineas.join("\n");

	const meanL = (
		predicciones.reduce((s, p) => s + p.prediccionGolesLocal, 0) / count
	).toFixed(2);
	const meanV = (
		predicciones.reduce((s, p) => s + p.prediccionGolesVisitante, 0) / count
	).toFixed(2);
	lineas.push(`- **Media de score:** ${meanL}-${meanV}`);

	const sortedL = predicciones
		.map((p) => p.prediccionGolesLocal)
		.sort((a, b) => a - b);
	const sortedV = predicciones
		.map((p) => p.prediccionGolesVisitante)
		.sort((a, b) => a - b);
	const mid = Math.floor(count / 2);
	const medianL =
		count % 2 === 0
			? Math.round((sortedL[mid - 1] + sortedL[mid]) / 2)
			: sortedL[mid];
	const medianV =
		count % 2 === 0
			? Math.round((sortedV[mid - 1] + sortedV[mid]) / 2)
			: sortedV[mid];
	lineas.push(`- **Mediana de score:** ${medianL}-${medianV}`);

	const distinctResults = new Set(
		predicciones.map(
			(p) => `${p.prediccionGolesLocal}-${p.prediccionGolesVisitante}`,
		),
	).size;
	const dispersion = ((distinctResults / count) * 100).toFixed(1);
	lineas.push(`- **Dispersión:** ${dispersion}%`);

	return lineas.join("\n");
}

export async function enviarEstadisticasPrePartido(
	partidoId: number,
	services: Services,
	client: Client,
): Promise<boolean> {
	const [info, predicciones, sinPrediccion, timbas] = await Promise.all([
		services.partidos.verInformacionPartido({ id: partidoId }),
		services.predicciones.verPrediccionesPorPartido({ partidoId }),
		services.predicciones.verParticipantesSinPrediccion({ partidoId }),
		services.timba.verTimbasCerradasPorPartido(partidoId),
	]);
	if (!info) return false;

	const mensaje = buildAlertaPrePartido(info, predicciones, sinPrediccion);
	const heatmap = await generarHeatmapPredicciones(info, predicciones);

	if (heatmap) {
		await sendAlertsChannelWithFiles(client, mensaje, [
			new AttachmentBuilder(heatmap, {
				name: `predicciones-${info.partidoId}.png`,
			}),
		]);
	} else {
		await sendAlertsChannel(client, mensaje);
	}

	if (timbas.length > 0) {
		const partido = `${info.equipoLocalSiglas} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteSiglas} ${info.equipoVisitanteBandera}`;
		const lineas = [
			`_⚔️ **Timba Times en juego** (${partido})_`,
			...timbas.map(
				(t) =>
					`• <@${t.jugador1Id}> 🆚 <@${t.jugador2Id}> — **${t.puntos} 💠** — "${t.descripcion}"`,
			),
		];
		await sendAlertsChannel(client, lineas.join("\n"));
	}

	return true;
}

export async function enviarAlertaInicioPartidoSoloMensaje(
	partidoId: number,
	services: Services,
	client: Client,
): Promise<boolean> {
	const [info, predicciones] = await Promise.all([
		services.partidos.verInformacionPartido({ id: partidoId }),
		services.predicciones.verPrediccionesPorPartido({ partidoId }),
	]);
	if (!info) return false;
	await sendAlertsChannel(client, buildAlertaPartido(info, predicciones));
	return true;
}

export async function enviarAlertaGol(
	partidoId: number,
	equipo: "local" | "visitante",
	services: Services,
	client: Client,
): Promise<boolean> {
	const info = await services.partidos.verInformacionPartido({ id: partidoId });
	if (!info) return false;
	await sendAlertsChannel(client, buildAlertaGol(info, equipo));
	return true;
}

export class MatchScheduler {
	private readonly pending = new Map<number, NodeJS.Timeout>();
	private readonly pendingPreMatch = new Map<number, NodeJS.Timeout>();

	constructor(
		private readonly services: Services,
		private readonly client: Client,
	) {}

	async init(): Promise<void> {
		const partidos = await this.services.partidos.verPartidosNoFinalizados();
		for (const p of partidos) {
			if (p.estado === "programado" && p.fechaPartido !== null) {
				this.schedule(p.partidoId, p.fechaPartido);
			}
		}
		logger.info(
			{ count: this.pending.size },
			"Partidos programados en scheduler de alertas",
		);
	}

	schedule(partidoId: number, fechaPartido: Date): void {
		const existing = this.pending.get(partidoId);
		if (existing !== undefined) clearTimeout(existing);
		const existingPre = this.pendingPreMatch.get(partidoId);
		if (existingPre !== undefined) clearTimeout(existingPre);

		const delay = fechaPartido.getTime() - Date.now();
		if (delay <= 0) return;

		const preMatchDelay = delay - 30 * 60 * 1000;
		if (preMatchDelay > 0) {
			const preTimeout = setTimeout(() => {
				this.pendingPreMatch.delete(partidoId);
				this.fireAlertaPrePartido(partidoId).catch((err) =>
					logger.error(
						{ err, partidoId },
						"Error disparando estadísticas pre-partido",
					),
				);
			}, preMatchDelay);
			this.pendingPreMatch.set(partidoId, preTimeout);
		}

		const timeout = setTimeout(() => {
			this.pending.delete(partidoId);
			this.fireAlerta(partidoId).catch((err) =>
				logger.error({ err, partidoId }, "Error disparando alerta de partido"),
			);
		}, delay);

		this.pending.set(partidoId, timeout);
	}

	private async fireAlertaPrePartido(partidoId: number): Promise<void> {
		await enviarEstadisticasPrePartido(partidoId, this.services, this.client);
	}

	private async fireAlerta(partidoId: number): Promise<void> {
		const [info, predicciones, todasLasTimbas, timbasCerradas] =
			await Promise.all([
				this.services.partidos.verInformacionPartido({ id: partidoId }),
				this.services.predicciones.verPrediccionesPorPartido({ partidoId }),
				this.services.timba.verTimbasPorPartido(partidoId),
				this.services.timba.verTimbasCerradasPorPartido(partidoId),
			]);

		if (!info) return;

		const timbasCanceladas = todasLasTimbas.filter(
			(t) => t.estado === "abierta",
		);

		await Promise.all([
			sendAlertsChannel(this.client, buildAlertaPartido(info, predicciones)),
			this.services.partidos.actualizarPartidoEnVivo(partidoId),
			this.services.timba.cancelarTimbasAbiertas(partidoId),
		]);

		const partido = `${info.equipoLocalSiglas} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteSiglas} ${info.equipoVisitanteBandera}`;

		if (timbasCerradas.length > 0) {
			const lineas = [
				`_⚔️ **Timba Times en juego** (${partido})_`,
				...timbasCerradas.map(
					(t) =>
						`• <@${t.jugador1Id}> 🆚 <@${t.jugador2Id}> — **${t.puntos} 💠** — "${t.descripcion}"`,
				),
			];
			await sendAlertsChannel(this.client, lineas.join("\n"));
		} else {
			await sendAnnouncementChannel(
				this.client,
				`🎰 No hay Timba Times para ${partido}.`,
			);
		}

		if (timbasCanceladas.length === 0) return;

		const lineas = [
			`🚫 **Timba Times canceladas** (${partido}) — nadie las aceptó a tiempo`,
			...timbasCanceladas.map(
				(t) => `• <@${t.jugador1Id}> — **${t.puntos} 💠** — "${t.descripcion}"`,
			),
		];
		await sendAnnouncementChannel(this.client, lineas.join("\n"));
	}
}
