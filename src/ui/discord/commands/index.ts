import {
	Collection,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { buildPartidosComponents } from "../components/partidos";
import { fechaSchema } from "../types/shared";
import type { DiscordCommand, DiscordCommandPayload } from "../utils/types";

const pingCommand = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Responde con pong")
	.setContexts(InteractionContextType.Guild);

const partidosCommand = new SlashCommandBuilder()
	.setName("partidos")
	.setDescription("Muestra los partidos de una fecha")
	.addStringOption((option) =>
		option
			.setName("fecha")
			.setDescription("Fecha en formato YYYY-MM-DD para Peru")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

export const discordCommands = new Collection<string, DiscordCommand>([
	[
		"ping",
		{
			definition: pingCommand,
			handle: async (interaction) => {
				await interaction.reply(`pong ${interaction.user}`);
			},
		},
	],
	[
		"partidos",
		{
			definition: partidosCommand,
			handle: async (interaction, appContext) => {
				const dateParsed = fechaSchema.safeParse(
					interaction.options.getString("fecha"),
				);

				if (!dateParsed.success) {
					await interaction.reply({
						content: dateParsed.error.message,
						ephemeral: true,
					});
					return;
				}

				await interaction.deferReply();

				const partidos = await appContext.services.partidos.verPartidosPorFecha(
					{
						date: dateParsed.data,
					},
				);
				const fechas = await appContext.services.partidos.verFechasDePartidos();

				await interaction.editReply({
					components: buildPartidosComponents(
						dateParsed.data,
						partidos,
						fechas,
					),
					flags: MessageFlags.IsComponentsV2,
				});
			},
		},
	],
]);

export const discordCommandPayloads: DiscordCommandPayload[] =
	discordCommands.map((command) => command.definition.toJSON());
