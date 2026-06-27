import type { PoolClient } from "pg";
import type { IPartidosRepository } from "../src/interface/repository/partidos.repository";
import type { IPrediccionesRepository } from "../src/interface/repository/prediccion.repository";
import { PrediccionesService } from "../src/service/predicciones.service";
import type { TxManager } from "../support/db.provider";

function createTxManagerMock(
	implementation?: (fn: (tx: PoolClient) => Promise<void>) => Promise<void>,
): TxManager {
	return {
		runInTx: jest.fn(
			implementation ??
				(async (fn: (tx: PoolClient) => Promise<void>) => {
					await fn({} as PoolClient);
				}),
		),
	} as unknown as TxManager;
}

function createPrediccionesRepositoryMock(): jest.Mocked<IPrediccionesRepository> {
	const repo = {
		agregarPrediccion: jest.fn().mockResolvedValue(undefined),
		agregarHistoriaPrediccion: jest.fn().mockResolvedValue(undefined),
		actualizarPrediccion: jest.fn().mockResolvedValue(undefined),
		verPrediccionPorUsuarioYPartido: jest.fn().mockResolvedValue(null),
		verPrediccionesPorPartido: jest.fn().mockResolvedValue([]),
		verPrediccionesPorFecha: jest.fn().mockResolvedValue([]),
		verPredicciones: jest.fn().mockResolvedValue([]),
		verMisPredicciones: jest.fn().mockResolvedValue([]),
		verMisPrediccionesPorFecha: jest.fn().mockResolvedValue([]),
		withTx: jest.fn(),
	} as unknown as jest.Mocked<IPrediccionesRepository>;

	repo.withTx.mockReturnValue(repo);

	return repo;
}

function createPartidosRepositoryMock(
	partido: {
		id: number;
		fechaPartido: Date | null;
		partidoOriginalId?: number | null;
		estado?: string;
		golesMinimosLocal?: number | null;
		golesMinimosVisitante?: number | null;
	} | null = {
		id: 42,
		fechaPartido: null,
		partidoOriginalId: null,
	},
): jest.Mocked<IPartidosRepository> {
	const repo = {
		obtenerPartido: jest.fn().mockResolvedValue(partido),
		withTx: jest.fn(),
	} as unknown as jest.Mocked<IPartidosRepository>;

	repo.withTx.mockReturnValue(repo);

	return repo;
}

describe("PrediccionesService", () => {
	it("guardarPrediccion creates a prediction when the user has none for the partido", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() + 60_000),
			partidoOriginalId: null,
		});
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);
		const args = {
			usuarioId: "user-1",
			partidoId: 42,
			golesLocal: 2,
			golesVisitante: 1,
		};

		await service.guardarPrediccion(args);

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(
			prediccionesRepo.verPrediccionPorUsuarioYPartido,
		).toHaveBeenCalledWith({
			usuarioId: "user-1",
			partidoId: 42,
		});
		expect(prediccionesRepo.agregarPrediccion).toHaveBeenCalledWith({
			...args,
			penalesGanadorId: null,
		});
		expect(prediccionesRepo.actualizarPrediccion).not.toHaveBeenCalled();
		expect(txManager.runInTx).not.toHaveBeenCalled();
		expect(prediccionesRepo.withTx).not.toHaveBeenCalled();
	});

	it("guardarPrediccion updates a prediction when the user already has one for the partido", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		prediccionesRepo.verPrediccionPorUsuarioYPartido.mockResolvedValue({
			usuarioId: "user-1",
			partidoId: 42,
			golesLocal: 1,
			golesVisitante: 3,
			penalesGanadorId: null,
		});
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() + 60_000),
			partidoOriginalId: null,
		});
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);
		const args = {
			usuarioId: "user-1",
			partidoId: 42,
			golesLocal: 3,
			golesVisitante: 0,
		};

		await service.guardarPrediccion(args);

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(
			prediccionesRepo.verPrediccionPorUsuarioYPartido,
		).toHaveBeenCalledWith({
			usuarioId: "user-1",
			partidoId: 42,
		});
		expect(prediccionesRepo.actualizarPrediccion).toHaveBeenCalledWith({
			...args,
			penalesGanadorId: null,
		});
		expect(prediccionesRepo.agregarPrediccion).not.toHaveBeenCalled();
	});

	it("guardarPrediccion rejects when the partido does not exist", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock(null);
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.guardarPrediccion({
				usuarioId: "user-1",
				partidoId: 99,
				golesLocal: 1,
				golesVisitante: 1,
			}),
		).rejects.toThrow("El partido no existe.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 99 });
		expect(
			prediccionesRepo.verPrediccionPorUsuarioYPartido,
		).not.toHaveBeenCalled();
		expect(prediccionesRepo.agregarPrediccion).not.toHaveBeenCalled();
		expect(prediccionesRepo.actualizarPrediccion).not.toHaveBeenCalled();
		expect(txManager.runInTx).not.toHaveBeenCalled();
	});

	it("guardarPrediccion rejects when the partido has already started", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() - 60_000),
			partidoOriginalId: null,
		});
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.guardarPrediccion({
				usuarioId: "user-1",
				partidoId: 42,
				golesLocal: 1,
				golesVisitante: 0,
			}),
		).rejects.toThrow("El partido ya inició.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(
			prediccionesRepo.verPrediccionPorUsuarioYPartido,
		).not.toHaveBeenCalled();
		expect(prediccionesRepo.agregarPrediccion).not.toHaveBeenCalled();
		expect(prediccionesRepo.actualizarPrediccion).not.toHaveBeenCalled();
	});

	it("verPrediccionesPorPartido delegates to the repository", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const predicciones: Awaited<
			ReturnType<IPrediccionesRepository["verPrediccionesPorPartido"]>
		> = [];
		prediccionesRepo.verPrediccionesPorPartido.mockResolvedValue(predicciones);
		const partidosRepo = createPartidosRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.verPrediccionesPorPartido({ partidoId: 42 }),
		).resolves.toBe(predicciones);
		expect(prediccionesRepo.verPrediccionesPorPartido).toHaveBeenCalledWith({
			partidoId: 42,
		});
	});
});
