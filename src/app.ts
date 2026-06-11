import { config } from "@support/config";
import { ProvideDB, ProvideTxManager } from "@support/db.provider";
import { logger } from "@support/logger";
import { AwardsRepository } from "./repository/awards.repository";
import { EstaticoRepository } from "./repository/estatico.repository";
import { PartidosRepository } from "./repository/partidos.repository";
import { PrediccionesRepository } from "./repository/predicciones.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { AdminService } from "./service/admin.service";
import { AwardsService } from "./service/awards.service";
import { PartidosService } from "./service/partidos.service";
import { PrediccionesService } from "./service/predicciones.service";
import { UsuariosService } from "./service/usuarios.service";
import type { AppContext } from "./types/app-context";
import {
	createDiscordClient,
	registerDiscordEventHandlers,
} from "./ui/discord/services/client";

// * (SKETCH) Inyecciones declaracion - definicion
export function createAppContext(): AppContext {
	const db = ProvideDB();
	const txManager = ProvideTxManager(db);
	const usuariosRepository = new UsuariosRepository(db);
	const estaticoRepository = new EstaticoRepository(db);
	const partidosRepository = new PartidosRepository(db);
	const prediccionesRepository = new PrediccionesRepository(db);
	const awardsRepository = new AwardsRepository(db);
	const usuariosService = new UsuariosService(
		usuariosRepository,
		estaticoRepository,
		txManager,
	);
	const partidosService = new PartidosService(partidosRepository);
	const prediccionesService = new PrediccionesService(
		prediccionesRepository,
		partidosRepository,
		txManager,
	);
	const adminService = new AdminService(
		partidosRepository,
		prediccionesRepository,
		usuariosRepository,
		txManager,
	);
	const awardsService = new AwardsService(
		awardsRepository,
		estaticoRepository,
		txManager,
	);

	return {
		db,
		txManager,
		repositories: {
			usuarios: usuariosRepository,
			estatico: estaticoRepository,
			partidos: partidosRepository,
			predicciones: prediccionesRepository,
		},
		services: {
			usuarios: usuariosService,
			partidos: partidosService,
			predicciones: prediccionesService,
			admin: adminService,
			awards: awardsService,
		},
	};
}

export type { AppContext };

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
