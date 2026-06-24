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
	buildContraofertaComponent,
	buildMisTimbasComponents,
	buildTimbaAceptadaComponent,
	buildTimbaCreacionComponent,
	buildTimbaResolucionComponents,
	buildTimbaResolucionMedioTiempoComponents,
	MIS_TIMBAS_DATE_SELECT_CUSTOM_ID,
	TIMBA_ACEPTAR_PREFIX,
	TIMBA_CONTRAOFERTA_ACEPTAR_PREFIX,
	TIMBA_CONTRAOFERTA_PREFIX,
	TIMBA_CONTRAOFERTA_RECHAZAR_PREFIX,
	TIMBA_MT_RESOLVER_J1_PREFIX,
	TIMBA_MT_RESOLVER_J2_PREFIX,
	TIMBA_MT_REVERTIR_PREFIX,
	TIMBA_RESOLVER_J1_PREFIX,
	TIMBA_RESOLVER_J2_PREFIX,
} from "../components/timba";
import { golesSchema, puntosApuestaSchema } from "../types/shared";

const PREDICCION_MODAL_CUSTOM_ID = "prediccion:create";
const PREDICCION_ADMIN_MODAL_CUSTOM_ID = "prediccion:create-admin";
const PREDICCION_GOLES_LOCAL_FIELD_ID = "goles-local";
const PREDICCION_GOLES_VISITANTE_FIELD_ID = "goles-visitante";
const TIMBA_MODAL_CUSTOM_ID = "timba:create";
const TIMBA_ADMIN_MODAL_CUSTOM_ID = "timba:create-admin";
const TIMBA_CONTRAOFERTA_MODAL_CUSTOM_ID = "timba:contraoferta:create";
const TIMBA_DESCRIPCION_FIELD_ID = "descripcion";
const TIMBA_PUNTOS_FIELD_ID = "puntos";
const TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID = "puntos-arriesgados";

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
				? `_🎯 ¡<@${interaction.user.id}> ha enviado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} **vs.** **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`
				: `_✏️ ¡<@${interaction.user.id}> ha actualizado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} **vs.** **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`,
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

export async function handleMisTimbasDateSelectInteraction(
	interaction: StringSelectMenuInteraction,
	appContext: AppContext,
): Promise<void> {
	if (interaction.customId !== MIS_TIMBAS_DATE_SELECT_CUSTOM_ID) {
		return;
	}

	const selectedDate = interaction.values[0];
	const fechas = await appContext.services.timba.verFechasDeTimbasPorUsuario(
		interaction.user.id,
	);

	if (!fechas.includes(selectedDate)) {
		await interaction.reply({
			content: "La fecha seleccionada no es válida.",
			ephemeral: true,
		});
		return;
	}

	await interaction.deferUpdate();

	const timbas = await appContext.services.timba.verMisTimbasPorFecha({
		jugador_1Id: interaction.user.id,
		date: selectedDate,
	});

	await interaction.editReply({
		components: buildMisTimbasComponents(
			selectedDate,
			interaction.user.id,
			timbas,
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
		const resultado = await appContext.services.predicciones.guardarPrediccion({
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
				? `_🎯 ¡<@${usuarioId}> ha enviado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} **vs.** **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`
				: `_✏️ ¡<@${usuarioId}> ha actualizado su resultado para **${partido.equipoLocalNombre}** ${partido.equipoLocalBandera} **vs.** **${partido.equipoVisitanteNombre}** ${partido.equipoVisitanteBandera}!_`,
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
		try {
			await interaction.respond([]);
		} catch {}
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

export async function deleteAnnouncementMessages(
	client: DiscordClient,
	messageIds: string[],
): Promise<void> {
	if (messageIds.length === 0) return;
	const channelId = config.discord.announcements.channel.id;
	if (!channelId) return;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "messages" in channel) {
			await Promise.allSettled(
				messageIds.map((id) =>
					(channel as import("discord.js").TextChannel).messages
						.fetch(id)
						.then((msg) => msg.delete()),
				),
			);
		}
	} catch (error) {
		logger.error(
			{ err: error, channelId },
			"Error borrando mensajes de contraofertas canceladas",
		);
	}
}

export async function sendComponentsToAnnouncementChannel(
	client: DiscordClient,
	components: APIMessageTopLevelComponent[],
): Promise<string | null> {
	const channelId = config.discord.announcements.channel.id;
	if (!channelId) return null;

	try {
		const channel =
			(client.channels.cache.get(channelId) as TextBasedChannel | undefined) ??
			((await client.channels.fetch(channelId)) as TextBasedChannel | null) ??
			undefined;

		if (channel && "send" in channel) {
			const message = await channel.send({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch in discord.js
				components: components as any,
				flags: MessageFlags.IsComponentsV2,
			});
			return message.id;
		}
	} catch (error) {
		logger.error(
			{ err: error, channelId },
			"Error enviando componentes al canal de anuncios",
		);
	}
	return null;
}

export function buildTimbaModal(
	partidoId: number,
	puntosMaximoFase: number,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(`${TIMBA_MODAL_CUSTOM_ID}:${partidoId}`)
		.setTitle("🎰 Timba Time")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_DESCRIPCION_FIELD_ID)
					.setLabel("Descripción del reto")
					.setPlaceholder("Ej: 'Brasil gana' (1 a 200 caracteres)")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(200),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_FIELD_ID)
					.setLabel("Mis puntos en juego (si pierdo)")
					.setPlaceholder(
						`Mínimo 1 — máximo ${puntosMaximoFase} (también tope: 10% de tus puntos)`,
					)
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(6),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
					.setLabel("Puntos a arriesgar por el retador (opcional)")
					.setPlaceholder("Por defecto: igual a mis puntos en juego")
					.setStyle(TextInputStyle.Short)
					.setRequired(false)
					.setMinLength(1)
					.setMaxLength(6),
			),
		);
}

