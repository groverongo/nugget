import { config } from "@support/config";
import { ProvideDB, ProvideTxManager } from "@support/db.provider";
import { logger } from "@support/logger";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { EstaticoRepository } from "./repository/estatico.repository";
import { PartidosRepository } from "./repository/partidos.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { PartidosService } from "./service/partidos.service";
import { UsuariosService } from "./service/usuarios.service";

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
	createAppContext();

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
		}
	});

	await client.login(config.discord.token);
}

void main();
