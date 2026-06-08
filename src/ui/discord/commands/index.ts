import { config } from "@support/config";
import {
	Collection,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { buildPartidosComponents } from "../components/partidos";
import { buildMisPrediccionesComponents } from "../components/predicciones";
import { fechaSchema } from "../types/shared";
import type { DiscordCommand, DiscordCommandPayload } from "../utils/types";

const pingCommand = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Responde con pong")
	.setContexts(InteractionContextType.Guild);

const anonCommand = new SlashCommandBuilder()
	.setName("anon")
	.setDescription("Envía un mensaje anónimo al administrador del bot")
	.addStringOption((option) =>
		option
			.setName("mensaje")
			.setDescription("El mensaje que quieres enviar")
			.setRequired(true),
	)
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

const misPrediccionesCommand = new SlashCommandBuilder()
	.setName("mis-predicciones")
	.setDescription("Muestra mis predicciones de una fecha")
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
		"anon",
		{
			definition: anonCommand,
			handle: async (interaction) => {
				const mensaje = interaction.options.getString("mensaje", true);
				const ownerId = config.discord.owner.id;

				if (!ownerId) {
					await interaction.reply({
						content: "El ID del administrador no está configurado.",
						ephemeral: true,
					});
					return;
				}

				try {
					const owner = await interaction.client.users.fetch(ownerId);
					await owner.send(
						`📨 Mensaje anónimo de <@${interaction.user.id}>:\n${mensaje}`,
					);
					await interaction.reply({
						content: "Tu mensaje anónimo ha sido enviado correctamente.",
						ephemeral: true,
					});
				} catch {
					await interaction.reply({
						content:
							"No se pudo enviar el mensaje. Revisa la configuración del bot.",
						ephemeral: true,
					});
				}
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
	[
		"mis-predicciones",
		{
			definition: misPrediccionesCommand,
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

				await interaction.deferReply({ ephemeral: true });

				const predicciones =
					await appContext.services.predicciones.verMisPrediccionesPorFecha({
						usuarioId: interaction.user.id,
						date: dateParsed.data,
					});
				const fechas =
					await appContext.services.predicciones.verFechasDePrediccionesPorUsuario(
						interaction.user.id,
					);

				await interaction.editReply({
					components: buildMisPrediccionesComponents(
						dateParsed.data,
						predicciones,
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
