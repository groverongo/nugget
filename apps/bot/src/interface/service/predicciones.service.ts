import type {
	AgregarPrediccionArgs,
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

export interface IPrediccionesService {
	guardarPrediccion(
		args: AgregarPrediccionArgs,
	): Promise<"created" | "updated">;

	guardarPrediccionAdmin(
		args: AgregarPrediccionArgs,
	): Promise<"created" | "updated">;

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]>;

	verPrediccionesPorFecha(
		args: VerPrediccionesPorFechaArgs,
	): Promise<VerPrediccionesPorFechaRow[]>;

	verPredicciones(): Promise<VerPrediccionesRow[]>;

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]>;

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
}
