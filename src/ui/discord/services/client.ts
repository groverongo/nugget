import { config } from "@support/config";
import { logger } from "@support/logger";
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import z from "zod";
import type { AppContext } from "../../../app";
import { discordCommandPayloads, POLLERO_ROLE_ID } from "../commands";
import {
	handleAutocompleteInteraction,
	handleCommandInteraction,
	handlePartidosButtonInteraction,
	handlePartidosDateSelectInteraction,
	handlePrediccionesDateSelectInteraction,
	handlePrediccionModalSubmitInteraction,
} from "../handlers/interactions";

z.config(z.locales.es());

export function createDiscordClient(): Client {
	return new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	});
}

async function registerApplicationCommands(client: Client): Promise<void> {
	if (!client.application) {
		throw new Error(
			"Discord application no disponible para registrar comandos.",
		);
	}

	const rest = new REST({ version: "10" }).setToken(config.discord.token);

	await rest.put(Routes.applicationCommands(client.application.id), {
		body: discordCommandPayloads,
	});
}

export function registerDiscordEventHandlers(
	client: Client,
	appContext: AppContext,
): void {
	client.once(Events.ClientReady, async (readyClient) => {
		try {
			await registerApplicationCommands(readyClient);
			logger.info({ user: readyClient.user.tag }, "Discord bot listo");
		} catch (error) {
			logger.error(
				{ err: error },
				"No se pudieron registrar los comandos de Discord",
			);
			await client.destroy();
			process.exit(1);
		}
	});

	client.on(Events.InteractionCreate, async (interaction) => {
		try {
			if (interaction.isAutocomplete()) {
				await handleAutocompleteInteraction(interaction, appContext);
				return;
			}

			if (interaction.isChatInputCommand()) {
				await handleCommandInteraction(interaction, appContext);
				return;
			}

			if (interaction.isButton()) {
				await handlePartidosButtonInteraction(interaction, appContext);
				return;
			}

			if (interaction.isModalSubmit()) {
				await handlePrediccionModalSubmitInteraction(interaction, appContext);
				return;
			}

			if (interaction.isStringSelectMenu()) {
				await handlePartidosDateSelectInteraction(interaction, appContext);
				await handlePrediccionesDateSelectInteraction(interaction, appContext);
			}
		} catch (error) {
			logger.error(
				{ err: error },
				"Error al manejar una interacción de Discord",
			);
		}
	});

	client.on(Events.GuildMemberAdd, async (member) => {
		logger.info(
			{ userId: member.id, username: member.user.username },
			"Nuevo miembro entro al servidor",
		);
		try {
			await appContext.services.usuarios.createUsuario({
				id: member.id,
				username: member.user.username,
			});
		} catch (error) {
			logger.error(
				{ err: error, userId: member.id },
				"Error creando usuario en DB",
			);
		}
	});

	client.on(Events.GuildMemberRemove, async (member) => {
		logger.info({ userId: member.id }, "Miembro salió del servidor");
		try {
			await appContext.services.usuarios.deleteUsuario({ id: member.id });

			if (member.roles.cache.has(POLLERO_ROLE_ID)) {
				const allMembers = await member.guild.members.fetch();
				const polleroCount = allMembers.filter((m) =>
					m.roles.cache.has(POLLERO_ROLE_ID),
				).size;
				await appContext.services.usuarios.recalcularPremios(polleroCount);
			}
		} catch (error) {
			logger.error(
				{ err: error, userId: member.id },
				"Error al salir miembro del servidor",
			);
		}
	});

	client.on(Events.Error, (error) => {
		logger.error({ err: error }, "Discord client emitió un error");
	});

	client.on(Events.Warn, (message) => {
		logger.warn({ message }, "Discord client emitió una advertencia");
	});
}
