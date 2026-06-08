import { logger } from "@support/logger";
import {
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	MessageFlags,
	type StringSelectMenuInteraction,
} from "discord.js";
import type { AppContext } from "../../../app";
import { discordCommands } from "../commands";
import {
	buildPartidosComponents,
	PARTIDOS_BUTTON_CUSTOM_ID_PREFIX,
	PARTIDOS_DATE_SELECT_CUSTOM_ID,
} from "../components/partidos";

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

	await interaction.reply({
		content: `${interaction.user} clicked on partido ${partido.id}`,
		ephemeral: true,
	});
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
