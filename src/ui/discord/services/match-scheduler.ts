import type {
	VerInformacionPartidoRow,
} from "@sqlc/partidos_sql";
import type { VerPrediccionesPorPartidoRow } from "@sqlc/predicciones_sql";
import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAnnouncementChannel } from "../handlers/interactions";

type Services = AppContext["services"];

function buildAlertaPartido(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
): string {
	const lineas = [
		`🕛 **¡EMPEZÓ EL PARTIDO!**`,
		`**${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}**`,
		`*Ya no más apuestas* 🙅`,
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

	// Orden: total goles desc, goles local desc
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

export class MatchScheduler {
	private readonly pending = new Map<number, NodeJS.Timeout>();

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

		const delay = fechaPartido.getTime() - Date.now();
		if (delay <= 0) return;

		const timeout = setTimeout(() => {
			this.pending.delete(partidoId);
			this.fireAlerta(partidoId).catch((err) =>
				logger.error({ err, partidoId }, "Error disparando alerta de partido"),
			);
		}, delay);

		this.pending.set(partidoId, timeout);
	}

	private async fireAlerta(partidoId: number): Promise<void> {
		const [info, predicciones] = await Promise.all([
			this.services.partidos.verInformacionPartido({ id: partidoId }),
			this.services.predicciones.verPrediccionesPorPartido({ partidoId }),
		]);

		if (!info) return;

		await sendAnnouncementChannel(this.client, buildAlertaPartido(info, predicciones));
	}
}
