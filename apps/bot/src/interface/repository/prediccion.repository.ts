import type {
	ActualizarPrediccionArgs,
	ActualizarPuntajePrediccionArgs,
	ActualizarPuntosActualesPrediccionArgs,
	AgregarPrediccionArgs,
	VerGanadoresHitMasGolesRow,
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
	VerPrediccionPorUsuarioYPartidoArgs,
	VerPrediccionPorUsuarioYPartidoRow,
	VerPuntajesPartidoArgs,
	VerPuntajesPartidoRow,
	VerResultadosRecientesUsuarioArgs,
	VerResultadosRecientesUsuarioRow,
} from "@sqlc/predicciones_sql";
import type { PoolClient } from "pg";

export interface IPrediccionesRepository {
	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void>;

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void>;

	verPrediccionPorUsuarioYPartido(
		args: VerPrediccionPorUsuarioYPartidoArgs,
	): Promise<VerPrediccionPorUsuarioYPartidoRow | null>;

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

	actualizarPuntajePrediccion(
		args: ActualizarPuntajePrediccionArgs,
	): Promise<void>;

	verResultadosRecientesUsuario(
		args: VerResultadosRecientesUsuarioArgs,
	): Promise<VerResultadosRecientesUsuarioRow[]>;

	verPuntajesPartido(
		args: VerPuntajesPartidoArgs,
	): Promise<VerPuntajesPartidoRow[]>;

	verPrediccionesResumenPartido(
		args: VerPrediccionesResumenPartidoArgs,
	): Promise<VerPrediccionesResumenPartidoRow[]>;

	verParticipantesSinPrediccion(
		args: VerParticipantesSinPrediccionArgs,
	): Promise<VerParticipantesSinPrediccionRow[]>;

	verGanadoresHitMasGoles(): Promise<VerGanadoresHitMasGolesRow[]>;

	actualizarPuntosActualesPrediccion(
		args: ActualizarPuntosActualesPrediccionArgs,
	): Promise<void>;

	withTx(tx: PoolClient): IPrediccionesRepository;
}
