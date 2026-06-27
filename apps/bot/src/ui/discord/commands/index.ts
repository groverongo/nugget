import { config } from "@support/config";
import {
	AttachmentBuilder,
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
	buildMisTimbasComponents,
	buildTimbaResolucionComponents,
	buildTimbaResolucionMedioTiempoComponents,
	buildVerTimbasComponent,
} from "../components/timba";
import {
	buildTimbaAdminModal,
	buildTimbaModal,
	deleteAnnouncementMessages,
	sendAlertsChannel,
	sendAnnouncementChannel,
} from "../handlers/interactions";
import { enviarAlertaAwards } from "../services/awards-scheduler";
import { enviarAlertaDiaria } from "../services/daily-alert-scheduler";
import {
	checkAndScheduleEndOfDay,
	enviarResumenDia,
} from "../services/end-of-day-scheduler";
import {
	enviarAlertaGol,
	enviarAlertaInicioPartidoSoloMensaje,
	enviarEstadisticasPrePartido,
} from "../services/match-scheduler";
import { generarEvolucionPredicciones } from "../services/utility-client";
import { obtenerYYYYMMDDPeru } from "../utils/fecha";
import {
	buildAlertaAuraPoints,
	buildAlertaFinPartido,
	buildAlertaGol,
	buildAlertaMedioTiempo,
} from "../utils/match-announcement";
import {
	buildAlertaEliminacion,
	buildRecuento,
	buildTabla,
} from "../utils/recuento-announcement";
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

const enviarAlertaCommand = new SlashCommandBuilder()
	.setName("enviar-alerta")
	.setDescription(
		"[ADMIN] Envía manualmente una alerta de Nugget al canal de alertas",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("tipo")
			.setDescription("Tipo de alerta a enviar")
			.setRequired(true)
			.addChoices(
				{
					name: "📣 Diaria — partidos programados de hoy",
					value: "diaria",
				},
				{
					name: "📊 Pre-partido — estadísticas antes del partido",
					value: "pre-partido",
				},
				{ name: "🏆 Awards — cierre de predicciones", value: "awards" },
				{ name: "📋 Resumen del día", value: "resumen-dia" },
				{
					name: "🕛 Inicio de partido (solo mensaje, sin cambiar estado)",
					value: "inicio-partido",
				},
				{ name: "⚽ Gol — alerta de gol sin modificar DB", value: "gol" },
			),
	)
	.addIntegerOption((option) =>
		option
			.setName("partido")
			.setDescription(
				"ID del partido (requerido para pre-partido, inicio-partido y gol)",
			)
			.setRequired(false)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("equipo")
			.setDescription("Equipo que marcó (requerido para gol)")
			.setRequired(false)
			.addChoices(
				{ name: "Local", value: "local" },
				{ name: "Visitante", value: "visitante" },
			),
	)
	.addStringOption((option) =>
		option
			.setName("fecha")
			.setDescription(
				"Fecha YYYY-MM-DD (para resumen-dia y diaria; por defecto hoy)",
			)
			.setRequired(false),
	)
	.setContexts(InteractionContextType.Guild);

const golCommand = new SlashCommandBuilder()
	.setName("gol")
	.setDescription(
		"[ADMIN] Registra un gol en un partido en vivo (+1 al equipo)",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido en vivo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("equipo")
			.setDescription("Equipo que marcó el gol")
			.setRequired(true)
			.addChoices(
				{ name: "Local", value: "local" },
				{ name: "Visitante", value: "visitante" },
			),
	)
	.setContexts(InteractionContextType.Guild);

const varCommand = new SlashCommandBuilder()
	.setName("var")
	.setDescription("[ADMIN] Anula un gol en un partido en vivo (-1 al equipo)")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido en vivo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("equipo")
			.setDescription("Equipo al que se anula el gol")
			.setRequired(true)
			.addChoices(
				{ name: "Local", value: "local" },
				{ name: "Visitante", value: "visitante" },
			),
	)
	.setContexts(InteractionContextType.Guild);

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
	.addIntegerOption((option) =>
		option
			.setName("milagro")
			.setDescription("Goles en descuentos (90' o más). 0 si no hubo.")
			.setRequired(true)
			.setMinValue(0),
	)
	.addIntegerOption((option) =>
		option
			.setName("penales_ganador_id")
			.setDescription(
				"[Solo suplementario] ID del equipo que ganó los penales (si hubo empate)",
			)
			.setRequired(false)
			.setMinValue(1),
	)
	.setContexts(InteractionContextType.Guild);

