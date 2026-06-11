import {
	type ActualizarPrediccionArgs,
	type ActualizarPuntajePrediccionArgs,
	type AgregarPrediccionArgs,
	actualizarPrediccion,
	actualizarPuntajePrediccion,
	agregarPrediccion,
	type VerMisPrediccionesPorFechaArgs,
	type VerMisPrediccionesPorFechaRow,
	type VerMisPrediccionesRow,
	type VerPrediccionesPorFechaArgs,
	type VerPrediccionesPorFechaRow,
	type VerPrediccionesPorPartidoArgs,
	type VerPrediccionesPorPartidoRow,
	type VerPrediccionesRow,
	type VerPrediccionPorUsuarioYPartidoArgs,
	type VerPrediccionPorUsuarioYPartidoRow,
	type VerPuntajesPartidoArgs,
	type VerPuntajesPartidoRow,
	type VerResultadosRecientesUsuarioArgs,
	type VerResultadosRecientesUsuarioRow,
	verFechasDePrediccionesPorUsuario,
	verMisPredicciones,
	verMisPrediccionesPorFecha,
	verPredicciones,
	verPrediccionesPorFecha,
	verPrediccionesPorPartido,
	verPrediccionPorUsuarioYPartido,
	verPuntajesPartido,
	verResultadosRecientesUsuario,
} from "@sqlc/predicciones_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";

export class PrediccionesRepository implements IPrediccionesRepository {
	constructor(private readonly pool: DBExecutor) {}

	agregarPrediccion(args: AgregarPrediccionArgs): Promise<void> {
		return agregarPrediccion(this.pool, args);
	}

	actualizarPrediccion(args: ActualizarPrediccionArgs): Promise<void> {
		return actualizarPrediccion(this.pool, args);
	}

	verPrediccionPorUsuarioYPartido(
		args: VerPrediccionPorUsuarioYPartidoArgs,
	): Promise<VerPrediccionPorUsuarioYPartidoRow | null> {
		return verPrediccionPorUsuarioYPartido(this.pool, args);
	}

	verPrediccionesPorPartido(
		args: VerPrediccionesPorPartidoArgs,
	): Promise<VerPrediccionesPorPartidoRow[]> {
		return verPrediccionesPorPartido(this.pool, args);
	}

	verPrediccionesPorFecha(
		args: VerPrediccionesPorFechaArgs,
	): Promise<VerPrediccionesPorFechaRow[]> {
		return verPrediccionesPorFecha(this.pool, args);
	}

	verPredicciones(): Promise<VerPrediccionesRow[]> {
		return verPredicciones(this.pool);
	}

	verMisPredicciones(usuarioId: string): Promise<VerMisPrediccionesRow[]> {
		return verMisPredicciones(this.pool, { usuarioId });
	}

	async verFechasDePrediccionesPorUsuario(
		usuarioId: string,
	): Promise<string[]> {
		const filas = await verFechasDePrediccionesPorUsuario(this.pool, {
			usuarioId,
		});

		return filas.map((fila) => fila.fecha);
	}

	verMisPrediccionesPorFecha(
		args: VerMisPrediccionesPorFechaArgs,
	): Promise<VerMisPrediccionesPorFechaRow[]> {
		return verMisPrediccionesPorFecha(this.pool, args);
	}

	actualizarPuntajePrediccion(
		args: ActualizarPuntajePrediccionArgs,
	): Promise<void> {
		return actualizarPuntajePrediccion(this.pool, args);
	}

	verResultadosRecientesUsuario(
		args: VerResultadosRecientesUsuarioArgs,
	): Promise<VerResultadosRecientesUsuarioRow[]> {
		return verResultadosRecientesUsuario(this.pool, args);
	}

	verPuntajesPartido(
		args: VerPuntajesPartidoArgs,
	): Promise<VerPuntajesPartidoRow[]> {
		return verPuntajesPartido(this.pool, args);
	}

	withTx(tx: PoolClient): IPrediccionesRepository {
		return new PrediccionesRepository(tx);
	}
}
