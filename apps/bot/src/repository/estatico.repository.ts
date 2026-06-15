import {
	type VerEquiposArgs,
	type VerEquiposRow,
	verEquipos,
} from "@sqlc/equipos_sql";
import {
	type BuscarJugadoresArgs,
	type BuscarJugadoresRow,
	buscarJugadores,
	type VerJugadoresPorEquipoArgs,
	type VerJugadoresPorEquipoRow,
	type VerJugadoresPorIdsArgs,
	type VerJugadoresPorIdsRow,
	verJugadoresPorEquipo,
	verJugadoresPorIds,
} from "@sqlc/jugadores_sql";
import {
	type VerPuntosMejorGolPorPosicionRow,
	verPuntosMejorGolPorPosicion,
} from "@sqlc/mejor_gol_sql";
import {
	type AgregarPuestoPremioArgs,
	agregarPuestoPremio,
	limpiezaDistribucionPremios,
} from "@sqlc/usuarios_sql";
import type { DBExecutor } from "@support/db.provider";
import type { PoolClient } from "pg";
import type { IEstaticoRepository } from "../interface/repository/estatico.repository";

export class EstaticoRepository implements IEstaticoRepository {
	constructor(private readonly pool: DBExecutor) {}

	limpiezaDistribucionPremios(): Promise<void> {
		return limpiezaDistribucionPremios(this.pool);
	}

	async agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void> {
		for (const arg of args) {
			await agregarPuestoPremio(this.pool, arg);
		}
	}

	verEquipos(args: VerEquiposArgs): Promise<VerEquiposRow[]> {
		return verEquipos(this.pool, args);
	}

	verJugadoresPorEquipo(
		args: VerJugadoresPorEquipoArgs,
	): Promise<VerJugadoresPorEquipoRow[]> {
		return verJugadoresPorEquipo(this.pool, args);
	}

	buscarJugadores(args: BuscarJugadoresArgs): Promise<BuscarJugadoresRow[]> {
		return buscarJugadores(this.pool, args);
	}

	verJugadoresPorIds(
		args: VerJugadoresPorIdsArgs,
	): Promise<VerJugadoresPorIdsRow[]> {
		return verJugadoresPorIds(this.pool, args);
	}

	verPuntosMejorGolPorPosicion(
		posicion: number,
	): Promise<VerPuntosMejorGolPorPosicionRow | null> {
		return verPuntosMejorGolPorPosicion(this.pool, { posicion });
	}

	withTx(tx: PoolClient) {
		return new EstaticoRepository(tx);
	}
}
