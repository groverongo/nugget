import { logger } from "@support/logger";
import {
	ActionRowBuilder,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	MessageFlags,
	ModalBuilder,
	type ModalSubmitInteraction,
	type StringSelectMenuInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import type { AppContext } from "../../../app";
import { discordCommands } from "../commands";
import {
	buildPartidosComponents,
	PARTIDOS_BUTTON_CUSTOM_ID_PREFIX,
	PARTIDOS_DATE_SELECT_CUSTOM_ID,
} from "../components/partidos";

const PREDICCION_MODAL_CUSTOM_ID = "prediccion:create";
const PREDICCION_GOLES_LOCAL_FIELD_ID = "goles-local";
const PREDICCION_GOLES_VISITANTE_FIELD_ID = "goles-visitante";

function buildPrediccionModal(partidoId: number): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(`${PREDICCION_MODAL_CUSTOM_ID}:${partidoId}`)
		.setTitle("Registrar predicción")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_LOCAL_FIELD_ID)
					.setLabel("Goles del local")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMaxLength(2),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_VISITANTE_FIELD_ID)
					.setLabel("Goles del visitante")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMaxLength(2),
			),
		);
}

function parsePrediccionModalCustomId(customId: string): number | null {
	if (!customId.startsWith(`${PREDICCION_MODAL_CUSTOM_ID}:`)) {
		return null;
	}

	const partidoId = Number(
		customId.slice(PREDICCION_MODAL_CUSTOM_ID.length + 1),
	);

	if (Number.isNaN(partidoId)) {
		return null;
	}

	return partidoId;
}

function parseScoreInput(value: string): number | null {
	const normalized = value.trim();

	if (!/^\d{1,2}$/.test(normalized)) {
		return null;
	}

	return Number(normalized);
}

export async function handlePartidosButtonInteraction(
	interaction: ButtonInteraction,
	appContext: AppContext,
): Promise<void> {
	if (!interaction.customId.startsWith(PARTIDOS_BUTTON_CUSTOM_ID_PREFIX)) {
		return;
	}

	const selectedPartidoId = Number(
		interaction.customId.slice(PARTIDOS_BUTTON_CUSTOM_ID_PREFIX.length),
	);

	if (Number.isNaN(selectedPartidoId)) {
		await interaction.reply({
			content: "No se pudo identificar el partido seleccionado.",
			ephemeral: true,
		});
		return;
	}

	const partido = await appContext.repositories.partidos.obtenerPartido({
		id: selectedPartidoId,
	});

	if (!partido) {
		await interaction.reply({
			content: `No se encontró el partido ${selectedPartidoId}.`,
			ephemeral: true,
		});
		return;
	}

	await interaction.showModal(buildPrediccionModal(partido.id));
}

export async function handlePrediccionModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	const partidoId = parsePrediccionModalCustomId(interaction.customId);

	if (partidoId === null) {
		return;
	}

	const golesLocal = parseScoreInput(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_LOCAL_FIELD_ID),
	);
	const golesVisitante = parseScoreInput(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_VISITANTE_FIELD_ID),
	);

	if (golesLocal === null || golesVisitante === null) {
		await interaction.reply({
			content: "Ingresa goles válidos usando números enteros entre 0 y 99.",
			ephemeral: true,
		});
		return;
	}

	const partido = await appContext.repositories.partidos.obtenerPartido({
		id: partidoId,
	});

	if (!partido) {
		await interaction.reply({
			content: `No se encontró el partido ${partidoId}.`,
			ephemeral: true,
		});
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		await appContext.services.predicciones.agregarPrediccion({
			usuarioId: interaction.user.id,
			partidoId,
			golesLocal,
			golesVisitante,
		});

		await interaction.editReply(
			`Predicción registrada para el partido ${partido.id}: ${golesLocal}-${golesVisitante}.`,
		);
	} catch (error) {
		logger.error(
			{ err: error, partidoId, userId: interaction.user.id },
			"Error al registrar predicción desde Discord",
		);

		await interaction.editReply(
			"No se pudo registrar la predicción. Verifica si el partido sigue disponible para pronosticar.",
		);
	}
}

export async function handlePartidosDateSelectInteraction(
	interaction: StringSelectMenuInteraction,
	appContext: AppContext,
): Promise<void> {
	if (interaction.customId !== PARTIDOS_DATE_SELECT_CUSTOM_ID) {
		return;
	}

	const selectedDate = interaction.values[0];
	const fechas = await appContext.services.partidos.verFechasDePartidos();

	if (!fechas.includes(selectedDate as (typeof fechas)[number])) {
		await interaction.reply({
			content: "La fecha seleccionada no es válida.",
			ephemeral: true,
		});
		return;
	}

	await interaction.deferUpdate();

	const partidos = await appContext.services.partidos.verPartidosPorFecha({
		date: selectedDate,
	});

	await interaction.editReply({
		components: buildPartidosComponents(selectedDate, partidos, fechas),
		flags: MessageFlags.IsComponentsV2,
	});
}

export async function handleCommandInteraction(
	interaction: ChatInputCommandInteraction,
	appContext: AppContext,
): Promise<void> {
	const command = discordCommands.get(interaction.commandName);

	if (!command) {
		logger.warn(
			{ commandName: interaction.commandName },
			"Comando de Discord no registrado localmente",
		);

		if (interaction.deferred && !interaction.replied) {
			await interaction.editReply(
				"Este comando no está disponible en este momento.",
			);
			return;
		}

		if (interaction.replied) {
			await interaction.followUp({
				content: "Este comando no está disponible en este momento.",
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({
			content: "Este comando no está disponible en este momento.",
			ephemeral: true,
		});
		return;
	}

	try {
		await command.handle(interaction, appContext);
	} catch (error) {
		logger.error(
			{ err: error, commandName: interaction.commandName },
			"Error al ejecutar comando de Discord",
		);

		const errorReply = {
			content: "Ocurrió un error al procesar el comando.",
			ephemeral: true,
		};

		if (interaction.deferred && !interaction.replied) {
			await interaction.editReply(errorReply.content);
			return;
		}

		if (interaction.replied) {
			await interaction.followUp(errorReply);
			return;
		}

		await interaction.reply(errorReply);
	}
}
