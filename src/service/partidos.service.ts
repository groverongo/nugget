import type {
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "@sqlc/partidos_sql";
import type { IPartidosRepository } from "../interface/repository/partidos.repository";
import type { IPartidosService } from "../interface/service/partidos.service";

export class PartidosService implements IPartidosService {
	constructor(private readonly partidosRepo: IPartidosRepository) {}

	verPartidosPorFecha(
		args: VerPartidosPorFechaArgs,
	): Promise<VerPartidosPorFechaRow[]> {
		return this.partidosRepo.verPorFecha(args);
	}
}
