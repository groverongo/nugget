import type {
	AceptarTimbaArgs,
	AnularTimbaArgs,
	CancelarTimbaArgs,
	CheckEmparejamientoTimbaArgs,
	CrearTimbaArgs,
	CrearTimbaRow,
	ResolverTimbaArgs,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
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

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]>;

	checkEmparejamiento(args: CheckEmparejamientoTimbaArgs): Promise<number>;

	aceptar(args: AceptarTimbaArgs): Promise<void>;

	resolver(args: ResolverTimbaArgs): Promise<void>;

	cancelar(args: CancelarTimbaArgs): Promise<void>;

	anular(args: AnularTimbaArgs): Promise<void>;

	withTx(tx: PoolClient): ITimbaRepository;
}
