import type {
	ObtenerPartidoArgs,
	ObtenerPartidoRow,
	VerInformacionPartidoArgs,
	VerInformacionPartidoRow,
	VerPartidosPorFechaArgs,
	VerPartidosPorFechaRow,
} from "../db/sqlcgen/partidos_sql";
import type { IPartidosRepository } from "../src/interface/repository/partidos.repository";
import { PartidosService } from "../src/service/partidos.service";

function createPartidosRepositoryMock(): jest.Mocked<IPartidosRepository> {
	const repo = {
		verPorFecha: jest.fn().mockResolvedValue([]),
		verFechasDePartidos: jest.fn().mockResolvedValue([]),
		obtenerPartido: jest
			.fn<Promise<ObtenerPartidoRow | null>, [ObtenerPartidoArgs]>()
			.mockResolvedValue(null),
		verInformacionPartido: jest
			.fn<
				Promise<VerInformacionPartidoRow | null>,
				[VerInformacionPartidoArgs]
			>()
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
				equipoLocalSiglas: "PER",
				equipoVisitanteSiglas: "BRA",
				equipoLocalBandera: "🇵🇪",
				equipoVisitanteBandera: "🇧🇷",
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

	it("verFechasDePartidos delegates to partidosRepo.verFechasDePartidos", async () => {
		const expected: string[] = ["2026-06-06", "2026-06-07"];
		const partidosRepo = createPartidosRepositoryMock();
		partidosRepo.verFechasDePartidos.mockResolvedValue(expected);
		const service = new PartidosService(partidosRepo);

		await expect(service.verFechasDePartidos()).resolves.toEqual(expected);
		expect(partidosRepo.verFechasDePartidos).toHaveBeenCalledTimes(1);
		expect(partidosRepo.verFechasDePartidos).toHaveBeenCalledWith();
	});

	it("verInformacionPartido delegates to partidosRepo.verInformacionPartido", async () => {
		const expected: VerInformacionPartidoRow = {
			partidoId: 1,
			equipoLocalNombre: "Peru",
			equipoVisitanteNombre: "Brasil",
			equipoLocalGrupo: "A",
			equipoVisitanteGrupo: "B",
			estado: "pendiente",
			partidoGolesLocal: null,
			partidoGolesVisitante: null,
			fechaPartido: new Date("2026-06-06T10:00:00.000Z"),
		};
		const args: VerInformacionPartidoArgs = { id: 1 };
		const partidosRepo = createPartidosRepositoryMock();
		partidosRepo.verInformacionPartido.mockResolvedValue(expected);
		const service = new PartidosService(partidosRepo);

		await expect(service.verInformacionPartido(args)).resolves.toEqual(
			expected,
		);
		expect(partidosRepo.verInformacionPartido).toHaveBeenCalledTimes(1);
		expect(partidosRepo.verInformacionPartido).toHaveBeenCalledWith(args);
	});
});
