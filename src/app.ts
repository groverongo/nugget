import { config } from "@support/config";
import { ProvideDB, ProvideTxManager } from "@support/db.provider";
import { logger } from "@support/logger";
import { EstaticoRepository } from "./repository/estatico.repository";
import { PartidosRepository } from "./repository/partidos.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { PartidosService } from "./service/partidos.service";
import { UsuariosService } from "./service/usuarios.service";
import {
	createDiscordClient,
	registerDiscordEventHandlers,
} from "./ui/discord/services/client";

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

export type AppContext = ReturnType<typeof createAppContext>;

async function main() {
	const appContext = createAppContext();
	const client = createDiscordClient();

	registerDiscordEventHandlers(client, appContext);

	await client.login(config.discord.token);
}

void main().catch((error) => {
	logger.error({ err: error }, "No se pudo iniciar la aplicación");
	process.exitCode = 1;
});
