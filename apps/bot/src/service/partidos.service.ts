import type {
	AgregarPartidoArgs,
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidosNoFinalizadosRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "@sqlc/partidos_sql";
import type { IPartidosRepository } from "../interface/repository/partidos.repository";
import type { IPartidosService } from "../interface/service/partidos.service";

export class PartidosService implements IPartidosService {
	constructor(private readonly partidosRepo: IPartidosRepository) {}

	verFechasDePartidos(): Promise<string[]> {
		return this.partidosRepo.verFechasDePartidos();
	}

	verPartidosPorFecha(
		args: VerPartidosPorFechaArgs,
	): Promise<VerPartidosPorFechaRow[]> {
		return this.partidosRepo.verPorFecha(args);
	}

	verInformacionPartido(
		args: VerInformacionPartidoArgs,
	): Promise<VerInformacionPartidoRow | null> {
		return this.partidosRepo.verInformacionPartido(args);
	}

	verPartidosNoFinalizados(): Promise<VerPartidosNoFinalizadosRow[]> {
		return this.partidosRepo.verPartidosNoFinalizados();
	}

	actualizarPartidoEnVivo(id: number): Promise<void> {
		return this.partidosRepo.actualizarPartidoEnVivo({ id });
	}

	async sumarGol(
		partidoId: number,
		equipo: "local" | "visitante",
	): Promise<void> {
		const info = await this.partidosRepo.verInformacionPartido({
			id: partidoId,
		});
		if (!info) throw new Error(`Partido #${partidoId} no encontrado`);
		await this.partidosRepo.actualizarGolesPartido({
			golesLocal: (info.partidoGolesLocal ?? 0) + (equipo === "local" ? 1 : 0),
			golesVisitante:
				(info.partidoGolesVisitante ?? 0) + (equipo === "visitante" ? 1 : 0),
			id: partidoId,
		});
	}

	async restarGol(
		partidoId: number,
		equipo: "local" | "visitante",
	): Promise<void> {
		const info = await this.partidosRepo.verInformacionPartido({
			id: partidoId,
		});
		if (!info) throw new Error(`Partido #${partidoId} no encontrado`);
		await this.partidosRepo.actualizarGolesPartido({
			golesLocal: Math.max(
				(info.partidoGolesLocal ?? 0) - (equipo === "local" ? 1 : 0),
				0,
			),
			golesVisitante: Math.max(
				(info.partidoGolesVisitante ?? 0) - (equipo === "visitante" ? 1 : 0),
				0,
			),
			id: partidoId,
		});
	}

	marcarResumenDiaEnviado(fecha: string): Promise<void> {
		return this.partidosRepo.marcarResumenDiaEnviado({ fecha });
	}

	verResumenDiaEnviado(fecha: string): Promise<boolean> {
		return this.partidosRepo.verResumenDiaEnviado({ fecha });
	}

	async agregarPartidoSiguienteFase(args: AgregarPartidoArgs): Promise<void> {
		const fasePreviaId = args.faseId - 1;

		const equipoLocalJugoFasePrevia =
			await this.partidosRepo.existeEquipoPartidoFase({
				equipoId: args.equipoLocalId,
				faseId: fasePreviaId,
			});

		if (!equipoLocalJugoFasePrevia) {
			throw new Error("El equipo local no ha jugado la fase previa.");
		}

		const equipoVisitanteJugoFasePrevia =
			await this.partidosRepo.existeEquipoPartidoFase({
				equipoId: args.equipoVisitanteId,
				faseId: fasePreviaId,
			});

		if (!equipoVisitanteJugoFasePrevia) {
			throw new Error("El equipo visitante no ha jugado la fase previa.");
		}

		return this.partidosRepo.agregarPartido(args);
	}
}
