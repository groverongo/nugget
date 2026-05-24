import type {
	AgregarPuestoPremioArgs,
	CreateUsuarioArgs,
	ListUsuariosRow,
} from "../../db/sqlcgen/usuarios_sql";
import type { TxManager } from "../../support/db.provider";
import { generarPremiosPolla } from "../../support/pozo";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type { IUsuariosService } from "../interface/service/usuarios.service";

export class UsuariosService implements IUsuariosService {
	constructor(
		private readonly usuariosRepo: IUsuariosRepository,
		private readonly estaticoRepo: IEstaticoRepository,
		private readonly txManager: TxManager,
	) {}

	async createUsuario(args: CreateUsuarioArgs) {
		this.txManager.runInTx(async (tx) => {
			await this.usuariosRepo.withTx(tx).create(args);

			const conteo = await this.usuariosRepo.withTx(tx).count();

			const { comisionOrg: _, listaPremios } = generarPremiosPolla(conteo);

			await this.estaticoRepo.withTx(tx).limpiezaDistribucionPremios();

			const entradas = listaPremios.flatMap(
				(puesto): AgregarPuestoPremioArgs[] => {
					const entradas: AgregarPuestoPremioArgs[] = [];
					for (let i = puesto.min; i < puesto.max + 1; i++) {
						entradas.push({
							premio: puesto.premio.toString(),
							puesto: i,
						});
					}
					return entradas;
				},
			);

			await this.estaticoRepo
				.withTx(tx)
				.agregarEntradaDistribucionPremio(entradas);
		});
	}

	listUsuarios(): Promise<ListUsuariosRow[]> {
		return this.usuariosRepo.list();
	}
}
