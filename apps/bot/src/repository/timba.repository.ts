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
	cancelarTimbasAbiertasPorPartido,
	checkEmparejamientoTimba,
	crearTimba,
	type ResolverTimbaArgs,
	resolverTimba,
	sumarApuestasActivas,
	type VerMisTimbasRow,
	type VerPartidoParaTimbaRow,
	type VerTimbaRow,
	type VerTimbasCerradasPorPartidoRow,
	type VerTimbasPorPartidoRow,
	verMisTimbas,
	verPartidoParaTimba,
	verTimba,
	verTimbasCerradasPorPartido,
	verTimbasPorPartido,
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

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]> {
		return verTimbasPorPartido(this.pool, { partidoId });
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

	async sumarApuestasActivas(userId: string): Promise<number> {
		const row = await sumarApuestasActivas(this.pool, { userId });
		return row?.total ?? 0;
	}

	cancelarTimbasAbiertasPorPartido(partidoId: number): Promise<void> {
		return cancelarTimbasAbiertasPorPartido(this.pool, { partidoId });
	}

	withTx(tx: PoolClient): TimbaRepository {
		return new TimbaRepository(tx);
	}
}