const resolverTimbasCommand = new SlashCommandBuilder()
	.setName("resolver-timbas")
	.setDescription(
		"[ADMIN] Reenvía los botones de resolución de Timba Times para un partido",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("ID del partido")
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

const reanudarPartidoCommand = new SlashCommandBuilder()
	.setName("reanudar-partido")
	.setDescription(
		"[ADMIN] Reanuda un partido de medio tiempo a en vivo (cancela timbas abiertas)",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido en medio tiempo")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const iniciarSupleCommand = new SlashCommandBuilder()
	.setName("iniciar-suplementario")
	.setDescription(
		"[ADMIN] Inicia el tiempo suplementario (cierra las apuestas al suple)",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("ID del partido suplementario")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const iniciarPenalesCommand = new SlashCommandBuilder()
	.setName("iniciar-penales")
	.setDescription("[ADMIN] Inicia la tanda de penales del suplementario")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("ID del partido suplementario")
			.setRequired(true)
			.setAutocomplete(true),
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

const miEvolucionCommand = new SlashCommandBuilder()
	.setName("mi-evolucion")
	.setDescription(
		"Ver la evolución acumulada de tus puntos a lo largo del torneo",
	)
	.addIntegerOption((option) =>
		option
			.setName("pagina")
			.setDescription("Número de página (por defecto: 1)")
			.setRequired(false)
			.setMinValue(1),
	)
	.setContexts(InteractionContextType.Guild);

const misTimbasCommand = new SlashCommandBuilder()
	.setName("mis-timbas")
	.setDescription("Muestra tus timba times filtradas por fecha")
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

const timbaCommand = new SlashCommandBuilder()
	.setName("timba-time")
	.setDescription("Lanza un reto de puntos a otro pollero (Timba Time 🎲)")
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido sobre el que va la timba")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const timbaAdminCommand = new SlashCommandBuilder()
	.setName("timba-time-admin")
	.setDescription("[ADMIN] Crea una timba time en nombre de otro usuario")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("usuario_id")
			.setDescription("ID de Discord del usuario que lanza el reto")
			.setRequired(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido sobre el que va la timba")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const cancelarTimbaCommand = new SlashCommandBuilder()
	.setName("cancelar-timba")
	.setDescription("Cancela una de tus timba times abiertas")
	.addIntegerOption((option) =>
		option
			.setName("timba_id")
			.setDescription("Timba a cancelar")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const asignarBonusesCommand = new SlashCommandBuilder()
	.setName("asignar-bonuses")
	.setDescription(
		"[ADMIN] Asigna bonuses finales de la polla (win rate, racha máxima, hit de más goles)",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addBooleanOption((option) =>
		option
			.setName("confirmar")
			.setDescription("Confirmar la ejecución (acción no reversible)")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

const anularTimbaCommand = new SlashCommandBuilder()
	.setName("anular-timba")
	.setDescription("[ADMIN] Elimina una timba time (haya sido aceptada o no)")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("timba_id")
			.setDescription("ID de la timba a anular")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

const verTimbasCommand = new SlashCommandBuilder()
	.setName("ver-timbas")
	.setDescription("Ver todas las timba times activas de un partido")
	.addIntegerOption((option) =>
		option
			.setName("partido_id")
			.setDescription("Partido a consultar")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.setContexts(InteractionContextType.Guild);

const tablaCommand = new SlashCommandBuilder()
	.setName("tabla")
	.setDescription("[ADMIN] Muestra la tabla de posiciones completa con premios")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setContexts(InteractionContextType.Guild);

const recuentoCommand = new SlashCommandBuilder()
	.setName("recuento")
	.setDescription("[ADMIN] Envía el recuento de la polla al canal de alertas")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addStringOption((option) =>
		option
			.setName("titulo")
			.setDescription("Título del recuento (ej: Jornada 1 - Fase de Grupos)")
			.setRequired(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("total_partidos")
			.setDescription(
				"Total de partidos del torneo (ej: 104). Por defecto: los registrados en BD.",
			)
			.setRequired(false)
			.setMinValue(1),
	)
	.setContexts(InteractionContextType.Guild);

const registrarEliminadoCommand = new SlashCommandBuilder()
	.setName("registrar-eliminado")
	.setDescription("[ADMIN] Marca o desmarca un equipo como eliminado")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("equipo")
			.setDescription("Equipo a marcar/desmarcar como eliminado")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addBooleanOption((option) =>
		option
			.setName("eliminado")
			.setDescription("true = eliminado, false = restaurar")
			.setRequired(true),
	)
	.setContexts(InteractionContextType.Guild);

const agregarPartidoCommand = new SlashCommandBuilder()
	.setName("agregar-partido")
	.setDescription(
		"[ADMIN] Agregar un partido para la siguiente fase del torneo",
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addIntegerOption((option) =>
		option
			.setName("fase_id")
			.setDescription("Fase en la que se jugará el partido")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("equipo_local")
			.setDescription("Equipo local")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("equipo_visitante")
			.setDescription("Equipo visitante")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("fecha")
			.setDescription("Fecha del partido (formato: YYYY-MM-DD, ej: 2026-06-21)")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("hora")
			.setDescription("Hora del partido (formato: HH:mm, ej: 19:00)")
			.setRequired(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("utc_offset")
			.setDescription("UTC offset en horas (ej: -5 para Perú, +1 para Europa)")
			.setRequired(true)
			.setMinValue(-12)
			.setMaxValue(14),
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
				const milagro = interaction.options.getInteger("milagro", true);
				const penalesGanadorId =
					interaction.options.getInteger("penales_ganador_id") ?? null;

				await interaction.deferReply({ ephemeral: true });

				try {
					const resumen = await appContext.services.admin.actualizarPartido({
						partidoId,
						golesLocal,
						golesVisitante,
						milagro,
						penalesGanadorId,
					});

					const extras: string[] = [];
					if (resumen.extraPartidazo) extras.push("Partidazo 💥");
					if (milagro > 0) extras.push(`Milagro ✝️ +${milagro}pts`);
					if (resumen.puntosBatacazo > 0)
						extras.push(`Batacazo +${resumen.puntosBatacazo}pts 🐴`);
					if (resumen.puntosElegido > 0)
						extras.push(`El Elegido +${resumen.puntosElegido}pts 👑`);

					const lines = [
						`✅ **Partido #${partidoId}** cerrado: **${golesLocal} - ${golesVisitante}**`,
						`👥 Apostadores: ${resumen.totalApostadores} | ✅ Exactos: ${resumen.totalAcertadores}`,
						extras.length > 0
							? `🎁 Extras activos: ${extras.join(", ")}`
							: "Sin extras activos.",
					];
					if (resumen.supleCreado) {
						lines.push(
							`⏱️ Empate en fase KO → **Suplementario creado** (ID: ${resumen.supleCreado.supleId}). Los participantes ya pueden apostar.`,
						);
					}

					await interaction.editReply({ content: lines.join("\n") });

					if (resumen.supleCreado) {
						await sendAlertsChannel(
							interaction.client,
							`⏱️ _¡Empate en fase KO! Se abrió el **Suplementario** (partido #${resumen.supleCreado.supleId}). Tienen hasta que empiece para apostar._`,
						);
					}

					const [info, predicciones, sinPrediccion, puntajes] =
						await Promise.all([
							appContext.services.partidos.verInformacionPartido({
								id: partidoId,
							}),
							appContext.services.predicciones.verPrediccionesPorPartido({
								partidoId,
							}),
							appContext.services.predicciones.verParticipantesSinPrediccion({
								partidoId,
							}),
							appContext.services.predicciones.verPuntajesPartido({
								partidoId,
							}),
						]);

					if (info) {
						await sendAlertsChannel(
							interaction.client,
							buildAlertaFinPartido(info, predicciones, sinPrediccion),
						);
						const mensajeAura = buildAlertaAuraPoints(puntajes);
						if (mensajeAura) {
							await sendAlertsChannel(interaction.client, mensajeAura);
						}

						if (info.fechaPartido) {
							await checkAndScheduleEndOfDay(
								info.fechaPartido,
								appContext.services,
								interaction.client,
							);
						}
					}

					const timbas =
						await appContext.services.timba.verTimbasCerradasPorPartido(
							partidoId,
						);
					if (timbas.length > 0) {
						await sendAlertsChannel(
							interaction.client,
							`👑 _Resolución de **Timba Times**:_`,
						);
						for (let i = 0; i < timbas.length; i += 3) {
							const batch = timbas.slice(i, i + 3);
							await interaction.followUp({
								components: buildTimbaResolucionComponents(batch, partidoId),
								flags: MessageFlags.IsComponentsV2,
								ephemeral: true,
							});
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
		"resolver-timbas",
		{
			definition: resolverTimbasCommand,
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const timbas =
						await appContext.services.timba.verTimbasCerradasPorPartido(
							partidoId,
						);

					if (timbas.length === 0) {
						await interaction.editReply({
							content: `ℹ️ No hay Timba Times pendientes de resolución para el partido #${partidoId}.`,
						});
						return;
					}

					await interaction.editReply({
						components: buildTimbaResolucionComponents(
							timbas.slice(0, 3),
							partidoId,
							// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
						) as any,
						flags: MessageFlags.IsComponentsV2,
					});
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

					const [info, predicciones, sinPrediccion] = await Promise.all([
						appContext.services.partidos.verInformacionPartido({
							id: partidoId,
						}),
						appContext.services.predicciones.verPrediccionesPorPartido({
							partidoId,
						}),
						appContext.services.predicciones.verParticipantesSinPrediccion({
							partidoId,
						}),
					]);

					const timbas =
						await appContext.services.timba.verTimbasMedioTiempoPorPartido(
							partidoId,
						);

					if (info) {
						await sendAlertsChannel(
							interaction.client,
							buildAlertaMedioTiempo(info, predicciones, sinPrediccion),
						);
					}

					if (timbas.length > 0) {
						await interaction.followUp({
							// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
							components: buildTimbaResolucionMedioTiempoComponents(
								timbas.slice(0, 3),
								partidoId,
							) as any,
							flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
						});
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
		"reanudar-partido",
		{
			definition: reanudarPartidoCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter(
						(p) =>
							p.estado === "medio_tiempo" &&
							`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
								.toLowerCase()
								.includes(focusedValue),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const [partidos] = await Promise.all([
						appContext.services.partidos.verPartidosNoFinalizados(),
						appContext.services.partidos.reanudarPartido(partidoId),
						appContext.services.timba.cancelarTimbasAbiertas(partidoId),
					]);

					const partido = partidos.find((p) => p.partidoId === partidoId);
					const nombrePartido = partido
						? `**${partido.equipoLocalNombre} ${partido.equipoLocalBandera} vs. ${partido.equipoVisitanteNombre} ${partido.equipoVisitanteBandera}**`
						: `**Partido #${partidoId}**`;

					await interaction.editReply({
						content: `▶️ ${nombrePartido} reanudado. Timbas abiertas canceladas.`,
					});

					await sendAlertsChannel(
						interaction.client,
						`▶️ _¡${nombrePartido} se reanudó! Las Timba Times vuelven a estar cerradas._`,
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
		"iniciar-suplementario",
		{
			definition: iniciarSupleCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter(
						(p) =>
							p.partidoOriginalId !== null &&
							p.estado === "programado" &&
							`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
								.toLowerCase()
								.includes(focusedValue),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre} [SUPLE]`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);
				await interaction.deferReply({ ephemeral: true });
				try {
					await appContext.services.partidos.iniciarSuplementario(partidoId);

					const info = await appContext.services.partidos.verInformacionPartido(
						{
							id: partidoId,
						},
					);
					const nombrePartido = info
						? `**${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}**`
						: `**Partido #${partidoId}**`;

					await interaction.editReply({
						content: `⏱️ Suplementario iniciado: ${nombrePartido}. Las apuestas están cerradas.`,
					});
					await sendAlertsChannel(
						interaction.client,
						`⏱️ _¡Empieza el suplementario de ${nombrePartido}! Las apuestas están cerradas._`,
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
		"iniciar-penales",
		{
			definition: iniciarPenalesCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter(
						(p) =>
							p.partidoOriginalId !== null &&
							(p.estado === "suplementario" || p.estado === "medio_tiempo") &&
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
				await interaction.deferReply({ ephemeral: true });
				try {
					await appContext.services.partidos.iniciarPenales(partidoId);

					const info = await appContext.services.partidos.verInformacionPartido(
						{
							id: partidoId,
						},
					);
					const nombrePartido = info
						? `**${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}**`
						: `**Partido #${partidoId}**`;

					await interaction.editReply({
						content: `⚽ Penales iniciados: ${nombrePartido}.`,
					});
					await sendAlertsChannel(
						interaction.client,
						`⚽ _¡Tanda de penales de ${nombrePartido}!_`,
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
		"agregar-partido",
		{
			definition: agregarPartidoCommand,
			autocomplete: async (interaction, appContext) => {
				const focusedOption = interaction.options.getFocused(true);
				const query = focusedOption.value.toString().toLowerCase();

				if (focusedOption.name === "fase_id") {
					const { verFases } = await import("@sqlc/fases_sql");
					const fases = await verFases(appContext.db);
					const opciones = fases
						.filter((f) => f.nombre.toLowerCase().includes(query))
						.slice(0, 25)
						.map((f) => ({
							name: f.nombre,
							value: f.id,
						}));
					await interaction.respond(opciones);
				} else if (
					focusedOption.name === "equipo_local" ||
					focusedOption.name === "equipo_visitante"
				) {
					const equipos = await appContext.services.awards.verEquipos();
					const opciones = equipos
						.filter((e) => e.nombre.toLowerCase().includes(query))
						.slice(0, 25)
						.map((e) => ({
							name: e.nombre,
							value: String(e.id),
						}));
					await interaction.respond(opciones);
				}
			},
			handle: async (interaction, appContext) => {
				const faseId = interaction.options.getInteger("fase_id", true);
				const equipoLocalIdStr = interaction.options.getString(
					"equipo_local",
					true,
				);
				const equipoVisitanteIdStr = interaction.options.getString(
					"equipo_visitante",
					true,
				);
				const fecha = interaction.options.getString("fecha", true);
				const hora = interaction.options.getString("hora", true);
				const utcOffset = interaction.options.getInteger("utc_offset", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const equipoLocalId = parseInt(equipoLocalIdStr, 10);
					const equipoVisitanteId = parseInt(equipoVisitanteIdStr, 10);

					if (Number.isNaN(equipoLocalId) || Number.isNaN(equipoVisitanteId)) {
						await interaction.editReply({
							content:
								"❌ Los equipos deben seleccionarse desde el autocompletado.",
						});
						return;
					}

					if (equipoLocalId === equipoVisitanteId) {
						await interaction.editReply({
							content: "❌ El equipo local y visitante no pueden ser el mismo.",
						});
						return;
					}

					let fechaAjustada: Date;
					try {
						const fechaRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
						const horaRegex = /^(\d{2}):(\d{2})$/;

						if (!fechaRegex.test(fecha)) {
							throw new Error("Invalid date format");
						}
						if (!horaRegex.test(hora)) {
							throw new Error("Invalid time format");
						}

						const offsetSign = utcOffset >= 0 ? "+" : "-";
						const offsetHours = String(Math.abs(utcOffset)).padStart(2, "0");
						const timestampzStr = `${fecha}T${hora}:00${offsetSign}${offsetHours}:00`;
						fechaAjustada = new Date(timestampzStr);
						if (Number.isNaN(fechaAjustada.getTime())) {
							throw new Error("Invalid date");
						}
					} catch {
						await interaction.editReply({
							content:
								"❌ Formato inválido. Usa fecha: YYYY-MM-DD (ej: 2026-06-21) y hora: HH:mm (ej: 19:00)",
						});
						return;
					}

					await appContext.services.partidos.agregarPartidoSiguienteFase({
						faseId,
						equipoLocalId,
						equipoVisitanteId,
						fechaPartido: fechaAjustada,
					});

					const equipos = await appContext.services.awards.verEquipos();
					const equipoLocal = equipos.find((e) => e.id === equipoLocalId);
					const equipoVisitante = equipos.find(
						(e) => e.id === equipoVisitanteId,
					);

					const nombrePartido =
						equipoLocal && equipoVisitante
							? `${equipoLocal.nombre} vs ${equipoVisitante.nombre}`
							: `#${equipoLocalId} vs #${equipoVisitanteId}`;

					await interaction.editReply({
						content: `✅ Partido agregado: **${nombrePartido}** | Fase: ${faseId} | Fecha: ${fechaAjustada.toISOString()}`,
					});
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

				const hoy = obtenerYYYYMMDDPeru();
				const fechaSeleccionada = fechas.includes(hoy)
					? hoy
					: fechas[fechas.length - 1];
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
		"mi-evolucion",
		{
			definition: miEvolucionCommand,
			handle: async (interaction, appContext) => {
				if (!(await assertPollero(interaction))) return;

				await interaction.deferReply({ ephemeral: true });

				const limite = config.utility.evolution_limit;
				const pagina = interaction.options.getInteger("pagina") ?? 1;
				const offset = (pagina - 1) * limite;

				const predicciones =
					await appContext.services.predicciones.verMisPredicciones(
						interaction.user.id,
						limite,
						offset,
					);

				const chart = await generarEvolucionPredicciones(
					predicciones,
					interaction.user.displayName,
				);

				if (!chart) {
					await interaction.editReply({
						content: "Aún no tienes predicciones en partidos finalizados.",
					});
					return;
				}

				await interaction.editReply({
					files: [new AttachmentBuilder(chart, { name: "evolucion.png" })],
				});
			},
		},
	],
	[
		"mis-timbas",
		{
			definition: misTimbasCommand,
			handle: async (interaction, appContext) => {
				if (!(await assertPollero(interaction))) return;

				await interaction.deferReply({ ephemeral: true });

				const fechas =
					await appContext.services.timba.verFechasDeTimbasPorUsuario(
						interaction.user.id,
					);

				if (fechas.length === 0) {
					await interaction.editReply({
						content: "Aún no tienes timba times registradas.",
					});
					return;
				}

				const hoy = obtenerYYYYMMDDPeru();
				const fechaSeleccionada = fechas.includes(hoy)
					? hoy
					: fechas[fechas.length - 1];
				const timbas = await appContext.services.timba.verMisTimbasPorFecha({
					jugador_1Id: interaction.user.id,
					date: fechaSeleccionada,
				});

				await interaction.editReply({
					components: buildMisTimbasComponents(
						fechaSeleccionada,
						interaction.user.id,
						timbas,
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
						name: `${j.nombre} (${j.equipoNombre})`,
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
						name: `${j.nombre} (${j.equipoNombre})`,
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
						name: `${j.nombre} (${j.equipoNombre})`,
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
	[
		"enviar-alerta",
		{
			definition: enviarAlertaCommand,
			autocomplete: async (interaction, appContext) => {
				const focusedOption = interaction.options.getFocused(true);
				if (focusedOption.name !== "partido") return;
				const tipo = interaction.options.getString("tipo");
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const q = focusedOption.value.toString().toLowerCase();
				const opciones = partidos
					.filter((p) => {
						if (tipo === "inicio-partido")
							return p.estado === "programado" || p.estado === "en_vivo";
						if (tipo === "gol")
							return p.estado === "en_vivo" || p.estado === "medio_tiempo";
						return true;
					})
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(q),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre} [${p.estado}]`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const tipo = interaction.options.getString("tipo", true);
				const partidoId = interaction.options.getInteger("partido");
				const fechaRaw = interaction.options.getString("fecha");

				await interaction.deferReply({ ephemeral: true });

				try {
					switch (tipo) {
						case "diaria": {
							const fecha = fechaRaw ?? obtenerYYYYMMDDPeru();
							const enviado = await enviarAlertaDiaria(
								fecha,
								appContext.services,
								interaction.client,
							);
							await interaction.editReply({
								content: enviado
									? `✅ Alerta diaria enviada (${fecha}).`
									: `⚠️ No hay partidos programados para ${fecha}.`,
							});
							break;
						}
						case "pre-partido": {
							if (partidoId === null) {
								await interaction.editReply({
									content: "❌ Debes indicar un `partido` para esta alerta.",
								});
								return;
							}
							const enviadoPre = await enviarEstadisticasPrePartido(
								partidoId,
								appContext.services,
								interaction.client,
							);
							await interaction.editReply({
								content: enviadoPre
									? "✅ Estadísticas pre-partido enviadas."
									: `❌ No se encontró el partido #${partidoId}.`,
							});
							break;
						}
						case "awards": {
							await enviarAlertaAwards(appContext.services, interaction.client);
							await interaction.editReply({
								content: "✅ Alerta de awards enviada.",
							});
							break;
						}
						case "resumen-dia": {
							const fecha = fechaRaw ?? obtenerYYYYMMDDPeru();
							await enviarResumenDia(
								fecha,
								appContext.services,
								interaction.client,
							);
							await interaction.editReply({
								content: `✅ Resumen del día (${fecha}) enviado.`,
							});
							break;
						}
						case "inicio-partido": {
							if (partidoId === null) {
								await interaction.editReply({
									content: "❌ Debes indicar un `partido` para esta alerta.",
								});
								return;
							}
							const enviadoInicio = await enviarAlertaInicioPartidoSoloMensaje(
								partidoId,
								appContext.services,
								interaction.client,
							);
							await interaction.editReply({
								content: enviadoInicio
									? "✅ Alerta de inicio de partido enviada (estado no modificado)."
									: `❌ No se encontró el partido #${partidoId}.`,
							});
							break;
						}
						case "gol": {
							if (partidoId === null) {
								await interaction.editReply({
									content: "❌ Debes indicar un `partido` para esta alerta.",
								});
								return;
							}
							const equipoRaw = interaction.options.getString("equipo");
							if (equipoRaw !== "local" && equipoRaw !== "visitante") {
								await interaction.editReply({
									content: "❌ Debes indicar el `equipo` (local o visitante).",
								});
								return;
							}
							const enviadoGol = await enviarAlertaGol(
								partidoId,
								equipoRaw,
								appContext.services,
								interaction.client,
							);
							await interaction.editReply({
								content: enviadoGol
									? "✅ Alerta de gol enviada (sin modificar DB)."
									: `❌ No se encontró el partido #${partidoId}.`,
							});
							break;
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
		"gol",
		{
			definition: golCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const q = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter((p) => p.estado === "en_vivo" || p.estado === "medio_tiempo")
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(q),
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
				const equipo = interaction.options.getString("equipo", true) as
					| "local"
					| "visitante";

				await interaction.deferReply({ ephemeral: true });

				try {
					await appContext.services.partidos.sumarGol(partidoId, equipo);
					const info = await appContext.services.partidos.verInformacionPartido(
						{
							id: partidoId,
						},
					);
					if (!info) {
						await interaction.editReply({
							content: `❌ No se encontró el partido #${partidoId}.`,
						});
						return;
					}
					await sendAlertsChannel(
						interaction.client,
						buildAlertaGol(info, equipo),
					);
					await interaction.editReply({ content: "✅ Gol registrado." });
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"var",
		{
			definition: varCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const q = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter((p) => p.estado === "en_vivo" || p.estado === "medio_tiempo")
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(q),
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
				const equipo = interaction.options.getString("equipo", true) as
					| "local"
					| "visitante";

				await interaction.deferReply({ ephemeral: true });

				try {
					await appContext.services.partidos.restarGol(partidoId, equipo);
					const info = await appContext.services.partidos.verInformacionPartido(
						{
							id: partidoId,
						},
					);
					const score = info
						? `${info.equipoLocalNombre} ${info.partidoGolesLocal ?? 0}-${info.partidoGolesVisitante ?? 0} ${info.equipoVisitanteNombre}`
						: `#${partidoId}`;
					await interaction.editReply({
						content: `✅ VAR aplicado. Score actual: **${score}**`,
					});
				} catch (error) {
					await interaction.editReply({
						content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"timba-time",
		{
			definition: timbaCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const q = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter(
						(p) => p.estado === "programado" || p.estado === "medio_tiempo",
					)
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(q),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				if (!(await assertPollero(interaction))) return;

				const partidoId = interaction.options.getInteger("partido_id", true);

				const partido =
					await appContext.services.timba.verPartidoParaTimba(partidoId);

				if (!partido) {
					await interaction.reply({
						content: `❌ No se encontró el partido #${partidoId}.`,
						ephemeral: true,
					});
					return;
				}

				if (
					partido.estado !== "programado" &&
					partido.estado !== "medio_tiempo"
				) {
					await interaction.reply({
						content:
							"❌ Solo puedes crear timbas para partidos programados o en medio tiempo.",
						ephemeral: true,
					});
					return;
				}

				await interaction.showModal(
					buildTimbaModal(partidoId, partido.puntosBase),
				);
			},
		},
	],
	[
		"timba-time-admin",
		{
			definition: timbaAdminCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const q = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = partidos
					.filter(
						(p) => p.estado === "programado" || p.estado === "medio_tiempo",
					)
					.filter((p) =>
						`${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`
							.toLowerCase()
							.includes(q),
					)
					.slice(0, 25)
					.map((p) => ({
						name: `#${p.partidoId} — ${p.equipoLocalNombre} vs ${p.equipoVisitanteNombre}`,
						value: p.partidoId,
					}));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				const usuarioId = interaction.options.getString("usuario_id", true);
				const partidoId = interaction.options.getInteger("partido_id", true);

				const partido =
					await appContext.services.timba.verPartidoParaTimba(partidoId);

				if (!partido) {
					await interaction.reply({
						content: `❌ No se encontró el partido #${partidoId}.`,
						ephemeral: true,
					});
					return;
				}

				if (
					partido.estado !== "programado" &&
					partido.estado !== "medio_tiempo"
				) {
					await interaction.reply({
						content:
							"❌ Solo se pueden crear timbas para partidos programados o en medio tiempo.",
						ephemeral: true,
					});
					return;
				}

				await interaction.showModal(
					buildTimbaAdminModal(usuarioId, partidoId, partido.puntosBase),
				);
			},
		},
	],
	[
		"cancelar-timba",
		{
			definition: cancelarTimbaCommand,
			autocomplete: async (interaction, appContext) => {
				const misTimbas = await appContext.services.timba.verMisTimbas(
					interaction.user.id,
				);
				const q = interaction.options
					.getFocused(true)
					.value.toString()
					.toLowerCase();
				const opciones = misTimbas
					.filter((t) =>
						`${t.equipoLocalNombre} vs ${t.equipoVisitanteNombre} ${t.descripcion}`
							.toLowerCase()
							.includes(q),
					)
					.slice(0, 25)
					.map((t) => {
						const label = `#${t.id} — ${t.equipoLocalNombre} vs ${t.equipoVisitanteNombre} (${t.puntosPropuestos}pts) — "${t.descripcion}"`;
						return {
							name: label.length > 100 ? `${label.slice(0, 97)}...` : label,
							value: t.id,
						};
					});
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				if (!(await assertPollero(interaction))) return;

				const timbaId = interaction.options.getInteger("timba_id", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const cancelada = await appContext.services.timba.cancelarTimba({
						timbaId,
						jugador1Id: interaction.user.id,
					});
					await interaction.editReply({
						content: `✅ Timba #${timbaId} cancelada.`,
					});
					const partido = `${cancelada.equipoLocalNombre} ${cancelada.equipoLocalBandera} vs. ${cancelada.equipoVisitanteNombre} ${cancelada.equipoVisitanteBandera}`;
					await sendAnnouncementChannel(
						interaction.client,
						`🚫 _¡<@${cancelada.jugador_1Id}> canceló una timba para **${partido}**!_`,
					);
					const toDelete = [
						cancelada.discordMessageId,
						...cancelada.cancelledContraofertaMessageIds,
					].filter((id): id is string => id !== null);
					if (toDelete.length > 0) {
						await deleteAnnouncementMessages(interaction.client, toDelete);
					}
				} catch (error) {
					await interaction.editReply({
						content: `❌ ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"anular-timba",
		{
			definition: anularTimbaCommand,
			handle: async (interaction, appContext) => {
				const timbaId = interaction.options.getInteger("timba_id", true);

				await interaction.deferReply({ ephemeral: true });

				try {
					const anulada = await appContext.services.timba.anularTimba(timbaId);
					await interaction.editReply({
						content: `✅ Timba #${timbaId} anulada y eliminada.`,
					});
					const partido = `${anulada.equipoLocalNombre} ${anulada.equipoLocalBandera} vs. ${anulada.equipoVisitanteNombre} ${anulada.equipoVisitanteBandera}`;
					await sendAnnouncementChannel(
						interaction.client,
						`🚫 *¡Se canceló una timba de <@${anulada.jugador_1Id}> para el partido ${partido}! - "${anulada.descripcion}"*`,
					);
				} catch (error) {
					await interaction.editReply({
						content: `❌ ${error instanceof Error ? error.message : "Error desconocido"}`,
					});
				}
			},
		},
	],
	[
		"ver-timbas",
		{
			definition: verTimbasCommand,
			autocomplete: async (interaction, appContext) => {
				const partidos =
					await appContext.services.partidos.verPartidosNoFinalizados();
				const focusedValue = interaction.options.getFocused().toLowerCase();
				const filtered = partidos
					.filter(
						(p) =>
							p.equipoLocalNombre.toLowerCase().includes(focusedValue) ||
							p.equipoVisitanteNombre.toLowerCase().includes(focusedValue) ||
							String(p.partidoId).includes(focusedValue),
					)
					.slice(0, 25);
				await interaction.respond(
					filtered.map((p) => ({
						name: `${p.equipoLocalNombre} vs. ${p.equipoVisitanteNombre}`,
						value: p.partidoId,
					})),
				);
			},
			handle: async (interaction, appContext) => {
				const partidoId = interaction.options.getInteger("partido_id", true);

				await interaction.deferReply({ ephemeral: true });

				const timbas =
					await appContext.services.timba.verTimbasPorPartido(partidoId);

				if (timbas.length === 0) {
					await interaction.editReply({
						content: "No hay timba times activas para este partido.",
					});
					return;
				}

				await interaction.editReply({
					// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
					components: buildVerTimbasComponent(timbas) as any,
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
			},
		},
	],
	[
		"asignar-bonuses",
		{
			definition: asignarBonusesCommand,
			handle: async (interaction, appContext) => {
				const confirmar = interaction.options.getBoolean("confirmar", true);
				if (!confirmar) {
					await interaction.reply({
						content: "❌ Debes confirmar con `confirmar: Sí` para ejecutar.",
						ephemeral: true,
					});
					return;
				}

				await interaction.deferReply({ ephemeral: true });

				const resultado = await appContext.services.admin.asignarBonuses();

				const lineas = ["⭐ **Bonus Récords — Fin de la Polla**", ""];

				const wrMenciones = resultado.winRate.ganadores
					.map((u) => `<@${u.id}>`)
					.join(", ");
				lineas.push(
					`🥇 **Mayor Win Rate** (${resultado.winRate.valor.toFixed(1)}%) **+${resultado.winRate.puntos} 💠**: ${wrMenciones}`,
				);

				const rmMenciones = resultado.rachaMaxima.ganadores
					.map((u) => `<@${u.id}>`)
					.join(", ");
				lineas.push(
					`🔥 **Racha Máxima** (${resultado.rachaMaxima.valor} seguidas) **+${resultado.rachaMaxima.puntos} 💠**: ${rmMenciones}`,
				);

				if (resultado.hitMasGoles.ganadores.length > 0) {
					const hmgMenciones = resultado.hitMasGoles.ganadores
						.map((u) => `<@${u.id}>`)
						.join(", ");
					lineas.push(
						`⚽ **Hit de más goles** (${resultado.hitMasGoles.partido} — ${resultado.hitMasGoles.totalGoles} goles) **+${resultado.hitMasGoles.puntos} 💠**: ${hmgMenciones}`,
					);
				}

				await sendAnnouncementChannel(interaction.client, lineas.join("\n"));

				await interaction.editReply({
					content: "✅ Bonuses asignados y alerta enviada.",
				});
			},
		},
	],
	[
		"tabla",
		{
			definition: tablaCommand,
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });
				const datos =
					await appContext.services.recuento.obtenerDatosRecuento("");
				for (const chunk of buildTabla(datos)) {
					await sendAlertsChannel(interaction.client, chunk);
				}
				await interaction.editReply({ content: "✅ Tabla enviada." });
			},
		},
	],
	[
		"recuento",
		{
			definition: recuentoCommand,
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });
				const titulo = interaction.options.getString("titulo", true);
				const totalPartidos =
					interaction.options.getInteger("total_partidos") ?? undefined;
				const datos = await appContext.services.recuento.obtenerDatosRecuento(
					titulo,
					totalPartidos,
				);
				const mensaje = buildRecuento(datos);
				await sendAlertsChannel(interaction.client, mensaje);
				await interaction.editReply({ content: "✅ Recuento enviado." });
			},
		},
	],
	[
		"registrar-eliminado",
		{
			definition: registrarEliminadoCommand,
			autocomplete: async (interaction, appContext) => {
				const query = interaction.options.getFocused(true).value.toString();
				const equipos = await appContext.services.awards.verEquipos();
				const opciones = equipos
					.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()))
					.slice(0, 25)
					.map((e) => ({ name: e.nombre, value: e.id }));
				await interaction.respond(opciones);
			},
			handle: async (interaction, appContext) => {
				await interaction.deferReply({ ephemeral: true });
				const equipoId = interaction.options.getInteger("equipo", true);
				const eliminado = interaction.options.getBoolean("eliminado", true);
				if (eliminado) {
					await appContext.services.recuento.marcarEquipoEliminado(equipoId);
					const [eliminados, awards] = await Promise.all([
						appContext.services.recuento.verEquiposEliminados(),
						appContext.services.recuento.verAwardsParaRecuento(),
					]);
					const equipo = eliminados.find((e) => e.id === equipoId);
					if (equipo) {
						await sendAlertsChannel(
							interaction.client,
							buildAlertaEliminacion(equipo, awards, equipoId),
						);
					}
				} else {
					await appContext.services.recuento.marcarEquipoNoEliminado(equipoId);
				}
				const estado = eliminado ? "marcado como eliminado" : "restaurado";
				await interaction.editReply({
					content: `✅ Equipo #${equipoId} ${estado}.`,
				});
			},
		},
	],
]);

export const discordCommandPayloads: DiscordCommandPayload[] =
	discordCommands.map((command) => command.definition.toJSON());
