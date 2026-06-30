import type {
	AceptarTimbaArgs,
	AnularTimbaArgs,
	CancelarTimbaArgs,
	CheckEmparejamientoTimbaArgs,
	CrearContraofertaArgs,
	CrearContraofertaRow,
	CrearTimbaArgs,
	CrearTimbaRow,
	GuardarMensajeTimbaArgs,
	ResolverTimbaArgs,
	RevertirTimbaArgs,
	VerContraofertasMensajesPorTimbaRow,
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasMedioTiempoPorPartidoRow,
	VerTimbasPorPartidoRow,
	VerTimbasResueltasPorPartidoRow,
	VerTodasLasTimbasRow,
} from "@sqlc/timba_sql";
import type { PoolClient } from "pg";

export interface ITimbaRepository {
	crear(args: CrearTimbaArgs): Promise<CrearTimbaRow | null>;

	verTimba(id: number): Promise<VerTimbaRow | null>;

	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null>;

	verTimbasCerradasPorPartido(
		partidoId: number,
	): Promise<VerTimbasCerradasPorPartidoRow[]>;

	verTimbasResueltasPorPartido(
		partidoId: number,
	): Promise<VerTimbasResueltasPorPartidoRow[]>;

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]>;

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]>;

	verTodasLasTimbas(): Promise<VerTodasLasTimbasRow[]>;

	verFechasDeTimbasPorUsuario(jugador1Id: string): Promise<string[]>;

	verMisTimbasPorFecha(
		args: VerMisTimbasPorFechaArgs,
	): Promise<VerMisTimbasPorFechaRow[]>;

	checkEmparejamiento(args: CheckEmparejamientoTimbaArgs): Promise<number>;

	aceptar(args: AceptarTimbaArgs): Promise<void>;

	resolver(args: ResolverTimbaArgs): Promise<void>;

	cancelar(args: CancelarTimbaArgs): Promise<void>;

	anular(args: AnularTimbaArgs): Promise<void>;

	sumarApuestasActivas(userId: string): Promise<number>;

	cancelarTimbasAbiertasPorPartido(partidoId: number): Promise<void>;

	verContraofertasMensajesPorTimba(
		timbaOriginalId: number,
	): Promise<VerContraofertasMensajesPorTimbaRow[]>;

	crearContraoferta(
		args: CrearContraofertaArgs,
	): Promise<CrearContraofertaRow | null>;

	cancelarContraofertasPorTimba(timbaOriginalId: number): Promise<void>;

	cancelarContraofertasEnCascadaPorTimba(
		timbaOriginalId: number,
	): Promise<void>;

	verTimbasMedioTiempoPorPartido(
		partidoId: number,
	): Promise<VerTimbasMedioTiempoPorPartidoRow[]>;

	revertir(args: RevertirTimbaArgs): Promise<void>;

	guardarMensaje(args: GuardarMensajeTimbaArgs): Promise<void>;

	withTx(tx: PoolClient): ITimbaRepository;
}
