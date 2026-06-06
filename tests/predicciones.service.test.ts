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
		actualizarPrediccion: jest.fn().mockResolvedValue(undefined),
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
	partido: { id: number; fechaPartido: Date | null } | null = {
		id: 42,
		fechaPartido: null,
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
	it("agregarPrediccion persists inside a transaction when the partido has not started", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() + 60_000),
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

		await service.agregarPrediccion(args);

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(prediccionesRepo.agregarPrediccion).toHaveBeenCalledWith(args);
		expect(txManager.runInTx).not.toHaveBeenCalled();
		expect(prediccionesRepo.withTx).not.toHaveBeenCalled();
		expect(partidosRepo.withTx).not.toHaveBeenCalled();
	});

	it("agregarPrediccion rejects when the partido does not exist", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock(null);
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.agregarPrediccion({
				usuarioId: "user-1",
				partidoId: 99,
				golesLocal: 1,
				golesVisitante: 1,
			}),
		).rejects.toThrow("El partido no existe.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 99 });
		expect(prediccionesRepo.agregarPrediccion).not.toHaveBeenCalled();
		expect(txManager.runInTx).not.toHaveBeenCalled();
	});

	it("agregarPrediccion rejects when the partido has already started", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() - 60_000),
		});
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.agregarPrediccion({
				usuarioId: "user-1",
				partidoId: 42,
				golesLocal: 1,
				golesVisitante: 0,
			}),
		).rejects.toThrow("El partido ya inició.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(prediccionesRepo.agregarPrediccion).not.toHaveBeenCalled();
	});

	it("actualizarPrediccion updates when the partido has not started", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() + 60_000),
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

		await service.actualizarPrediccion(args);

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(prediccionesRepo.actualizarPrediccion).toHaveBeenCalledWith(args);
	});

	it("actualizarPrediccion rejects when the partido does not exist", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock(null);
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.actualizarPrediccion({
				usuarioId: "user-1",
				partidoId: 42,
				golesLocal: 3,
				golesVisitante: 0,
			}),
		).rejects.toThrow("El partido no existe.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(prediccionesRepo.actualizarPrediccion).not.toHaveBeenCalled();
	});

	it("actualizarPrediccion rejects when the partido has already started", async () => {
		const prediccionesRepo = createPrediccionesRepositoryMock();
		const partidosRepo = createPartidosRepositoryMock({
			id: 42,
			fechaPartido: new Date(Date.now() - 60_000),
		});
		const tx = {} as PoolClient;
		const txManager = createTxManagerMock(async (fn) => {
			await fn(tx);
		});
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(
			service.actualizarPrediccion({
				usuarioId: "user-1",
				partidoId: 42,
				golesLocal: 3,
				golesVisitante: 0,
			}),
		).rejects.toThrow("El partido ya inició.");

		expect(partidosRepo.obtenerPartido).toHaveBeenCalledWith({ id: 42 });
		expect(prediccionesRepo.actualizarPrediccion).not.toHaveBeenCalled();
	});

	it("verPrediccionesPorPartido delegates to the repository", async () => {
		const predicciones = [{ partidoId: 42 }] as Awaited<
			ReturnType<IPrediccionesRepository["verPrediccionesPorPartido"]>
		>;
		const prediccionesRepo = createPrediccionesRepositoryMock();
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
		).resolves.toEqual(predicciones);
		expect(prediccionesRepo.verPrediccionesPorPartido).toHaveBeenCalledWith({
			partidoId: 42,
		});
	});

	it("verPrediccionesPorFecha delegates to the repository", async () => {
		const predicciones = [{ partidoId: 42 }] as Awaited<
			ReturnType<IPrediccionesRepository["verPrediccionesPorFecha"]>
		>;
		const prediccionesRepo = createPrediccionesRepositoryMock();
		prediccionesRepo.verPrediccionesPorFecha.mockResolvedValue(predicciones);
		const partidosRepo = createPartidosRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);
		const args = { date: "2026-06-06" };

		await expect(service.verPrediccionesPorFecha(args)).resolves.toEqual(
			predicciones,
		);
		expect(prediccionesRepo.verPrediccionesPorFecha).toHaveBeenCalledWith(args);
	});

	it("verPredicciones delegates to the repository", async () => {
		const predicciones = [{ partidoId: 42 }] as Awaited<
			ReturnType<IPrediccionesRepository["verPredicciones"]>
		>;
		const prediccionesRepo = createPrediccionesRepositoryMock();
		prediccionesRepo.verPredicciones.mockResolvedValue(predicciones);
		const partidosRepo = createPartidosRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(service.verPredicciones()).resolves.toEqual(predicciones);
		expect(prediccionesRepo.verPredicciones).toHaveBeenCalledTimes(1);
	});

	it("verMisPredicciones delegates to the repository", async () => {
		const predicciones = [{ partidoId: 42 }] as Awaited<
			ReturnType<IPrediccionesRepository["verMisPredicciones"]>
		>;
		const prediccionesRepo = createPrediccionesRepositoryMock();
		prediccionesRepo.verMisPredicciones.mockResolvedValue(predicciones);
		const partidosRepo = createPartidosRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);

		await expect(service.verMisPredicciones("user-1")).resolves.toEqual(
			predicciones,
		);
		expect(prediccionesRepo.verMisPredicciones).toHaveBeenCalledWith("user-1");
	});

	it("verMisPrediccionesPorFecha delegates to the repository", async () => {
		const predicciones = [{ partidoId: 42 }] as Awaited<
			ReturnType<IPrediccionesRepository["verMisPrediccionesPorFecha"]>
		>;
		const prediccionesRepo = createPrediccionesRepositoryMock();
		prediccionesRepo.verMisPrediccionesPorFecha.mockResolvedValue(predicciones);
		const partidosRepo = createPartidosRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new PrediccionesService(
			prediccionesRepo,
			partidosRepo,
			txManager,
		);
		const args = {
			usuarioId: "user-1",
			date: "2026-06-06",
		};

		await expect(service.verMisPrediccionesPorFecha(args)).resolves.toEqual(
			predicciones,
		);
		expect(prediccionesRepo.verMisPrediccionesPorFecha).toHaveBeenCalledWith(
			args,
		);
	});
});
