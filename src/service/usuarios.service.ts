import type {
	CreateUsuarioArgs,
	ListUsuariosRow,
} from "../../db/sqlcgen/usuarios_sql";
import type { TxManager } from "../../support/db.provider";
import { generarPremiosPolla } from "../../support/pozo";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type { IUsuariosService } from "../interface/service/usuarios.service";

export class UsuariosService implements IUsuariosService {
	constructor(
		private readonly usuariosRepo: IUsuariosRepository,
		private readonly txManager: TxManager,
	) {}

	async createUsuario(args: CreateUsuarioArgs) {
		this.txManager.runInTx(async (tx) => {
			await this.usuariosRepo.withTx(tx).create(args);

			const conteo = await this.usuariosRepo.withTx(tx).count();

			const distribucion = generarPremiosPolla(conteo);
		});
	}

	listUsuarios(): Promise<ListUsuariosRow[]> {
		return this.usuariosRepo.list();
	}
}
