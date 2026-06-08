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
import type { PartidosService } from "../../../service/partidos.service";

type PartidosPorFecha = Awaited<
	ReturnType<PartidosService["verPartidosPorFecha"]>
>;
type PartidoPorFecha = PartidosPorFecha[number];

export const PARTIDOS_BUTTON_CUSTOM_ID_PREFIX = "partidos:pick:";
export const PARTIDOS_DATE_SELECT_CUSTOM_ID = "partidos:date-select";

const PARTIDOS_MAX_BUTTONS = 25;

export function isValidDateInput(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatPartidoLine(partido: PartidoPorFecha): string {
	const marcador =
		partido.partidoGolesLocal !== null && partido.partidoGolesVisitante !== null
			? ` (${partido.partidoGolesLocal}-${partido.partidoGolesVisitante})`
			: "";

	const indicadorFecha = {
		regresivo: partido.fechaPartido
			? `<t:${partido.fechaPartido.getTime() / 1_000}:R>`
			: null,
		local: partido.fechaPartido
			? `<t:${partido.fechaPartido.getTime() / 1_000}:s>`
			: null,
	};

	return `${partido.equipoLocalNombre} vs ${partido.equipoVisitanteNombre} (${indicadorFecha.local}) — ${partido.estado}${marcador} — ${indicadorFecha.regresivo}`;
}

export function buildPartidosComponents(
	date: string,
	partidos: PartidosPorFecha,
	fechas: string[],
): APIMessageTopLevelComponent[] {
	if (partidos.length === 0) {
		return [
			new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`# Partidos para ${date}\nNo hay partidos para la fecha ${date}.`,
					),
				)
				.toJSON(),
		];
	}

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			`## Partidos para ${date} (Fechas Peru)`,
		),
	);

	for (const partido of partidos.slice(0, PARTIDOS_MAX_BUTTONS)) {
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(formatPartidoLine(partido)),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${PARTIDOS_BUTTON_CUSTOM_ID_PREFIX}${partido.partidoId}`,
						)
						.setLabel("Predecir")
						.setStyle(ButtonStyle.Primary),
				),
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);
	}

	container.addActionRowComponents((actionRow) =>
		actionRow.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(PARTIDOS_DATE_SELECT_CUSTOM_ID)
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
