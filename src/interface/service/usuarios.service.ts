import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
} from "@sqlc/usuarios_sql";

export type CreateUsuarioInput = Pick<CreateUsuarioArgs, "id" | "username"> &
	Partial<Omit<CreateUsuarioArgs, "id" | "username">>;

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioInput): Promise<void>;

	deleteUsuario(args: DeleteUsuarioArgs): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;
}
