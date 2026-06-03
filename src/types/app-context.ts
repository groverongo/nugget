import type { TxManager } from "@support/db.provider";
import type { Pool } from "pg";
import type { EstaticoRepository } from "../repository/estatico.repository";
import type { UsuariosRepository } from "../repository/usuarios.repository";
import type { UsuariosService } from "../service/usuarios.service";

export interface AppContext {
	db: Pool;
	txManager: TxManager;
	repositories: {
		usuarios: UsuariosRepository;
		estatico: EstaticoRepository;
	};
	services: {
		usuarios: UsuariosService;
	};
}
