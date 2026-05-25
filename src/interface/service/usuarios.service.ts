import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
} from "@sqlc/usuarios_sql";

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioArgs): Promise<void>;

	deleteUsuario(args: DeleteUsuarioArgs): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;
}
