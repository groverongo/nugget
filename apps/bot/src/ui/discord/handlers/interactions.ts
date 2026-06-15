import { config } from "@support/config";
import { logger } from "@support/logger";
import {
	ActionRowBuilder,
	type APIMessageTopLevelComponent,
	type AttachmentBuilder,
	type AutocompleteInteraction,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	MessageFlags,
	ModalBuilder,
	type ModalSubmitInteraction,
	type StringSelectMenuInteraction,
	type TextBasedChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import type { AppContext } from "../../../app";
import { discordCommands, POLLERO_ROLE_ID } from "../commands";
import {
	buildPartidosAdminComponents,
	buildPartidosComponents,
	PARTIDOS_ADMIN_BUTTON_CUSTOM_ID_PREFIX,
	PARTIDOS_ADMIN_DATE_SELECT_CUSTOM_ID_PREFIX,
	PARTIDOS_BUTTON_CUSTOM_ID_PREFIX,
	PARTIDOS_DATE_SELECT_CUSTOM_ID,
} from "../components/partidos";
import {
	buildMisPrediccionesComponents,
	PREDICCIONES_DATE_SELECT_CUSTOM_ID,
} from "../components/predicciones";
import {
	buildTimbaAceptadaComponent,
	buildTimbaResolucionComponents,
	TIMBA_ACEPTAR_PREFIX,
	TIMBA_RESOLVER_J1_PREFIX,
	TIMBA_RESOLVER_J2_PREFIX,
} from "../components/timba";
import { golesSchema } from "../types/shared";

const PREDICCION_MODAL_CUSTOM_ID = "prediccion:create";
const PREDICCION_ADMIN_MODAL_CUSTOM_ID = "prediccion:create-admin";
const PREDICCION_GOLES_LOCAL_FIELD_ID = "goles-local";
const PREDICCION_GOLES_VISITANTE_FIELD_ID = "goles-visitante";

function buildPrediccionModal(
	partidoId: number,
	nombreEquipoLocal: string,
	nombreEquipoVisitante: string,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(`${PREDICCION_MODAL_CUSTOM_ID}:${partidoId}`)
		.setTitle("Registrar predicción")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_LOCAL_FIELD_ID)
					.setLabel(`Goles de ${nombreEquipoLocal}`)
					.setPlaceholder("Ej: 0, 1, 2...")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(2),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_VISITANTE_FIELD_ID)
					.setLabel(`Goles de ${nombreEquipoVisitante}`)
					.setPlaceholder("Ej: 0, 1, 2...")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
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

	const partido = await appContext.services.partidos.verInformacionPartido({
		id: selectedPartidoId,
	});

	if (!partido) {
		await interaction.reply({
			content: `No se encontró el partido ${selectedPartidoId}.`,
			ephemeral: true,
		});
		return;
	}

	await interaction.showModal(
		buildPrediccionModal(
			partido.partidoId,
			partido.equipoLocalNombre,
			partido.equipoVisitanteNombre,
		),
	);
}

