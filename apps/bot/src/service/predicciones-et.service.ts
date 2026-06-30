import type {
	UpsertPrediccionEtArgs,
	VerPrediccionEtRow,
} from "@sqlc/predicciones_et_sql";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IPrediccionesEtRepository } from "../interface/repository/predicciones-et.repository";

export class PrediccionesEtService {
	constructor(
		private readonly prediccionesEtRepo: IPrediccionesEtRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
	) {}

	guardarPrediccionEt(args: UpsertPrediccionEtArgs): Promise<void> {
		return this.prediccionesEtRepo.upsertPrediccionEt(args);
	}

	verPrediccionEt(args: {
		usuarioId: string;
		partidoId: number;
	}): Promise<VerPrediccionEtRow | null> {
		return this.prediccionesEtRepo.verPrediccionEt(args);
	}

	async materializarPrediccionesEt(args: {
		partidoOriginalId: number;
		partidoSupleId: number;
		golesBaseLocal: number;
		golesBaseVisitante: number;
	}): Promise<void> {
		const predEt = await this.prediccionesEtRepo.verPrediccionesEtPorPartido(
			args.partidoOriginalId,
		);

		for (const p of predEt) {
			const golesLocal = args.golesBaseLocal + p.golesLocalAdicionales;
			const golesVisitante =
				args.golesBaseVisitante + p.golesVisitanteAdicionales;

			// penales_ganador_id solo aplica si la predicción ET también termina empatada
			const penalesGanadorId =
				golesLocal === golesVisitante ? p.penalesGanadorId : null;

			// Si ya existe predicción manual para el suple, no sobreescribir
			const existing =
				await this.prediccionesRepo.verPrediccionPorUsuarioYPartido({
					usuarioId: p.usuarioId,
					partidoId: args.partidoSupleId,
				});
			if (existing) continue;

			await this.prediccionesRepo.agregarPrediccion({
				usuarioId: p.usuarioId,
				partidoId: args.partidoSupleId,
				golesLocal,
				golesVisitante,
				penalesGanadorId,
			});
		}

		await this.prediccionesEtRepo.eliminarPrediccionesEtPorPartido({
			partidoId: args.partidoOriginalId,
		});
	}
}
