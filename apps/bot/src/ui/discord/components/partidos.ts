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
import { fechaADiscordTimestamp } from "../utils/fecha";

type PartidosPorFecha = Awaited<
	ReturnType<PartidosService["verPartidosPorFecha"]>
>;
type PartidoPorFecha = PartidosPorFecha[number];

export const PARTIDOS_BUTTON_CUSTOM_ID_PREFIX = "partidos:pick:";
export const PARTIDOS_DATE_SELECT_CUSTOM_ID = "partidos:date-select";
export const PARTIDOS_ADMIN_BUTTON_CUSTOM_ID_PREFIX = "partidos:pick-admin:";
export const PARTIDOS_ADMIN_DATE_SELECT_CUSTOM_ID_PREFIX =
	"partidos:date-select-admin:";

const PARTIDOS_MAX_BUTTONS = 25;

export function isValidDateInput(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatPartidoLine(partido: PartidoPorFecha): string {
	const marcador =
		partido.partidoGolesLocal !== null && partido.partidoGolesVisitante !== null
			? ` **${partido.partidoGolesLocal} - ${partido.partidoGolesVisitante}**`
			: "";

	const timestamp = partido.fechaPartido
		? partido.fechaPartido.getTime() / 1_000
		: null;

	const local = `${partido.equipoLocalBandera} ${partido.equipoLocalSiglas}`;
	const visitante = `${partido.equipoVisitanteBandera} ${partido.equipoVisitanteSiglas}`;
	const hora = timestamp ? `<t:${timestamp}:t>` : "";
	const regresivo = timestamp ? ` — <t:${timestamp}:R>` : "";

	return `${local} vs ${visitante}${marcador} (${hora})${regresivo}`;
}

export function buildPartidosComponents(
	date: string,
	partidos: PartidosPorFecha,
	fechas: string[],
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			`## Partidos del <t:${fechaADiscordTimestamp(date)}:D>`,
		),
	);

	if (partidos.length === 0) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("No hay partidos para esta fecha."),
		);
	}

	for (const partido of partidos.slice(0, PARTIDOS_MAX_BUTTONS)) {
		const { estado } = partido;
		const esSuple = partido.partidoOriginalId !== null;

		const button =
			estado === "en_vivo" ||
			estado === "medio_tiempo" ||
			estado === "suplementario"
				? new ButtonBuilder()
						.setCustomId(`noop:${partido.partidoId}`)
						.setLabel("🔴 ¡En vivo!")
						.setStyle(ButtonStyle.Danger)
						.setDisabled(true)
				: estado === "penales"
					? new ButtonBuilder()
							.setCustomId(`noop:${partido.partidoId}`)
							.setLabel("⚽ Penales")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(true)
					: estado === "finalizado"
						? new ButtonBuilder()
								.setCustomId(`noop:${partido.partidoId}`)
								.setLabel("Finalizado")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true)
						: new ButtonBuilder()
								.setCustomId(
									`${PARTIDOS_BUTTON_CUSTOM_ID_PREFIX}${partido.partidoId}`,
								)
								.setLabel(esSuple ? "Predecir (Suple)" : "Predecir")
								.setStyle(esSuple ? ButtonStyle.Success : ButtonStyle.Primary);

		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						esSuple
							? `⏱️ **[SUPLEMENTARIO]** ${formatPartidoLine(partido)}`
							: formatPartidoLine(partido),
					),
				)
				.setButtonAccessory(button),
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

export function buildAlertaDiariaPartidosComponents(
	partidos: PartidosPorFecha,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			"📣 ***¡Buenos días!***\n**Es hora de apostar a estos partidos:**",
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

	return [container.toJSON()];
}

export function buildPartidosAdminComponents(
	date: string,
	partidos: PartidosPorFecha,
	fechas: string[],
	usuarioId: string,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			`## Partidos del <t:${fechaADiscordTimestamp(date)}:D>`,
		),
	);

	if (partidos.length === 0) {
		return [
			new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`# Partidos del <t:${fechaADiscordTimestamp(date)}:D>\nNo hay partidos para esta fecha.`,
					),
				)
				.toJSON(),
		];
	}

	for (const partido of partidos.slice(0, PARTIDOS_MAX_BUTTONS)) {
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(formatPartidoLine(partido)),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${PARTIDOS_ADMIN_BUTTON_CUSTOM_ID_PREFIX}${usuarioId}:${partido.partidoId}`,
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
				.setCustomId(
					`${PARTIDOS_ADMIN_DATE_SELECT_CUSTOM_ID_PREFIX}${usuarioId}`,
				)
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