export async function handlePrediccionModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	const partidoId = parsePrediccionModalCustomId(interaction.customId);

	if (partidoId === null) {
		return;
	}

	const member =
		interaction.guild?.members.cache.get(interaction.user.id) ??
		(await interaction.guild?.members.fetch(interaction.user.id));
	if (!member?.roles.cache.has(POLLERO_ROLE_ID)) {
		await interaction.reply({
			content: "Primero usa `/predecir-awards` para unirte a la polla 🐔",
			ephemeral: true,
		});
		return;
	}

	const golesLocalParsed = golesSchema.safeParse(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_LOCAL_FIELD_ID),
	);
	const golesVisitanteParsed = golesSchema.safeParse(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_VISITANTE_FIELD_ID),
	);

	if (!golesLocalParsed.success || !golesVisitanteParsed.success) {
		logger.error(
			golesLocalParsed.error?.message || golesVisitanteParsed.error?.message,
		);
		await interaction.reply({
			content: `${interaction.user.displayName} es un webonaso, puso mal el resultado`,
		});
		return;
	}

	const partido = await appContext.services.partidos.verInformacionPartido({
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
		const resultado = await appContext.services.predicciones.guardarPrediccion({
			usuarioId: interaction.user.id,
			partidoId,
			golesLocal: golesLocalParsed.data,
			golesVisitante: golesVisitanteParsed.data,
		});

		await interaction.editReply(
			`Predicción registrada para ${partido.equipoLocalNombre} vs ${partido.equipoVisitanteNombre}: ${golesLocalParsed.data}-${golesVisitanteParsed.data}.`,
		);

		await sendAnnouncementChannel(
			interaction.client,
			resultado === "created"
				? `_🎯 ¡<@${interaction.user.id}> ha enviado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} vs. **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`
				: `_✏️ ¡<@${interaction.user.id}> ha actualizado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} vs. **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`,
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

export async function handlePrediccionesDateSelectInteraction(
	interaction: StringSelectMenuInteraction,
	appContext: AppContext,
): Promise<void> {
	if (interaction.customId !== PREDICCIONES_DATE_SELECT_CUSTOM_ID) {
		return;
	}

	const selectedDate = interaction.values[0];
	const fechas =
		await appContext.services.predicciones.verFechasDePrediccionesPorUsuario(
			interaction.user.id,
		);

	if (!fechas.includes(selectedDate as (typeof fechas)[number])) {
		await interaction.reply({
			content: "La fecha seleccionada no es válida.",
			ephemeral: true,
		});
		return;
	}

	await interaction.deferUpdate();

	const predicciones =
		await appContext.services.predicciones.verMisPrediccionesPorFecha({
			usuarioId: interaction.user.id,
			date: selectedDate,
		});

	await interaction.editReply({
		components: buildMisPrediccionesComponents(
			selectedDate,
			predicciones,
			fechas,
		),
		flags: MessageFlags.IsComponentsV2,
	});
}

function buildPrediccionAdminModal(
	partidoId: number,
	usuarioId: string,
	nombreEquipoLocal: string,
	nombreEquipoVisitante: string,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(
			`${PREDICCION_ADMIN_MODAL_CUSTOM_ID}:${usuarioId}:${partidoId}`,
		)
		.setTitle("Registrar predicción (admin)")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_LOCAL_FIELD_ID)
					.setLabel(`Goles de ${nombreEquipoLocal}`)
					.setPlaceholder("Ej: 0, 1, 2...")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(2),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(PREDICCION_GOLES_VISITANTE_FIELD_ID)
					.setLabel(`Goles de ${nombreEquipoVisitante}`)
					.setPlaceholder("Ej: 0, 1, 2...")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(2),
			),
		);
}

function parsePrediccionAdminModalCustomId(
	customId: string,
): { usuarioId: string; partidoId: number } | null {
	if (!customId.startsWith(`${PREDICCION_ADMIN_MODAL_CUSTOM_ID}:`)) return null;
	const rest = customId.slice(PREDICCION_ADMIN_MODAL_CUSTOM_ID.length + 1);
	const lastColon = rest.lastIndexOf(":");
	if (lastColon === -1) return null;
	const usuarioId = rest.slice(0, lastColon);
	const partidoId = Number(rest.slice(lastColon + 1));
	if (Number.isNaN(partidoId) || !usuarioId) return null;
	return { usuarioId, partidoId };
}

export async function handlePartidosAdminButtonInteraction(
	interaction: ButtonInteraction,
	appContext: AppContext,
): Promise<void> {
	if (
		!interaction.customId.startsWith(PARTIDOS_ADMIN_BUTTON_CUSTOM_ID_PREFIX)
	) {
		return;
	}

	const rest = interaction.customId.slice(
		PARTIDOS_ADMIN_BUTTON_CUSTOM_ID_PREFIX.length,
	);
	const lastColon = rest.lastIndexOf(":");
	if (lastColon === -1) return;
	const usuarioId = rest.slice(0, lastColon);
	const selectedPartidoId = Number(rest.slice(lastColon + 1));

	if (Number.isNaN(selectedPartidoId) || !usuarioId) {
		await interaction.reply({
			content: "No se pudo identificar el partido.",
			ephemeral: true,
		});
		return;
	}

	const partido = await appContext.services.partidos.verInformacionPartido({
		id: selectedPartidoId,
	});

	if (!partido) {
		await interaction.reply({
			content: `No se encontró el partido ${selectedPartidoId}.`,
			ephemeral: true,
		});
		return;
	}

	await interaction.showModal(
		buildPrediccionAdminModal(
			partido.partidoId,
			usuarioId,
			partido.equipoLocalNombre,
			partido.equipoVisitanteNombre,
		),
	);
}

