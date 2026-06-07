import { config } from "@support/config";
import { ProvideDB, ProvideTxManager } from "@support/db.provider";
import { logger } from "@support/logger";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { EstaticoRepository } from "./repository/estatico.repository";
import { PartidosRepository } from "./repository/partidos.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { PartidosService } from "./service/partidos.service";
import { UsuariosService } from "./service/usuarios.service";

const PARTIDOS_MESSAGE_REGEX = /^!partidos\s+(\d{4}-\d{2}-\d{2})$/;

function formatPartidosReply(
	date: string,
	partidos: Awaited<ReturnType<PartidosService["verPartidosPorFecha"]>>,
): string {
	if (partidos.length === 0) {
		return `No hay partidos para la fecha ${date}.`;
	}

	const formattedPartidos = partidos.map((partido) => {
		const marcador =
			partido.partidoGolesLocal !== null &&
			partido.partidoGolesVisitante !== null
				? ` (${partido.partidoGolesLocal}-${partido.partidoGolesVisitante})`
				: "";

		return [
			`• ${partido.equipoLocalNombre} vs ${partido.equipoVisitanteNombre}`,
			`estado: ${partido.estado}${marcador}`,
		].join(" - ");
	});

	return [`Partidos para ${date}:`, ...formattedPartidos].join("\n");
}

// * (SKETCH) Inyecciones declaracion - definicion
export function createAppContext() {
	const db = ProvideDB();
	const txManager = ProvideTxManager(db);
	const usuariosRepository = new UsuariosRepository(db);
	const estaticoRepository = new EstaticoRepository(db);
	const partidosRepository = new PartidosRepository(db);
	const usuariosService = new UsuariosService(
		usuariosRepository,
		estaticoRepository,
		txManager,
	);
	const partidosService = new PartidosService(partidosRepository);

	return {
		db,
		txManager,
		repositories: {
			usuarios: usuariosRepository,
			estatico: estaticoRepository,
			partidos: partidosRepository,
		},
		services: {
			usuarios: usuariosService,
			partidos: partidosService,
		},
	};
}

async function main() {
	const appContext = createAppContext();

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
		],
	});

	client.once(Events.ClientReady, () => {
		logger.info({ user: client.user?.tag }, "Discord bot listo");
	});

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot) {
			return;
		}

		if (message.content === "!ping") {
			await message.reply("pong");
			return;
		}

		const partidosMessageMatch = message.content.match(PARTIDOS_MESSAGE_REGEX);

		if (!partidosMessageMatch) {
			return;
		}

		const [, date] = partidosMessageMatch;

		const partidos = await appContext.services.partidos.verPartidosPorFecha({
			date,
		});

		await message.reply(formatPartidosReply(date, partidos));
	});

	await client.login(config.discord.token);
}

void main();
