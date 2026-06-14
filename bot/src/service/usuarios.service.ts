import type { VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	AgregarPuestoPremioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
	UpdateUsuarioParticipanteArgs,
} from "@sqlc/usuarios_sql";
import type { TxManager } from "@support/db.provider";
import { generarPremiosPolla } from "@support/pozo";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type {
	CreateUsuarioInput,
	IUsuariosService,
	VerEquiposInput,
} from "../interface/service/usuarios.service";

export class UsuariosService implements IUsuariosService {
	constructor(
		private readonly usuariosRepo: IUsuariosRepository,
		private readonly estaticoRepo: IEstaticoRepository,
		private readonly txManager: TxManager,
	) {}

	async createUsuario(args: CreateUsuarioInput) {
		await this.usuariosRepo.create(args);
	}

	async deleteUsuario(args: DeleteUsuarioArgs) {
		await this.usuariosRepo.delete(args);
	}

	async recalcularPremios(): Promise<void> {
		const polleroCount = await this.usuariosRepo.countParticipantes();

		await this.txManager.runInTx(async (tx) => {
			await this.estaticoRepo.withTx(tx).limpiezaDistribucionPremios();

			if (polleroCount === 0) return;

			const { listaPremios } = generarPremiosPolla(polleroCount);

			const entradas = listaPremios.flatMap(
				(puesto): AgregarPuestoPremioArgs[] => {
					const result: AgregarPuestoPremioArgs[] = [];
					for (let i = puesto.min; i <= puesto.max; i++) {
						result.push({ premio: puesto.premio.toString(), puesto: i });
					}
					return result;
				},
			);

			await this.estaticoRepo
				.withTx(tx)
				.agregarEntradaDistribucionPremio(entradas);
		});
	}

	actualizarParticipante(args: UpdateUsuarioParticipanteArgs): Promise<void> {
		return this.usuariosRepo.actualizarParticipante(args);
	}

	listUsuarios(): Promise<ListUsuariosRow[]> {
		return this.usuariosRepo.list();
	}

	verEquipos(args: VerEquiposInput = {}): Promise<VerEquiposRow[]> {
		return this.estaticoRepo.verEquipos({
			blanco: args.blanco ?? null,
			negro: args.negro ?? null,
		});
	}
}
