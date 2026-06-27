import type { TxManager } from "@support/db.provider";
import type { IPartidosRepository } from "../interface/repository/partidos.repository";
import type { IPrediccionesRepository } from "../interface/repository/prediccion.repository";
import type { IUsuariosRepository } from "../interface/repository/usuarios.repository";
import type {
	BonusResult,
	IAdminService,
	ResumenActualizacion,
} from "../interface/service/admin.service";

export class AdminService implements IAdminService {
	constructor(
		private readonly partidosRepo: IPartidosRepository,
		private readonly prediccionesRepo: IPrediccionesRepository,
		private readonly usuariosRepo: IUsuariosRepository,
		private readonly txManager: TxManager,
	) {}

	async actualizarPartido(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
		milagro: number;
		penalesGanadorId?: number | null;
	}): Promise<ResumenActualizacion> {
		return this.txManager.runInTx(async (tx) => {
			const partidoRepo = this.partidosRepo.withTx(tx);
			const predRepo = this.prediccionesRepo.withTx(tx);
			const usuariosRepo = this.usuariosRepo.withTx(tx);

			const info = await partidoRepo.verPartidoParaCalculo({
				id: args.partidoId,
			});
			if (!info) throw new Error("Partido no encontrado.");

			const esSuple = info.partidoOriginalId !== null;
			const golesMinimosLocal = Number(info.golesMinimosLocal ?? 0);
			const golesMinimosVisitante = Number(info.golesMinimosVisitante ?? 0);

			const puntosBase = esSuple
				? Math.floor(info.puntosBase / 2)
				: info.puntosBase;
			const puntosBuenIntento = esSuple
				? Math.max(1, Math.floor(info.puntosBuenIntento / 2))
				: info.puntosBuenIntento;

			const totalGoles = args.golesLocal + args.golesVisitante;
			const golesAgregados =
				totalGoles - golesMinimosLocal - golesMinimosVisitante;
			const extraPartidazo = esSuple
				? golesAgregados > 2.5
				: (args.golesLocal === 0 && args.golesVisitante === 0) ||
					totalGoles > 3.5;

			const fifaLocal = Number(info.equipoLocalPuntosFifa ?? 0);
			const fifaVisitante = Number(info.equipoVisitantePuntosFifa ?? 0);
			const diffFifa = Math.abs(fifaLocal - fifaVisitante);
			const localEsFavorito = fifaLocal >= fifaVisitante;

			const penalesGanadorId = args.penalesGanadorId ?? null;
			const hayEmpateGoles = args.golesLocal === args.golesVisitante;

			// Fetch predicciones una sola vez
			const predicciones = await predRepo.verPrediccionesPorPartido({
				partidoId: args.partidoId,
			});

			// Para batacazo con penales necesitamos saber qué equipo es el local
			const equipoLocalId = predicciones[0]?.equipoLocalId ?? null;
			const equipoVisitanteId = predicciones[0]?.equipoVisitanteId ?? null;

			let localGanaFinal = args.golesLocal > args.golesVisitante;
			let visitanteGanaFinal = args.golesVisitante > args.golesLocal;
			if (
				esSuple &&
				hayEmpateGoles &&
				penalesGanadorId !== null &&
				equipoLocalId
			) {
				localGanaFinal = penalesGanadorId === equipoLocalId;
				visitanteGanaFinal = penalesGanadorId === equipoVisitanteId;
			}

			const batacazoOcurrio =
				(localGanaFinal && !localEsFavorito) ||
				(visitanteGanaFinal && localEsFavorito);
			const puntosBatacazo = batacazoOcurrio ? Math.floor(diffFifa / 100) : 0;

			const totalApostadores = predicciones.length;
			const totalAcertadores = predicciones.filter((p) =>
				this.esExacto(
					p,
					args.golesLocal,
					args.golesVisitante,
					penalesGanadorId,
				),
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
				extraMilagro: args.milagro > 0,
				extraPartidazo,
				extraBatacazo: puntosBatacazo > 0,
				extraElElegido: puntosElegido > 0,
			});

			for (const pred of predicciones) {
				const esExacto = this.esExacto(
					pred,
					args.golesLocal,
					args.golesVisitante,
					penalesGanadorId,
				);

				const esBuenIntento =
					!esExacto &&
					this.esBuenIntento(
						pred,
						args.golesLocal,
						args.golesVisitante,
						penalesGanadorId,
						esSuple,
					);

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
					const nuevaRacha = racha + 1;
					const puntosEnRacha = Math.min(racha, puntosBase);

					const puntosPartidazo = extraPartidazo ? 1 : 0;
					const puntosMilagro = args.milagro;
					const subTotal =
						puntosBase +
						puntosEnRacha +
						puntosPartidazo +
						puntosMilagro +
						puntosBatacazo +
						puntosElegido;
					const puntosGranFinal =
						!esSuple && info.faseNombre === "final" ? subTotal : 0;
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

					await usuariosRepo.actualizarStats({
						id: pred.usuarioId,
						partidosGanados: 1,
						partidosPerdidos: 0,
						puntos: puntosTotal,
						racha: nuevaRacha,
					});
					const puntosActualesExacto = await usuariosRepo.obtenerPuntos(
						pred.usuarioId,
					);
					await predRepo.actualizarPuntosActualesPrediccion({
						puntosActuales: puntosActualesExacto,
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
					});
				} else if (esBuenIntento) {
					await predRepo.actualizarPuntajePrediccion({
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
						resultado: "buen_intento",
						puntosBase: puntosBuenIntento,
						puntosEnRacha: 0,
						puntosPartidazo: 0,
						puntosMilagro: 0,
						puntosBatacazo: 0,
						puntosElElegido: 0,
						puntosGranFinal: 0,
						puntosTotal: puntosBuenIntento,
					});

					await usuariosRepo.actualizarStats({
						id: pred.usuarioId,
						partidosGanados: 0,
						partidosPerdidos: 0,
						puntos: puntosBuenIntento,
						racha: 0,
					});
					const puntosActualesBuenIntento = await usuariosRepo.obtenerPuntos(
						pred.usuarioId,
					);
					await predRepo.actualizarPuntosActualesPrediccion({
						puntosActuales: puntosActualesBuenIntento,
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
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

					await usuariosRepo.actualizarStats({
						id: pred.usuarioId,
						partidosGanados: 0,
						partidosPerdidos: 1,
						puntos: 0,
						racha: 0,
					});
					const puntosActualesFallado = await usuariosRepo.obtenerPuntos(
						pred.usuarioId,
					);
					await predRepo.actualizarPuntosActualesPrediccion({
						puntosActuales: puntosActualesFallado,
						usuarioId: pred.usuarioId,
						partidoId: args.partidoId,
					});
				}
			}

			// Si no es suple y terminó en empate en fase KO, crear suplementario
			let supleCreado: { supleId: number } | null = null;
			if (!esSuple && hayEmpateGoles && info.faseNombre !== "Fase de Grupos") {
				if (equipoLocalId !== null && equipoVisitanteId !== null) {
					const suple = await partidoRepo.crearPartidoSuplementario({
						faseId: info.faseId,
						equipoLocalId,
						equipoVisitanteId,
						partidoOriginalId: args.partidoId,
						golesMinimosLocal: args.golesLocal,
						golesMinimosVisitante: args.golesVisitante,
					});
					if (suple) {
						supleCreado = { supleId: suple.id };
					}
				}
			}

			return {
				totalApostadores,
				totalAcertadores,
				extraPartidazo,
				puntosBatacazo,
				puntosElegido,
				supleCreado,
			};
		});
	}

	private esExacto(
		pred: {
			prediccionGolesLocal: number;
			prediccionGolesVisitante: number;
			prediccionPenalesGanadorId: number | null;
		},
		golesLocal: number,
		golesVisitante: number,
		penalesGanadorId: number | null,
	): boolean {
		if (
			pred.prediccionGolesLocal !== golesLocal ||
			pred.prediccionGolesVisitante !== golesVisitante
		) {
			return false;
		}
		// En empate, el ganador de penales debe coincidir
		if (golesLocal === golesVisitante) {
			return pred.prediccionPenalesGanadorId === penalesGanadorId;
		}
		return true;
	}

	private esBuenIntento(
		pred: {
			prediccionGolesLocal: number;
			prediccionGolesVisitante: number;
			prediccionPenalesGanadorId: number | null;
		},
		golesLocal: number,
		golesVisitante: number,
		penalesGanadorId: number | null,
		esSuple: boolean,
	): boolean {
		const predDiff = pred.prediccionGolesLocal - pred.prediccionGolesVisitante;
		const realDiff = golesLocal - golesVisitante;

		if (
			Math.sign(predDiff) !== Math.sign(realDiff) ||
			Math.abs(predDiff) !== Math.abs(realDiff)
		) {
			return false;
		}

		// Si hay empate (diff = 0) en suple, el ganador de penales debe coincidir
		if (esSuple && predDiff === 0 && realDiff === 0) {
			return pred.prediccionPenalesGanadorId === penalesGanadorId;
		}

		return true;
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

	async asignarBonuses(): Promise<BonusResult> {
		const [wrGanadores, rmGanadores, hmgGanadores] = await Promise.all([
			this.usuariosRepo.verGanadoresMayorWinRate(),
			this.usuariosRepo.verGanadoresRachaMaxima(),
			this.prediccionesRepo.verGanadoresHitMasGoles(),
		]);

		await Promise.all([
			...wrGanadores.map((u) => this.usuariosRepo.ajustarPuntos(u.id, 5)),
			...rmGanadores.map((u) => this.usuariosRepo.ajustarPuntos(u.id, 3)),
			...hmgGanadores.map((u) =>
				this.usuariosRepo.ajustarPuntos(u.usuarioId, 2),
			),
		]);

		const first = hmgGanadores[0];
		const partido = first
			? `${first.equipoLocalSiglas} ${first.equipoLocalBandera} ${first.golesLocal}-${first.golesVisitante} ${first.equipoVisitanteSiglas} ${first.equipoVisitanteBandera}`
			: "";

		return {
			winRate: {
				ganadores: wrGanadores.map((u) => ({ id: u.id, username: u.username })),
				valor: Number(wrGanadores[0]?.winRate ?? 0),
				puntos: 5,
			},
			rachaMaxima: {
				ganadores: rmGanadores.map((u) => ({ id: u.id, username: u.username })),
				valor: rmGanadores[0]?.rachaMaxima ?? 0,
				puntos: 3,
			},
			hitMasGoles: {
				ganadores: hmgGanadores.map((u) => ({
					id: u.usuarioId,
					username: u.username,
				})),
				totalGoles: hmgGanadores[0]?.totalGoles ?? 0,
				partido,
				puntos: 2,
			},
		};
	}
}
