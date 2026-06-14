import type {
	ActualizarStatsUsuarioArgs,
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
	UpdateUsuarioParticipanteArgs,
	UpdateUsuarioUsernameArgs,
} from "@sqlc/usuarios_sql";
import type { PoolClient } from "pg";

export interface IUsuariosRepository {
	create(args: CreateUsuarioArgs): Promise<void>;

	delete(args: DeleteUsuarioArgs): Promise<void>;

	list(): Promise<ListUsuariosRow[]>;

	updateUsername(args: UpdateUsuarioUsernameArgs): Promise<void>;

	actualizarParticipante(args: UpdateUsuarioParticipanteArgs): Promise<void>;

	actualizarStats(args: ActualizarStatsUsuarioArgs): Promise<void>;

	obtenerPuntos(id: string): Promise<number>;

	ajustarPuntos(id: string, delta: number): Promise<void>;

	count(): Promise<number>;

	countParticipantes(): Promise<number>;

	withTx(tx: PoolClient): IUsuariosRepository;
}
