import type { VerPrediccionesAwardsRow } from "@sqlc/awards_sql";
import { config } from "@support/config";
import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAlertsChannel } from "../handlers/interactions";

type Services = AppContext["services"];

function groupBy(
	rows: VerPrediccionesAwardsRow[],
	label: (r: VerPrediccionesAwardsRow) => string,
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const r of rows) {
		const key = label(r);
		const group = map.get(key) ?? [];
		group.push(`<@${r.usuarioId}>`);
		map.set(key, group);
	}
	return map;
}

function renderCategoria(
	titulo: string,
	groups: Map<string, string[]>,
): string {
	const lineas = [`**${titulo}**`];
	for (const [label, menciones] of groups) {
		lineas.push(`• ${label}: ${menciones.join(", ")}`);
	}
	return lineas.join("\n");
}

function buildAlertaAwards(rows: VerPrediccionesAwardsRow[]): string {
	if (rows.length === 0) {
		return "🏆 **¡CIERRE DE PREDICCIONES DE AWARDS!**\n_Nadie registró predicciones._";
	}

	const categorias = [
		renderCategoria(
			"🥇 Campeón del mundo",
			groupBy(rows, (r) => `${r.campeonNombre} ${r.campeonBandera}`),
		),
		renderCategoria(
			"⚽ Goleador del torneo",
			groupBy(rows, (r) => r.goleadorNombre),
		),
		renderCategoria(
			"🎖️ Balón de Oro",
			groupBy(rows, (r) => r.mejorJugadorNombre),
		),
		renderCategoria(
			"🧤 Guante de Oro",
			groupBy(rows, (r) => r.mejorArqueroNombre),
		),
		renderCategoria(
			"🌟 Mejor Jugador Joven",
			groupBy(rows, (r) => r.mejorJugadorJovenNombre),
		),
		renderCategoria(
			"💥 Premio Puskás",
			groupBy(rows, (r) => r.mejorGolNombre),
		),
		renderCategoria(
			"🤡 White Horse (Decepción)",
			groupBy(
				rows,
				(r) => `${r.seleccionDecepcionNombre} ${r.seleccionDecepcionBandera}`,
			),
		),
		renderCategoria(
			"🐴 Dark Horse (Sorpresa)",
			groupBy(
				rows,
				(r) => `${r.seleccionSorpresaNombre} ${r.seleccionSorpresaBandera}`,
			),
		),
	];

	return ["🏆 **¡CIERRE DE PREDICCIONES DE AWARDS!**", "", ...categorias].join(
		"\n",
	);
}

export class AwardsScheduler {
	constructor(
		private readonly services: Services,
		private readonly client: Client,
	) {}

	init(): void {
		const fechaCierre = new Date(config.polla.fecha_cierre_awards);
		const delay = fechaCierre.getTime() - Date.now();

		if (delay <= 0) {
			logger.info("Alerta de awards ya pasó, no se programa.");
			return;
		}

		setTimeout(() => {
			this.fireAlerta().catch((err) =>
				logger.error({ err }, "Error disparando alerta de awards"),
			);
		}, delay);

		logger.info(
			{ fechaCierre: fechaCierre.toISOString(), delayMs: delay },
			"Alerta de awards programada",
		);
	}

	private async fireAlerta(): Promise<void> {
		const rows = await this.services.awards.verPrediccionesAwards();
		await sendAlertsChannel(this.client, buildAlertaAwards(rows));
	}
}
