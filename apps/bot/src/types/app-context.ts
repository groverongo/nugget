import type { TxManager } from "@support/db.provider";
import type { Pool } from "pg";
import type { EstaticoRepository } from "../repository/estatico.repository";
import type { PartidosRepository } from "../repository/partidos.repository";
import type { PrediccionesRepository } from "../repository/predicciones.repository";
import type { TimbaRepository } from "../repository/timba.repository";
import type { UsuariosRepository } from "../repository/usuarios.repository";
import type { AdminService } from "../service/admin.service";
import type { AwardsService } from "../service/awards.service";
import type { PartidosService } from "../service/partidos.service";
import type { PrediccionesService } from "../service/predicciones.service";
import type { RecuentoService } from "../service/recuento.service";
import type { TimbaService } from "../service/timba.service";
import type { UsuariosService } from "../service/usuarios.service";

export interface AppContext {
	db: Pool;
	txManager: TxManager;
	repositories: {
		usuarios: UsuariosRepository;
		estatico: EstaticoRepository;
		partidos: PartidosRepository;
		predicciones: PrediccionesRepository;
		timba: TimbaRepository;
	};
	services: {
		usuarios: UsuariosService;
		partidos: PartidosService;
		predicciones: PrediccionesService;
		admin: AdminService;
		awards: AwardsService;
		timba: TimbaService;
		recuento: RecuentoService;
	};
}
