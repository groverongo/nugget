import { config } from "@support/config";
import { ProvideDB, ProvideTxManager } from "@support/db.provider";
import { Client, GatewayIntentBits } from "discord.js";
import { registerDiscordEvents } from "./events";
import { EstaticoRepository } from "./repository/estatico.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { UsuariosService } from "./service/usuarios.service";
import type { AppContext } from "./types/app-context";

// * (SKETCH) Inyecciones declaracion - definicion
export function createAppContext(): AppContext {
	const db = ProvideDB();
	const txManager = ProvideTxManager(db);
	const usuariosRepository = new UsuariosRepository(db);
	const estaticoRepository = new EstaticoRepository(db);
	const usuariosService = new UsuariosService(
		usuariosRepository,
		estaticoRepository,
		txManager,
	);

	return {
		db,
		txManager,
		repositories: {
			usuarios: usuariosRepository,
			estatico: estaticoRepository,
		},
		services: {
			usuarios: usuariosService,
		},
	};
}

async function main() {
	const appContext = createAppContext();

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
		],
	});

	registerDiscordEvents(client, appContext);

	await client.login(config.discord.token);
}

void main();