function parseTimbaModalCustomId(customId: string): number | null {
	if (!customId.startsWith(`${TIMBA_MODAL_CUSTOM_ID}:`)) {
		return null;
	}

	const partidoId = Number(customId.slice(TIMBA_MODAL_CUSTOM_ID.length + 1));

	if (Number.isNaN(partidoId)) {
		return null;
	}

	return partidoId;
}

export async function handleTimbaModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	const partidoId = parseTimbaModalCustomId(interaction.customId);

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

	const descripcion = interaction.fields
		.getTextInputValue(TIMBA_DESCRIPCION_FIELD_ID)
		.trim();
	const puntosParsed = puntosApuestaSchema.safeParse(
		interaction.fields.getTextInputValue(TIMBA_PUNTOS_FIELD_ID),
	);
	const puntosArriesgadosRaw = interaction.fields
		.getTextInputValue(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
		.trim();
	const puntosArriesgadosParsed = puntosArriesgadosRaw
		? puntosApuestaSchema.safeParse(puntosArriesgadosRaw)
		: null;

	if (
		!descripcion ||
		!puntosParsed.success ||
		(puntosArriesgadosParsed !== null && !puntosArriesgadosParsed.success)
	) {
		await interaction.reply({
			content:
				"❌ Revisa los datos: la descripción no puede estar vacía y los puntos deben ser un número entero mayor a 0.",
			ephemeral: true,
		});
		return;
	}

	const puntosArriesgados = puntosArriesgadosParsed?.data ?? puntosParsed.data;

	await interaction.deferReply({ ephemeral: true });

	try {
		const result = await appContext.services.timba.crearTimba({
			jugador1Id: interaction.user.id,
			partidoId,
			descripcion,
			puntosPropuestos: puntosParsed.data,
			puntosArriesgados,
		});

		const resumen =
			puntosArriesgados === puntosParsed.data
				? `**${puntosParsed.data} 💠** en juego`
				: `yo arriesgo **${puntosParsed.data} 💠** / retador arriesga **${puntosArriesgados} 💠**`;
		await interaction.editReply({
			content: `✅ Timba creada. ${resumen} — _"${descripcion}"_`,
		});

		const partido = `${result.equipoLocalNombre} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteNombre} ${result.equipoVisitanteBandera}`;
		await sendAnnouncementChannel(
			interaction.client,
			`🎰 _¡<@${result.jugador1Id}> envió una timba para **${partido}**!_`,
		);
		const messageId = await sendComponentsToAnnouncementChannel(
			interaction.client,
			buildTimbaCreacionComponent(result),
		);
		if (messageId) {
			await appContext.services.timba.guardarMensajeTimba(
				result.timbaId,
				messageId,
			);
		}
	} catch (error) {
		await interaction.editReply({
			content: `❌ ${error instanceof Error ? error.message : "Error desconocido"}`,
		});
	}
}

