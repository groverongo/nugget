import type {
	VerEvolucionGrupalArgs,
	VerEvolucionGrupalRow,
	VerEvolucionPorUsuarioArgs,
	VerEvolucionPorUsuarioRow,
} from "@sqlc/evolucion_sql";
import type {
	VerMisPrediccionesPorFechaArgs,
	VerMisPrediccionesPorFechaRow,
	VerMisPrediccionesRow,
	VerParticipantesSinPrediccionArgs,
	VerParticipantesSinPrediccionRow,
	VerPrediccionesPorFechaArgs,
	VerPrediccionesPorFechaRow,
	VerPrediccionesPorPartidoArgs,
	VerPrediccionesPorPartidoRow,
	VerPrediccionesResumenPartidoArgs,
	VerPrediccionesResumenPartidoRow,
	VerPrediccionesRow,
	VerPuntajesPartidoArgs,
	VerPuntajesPartidoRow,
} from "@sqlc/predicciones_sql";
import type { GuardarPrediccionArgs } from "../../service/predicciones.service";

export interface IPrediccionesService {
	guardarPrediccion(
		args: GuardarPrediccionArgs,
	): Promise<"created" | "updated">;

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]>;

	verPrediccionesPorFecha(
		args: VerPrediccionesPorFechaArgs,
	): Promise<VerPrediccionesPorFechaRow[]>;

	verPredicciones(): Promise<VerPrediccionesRow[]>;

	verMisPredicciones(
		usuarioId: string,
		limit: number,
		offset: number,
	): Promise<VerMisPrediccionesRow[]>;

	verFechasDePrediccionesPorUsuario(usuarioId: string): Promise<string[]>;

	verMisPrediccionesPorFecha(
		args: VerMisPrediccionesPorFechaArgs,
	): Promise<VerMisPrediccionesPorFechaRow[]>;

	verPuntajesPartido(
		args: VerPuntajesPartidoArgs,
	): Promise<VerPuntajesPartidoRow[]>;

	verPrediccionesResumenPartido(
		args: VerPrediccionesResumenPartidoArgs,
	): Promise<VerPrediccionesResumenPartidoRow[]>;

	verParticipantesSinPrediccion(
		args: VerParticipantesSinPrediccionArgs,
	): Promise<VerParticipantesSinPrediccionRow[]>;

	verEvolucionPorUsuario(
		args: VerEvolucionPorUsuarioArgs,
	): Promise<VerEvolucionPorUsuarioRow[]>;

	verEvolucionGrupal(
		args: VerEvolucionGrupalArgs,
	): Promise<VerEvolucionGrupalRow[]>;
}
