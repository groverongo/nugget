import type {
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "../db/sqlcgen/partidos_sql";
import type { IPartidosRepository } from "../src/interface/repository/partidos.repository";
import { PartidosService } from "../src/service/partidos.service";

function createPartidosRepositoryMock(): jest.Mocked<IPartidosRepository> {
	const repo = {
		verPorFecha: jest.fn().mockResolvedValue([]),
		obtenerPartido: jest
			.fn<Promise<ObtenerPartidoRow | null>, [ObtenerPartidoArgs]>()
			.mockResolvedValue(null),
		withTx: jest.fn(),
	} as unknown as jest.Mocked<IPartidosRepository>;

	repo.withTx.mockReturnValue(repo);

	return repo;
}

describe("PartidosService", () => {
	it("verPartidosPorFecha delegates to partidosRepo.verPorFecha", async () => {
		const expected: VerPartidosPorFechaRow[] = [
			{
				partidoId: 1,
				equipoLocalNombre: "Peru",
				equipoVisitanteNombre: "Brasil",
				equipoLocalGrupo: "A",
				equipoVisitanteGrupo: "B",
				estado: "pendiente",
				partidoGolesLocal: null,
				partidoGolesVisitante: null,
				fechaPartido: new Date("2026-06-06T10:00:00.000Z"),
			},
		];
		const args: VerPartidosPorFechaArgs = { date: "2026-06-06" };
		const partidosRepo = createPartidosRepositoryMock();
		partidosRepo.verPorFecha.mockResolvedValue(expected);
		const service = new PartidosService(partidosRepo);

		await expect(service.verPartidosPorFecha(args)).resolves.toEqual(expected);
		expect(partidosRepo.verPorFecha).toHaveBeenCalledTimes(1);
		expect(partidosRepo.verPorFecha).toHaveBeenCalledWith(args);
	});
});
