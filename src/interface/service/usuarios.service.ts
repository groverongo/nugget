import type { VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	CreateUsuarioArgs,
	DeleteUsuarioArgs,
	ListUsuariosRow,
} from "@sqlc/usuarios_sql";

export type CreateUsuarioInput = CreateUsuarioArgs;

export interface VerEquiposInput {
	blanco?: boolean;
	negro?: boolean;
}

export interface IUsuariosService {
	createUsuario(args: CreateUsuarioInput): Promise<void>;

	deleteUsuario(args: DeleteUsuarioArgs): Promise<void>;

	recalcularPremios(polleroCount: number): Promise<void>;

	listUsuarios(): Promise<ListUsuariosRow[]>;

	verEquipos(args?: VerEquiposInput): Promise<VerEquiposRow[]>;
}
