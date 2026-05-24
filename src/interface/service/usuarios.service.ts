import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
} from "../../../db/sqlcgen/usuarios_sql";

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioArgs): Promise<void>;

	deleteUsuario(args: DeleteUsuarioArgs): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;
}