export async function handlePrediccionAdminModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	const parsed = parsePrediccionAdminModalCustomId(interaction.customId);
	if (parsed === null) return;

	const { usuarioId, partidoId } = parsed;

	const golesLocalParsed = golesSchema.safeParse(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_LOCAL_FIELD_ID),
	);
	const golesVisitanteParsed = golesSchema.safeParse(
		interaction.fields.getTextInputValue(PREDICCION_GOLES_VISITANTE_FIELD_ID),
	);

	if (!golesLocalParsed.success || !golesVisitanteParsed.success) {
		await interaction.reply({ content: "Goles inválidos.", ephemeral: true });
		return;
	}

	const partido = await appContext.services.partidos.verInformacionPartido({
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
		const resultado =
			await appContext.services.predicciones.guardarPrediccionAdmin({
				usuarioId,
				partidoId,
				golesLocal: golesLocalParsed.data,
				golesVisitante: golesVisitanteParsed.data,
			});

		await interaction.editReply(
			resultado === "created"
				? `✅ Predicción registrada para <@${usuarioId}>: ${partido.equipoLocalNombre} ${golesLocalParsed.data}-${golesVisitanteParsed.data} ${partido.equipoVisitanteNombre}.`
				: `✅ Predicción actualizada para <@${usuarioId}>: ${partido.equipoLocalNombre} ${golesLocalParsed.data}-${golesVisitanteParsed.data} ${partido.equipoVisitanteNombre}.`,
		);

		await sendAnnouncementChannel(
			interaction.client,
			resultado === "created"
				? `_🎯 ¡<@${usuarioId}> ha enviado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} vs. **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`
				: `_✏️ ¡<@${usuarioId}> ha actualizado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} vs. **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`,
		);
	} catch (error) {
		await interaction.editReply(
			`❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
		);
	}
}

export async function handlePartidosAdminDateSelectInteraction(
	interaction: StringSelectMenuInteraction,
	appContext: AppContext,
): Promise<void> {
	if (
		!interaction.customId.startsWith(
			PARTIDOS_ADMIN_DATE_SELECT_CUSTOM_ID_PREFIX,
		)
	) {
		return;
	}

	const usuarioId = interaction.customId.slice(
		PARTIDOS_ADMIN_DATE_SELECT_CUSTOM_ID_PREFIX.length,
	);
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
		components: buildPartidosAdminComponents(
			selectedDate,
			partidos,
			fechas,
			usuarioId,
		),
		flags: MessageFlags.IsComponentsV2,
	});
}

export async function handleAutocompleteInteraction(
	interaction: AutocompleteInteraction,
	appContext: AppContext,
): Promise<void> {
	const command = discordCommands.get(interaction.commandName);
	if (!command?.autocomplete) return;
	try {
		await command.autocomplete(interaction, appContext);
	} catch (error) {
		logger.error(
			{ err: error, commandName: interaction.commandName },
			"Error al manejar autocomplete de Discord",
		);
	}
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

type DiscordClient = {
	channels: {
		cache: { get(id: string): unknown };
		fetch(id: string): Promise<unknown>;
	};
};

function splitMessage(text: string, maxLength = 2000): string[] {
	if (text.length <= maxLength) return [text];
	const chunks: string[] = [];
	let current = "";
	for (const line of text.split("\n")) {
		const addition = current ? `\n${line}` : line;
		if (current.length + addition.length > maxLength) {
			if (current) chunks.push(current);
			current = line.length > maxLength ? line.slice(0, maxLength) : line;
		} else {
			current += addition;
		}
	}
	if (current) chunks.push(current);
	return chunks;
}

async function sendToChannel(
	client: DiscordClient,
	channelId: string,
	message: string,
): Promise<void> {
	if (!channelId) return;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "send" in channel) {
			for (const chunk of splitMessage(message)) {
				await channel.send(chunk);
			}
		}
	} catch (error) {
		logger.error({ err: error, channelId }, "Error enviando mensaje al canal");
	}
}

export function sendAnnouncementChannel(
	client: DiscordClient,
	message: string,
): Promise<void> {
	return sendToChannel(
		client,
		config.discord.announcements.channel.id,
		message,
	);
}

export function sendAlertsChannel(
	client: DiscordClient,
	message: string,
): Promise<void> {
	return sendToChannel(client, config.discord.alerts.channel.id, message);
}

export async function sendAlertsChannelWithFiles(
	client: DiscordClient,
	message: string,
	files: AttachmentBuilder[],
): Promise<void> {
	const channelId = config.discord.alerts.channel.id;
	if (!channelId) return;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "send" in channel) {
			await channel.send({
				content: message,
				files,
			});
		}
	} catch (error) {
		logger.error(
			{ err: error, channelId },
			"Error enviando alerta con archivos al canal de alertas",
		);
	}
}

export async function sendComponentsToAlertsChannel(
	client: DiscordClient,
	components: APIMessageTopLevelComponent[],
): Promise<void> {
	const channelId = config.discord.alerts.channel.id;
	if (!channelId) return;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "send" in channel) {
			await channel.send({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch in discord.js
				components: components as any,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	} catch (error) {
		logger.error(
			{ err: error, channelId },
			"Error enviando componentes al canal de alertas",
		);
	}
}

export async function sendComponentsToAnnouncementChannel(
	client: DiscordClient,
	components: APIMessageTopLevelComponent[],
): Promise<void> {
	const channelId = config.discord.announcements.channel.id;
	if (!channelId) return;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "send" in channel) {
			await channel.send({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch in discord.js
				components: components as any,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	} catch (error) {
		logger.error(
			{ err: error, channelId },
			"Error enviando componentes al canal de anuncios",
		);
	}
}

export async function handleTimbaButtonInteraction(
	interaction: ButtonInteraction,
	appContext: AppContext,
): Promise<void> {
	const { customId } = interaction;

	if (customId.startsWith(TIMBA_ACEPTAR_PREFIX)) {
		const timbaId = Number(customId.slice(TIMBA_ACEPTAR_PREFIX.length));
		if (Number.isNaN(timbaId)) return;

		const member =
			interaction.guild?.members.cache.get(interaction.user.id) ??
			(await interaction.guild?.members.fetch(interaction.user.id));
		if (!member?.roles.cache.has(POLLERO_ROLE_ID)) {
			await interaction.reply({
				content: "Primero usa `/predecir-awards` para unirte a la polla 🐔",
				ephemeral: true,
			});
			return;
		}

		await interaction.deferUpdate();

		try {
			const result = await appContext.services.timba.aceptarTimba({
				timbaId,
				jugador2Id: interaction.user.id,
			});

			await interaction.editReply({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				components: buildTimbaAceptadaComponent(result) as any,
				flags: MessageFlags.IsComponentsV2,
			});

			await sendAnnouncementChannel(
				interaction.client,
				[
					`🤝 ***¡Timba Time cerrada para ${result.equipoLocalNombre} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteNombre} ${result.equipoVisitanteBandera}***`,
					`<@${result.jugador1Id}> 🆚 <@${result.jugador2Id}> — **${result.puntos} 💠** en juego`,
					`_"${result.descripcion}"_`,
				].join("\n"),
			);
		} catch (error) {
			await interaction.followUp({
				content: `❌ ${error instanceof Error ? error.message : "No se pudo aceptar la timba."}`,
				ephemeral: true,
			});
		}
		return;
	}

	const isJ1 = customId.startsWith(TIMBA_RESOLVER_J1_PREFIX);
	const isJ2 = customId.startsWith(TIMBA_RESOLVER_J2_PREFIX);

	if (!isJ1 && !isJ2) return;

	const suffix = customId.slice(
		isJ1 ? TIMBA_RESOLVER_J1_PREFIX.length : TIMBA_RESOLVER_J2_PREFIX.length,
	);
	const colonIdx = suffix.lastIndexOf(":");
	if (colonIdx === -1) return;

	const timbaId = Number(suffix.slice(0, colonIdx));
	const partidoId = Number(suffix.slice(colonIdx + 1));
	if (Number.isNaN(timbaId) || Number.isNaN(partidoId)) return;

	await interaction.deferUpdate();

	try {
		const result = await appContext.services.timba.resolverTimba({
			timbaId,
			ganadorJugador: isJ1 ? "j1" : "j2",
		});

		await sendAnnouncementChannel(
			interaction.client,
			[
				`**Resolución de Timba Times** *(${result.equipoLocalNombre} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteNombre} ${result.equipoVisitanteBandera})*`,
				`👑 <@${result.ganadorId}> le robó **${result.puntos} 💠** a <@${result.perdedorId}> — _"${result.descripcion}"_`,
			].join("\n"),
		);

		const remaining =
			await appContext.services.timba.verTimbasCerradasPorPartido(partidoId);

		if (remaining.length > 0) {
			await interaction.editReply({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				components: buildTimbaResolucionComponents(remaining, partidoId) as any,
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			await interaction.editReply({
				content: "✅ Todas las timba times resueltas.",
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				components: [] as any,
			});
		}
	} catch (error) {
		await interaction.followUp({
			content: `❌ ${error instanceof Error ? error.message : "No se pudo resolver la timba."}`,
			ephemeral: true,
		});
	}
}
