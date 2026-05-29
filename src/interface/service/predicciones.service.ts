import type {
	ActualizarPrediccionArgs,
	AgregarPrediccionArgs,
} from "@sqlc/predicciones_sql";

export interface IPrediccionesService {
	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void>;

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void>;
}
