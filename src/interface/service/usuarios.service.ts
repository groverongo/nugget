import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
} from "@sqlc/usuarios_sql";

export type CreateUsuarioInput = CreateUsuarioArgs;

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioInput): Promise<void>;

	deleteUsuario(args: DeleteUsuarioArgs): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;
}
