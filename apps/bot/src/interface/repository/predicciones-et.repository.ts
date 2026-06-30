import type {
	EliminarPrediccionesEtPorPartidoArgs,
	UpsertPrediccionEtArgs,
	VerPrediccionEtArgs,
	VerPrediccionEtRow,
	VerPrediccionesEtPorPartidoRow,
} from "@sqlc/predicciones_et_sql";

export interface IPrediccionesEtRepository {
	upsertPrediccionEt(args: UpsertPrediccionEtArgs): Promise<void>;
	verPrediccionEt(
		args: VerPrediccionEtArgs,
	): Promise<VerPrediccionEtRow | null>;
	verPrediccionesEtPorPartido(
		partidoId: number,
	): Promise<VerPrediccionesEtPorPartidoRow[]>;
	eliminarPrediccionesEtPorPartido(
		args: EliminarPrediccionesEtPorPartidoArgs,
	): Promise<void>;
}
