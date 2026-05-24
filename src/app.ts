import { ProvideDB, ProvideTxManager } from "../support/db.provider";
import { EstaticoRepository } from "./repository/estatico.repository";
import { UsuariosRepository } from "./repository/usuarios.repository";
import { UsuariosService } from "./service/usuarios.service";

// * (SKETCH) Inyecciones declaracion - definicion
export function createAppContext() {
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

//TODO : Definicion de bot con Discord.js
async function main() {
	const _ = createAppContext();
}

void main();
