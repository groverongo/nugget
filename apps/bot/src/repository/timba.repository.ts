import {
	type AceptarTimbaArgs,
	type AnularTimbaArgs,
	aceptarTimba,
	anularTimba,
	type CancelarCadenaContraofertasParaAceptarArgs,
	type CancelarTimbaArgs,
	type CheckEmparejamientoTimbaArgs,
	type CrearContraofertaArgs,
	type CrearContraofertaRow,
	type CrearTimbaArgs,
	type CrearTimbaRow,
	cancelarCadenaContraofertasParaAceptar,
	cancelarContraofertasEnCascadaPorTimba,
	cancelarContraofertasPorTimba,
	cancelarTimba,
	cancelarTimbasContraofertaAbiertasPorPartido,
	checkEmparejamientoTimba,
	crearContraoferta,
	crearTimba,
	type GuardarMensajeTimbaArgs,
	guardarMensajeTimba,
	type ResolverTimbaArgs,
	type RevertirTimbaArgs,
	resolverTimba,
	revertirTimba,
	sumarApuestasActivas,
	type VerCadenaContraofertasParaCancelarArgs,
	type VerCadenaContraofertasParaCancelarRow,
	type VerContraofertasMensajesPorTimbaRow,
	type VerMisTimbasPorFechaArgs,
	type VerMisTimbasPorFechaRow,
	type VerMisTimbasRow,
	type VerPartidoParaTimbaRow,
	type VerTimbaIdPorDiscordMessageIdRow,
	type VerTimbaRow,
	type VerTimbasCerradasPorPartidoRow,
	type VerTimbasMedioTiempoPorPartidoRow,
	type VerTimbasPorPartidoRow,
	type VerTimbasResueltasPorPartidoRow,
	type VerTodasLasTimbasRow,
	verCadenaContraofertasParaCancelar,
	verContraofertasMensajesPorTimba,
	verFechasDeTimbasPorUsuario,
	verMisTimbas,
	verMisTimbasPorFecha,
	verPartidoParaTimba,
	verTimba,
	verTimbaIdPorDiscordMessageId,
	verTimbasCerradasPorPartido,
	verTimbasMedioTiempoPorPartido,
	verTimbasPorPartido,
	verTimbasResueltasPorPartido,
	verTodasLasTimbas,
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

	verTimbasResueltasPorPartido(
		partidoId: number,
	): Promise<VerTimbasResueltasPorPartidoRow[]> {
		return verTimbasResueltasPorPartido(this.pool, { partidoId });
	}

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]> {
		return verTimbasPorPartido(this.pool, { partidoId });
	}

	verMisTimbas(jugador_1Id: string): Promise<VerMisTimbasRow[]> {
		return verMisTimbas(this.pool, { jugador_1Id });
	}

	verTodasLasTimbas(): Promise<VerTodasLasTimbasRow[]> {
		return verTodasLasTimbas(this.pool);
	}

	async verFechasDeTimbasPorUsuario(jugador_1Id: string): Promise<string[]> {
		const filas = await verFechasDeTimbasPorUsuario(this.pool, {
			jugador_1Id,
		});
		return filas.map((fila) => fila.fecha);
	}

	verMisTimbasPorFecha(
		args: VerMisTimbasPorFechaArgs,
	): Promise<VerMisTimbasPorFechaRow[]> {
		return verMisTimbasPorFecha(this.pool, args);
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
		return cancelarTimbasContraofertaAbiertasPorPartido(this.pool, {
			partidoId,
		});
	}

	verContraofertasMensajesPorTimba(
		timbaOriginalId: number,
	): Promise<VerContraofertasMensajesPorTimbaRow[]> {
		return verContraofertasMensajesPorTimba(this.pool, { timbaOriginalId });
	}

	crearContraoferta(
		args: CrearContraofertaArgs,
	): Promise<CrearContraofertaRow | null> {
		return crearContraoferta(this.pool, args);
	}

	cancelarContraofertasPorTimba(timbaOriginalId: number): Promise<void> {
		return cancelarContraofertasPorTimba(this.pool, { timbaOriginalId });
	}

	cancelarContraofertasEnCascadaPorTimba(
		timbaOriginalId: number,
	): Promise<void> {
		return cancelarContraofertasEnCascadaPorTimba(this.pool, {
			timbaOriginalId,
		});
	}

	verCadenaContraofertasParaCancelar(
		args: VerCadenaContraofertasParaCancelarArgs,
	): Promise<VerCadenaContraofertasParaCancelarRow[]> {
		return verCadenaContraofertasParaCancelar(this.pool, args);
	}

	cancelarCadenaContraofertasParaAceptar(
		args: CancelarCadenaContraofertasParaAceptarArgs,
	): Promise<void> {
		return cancelarCadenaContraofertasParaAceptar(this.pool, args);
	}

	verTimbaIdPorDiscordMessageId(
		discordMessageId: string,
	): Promise<VerTimbaIdPorDiscordMessageIdRow | null> {
		return verTimbaIdPorDiscordMessageId(this.pool, { discordMessageId });
	}

	verTimbasMedioTiempoPorPartido(
		partidoId: number,
	): Promise<VerTimbasMedioTiempoPorPartidoRow[]> {
		return verTimbasMedioTiempoPorPartido(this.pool, { partidoId });
	}

	revertir(args: RevertirTimbaArgs): Promise<void> {
		return revertirTimba(this.pool, args);
	}

	guardarMensaje(args: GuardarMensajeTimbaArgs): Promise<void> {
		return guardarMensajeTimba(this.pool, args);
	}

	withTx(tx: PoolClient): TimbaRepository {
		return new TimbaRepository(tx);
	}
}
