import type {
	AceptarTimbaArgs,
	AnularTimbaArgs,
	CancelarTimbaArgs,
	CheckEmparejamientoTimbaArgs,
	CrearTimbaArgs,
	CrearTimbaRow,
	GuardarMensajeTimbaArgs,
	ResolverTimbaArgs,
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasPorPartidoRow,
	VerTimbasResueltasPorPartidoRow,
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

	guardarMensaje(args: GuardarMensajeTimbaArgs): Promise<void>;

	withTx(tx: PoolClient): ITimbaRepository;
}
