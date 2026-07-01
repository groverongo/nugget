import type { APIMessageTopLevelComponent } from "discord.js";
import {
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
} from "discord.js";
import type { VerPrediccionEtRow } from "../../../../db/sqlcgen/predicciones_et_sql";
import type { VerMisPrediccionesPorFechaRow } from "../../../../db/sqlcgen/predicciones_sql";
import { fechaADiscordTimestamp } from "../utils/fecha";
import { PARTIDOS_BUTTON_CUSTOM_ID_PREFIX } from "./partidos";

export const PREDICCIONES_DATE_SELECT_CUSTOM_ID = "predicciones:date-select";

type MiPrediccionPorFecha = VerMisPrediccionesPorFechaRow;

function formatMarcadorReal(prediccion: MiPrediccionPorFecha): string {
	if (
		prediccion.partidoGolesLocal === null ||
		prediccion.partidoGolesVisitante === null
	) {
		return "Sin resultado final";
	}

	return `Resultado: ${prediccion.partidoGolesLocal}-${prediccion.partidoGolesVisitante}`;
}

function getPrediccionEmoji(prediccion: MiPrediccionPorFecha): string {
	if (prediccion.estado === "finalizado") {
		return prediccion.partidoGolesLocal === prediccion.prediccionGolesLocal &&
			prediccion.partidoGolesVisitante === prediccion.prediccionGolesVisitante
			? "✅"
			: "❌";
	}

	if (prediccion.estado === "en_vivo" || prediccion.estado === "medio_tiempo") {
		if (
			prediccion.partidoGolesLocal === null ||
			prediccion.partidoGolesVisitante === null
		) {
			return "⏺️";
		}
		if (
			prediccion.partidoGolesLocal === prediccion.prediccionGolesLocal &&
			prediccion.partidoGolesVisitante === prediccion.prediccionGolesVisitante
		) {
			return "❇️";
		}
		if (
			prediccion.partidoGolesLocal <= prediccion.prediccionGolesLocal &&
			prediccion.partidoGolesVisitante <= prediccion.prediccionGolesVisitante
		) {
			return "⏺️";
		}
		return "❌";
	}

	return "";
}

function formatEtLine(
	et: VerPrediccionEtRow,
	prediccion: MiPrediccionPorFecha,
): string {
	const golesStr = `+${et.golesLocalAdicionales} — +${et.golesVisitanteAdicionales}`;
	let penalesStr = "";
	if (et.penalesGanadorId !== null) {
		const bandera =
			et.penalesGanadorId === prediccion.equipoLocalId
				? prediccion.equipoLocalBandera
				: prediccion.equipoVisitanteBandera;
		penalesStr = ` · Penales → ${bandera}`;
	}
	return `**Mi apuesta ET: ${golesStr}**${penalesStr} 🕐`;
}

function formatPrediccionLine(
	prediccion: MiPrediccionPorFecha,
	et?: VerPrediccionEtRow,
): string {
	const fechaPartido = prediccion.fechaPartido
		? `<t:${Math.floor(prediccion.fechaPartido.getTime() / 1_000)}:t>`
		: "Hora pendiente";

	const emoji = getPrediccionEmoji(prediccion);
	const emojiSuffix = emoji ? ` ${emoji}` : "";

	const lines = [
		`### ${prediccion.equipoLocalNombre} ${prediccion.equipoLocalBandera} vs. ${prediccion.equipoVisitanteNombre} ${prediccion.equipoVisitanteBandera}`,
		`**Mi predicción: ${prediccion.prediccionGolesLocal}-${prediccion.prediccionGolesVisitante}**${emojiSuffix}`,
	];
	if (et) lines.push(formatEtLine(et, prediccion));
	lines.push(
		formatMarcadorReal(prediccion),
		`Estado: ${prediccion.estado}`,
		fechaPartido,
	);
	return lines.join("\n");
}

export function buildMisPrediccionesComponents(
	date: string,
	predicciones: MiPrediccionPorFecha[],
	fechas: string[],
	etPrediccionesMap?: Map<number, VerPrediccionEtRow>,
): APIMessageTopLevelComponent[] {
	const titulo = `## Mis predicciones del <t:${fechaADiscordTimestamp(date)}:D>`;

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(titulo),
	);

	if (predicciones.length === 0) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`No registraste predicciones para el <t:${fechaADiscordTimestamp(date)}:D>.`,
			),
		);
	} else {
		for (const prediccion of predicciones) {
			const { estado } = prediccion;
			const button =
				estado === "en_vivo" || estado === "medio_tiempo"
					? new ButtonBuilder()
							.setCustomId(`noop:${prediccion.partidoId}`)
							.setLabel("🔴 ¡En vivo!")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(true)
					: estado === "finalizado"
						? new ButtonBuilder()
								.setCustomId(`noop:${prediccion.partidoId}`)
								.setLabel("Finalizado")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true)
						: new ButtonBuilder()
								.setCustomId(
									`${PARTIDOS_BUTTON_CUSTOM_ID_PREFIX}${prediccion.partidoId}`,
								)
								.setLabel("Actualizar")
								.setStyle(ButtonStyle.Primary);

			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							formatPrediccionLine(
								prediccion,
								etPrediccionesMap?.get(prediccion.partidoId),
							),
						),
					)
					.setButtonAccessory(button),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);
		}
	}

	container.addActionRowComponents((actionRow) =>
		actionRow.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(PREDICCIONES_DATE_SELECT_CUSTOM_ID)
				.setPlaceholder("Selecciona otra fecha")
				.addOptions(
					fechas.map((optionDate) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(optionDate)
							.setValue(optionDate)
							.setDefault(optionDate === date),
					),
				),
		),
	);

	return [container.toJSON()];
}
