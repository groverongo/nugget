import type {
	CreateUsuarioArgs,
	ListUsuariosRow,
} from "../../db/sqlcgen/usuarios_sql";
import { generarPremiosPolla } from "../../support/pozo";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type { IUsuariosService } from "../interface/service/usuarios.service";

export class UsuariosService implements IUsuariosService {
	constructor(private readonly usuariosRepo: IUsuariosRepository) {}

	async createUsuario(args: CreateUsuarioArgs) {
		// TODO: Agregarlo en transaccion
		await this.usuariosRepo.create(args);

		const conteo = await this.usuariosRepo.count();

		const _ = generarPremiosPolla(conteo);
	}

	listUsuarios(): Promise<ListUsuariosRow[]> {
		return this.usuariosRepo.list();
	}
}