export function buildTimbaAdminModal(
	usuarioId: string,
	partidoId: number,
	puntosMaximoFase: number,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(`${TIMBA_ADMIN_MODAL_CUSTOM_ID}:${usuarioId}:${partidoId}`)
		.setTitle("🎰 Timba Time (Admin)")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_DESCRIPCION_FIELD_ID)
					.setLabel("Descripción del reto")
					.setPlaceholder("Ej: 'Brasil gana' (1 a 200 caracteres)")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(200),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_FIELD_ID)
					.setLabel("Puntos propuestos (J1 arriesga si pierde)")
					.setPlaceholder(`Mínimo 1 — máximo ${puntosMaximoFase}`)
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(6),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
					.setLabel("Puntos arriesgados por el retador (opcional)")
					.setPlaceholder("Por defecto: igual a puntos propuestos")
					.setStyle(TextInputStyle.Short)
					.setRequired(false)
					.setMinLength(1)
					.setMaxLength(6),
			),
		);
}

function parseTimbaAdminModalCustomId(
	customId: string,
): { usuarioId: string; partidoId: number } | null {
	if (!customId.startsWith(`${TIMBA_ADMIN_MODAL_CUSTOM_ID}:`)) return null;
	const rest = customId.slice(TIMBA_ADMIN_MODAL_CUSTOM_ID.length + 1);
	const lastColon = rest.lastIndexOf(":");
	if (lastColon === -1) return null;
	const usuarioId = rest.slice(0, lastColon);
	const partidoId = Number(rest.slice(lastColon + 1));
	if (Number.isNaN(partidoId) || !usuarioId) return null;
	return { usuarioId, partidoId };
}

export async function handleTimbaAdminModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	const parsed = parseTimbaAdminModalCustomId(interaction.customId);
	if (parsed === null) return;

	const { usuarioId, partidoId } = parsed;

	const descripcion = interaction.fields
		.getTextInputValue(TIMBA_DESCRIPCION_FIELD_ID)
		.trim();
	const puntosParsed = puntosApuestaSchema.safeParse(
		interaction.fields.getTextInputValue(TIMBA_PUNTOS_FIELD_ID),
	);
	const puntosArriesgadosRawAdmin = interaction.fields
		.getTextInputValue(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
		.trim();
	const puntosArriesgadosParsedAdmin = puntosArriesgadosRawAdmin
		? puntosApuestaSchema.safeParse(puntosArriesgadosRawAdmin)
		: null;

	if (
		!descripcion ||
		!puntosParsed.success ||
		(puntosArriesgadosParsedAdmin !== null &&
			!puntosArriesgadosParsedAdmin.success)
	) {
		await interaction.reply({
			content:
				"❌ Revisa los datos: la descripción no puede estar vacía y los puntos deben ser un número entero mayor a 0.",
			ephemeral: true,
		});
		return;
	}

	const puntosArriesgadosAdmin =
		puntosArriesgadosParsedAdmin?.data ?? puntosParsed.data;

	await interaction.deferReply({ ephemeral: true });

	try {
		const result = await appContext.services.timba.crearTimba({
			jugador1Id: usuarioId,
			partidoId,
			descripcion,
			puntosPropuestos: puntosParsed.data,
			puntosArriesgados: puntosArriesgadosAdmin,
		});

		const resumenAdmin =
			puntosArriesgadosAdmin === puntosParsed.data
				? `**${puntosParsed.data} 💠** en juego`
				: `J1 arriesga **${puntosParsed.data} 💠** / retador arriesga **${puntosArriesgadosAdmin} 💠**`;
		await interaction.editReply({
			content: `✅ Timba creada para <@${usuarioId}>. ${resumenAdmin} — _"${descripcion}"_`,
		});

		const partido = `${result.equipoLocalNombre} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteNombre} ${result.equipoVisitanteBandera}`;
		await sendAnnouncementChannel(
			interaction.client,
			`🎰 _¡<@${result.jugador1Id}> envió una timba para **${partido}**!_`,
		);
		const messageId = await sendComponentsToAnnouncementChannel(
			interaction.client,
			buildTimbaCreacionComponent(result),
		);
		if (messageId) {
			await appContext.services.timba.guardarMensajeTimba(
				result.timbaId,
				messageId,
			);
		}
	} catch (error) {
		await interaction.editReply({
			content: `❌ ${error instanceof Error ? error.message : "Error desconocido"}`,
		});
	}
}

