import type { VerPrediccionesAwardsKORow } from "@sqlc/awards_sql";
import { config } from "@support/config";
import { logger } from "@support/logger";
import type { Client } from "discord.js";
import type { AppContext } from "../../../app";
import { sendAlertsChannel } from "../handlers/interactions";

type Services = AppContext["services"];

function groupBy(
	rows: VerPrediccionesAwardsKORow[],
	label: (r: VerPrediccionesAwardsKORow) => string,
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

function buildAlertaCierreAwardsKO(rows: VerPrediccionesAwardsKORow[]): string {
	if (rows.length === 0) {
		return "🏆 **¡CIERRE DE PREDICCIONES DE AWARDS ELIMINATORIAS!**\n_Nadie registró predicciones._";
	}

	const categorias = [
		renderCategoria(
			"🥈 Finalistas",
			groupBy(
				rows,
				(r) =>
					`${r.finalista1Bandera} ${r.finalista1Nombre} vs ${r.finalista2Bandera} ${r.finalista2Nombre}`,
			),
		),
		renderCategoria(
			"🥇 Campeón final",
			groupBy(rows, (r) => `${r.campeonBandera} ${r.campeonNombre}`),
		),
		renderCategoria(
			"⚽ Mejor partido (equipos)",
			groupBy(
				rows,
				(r) =>
					`${r.mejorPartidoEquipo1Bandera} ${r.mejorPartidoEquipo1Nombre} vs ${r.mejorPartidoEquipo2Bandera} ${r.mejorPartidoEquipo2Nombre}`,
			),
		),
		renderCategoria(
			"⚽ Mejor partido (más goles)",
			groupBy(rows, (r) =>
				r.mejorPartidoMasGolesNombre
					? `${r.mejorPartidoMasGolesBandera} ${r.mejorPartidoMasGolesNombre}`
					: "Empate",
			),
		),
		renderCategoria(
			"🔁 Número de suplementarios",
			groupBy(rows, (r) => String(r.awardKoNumSuplementarios ?? "?")),
		),
		renderCategoria(
			"👟 Goleador KO",
			groupBy(rows, (r) => r.goleadorKoNombre),
		),
	];

	return [
		"🏆 **¡CIERRE DE PREDICCIONES DE AWARDS ELIMINATORIAS!**",
		...categorias,
	].join("\n\n");
}

export async function enviarAlertaCierreAwardsKO(
	services: Services,
	client: Client,
): Promise<void> {
	const rows = await services.awards.verPrediccionesAwardsKO();
	await sendAlertsChannel(client, buildAlertaCierreAwardsKO(rows));
}

export async function enviarAlertaFaltanAwardsKO(
	services: Services,
	client: Client,
): Promise<void> {
	const [todosUsuarios, conAwardsKO] = await Promise.all([
		services.usuarios.listUsuarios(),
		services.awards.verPrediccionesAwardsKO(),
	]);

	const conAwardsKOIds = new Set(conAwardsKO.map((r) => r.usuarioId));
	const participantes = todosUsuarios.filter((u) => u.participante);
	const faltan = participantes.filter((u) => !conAwardsKOIds.has(u.id));

	if (faltan.length === 0) {
		await sendAlertsChannel(
			client,
			"✅ **¡Todos ya enviaron sus Awards Eliminatorias!** 🎉",
		);
		return;
	}

	const menciones = faltan.map((u) => `<@${u.id}>`).join(", ");
	await sendAlertsChannel(
		client,
		`⏰ **¡Quedan 12 horas para cerrar las Awards Eliminatorias!**\n\nFaltan enviar sus predicciones: ${menciones}\n\n_Usá \`/predecir-awards-ko\` para registrarlas antes de las 2pm._`,
	);
}

export class AwardsKOScheduler {
	constructor(
		private readonly services: Services,
		private readonly client: Client,
	) {}

	init(): void {
		const fechaCierre = new Date(config.polla.fecha_cierre_awards_ko);
		const fechaAviso = new Date(fechaCierre.getTime() - 12 * 60 * 60 * 1000);

		const delayAviso = fechaAviso.getTime() - Date.now();
		const delayCierre = fechaCierre.getTime() - Date.now();

		if (delayAviso > 0) {
			setTimeout(() => {
				enviarAlertaFaltanAwardsKO(this.services, this.client).catch((err) =>
					logger.error({ err }, "Error disparando alerta previa de awards KO"),
				);
			}, delayAviso);
			logger.info(
				{ fechaAviso: fechaAviso.toISOString(), delayMs: delayAviso },
				"Alerta previa de awards KO programada",
			);
		} else if (delayCierre > 0) {
			// El bot arrancó después de la hora de aviso pero antes del cierre: disparar ya
			enviarAlertaFaltanAwardsKO(this.services, this.client).catch((err) =>
				logger.error(
					{ err },
					"Error disparando alerta previa de awards KO (tardía)",
				),
			);
			logger.info(
				"Alerta previa de awards KO ya pasó, disparando inmediatamente.",
			);
		} else {
			logger.info("Alerta previa de awards KO ya pasó, no se programa.");
		}

		if (delayCierre > 0) {
			setTimeout(() => {
				enviarAlertaCierreAwardsKO(this.services, this.client).catch((err) =>
					logger.error(
						{ err },
						"Error disparando alerta de cierre de awards KO",
					),
				);
			}, delayCierre);
			logger.info(
				{ fechaCierre: fechaCierre.toISOString(), delayMs: delayCierre },
				"Alerta de cierre de awards KO programada",
			);
		} else {
			logger.info("Alerta de cierre de awards KO ya pasó, no se programa.");
		}
	}
}
