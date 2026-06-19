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
		milagro: boolean;
	}): Promise<ResumenActualizacion> {
		return this.txManager.runInTx(async (tx) => {
			const partidoRepo = this.partidosRepo.withTx(tx);
			const predRepo = this.prediccionesRepo.withTx(tx);
			const usuariosRepo = this.usuariosRepo.withTx(tx);

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
					const nuevaRacha = racha + 1;
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

					await usuariosRepo.actualizarStats({
						id: pred.usuarioId,
						partidosGanados: 0,
						partidosPerdidos: 0,
						puntos: puntosBase,
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