function buildContraofertaModal(
	timbaOriginalId: number,
	puntosMaximoFase: number,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(`${TIMBA_CONTRAOFERTA_MODAL_CUSTOM_ID}:${timbaOriginalId}`)
		.setTitle("🔄 Contraoferta")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_DESCRIPCION_FIELD_ID)
					.setLabel("Descripción del reto")
					.setPlaceholder("Ej: 'Brasil gana' (1 a 200 caracteres)")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(200),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_FIELD_ID)
					.setLabel("Mis puntos en juego (si pierdo)")
					.setPlaceholder(
						`Mínimo 1 — máximo ${puntosMaximoFase} (también tope: 10% de tus puntos)`,
					)
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMinLength(1)
					.setMaxLength(6),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
					.setLabel("Puntos a arriesgar por el retador")
					.setPlaceholder("Por defecto: igual a mis puntos en juego")
					.setStyle(TextInputStyle.Short)
					.setRequired(false)
					.setMinLength(1)
					.setMaxLength(6),
			),
		);
}

export async function handleContraofertaModalSubmitInteraction(
	interaction: ModalSubmitInteraction,
	appContext: AppContext,
): Promise<void> {
	if (
		!interaction.customId.startsWith(`${TIMBA_CONTRAOFERTA_MODAL_CUSTOM_ID}:`)
	)
		return;

	const timbaOriginalId = Number(
		interaction.customId.slice(TIMBA_CONTRAOFERTA_MODAL_CUSTOM_ID.length + 1),
	);
	if (Number.isNaN(timbaOriginalId)) return;

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

	const descripcion = interaction.fields
		.getTextInputValue(TIMBA_DESCRIPCION_FIELD_ID)
		.trim();
	const puntosParsed = puntosApuestaSchema.safeParse(
		interaction.fields.getTextInputValue(TIMBA_PUNTOS_FIELD_ID),
	);
	const puntosArriesgadosRaw = interaction.fields
		.getTextInputValue(TIMBA_PUNTOS_ARRIESGADOS_FIELD_ID)
		.trim();
	const puntosArriesgadosParsed = puntosArriesgadosRaw
		? puntosApuestaSchema.safeParse(puntosArriesgadosRaw)
		: null;

	if (
		!descripcion ||
		!puntosParsed.success ||
		(puntosArriesgadosParsed !== null && !puntosArriesgadosParsed.success)
	) {
		await interaction.reply({
			content:
				"❌ Revisa los datos: la descripción no puede estar vacía y los puntos deben ser un número entero mayor a 0.",
			ephemeral: true,
		});
		return;
	}

	const puntosArriesgados = puntosArriesgadosParsed?.data ?? puntosParsed.data;

	await interaction.deferReply({ ephemeral: true });

	try {
		const result = await appContext.services.timba.crearContraoferta({
			jugador1Id: interaction.user.id,
			timbaOriginalId,
			descripcion,
			puntosPropuestos: puntosParsed.data,
			puntosArriesgados,
		});

		await interaction.editReply({
			content: `✅ Contraoferta enviada. _"${descripcion}"_`,
		});

		const messageId = await sendComponentsToAnnouncementChannel(
			interaction.client,
			buildContraofertaComponent(result, result.timbaOriginalJugador1Id),
		);
		if (messageId) {
			await appContext.services.timba.guardarMensajeTimba(
				result.contraofertaId,
				messageId,
			);
		}
	} catch (error) {
		await interaction.editReply({
			content: `❌ ${error instanceof Error ? error.message : "Error desconocido"}`,
		});
	}
}

