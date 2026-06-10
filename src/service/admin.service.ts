import type { TxManager } from "@support/db.provider";
import type { IPartidosRepository } from "../interface/repository/partidos.repository";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type {
	IAdminService,
	ResumenActualizacion,
} from "../interface/service/admin.service";

export class AdminService implements IAdminService {
	constructor(
		private readonly partidosRepo: IPartidosRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly txManager: TxManager,
	) {}

	async actualizarPartido(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
		milagro: boolean;
	}): Promise<ResumenActualizacion> {
		return this.txManager.runInTx(async (tx) => {
			const partidoRepo = this.partidosRepo.withTx(tx);
			const predRepo = this.prediccionesRepo.withTx(tx);

			const info = await partidoRepo.verPartidoParaCalculo({
				id: args.partidoId,
			});
			if (!info) throw new Error("Partido no encontrado.");

			const totalGoles = args.golesLocal + args.golesVisitante;
			const extraPartidazo =
				(args.golesLocal === 0 && args.golesVisitante === 0) ||
				totalGoles > 3.5;

			const fifaLocal = Number(info.equipoLocalPuntosFifa ?? 0);
			const fifaVisitante = Number(info.equipoVisitantePuntosFifa ?? 0);
			const diffFifa = Math.abs(fifaLocal - fifaVisitante);
			const localGana = args.golesLocal > args.golesVisitante;
			const visitanteGana = args.golesVisitante > args.golesLocal;
			const localEsFavorito = fifaLocal >= fifaVisitante;
			const batacazoOcurrio =
				(localGana && !localEsFavorito) || (visitanteGana && localEsFavorito);
			const puntosBatacazo = batacazoOcurrio ? Math.floor(diffFifa / 100) : 0;

			const predicciones = await predRepo.verPrediccionesPorPartido({
				partidoId: args.partidoId,
			});

			const totalApostadores = predicciones.length;
			const totalAcertadores = predicciones.filter(
				(p) =>
					p.prediccionGolesLocal === args.golesLocal &&
					p.prediccionGolesVisitante === args.golesVisitante,
			).length;

			const elegidoOcurrio =
				totalAcertadores > 0 && totalAcertadores <= totalApostadores / 10;
			const puntosElegido = elegidoOcurrio
				? Math.floor(totalApostadores / (10 * totalAcertadores))
				: 0;

			await partidoRepo.actualizarPartidoFinalizado({
				id: args.partidoId,
				golesLocal: args.golesLocal,
				golesVisitante: args.golesVisitante,
				extraMilagro: args.milagro,
				extraPartidazo,
				extraBatacazo: puntosBatacazo > 0,
				extraElElegido: puntosElegido > 0,
			});

			for (const pred of predicciones) {
				const esExacto =
					pred.prediccionGolesLocal === args.golesLocal &&
					pred.prediccionGolesVisitante === args.golesVisitante;

				const esBuenIntento =
					!esExacto &&
					Math.sign(
						pred.prediccionGolesLocal - pred.prediccionGolesVisitante,
					) === Math.sign(args.golesLocal - args.golesVisitante) &&
					Math.abs(
						pred.prediccionGolesLocal - pred.prediccionGolesVisitante,
					) === Math.abs(args.golesLocal - args.golesVisitante);

				if (esExacto) {
					const resultadosPrevios =
						await predRepo.verResultadosRecientesUsuario({
							usuarioId: pred.usuarioId,
							partidoId: args.partidoId,
						});
					let racha = 0;
					for (const r of resultadosPrevios) {
						if (r.resultado === "exacto") racha++;
						else break;
					}
					const puntosEnRacha = Math.min(racha, info.puntosBase);

					const puntosBase = info.puntosBase;
					const puntosPartidazo = extraPartidazo ? 1 : 0;
					const puntosMilagro = args.milagro ? 1 : 0;
					const subTotal =
						puntosBase +
						puntosEnRacha +
						puntosPartidazo +
						puntosMilagro +
						puntosBatacazo +
						puntosElegido;
					const puntosGranFinal = info.faseNombre === "final" ? subTotal : 0;
					const puntosTotal = subTotal + puntosGranFinal;

					await predRepo.actualizarPuntajePrediccion({
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
						resultado: "exacto",
						puntosBase,
						puntosEnRacha,
						puntosPartidazo,
						puntosMilagro,
						puntosBatacazo,
						puntosElElegido: puntosElegido,
						puntosGranFinal,
						puntosTotal,
					});
				} else if (esBuenIntento) {
					const puntosBase = info.puntosBuenIntento;
					await predRepo.actualizarPuntajePrediccion({
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
						resultado: "buen_intento",
						puntosBase,
						puntosEnRacha: 0,
						puntosPartidazo: 0,
						puntosMilagro: 0,
						puntosBatacazo: 0,
						puntosElElegido: 0,
						puntosGranFinal: 0,
						puntosTotal: puntosBase,
					});
				} else {
					await predRepo.actualizarPuntajePrediccion({
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
						resultado: "fallado",
						puntosBase: 0,
						puntosEnRacha: 0,
						puntosPartidazo: 0,
						puntosMilagro: 0,
						puntosBatacazo: 0,
						puntosElElegido: 0,
						puntosGranFinal: 0,
						puntosTotal: 0,
					});
				}
			}

			return {
				totalApostadores,
				totalAcertadores,
				extraPartidazo,
				puntosBatacazo,
				puntosElegido,
			};
		});
	}

	async actualizarPartidoMedioTiempo(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
	}): Promise<void> {
		await this.partidosRepo.actualizarPartidoMedioTiempo({
			id: args.partidoId,
			golesLocal: args.golesLocal,
			golesVisitante: args.golesVisitante,
		});
	}
}
