import {
	Collection,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import {
	buildPartidosComponents,
	isValidDateInput,
} from "../components/partidos";
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
			.setDescription("Fecha en formato YYYY-MM-DD")
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
				const date = interaction.options.getString("fecha", true);

				if (!isValidDateInput(date)) {
					await interaction.reply({
						content: "La fecha debe tener el formato YYYY-MM-DD.",
						ephemeral: true,
					});
					return;
				}

				await interaction.deferReply();

				const partidos = await appContext.services.partidos.verPartidosPorFecha(
					{
						date,
					},
				);
				const fechas = await appContext.services.partidos.verFechasDePartidos();

				await interaction.editReply({
					components: buildPartidosComponents(date, partidos, fechas),
					flags: MessageFlags.IsComponentsV2,
				});
			},
		},
	],
]);

export const discordCommandPayloads: DiscordCommandPayload[] =
	discordCommands.map((command) => command.definition.toJSON());
