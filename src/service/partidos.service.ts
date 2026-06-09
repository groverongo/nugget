import type {
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
}
