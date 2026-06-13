import {
	type AceptarTimbaArgs,
	type AnularTimbaArgs,
	aceptarTimba,
	anularTimba,
	type CancelarTimbaArgs,
	type CheckEmparejamientoTimbaArgs,
	type CrearTimbaArgs,
	type CrearTimbaRow,
	cancelarTimba,
	checkEmparejamientoTimba,
	crearTimba,
	type ResolverTimbaArgs,
	resolverTimba,
	type VerMisTimbasRow,
	type VerPartidoParaTimbaRow,
	type VerTimbaRow,
	type VerTimbasCerradasPorPartidoRow,
	verMisTimbas,
	verPartidoParaTimba,
	verTimba,
	verTimbasCerradasPorPartido,
} from "@sqlc/timba_sql";
import type { Pool, PoolClient } from "pg";
import type { ITimbaRepository } from "../interface/repository/timba.repository";

export class TimbaRepository implements ITimbaRepository {
	constructor(private readonly pool: Pool | PoolClient) {}

	crear(args: CrearTimbaArgs): Promise<CrearTimbaRow | null> {
		return crearTimba(this.pool, args);
	}

	verTimba(id: number): Promise<VerTimbaRow | null> {
		return verTimba(this.pool, { id });
	}

	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null> {
		return verPartidoParaTimba(this.pool, { id: partidoId });
	}

	verTimbasCerradasPorPartido(
		partidoId: number,
	): Promise<VerTimbasCerradasPorPartidoRow[]> {
		return verTimbasCerradasPorPartido(this.pool, { partidoId });
	}

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]> {
		return verMisTimbas(this.pool, { jugador1Id });
	}

	async checkEmparejamiento(
		args: CheckEmparejamientoTimbaArgs,
	): Promise<number> {
		const row = await checkEmparejamientoTimba(this.pool, args);
		return row?.count ?? 0;
	}

	aceptar(args: AceptarTimbaArgs): Promise<void> {
		return aceptarTimba(this.pool, args);
	}

	resolver(args: ResolverTimbaArgs): Promise<void> {
		return resolverTimba(this.pool, args);
	}

	cancelar(args: CancelarTimbaArgs): Promise<void> {
		return cancelarTimba(this.pool, args);
	}

	anular(args: AnularTimbaArgs): Promise<void> {
		return anularTimba(this.pool, args);
	}

	withTx(tx: PoolClient): TimbaRepository {
		return new TimbaRepository(tx);
	}
}
