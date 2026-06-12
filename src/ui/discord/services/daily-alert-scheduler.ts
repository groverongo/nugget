import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { buildAlertaDiariaPartidosComponents } from "../components/partidos";
import { sendComponentsToAlertsChannel } from "../handlers/interactions";
import { obtenerYYYYMMDDPeru } from "../utils/fecha";

type Services = AppContext["services"];

function getNext9amPeru(): Date {
	// Peru = UTC-5, so 9am Peru = 14:00 UTC
	const next = new Date();
	next.setUTCHours(14, 0, 0, 0);
	if (Date.now() >= next.getTime()) {
		next.setUTCDate(next.getUTCDate() + 1);
	}
	return next;
}

export class DailyAlertScheduler {
	constructor(
		private readonly services: Services,
		private readonly client: Client,
	) {}

	init(): void {
		this.scheduleNext();
	}

	private scheduleNext(): void {
		const next = getNext9amPeru();
		const delay = next.getTime() - Date.now();
		logger.info(
			{ nextAlert: next.toISOString() },
			"Alerta diaria de partidos programada",
		);
		setTimeout(() => {
			this.fire().catch((err) =>
				logger.error({ err }, "Error en alerta diaria de partidos"),
			);
		}, delay);
	}

	private async fire(): Promise<void> {
		try {
			const hoy = obtenerYYYYMMDDPeru();
			const partidos = await this.services.partidos.verPartidosPorFecha({
				date: hoy,
			});
			const programados = partidos.filter((p) => p.estado === "programado");

			if (programados.length > 0) {
				await sendComponentsToAlertsChannel(
					this.client,
					buildAlertaDiariaPartidosComponents(programados),
				);
			}
		} finally {
			this.scheduleNext();
		}
	}
}