export async function handleTimbaButtonInteraction(
	interaction: ButtonInteraction,
	appContext: AppContext,
): Promise<void> {
	const { customId } = interaction;

	if (customId.startsWith(TIMBA_CONTRAOFERTA_ACEPTAR_PREFIX)) {
		const contraofertaId = Number(
			customId.slice(TIMBA_CONTRAOFERTA_ACEPTAR_PREFIX.length),
		);
		if (Number.isNaN(contraofertaId)) return;

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
			const result = await appContext.services.timba.aceptarContraoferta({
				contraofertaId,
				jugador1OriginalId: interaction.user.id,
			});

			await interaction.editReply({
				// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				components: buildTimbaAceptadaComponent(result) as any,
				flags: MessageFlags.IsComponentsV2,
			});

			await sendAnnouncementChannel(
				interaction.client,
				[
					`_🤝 **¡Contraoferta aceptada! ${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}**_`,
					result.puntosPropuestos === result.puntosArriesgados
						? `<@${result.jugador1Id}> 🆚 <@${result.jugador2Id}> — **${result.puntosPropuestos} 💠** en juego`
						: `<@${result.jugador1Id}> arriesga **${result.puntosPropuestos} 💠** 🆚 <@${result.jugador2Id}> arriesga **${result.puntosArriesgados} 💠**`,
					`"${result.descripcion}"`,
				].join("\n"),
			);
		} catch (error) {
			await interaction.followUp({
				content: `❌ ${error instanceof Error ? error.message : "No se pudo aceptar la contraoferta."}`,
				ephemeral: true,
			});
		}
		return;
	}

	if (customId.startsWith(TIMBA_CONTRAOFERTA_RECHAZAR_PREFIX)) {
		const contraofertaId = Number(
			customId.slice(TIMBA_CONTRAOFERTA_RECHAZAR_PREFIX.length),
		);
		if (Number.isNaN(contraofertaId)) return;

		await interaction.deferUpdate();

		try {
			const rechazada = await appContext.services.timba.rechazarContraoferta({
				contraofertaId,
				jugador1OriginalId: interaction.user.id,
			});

			const toDelete = [
				rechazada.discordMessageId,
				...rechazada.cancelledContraofertaMessageIds,
			].filter((id): id is string => id !== null);
			await deleteAnnouncementMessages(interaction.client, toDelete);

			await interaction.editReply({
				components: [
					{
						type: 17,
						components: [
							{
								type: 10,
								content: "❌ Contraoferta rechazada.",
							},
						],
					},
					// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				] as any,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			await interaction.followUp({
				content: `❌ ${error instanceof Error ? error.message : "No se pudo rechazar la contraoferta."}`,
				ephemeral: true,
			});
		}
		return;
	}

	if (customId.startsWith(TIMBA_CONTRAOFERTA_PREFIX)) {
		const timbaOriginalId = Number(
			customId.slice(TIMBA_CONTRAOFERTA_PREFIX.length),
		);
		if (Number.isNaN(timbaOriginalId)) return;

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

		await interaction.showModal(buildContraofertaModal(timbaOriginalId, 99));
		return;
	}

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

			await Promise.all([
				sendAnnouncementChannel(
					interaction.client,
					[
						`_🤝 **¡Timba Time cerrada! ${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}**_`,
						result.puntosPropuestos === result.puntosArriesgados
							? `<@${result.jugador1Id}> 🆚 <@${result.jugador2Id}> — **${result.puntosPropuestos} 💠** en juego`
							: `<@${result.jugador1Id}> arriesga **${result.puntosPropuestos} 💠** 🆚 <@${result.jugador2Id}> arriesga **${result.puntosArriesgados} 💠**`,
						`"${result.descripcion}"`,
					].join("\n"),
				),
				deleteAnnouncementMessages(
					interaction.client,
					result.cancelledContraofertaMessageIds,
				),
			]);
		} catch (error) {
			await interaction.followUp({
				content: `❌ ${error instanceof Error ? error.message : "No se pudo aceptar la timba."}`,
				ephemeral: true,
			});
		}
		return;
	}

	if (
		customId.startsWith(TIMBA_MT_RESOLVER_J1_PREFIX) ||
		customId.startsWith(TIMBA_MT_RESOLVER_J2_PREFIX) ||
		customId.startsWith(TIMBA_MT_REVERTIR_PREFIX)
	) {
		await handleTimbaResolucionMedioTiempo(interaction, appContext, customId);
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

		await sendAlertsChannel(
			interaction.client,
			`* <@${result.ganadorId}> le robó **${result.puntosRobados} 💠** a <@${result.perdedorId}> — "${result.descripcion}"`,
		);

		const remaining =
			await appContext.services.timba.verTimbasCerradasPorPartido(partidoId);

		if (remaining.length > 0) {
			await interaction.editReply({
				components: buildTimbaResolucionComponents(
					remaining.slice(0, 3),
					partidoId,
				),
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			await Promise.all([
				interaction.editReply({
					components: [
						{
							type: 17,
							components: [
								{
									type: 10,
									content: "✅ Todas las timba times resueltas.",
								},
							],
						},
						// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
					] as any,
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				}),
				sendAlertsChannel(
					interaction.client,
					`✅ _Todas las **Timba Times** del partido resueltas._`,
				),
			]);
		}
	} catch (error) {
		await interaction.followUp({
			content: `❌ ${error instanceof Error ? error.message : "No se pudo resolver la timba."}`,
			ephemeral: true,
		});
	}
}

async function handleTimbaResolucionMedioTiempo(
	interaction: ButtonInteraction,
	appContext: AppContext,
	customId: string,
) {
	const isMtJ1 = customId.startsWith(TIMBA_MT_RESOLVER_J1_PREFIX);
	const isMtJ2 = customId.startsWith(TIMBA_MT_RESOLVER_J2_PREFIX);
	const isMtRevertir = customId.startsWith(TIMBA_MT_REVERTIR_PREFIX);

	const prefix = isMtJ1
		? TIMBA_MT_RESOLVER_J1_PREFIX
		: isMtJ2
			? TIMBA_MT_RESOLVER_J2_PREFIX
			: TIMBA_MT_REVERTIR_PREFIX;

	const suffix = customId.slice(prefix.length);
	const colonIdx = suffix.lastIndexOf(":");
	if (colonIdx === -1) return;

	const timbaId = Number(suffix.slice(0, colonIdx));
	const partidoId = Number(suffix.slice(colonIdx + 1));
	if (Number.isNaN(timbaId) || Number.isNaN(partidoId)) return;

	await interaction.deferUpdate();

	try {
		if (isMtRevertir) {
			await appContext.services.timba.revertirTimba(timbaId);
		} else {
			const result = await appContext.services.timba.resolverTimbaMedioTiempo({
				timbaId,
				ganadorJugador: isMtJ1 ? "j1" : "j2",
			});
			await sendAlertsChannel(
				interaction.client,
				`* <@${result.ganadorId}> le robó **${result.puntosRobados} 💠** a <@${result.perdedorId}> — "${result.descripcion}"`,
			);
		}

		const timbas =
			await appContext.services.timba.verTimbasMedioTiempoPorPartido(partidoId);

		if (timbas.length > 0) {
			await interaction.editReply({
				components: buildTimbaResolucionMedioTiempoComponents(
					timbas.slice(0, 3),
					partidoId,
				),
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			await interaction.editReply({
				components: [
					{
						type: 17,
						components: [
							{
								type: 10,
								content: "✅ Sin Timba Times pendientes en este medio tiempo.",
							},
						],
					},
					// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
				] as any,
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		}
	} catch (error) {
		await interaction.followUp({
			content: `❌ ${error instanceof Error ? error.message : "No se pudo procesar la timba."}`,
			ephemeral: true,
		});
	}
}
