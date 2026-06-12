import { config } from "@support/config";
import {
	Collection,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import {
	buildPartidosAdminComponents,
	buildPartidosComponents,
} from "../components/partidos";
import { buildMisPrediccionesComponents } from "../components/predicciones";
import {
	sendAlertsChannel,
	sendAnnouncementChannel,
} from "../handlers/interactions";
import { obtenerYYYYMMDDPeru } from "../utils/fecha";
import {
	buildAlertaAuraPoints,
	buildAlertaFinPartido,
	buildAlertaMedioTiempo,
} from "../utils/match-announcement";
import type { DiscordCommand, DiscordCommandPayload } from "../utils/types";

export const POLLERO_ROLE_ID = "1513773724074250350";

async function assertPollero(
	interaction: import("discord.js").ChatInputCommandInteraction,
): Promise<boolean> {
	const member =
		interaction.guild?.members.cache.get(interaction.user.id) ??
		(await interaction.guild?.members.fetch(interaction.user.id));
	if (member?.roles.cache.has(POLLERO_ROLE_ID)) return true;
	await interaction.reply({
		content: "Primero usa `/predecir-awards` para unirte a la polla 🐔",
		ephemeral: true,
	});
	return false;
}

const AWARDS_PLAYER_FIELDS = [
	"goleador",
	"mejor_jugador",
	"mejor_arquero",
	"mejor_jugador_joven",
	"mejor_gol",
] as const;

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
	.setDescription(
		"Muestra los partidos programados y en vivo de hoy (hora Perú)",
	)
	.setContexts(InteractionContextType.Guild);

const actualizarPartidoCommand = new SlashCommandBuilder()
	.setName("actualizar-partido")
	.setDescription(
		"[ADMIN] Cierra un partido, calcula resultados y otorga puntos",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido a cerrar")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("goles_local")
			.setDescription("Goles del equipo local (resultado final)")
			.setRequired(true)
			.setMinValue(0),
	)
	.addIntegerOption((option) =>
		option
			.setName("goles_visitante")
			.setDescription("Goles del equipo visitante (resultado final)")
			.setRequired(true)
			.setMinValue(0),
	)
	.addBooleanOption((option) =>
		option
			.setName("milagro")
			.setDescription("¿El gol decisivo fue al minuto 90 o más tarde?")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

const actualizarPartidoMtCommand = new SlashCommandBuilder()
	.setName("halftime-partido")
	.setDescription(
		"[ADMIN] Actualiza el score de medio tiempo (no otorga puntos)",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("goles_local")
			.setDescription("Goles del equipo local al medio tiempo")
			.setRequired(true)
			.setMinValue(0),
	)
	.addIntegerOption((option) =>
		option
			.setName("goles_visitante")
			.setDescription("Goles del equipo visitante al medio tiempo")
			.setRequired(true)
			.setMinValue(0),
	)
	.setContexts(InteractionContextType.Guild);

const sayCommand = new SlashCommandBuilder()
	.setName("say")
	.setDescription("[ADMIN] Hace que Nugget envíe un mensaje en el canal actual")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("mensaje")
			.setDescription("El mensaje que enviará Nugget")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

const misPrediccionesCommand = new SlashCommandBuilder()
	.setName("mis-predicciones")
	.setDescription("Muestra tus predicciones filtradas por fecha")
	.setContexts(InteractionContextType.Guild);

const misAwardsCommand = new SlashCommandBuilder()
	.setName("mis-awards")
	.setDescription("Muestra tus predicciones de awards del Mundial 2026")
	.setContexts(InteractionContextType.Guild);

const predecirAwardsCommand = new SlashCommandBuilder()
	.setName("predecir-awards")
	.setDescription("Predice los premios del Mundial 2026")
	.addStringOption((option) =>
		option
			.setName("campeon")
			.setDescription("Equipo campeón del Mundial 2026")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("goleador")
			.setDescription("Goleador del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador")
			.setDescription("Mejor jugador del torneo (Balón de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_arquero")
			.setDescription("Mejor arquero del torneo (Guante de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador_joven")
			.setDescription("Mejor jugador joven del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_gol")
			.setDescription("Jugador autor del mejor gol del torneo (Premio Puskás)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_decepcion")
			.setDescription("Selección decepción del torneo (White Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_sorpresa")
			.setDescription("Selección sorpresa del torneo (Dark Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const predecirAdminCommand = new SlashCommandBuilder()
	.setName("predecir-admin")
	.setDescription(
		"[ADMIN] Registra la predicción de un partido para otro usuario",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("usuario")
			.setDescription("Usuario al que registrar la predicción")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const predecirAwardsAdminCommand = new SlashCommandBuilder()
	.setName("predecir-awards-admin")
	.setDescription(
		"[ADMIN] Registra las predicciones de awards para otro usuario",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("usuario")
			.setDescription("Usuario al que registrar las predicciones")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("campeon")
			.setDescription("Equipo campeón del Mundial 2026")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("goleador")
			.setDescription("Goleador del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador")
			.setDescription("Mejor jugador del torneo (Balón de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_arquero")
			.setDescription("Mejor arquero del torneo (Guante de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador_joven")
			.setDescription("Mejor jugador joven del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_gol")
			.setDescription("Jugador autor del mejor gol del torneo (Premio Puskás)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_decepcion")
			.setDescription("Selección decepción del torneo (White Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_sorpresa")
			.setDescription("Selección sorpresa del torneo (Dark Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const actualizarAwardsCommand = new SlashCommandBuilder()
	.setName("actualizar-awards")
	.setDescription(
		"[ADMIN] Asigna los premios del Mundial y suma puntos a los usuarios",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("campeon")
			.setDescription("Equipo campeón del Mundial 2026")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("goleador")
			.setDescription("Goleador del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador")
			.setDescription("Mejor jugador del torneo (Balón de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_arquero")
			.setDescription("Mejor arquero del torneo (Guante de Oro)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_jugador_joven")
			.setDescription("Mejor jugador joven del torneo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("mejor_gol")
			.setDescription("Jugador autor del mejor gol del torneo (Premio Puskás)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_decepcion")
			.setDescription("Selección decepción del torneo (White Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("seleccion_sorpresa")
			.setDescription("Selección sorpresa del torneo (Dark Horse)")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("mejor_gol_posicion")
			.setDescription("Posición del mejor gol entre todos los nominados (1-10)")
			.setRequired(true)
			.setMinValue(1)
			.setMaxValue(10),
	)
	.setContexts(InteractionContextType.Guild);

export const discordCommands = new Collection<string, DiscordCommand>([
	[
		"actualizar-partido",
		{
			definition: actualizarPartidoCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(focusedValue),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre} [${p.estado}]`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);
				const golesLocal = interaction.options.getInteger("goles_local", true);
				const golesVisitante = interaction.options.getInteger(
					"goles_visitante",
					true,
				);
				const milagro = interaction.options.getBoolean("milagro", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const resumen = await appContext.services.admin.actualizarPartido({
						partidoId,
						golesLocal,
						golesVisitante,
						milagro,
					});

					const extras: string[] = [];
					if (resumen.extraPartidazo) extras.push("Partidazo ⚡");
					if (milagro) extras.push("Milagro 🙏");
					if (resumen.puntosBatacazo > 0)
						extras.push(`Batacazo +${resumen.puntosBatacazo}pts 🐴`);
					if (resumen.puntosElegido > 0)
						extras.push(`El Elegido +${resumen.puntosElegido}pts 🎯`);

					await interaction.editReply({
						content: [
							`✅ **Partido #${partidoId}** cerrado: **${golesLocal} - ${golesVisitante}**`,
							`👥 Apostadores: ${resumen.totalApostadores} | ✅ Exactos: ${resumen.totalAcertadores}`,
							extras.length > 0
								? `🎁 Extras activos: ${extras.join(", ")}`
								: "Sin extras activos.",
						].join("\n"),
					});

					const [info, predicciones, puntajes] = await Promise.all([
						appContext.services.partidos.verInformacionPartido({
							id: partidoId,
						}),
						appContext.services.predicciones.verPrediccionesPorPartido({
							partidoId,
						}),
						appContext.services.predicciones.verPuntajesPartido({ partidoId }),
					]);

					if (info) {
						await sendAlertsChannel(
							interaction.client,
							buildAlertaFinPartido(info, predicciones),
						);
						const mensajeAura = buildAlertaAuraPoints(puntajes);
						if (mensajeAura) {
							await sendAlertsChannel(interaction.client, mensajeAura);
						}
					}
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"halftime-partido",
		{
			definition: actualizarPartidoMtCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(focusedValue),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre} [${p.estado}]`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);
				const golesLocal = interaction.options.getInteger("goles_local", true);
				const golesVisitante = interaction.options.getInteger(
					"goles_visitante",
					true,
				);

				await interaction.deferReply({ ephemeral: true });

				try {
					await appContext.services.admin.actualizarPartidoMedioTiempo({
						partidoId,
						golesLocal,
						golesVisitante,
					});

					await interaction.editReply({
						content: `⏸️ **Partido #${partidoId}** — Medio tiempo: **${golesLocal} - ${golesVisitante}**`,
					});

					const [info, predicciones] = await Promise.all([
						appContext.services.partidos.verInformacionPartido({
							id: partidoId,
						}),
						appContext.services.predicciones.verPrediccionesPorPartido({
							partidoId,
						}),
					]);

					if (info) {
						await sendAlertsChannel(
							interaction.client,
							buildAlertaMedioTiempo(info, predicciones),
						);
					}
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"say",
		{
			definition: sayCommand,
			handle: async (interaction) => {
				const mensaje = interaction.options.getString("mensaje", true);

				await interaction.reply({ ephemeral: true, content: "✅" });
				if (interaction.channel && "send" in interaction.channel) {
					await interaction.channel.send(mensaje);
				}
			},
		},
	],
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
				const ownerIds = config.discord.owner.id;

				if (ownerIds.length === 0) {
					await interaction.reply({
						content: "El ID del administrador no está configurado.",
						ephemeral: true,
					});
					return;
				}

				try {
					await Promise.all(
						ownerIds.map(async (ownerId) => {
							const owner = await interaction.client.users.fetch(ownerId);
							await owner.send(
								`📨 Mensaje anónimo de <@${interaction.user.id}>:\n${mensaje}`,
							);
						}),
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
				await interaction.deferReply({ ephemeral: true });

				const fechas = await appContext.services.partidos.verFechasDePartidos();
				const hoy = obtenerYYYYMMDDPeru();
				const fechaSeleccionada = fechas.includes(hoy) ? hoy : "2026-06-11";

				const partidos = await appContext.services.partidos.verPartidosPorFecha(
					{
						date: fechaSeleccionada,
					},
				);

				await interaction.editReply({
					components: buildPartidosComponents(
						fechaSeleccionada,
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
				if (!(await assertPollero(interaction))) return;

				await interaction.deferReply({ ephemeral: true });

				const fechas =
					await appContext.services.predicciones.verFechasDePrediccionesPorUsuario(
						interaction.user.id,
					);

				if (fechas.length === 0) {
					await interaction.editReply({
						content: "Aún no has realizado ninguna predicción.",
					});
					return;
				}

				const fechaSeleccionada = fechas[0];
				const predicciones =
					await appContext.services.predicciones.verMisPrediccionesPorFecha({
						usuarioId: interaction.user.id,
						date: fechaSeleccionada,
					});

				await interaction.editReply({
					components: buildMisPrediccionesComponents(
						fechaSeleccionada,
						predicciones,
						fechas,
					),
					flags: MessageFlags.IsComponentsV2,
				});
			},
		},
	],
	[
		"mis-awards",
		{
			definition: misAwardsCommand,
			handle: async (interaction, appContext) => {
				if (!(await assertPollero(interaction))) return;
				await interaction.deferReply({ ephemeral: true });

				const awards = await appContext.services.awards.verMisAwards(
					interaction.user.id,
				);

				if (!awards) {
					await interaction.editReply({
						content: "Aún no has enviado tus predicciones de awards.",
					});
					return;
				}

				const lineas = [
					`🏆 **Campeón:** ${awards.campeon ?? "—"}`,
					`⚽ **Goleador:** ${awards.goleador ?? "—"}`,
					`🌟 **Mejor Jugador (Balón de Oro):** ${awards.mejorJugador ?? "—"}`,
					`🧤 **Mejor Arquero (Guante de Oro):** ${awards.mejorArquero ?? "—"}`,
					`🌱 **Mejor Jugador Joven:** ${awards.mejorJugadorJoven ?? "—"}`,
					`💫 **Mejor Gol (Puskás):** ${awards.mejorGol ?? "—"}`,
					`💀 **Selección Decepción (White Horse):** ${awards.seleccionDecepcion ?? "—"}`,
					`🐴 **Selección Sorpresa (Dark Horse):** ${awards.seleccionSorpresa ?? "—"}`,
				];

				await interaction.editReply({
					content: `**Tus predicciones de Awards del Mundial 2026:**\n${lineas.join("\n")}`,
				});
			},
		},
	],
	[
		"predecir-awards",
		{
			definition: predecirAwardsCommand,
			autocomplete: async (interaction, appContext) => {
				const focused = interaction.options.getFocused(true);
				const query = focused.value.toString();

				if (focused.name === "campeon") {
					const equipos = await appContext.services.awards.verEquipos();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_decepcion") {
					const equipos =
						await appContext.services.awards.verEquiposWhiteHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_sorpresa") {
					const equipos =
						await appContext.services.awards.verEquiposDarkHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (
					AWARDS_PLAYER_FIELDS.includes(
						focused.name as (typeof AWARDS_PLAYER_FIELDS)[number],
					)
				) {
					const jugadores =
						await appContext.services.awards.buscarJugadores(query);
					const opciones = jugadores.slice(0, 25).map((j) => ({
						name: `${j.nombre} (${j.equipo_nombre})`,
						value: String(j.id),
					}));
					await interaction.respond(opciones);
				}
			},
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });

				try {
					const campeon = parseInt(
						interaction.options.getString("campeon", true),
						10,
					);
					const goleador = parseInt(
						interaction.options.getString("goleador", true),
						10,
					);
					const mejorJugador = parseInt(
						interaction.options.getString("mejor_jugador", true),
						10,
					);
					const mejorArquero = parseInt(
						interaction.options.getString("mejor_arquero", true),
						10,
					);
					const mejorJugadorJoven = parseInt(
						interaction.options.getString("mejor_jugador_joven", true),
						10,
					);
					const mejorGol = parseInt(
						interaction.options.getString("mejor_gol", true),
						10,
					);
					const seleccionDecepcion = parseInt(
						interaction.options.getString("seleccion_decepcion", true),
						10,
					);
					const seleccionSorpresa = parseInt(
						interaction.options.getString("seleccion_sorpresa", true),
						10,
					);

					if (
						[
							campeon,
							goleador,
							mejorJugador,
							mejorArquero,
							mejorJugadorJoven,
							mejorGol,
							seleccionDecepcion,
							seleccionSorpresa,
						].some(Number.isNaN)
					) {
						await interaction.editReply({
							content: "❌ Selecciona los valores desde el autocompletado.",
						});
						return;
					}

					const resultado = await appContext.services.awards.guardarAwards({
						usuarioId: interaction.user.id,
						campeon,
						goleador,
						mejorJugador,
						mejorArquero,
						mejorJugadorJoven,
						mejorGol,
						seleccionDecepcion,
						seleccionSorpresa,
					});

					const member =
						interaction.guild?.members.cache.get(interaction.user.id) ??
						(await interaction.guild?.members.fetch(interaction.user.id));
					await member?.roles.add(POLLERO_ROLE_ID);
					await appContext.services.usuarios.actualizarParticipante({
						id: interaction.user.id,
						participante: true,
					});

					await appContext.services.usuarios.recalcularPremios();

					await interaction.editReply({
						content:
							"✅ Tus predicciones de awards han sido guardadas. ¡Ya eres un Pollero! 🐔",
					});

					await sendAnnouncementChannel(
						interaction.client,
						resultado === "created"
							? `_🎯 ¡<@${interaction.user.id}> ha enviado sus predicciones de **Awards del Mundial**!_`
							: `_✏️ ¡<@${interaction.user.id}> ha actualizado sus predicciones de **Awards del Mundial**!_`,
					);
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"predecir-admin",
		{
			definition: predecirAdminCommand,
			autocomplete: async (interaction, appContext) => {
				const focused = interaction.options.getFocused(true);
				if (focused.name !== "usuario") return;
				const query = focused.value.toString();
				const usuarios = await appContext.services.usuarios.listUsuarios();
				const opciones = usuarios
					.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
					.slice(0, 25)
					.map((u) => ({ name: u.username, value: u.id }));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });

				const usuarioId = interaction.options.getString("usuario", true);
				const fechas = await appContext.services.partidos.verFechasDePartidos();
				const hoy = obtenerYYYYMMDDPeru();
				const fechaSeleccionada = fechas.includes(hoy)
					? hoy
					: (fechas[0] ?? "2026-06-11");

				const partidos = await appContext.services.partidos.verPartidosPorFecha(
					{
						date: fechaSeleccionada,
					},
				);

				await interaction.editReply({
					components: buildPartidosAdminComponents(
						fechaSeleccionada,
						partidos,
						fechas,
						usuarioId,
					),
					flags: MessageFlags.IsComponentsV2,
				});
			},
		},
	],
	[
		"predecir-awards-admin",
		{
			definition: predecirAwardsAdminCommand,
			autocomplete: async (interaction, appContext) => {
				const focused = interaction.options.getFocused(true);
				const query = focused.value.toString();

				if (focused.name === "usuario") {
					const usuarios = await appContext.services.usuarios.listUsuarios();
					const opciones = usuarios
						.filter((u) =>
							u.username.toLowerCase().includes(query.toLowerCase()),
						)
						.slice(0, 25)
						.map((u) => ({ name: u.username, value: u.id }));
					await interaction.respond(opciones);
				} else if (focused.name === "campeon") {
					const equipos = await appContext.services.awards.verEquipos();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_decepcion") {
					const equipos =
						await appContext.services.awards.verEquiposWhiteHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_sorpresa") {
					const equipos =
						await appContext.services.awards.verEquiposDarkHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (
					AWARDS_PLAYER_FIELDS.includes(
						focused.name as (typeof AWARDS_PLAYER_FIELDS)[number],
					)
				) {
					const jugadores =
						await appContext.services.awards.buscarJugadores(query);
					const opciones = jugadores.slice(0, 25).map((j) => ({
						name: `${j.nombre} (${j.equipo_nombre})`,
						value: String(j.id),
					}));
					await interaction.respond(opciones);
				}
			},
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });

				try {
					const usuarioId = interaction.options.getString("usuario", true);
					const campeon = parseInt(
						interaction.options.getString("campeon", true),
						10,
					);
					const goleador = parseInt(
						interaction.options.getString("goleador", true),
						10,
					);
					const mejorJugador = parseInt(
						interaction.options.getString("mejor_jugador", true),
						10,
					);
					const mejorArquero = parseInt(
						interaction.options.getString("mejor_arquero", true),
						10,
					);
					const mejorJugadorJoven = parseInt(
						interaction.options.getString("mejor_jugador_joven", true),
						10,
					);
					const mejorGol = parseInt(
						interaction.options.getString("mejor_gol", true),
						10,
					);
					const seleccionDecepcion = parseInt(
						interaction.options.getString("seleccion_decepcion", true),
						10,
					);
					const seleccionSorpresa = parseInt(
						interaction.options.getString("seleccion_sorpresa", true),
						10,
					);

					if (
						[
							campeon,
							goleador,
							mejorJugador,
							mejorArquero,
							mejorJugadorJoven,
							mejorGol,
							seleccionDecepcion,
							seleccionSorpresa,
						].some(Number.isNaN)
					) {
						await interaction.editReply({
							content: "❌ Selecciona los valores desde el autocompletado.",
						});
						return;
					}

					const resultado = await appContext.services.awards.guardarAwardsAdmin(
						{
							usuarioId,
							campeon,
							goleador,
							mejorJugador,
							mejorArquero,
							mejorJugadorJoven,
							mejorGol,
							seleccionDecepcion,
							seleccionSorpresa,
						},
					);

					const member =
						interaction.guild?.members.cache.get(usuarioId) ??
						(await interaction.guild?.members.fetch(usuarioId));
					await member?.roles.add(POLLERO_ROLE_ID);
					await appContext.services.usuarios.actualizarParticipante({
						id: usuarioId,
						participante: true,
					});

					await appContext.services.usuarios.recalcularPremios();

					await interaction.editReply({
						content:
							resultado === "created"
								? `✅ Predicciones de awards guardadas para <@${usuarioId}>.`
								: `✅ Predicciones de awards actualizadas para <@${usuarioId}>.`,
					});

					await sendAnnouncementChannel(
						interaction.client,
						resultado === "created"
							? `_🎯 ¡<@${usuarioId}> ha enviado sus predicciones de **Awards del Mundial**!_`
							: `_✏️ ¡<@${usuarioId}> ha actualizado sus predicciones de **Awards del Mundial**!_`,
					);
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"actualizar-awards",
		{
			definition: actualizarAwardsCommand,
			autocomplete: async (interaction, appContext) => {
				const focused = interaction.options.getFocused(true);
				const query = focused.value.toString();

				if (focused.name === "campeon") {
					const equipos = await appContext.services.awards.verEquipos();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_decepcion") {
					const equipos =
						await appContext.services.awards.verEquiposWhiteHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (focused.name === "seleccion_sorpresa") {
					const equipos =
						await appContext.services.awards.verEquiposDarkHorse();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
						.slice(0, 25)
						.map((e) => ({ name: e.nombre, value: String(e.id) }));
					await interaction.respond(opciones);
				} else if (
					AWARDS_PLAYER_FIELDS.includes(
						focused.name as (typeof AWARDS_PLAYER_FIELDS)[number],
					)
				) {
					const jugadores =
						await appContext.services.awards.buscarJugadores(query);
					const opciones = jugadores.slice(0, 25).map((j) => ({
						name: `${j.nombre} (${j.equipo_nombre})`,
						value: String(j.id),
					}));
					await interaction.respond(opciones);
				}
			},
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });

				try {
					const campeon = parseInt(
						interaction.options.getString("campeon", true),
						10,
					);
					const goleador = parseInt(
						interaction.options.getString("goleador", true),
						10,
					);
					const mejorJugador = parseInt(
						interaction.options.getString("mejor_jugador", true),
						10,
					);
					const mejorArquero = parseInt(
						interaction.options.getString("mejor_arquero", true),
						10,
					);
					const mejorJugadorJoven = parseInt(
						interaction.options.getString("mejor_jugador_joven", true),
						10,
					);
					const mejorGol = parseInt(
						interaction.options.getString("mejor_gol", true),
						10,
					);
					const seleccionDecepcion = parseInt(
						interaction.options.getString("seleccion_decepcion", true),
						10,
					);
					const seleccionSorpresa = parseInt(
						interaction.options.getString("seleccion_sorpresa", true),
						10,
					);
					const mejorGolPosicion = interaction.options.getInteger(
						"mejor_gol_posicion",
						true,
					);

					if (
						[
							campeon,
							goleador,
							mejorJugador,
							mejorArquero,
							mejorJugadorJoven,
							mejorGol,
							seleccionDecepcion,
							seleccionSorpresa,
						].some(Number.isNaN)
					) {
						await interaction.editReply({
							content: "❌ Selecciona los valores desde el autocompletado.",
						});
						return;
					}

					const resumen = await appContext.services.awards.actualizarAwards({
						campeon,
						goleador,
						mejorJugador,
						mejorArquero,
						mejorJugadorJoven,
						mejorGolJugadorId: mejorGol,
						mejorGolPosicion,
						seleccionDecepcion,
						seleccionSorpresa,
					});

					const lineas = resumen.resultados
						.filter((r) => r.puntosGanados > 0)
						.sort((a, b) => b.puntosGanados - a.puntosGanados)
						.slice(0, 10)
						.map(
							(r) =>
								`**${r.username}**: +${r.puntosGanados}pts (${r.aciertos.join(", ")})`,
						);

					await interaction.editReply({
						content: [
							`✅ Awards del Mundial actualizados. ${resumen.totalUsuarios} usuarios procesados.`,
							lineas.length > 0
								? `\n**Top puntuadores:**\n${lineas.join("\n")}`
								: "",
						].join(""),
					});
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
]);

export const discordCommandPayloads: DiscordCommandPayload[] =
	discordCommands.map((command) => command.definition.toJSON());
