import type {
	CreateUsuarioArgs,
	ListUsuariosRow,
} from "../../../db/sqlcgen/usuarios_sql";

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioArgs): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;
}
