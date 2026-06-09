import type { PoolClient } from "pg";
import type { IEstaticoRepository } from "../src/interface/repository/estatico.repository";
import type { IUsuariosRepository } from "../src/interface/repository/usuarios.repository";
import { UsuariosService } from "../src/service/usuarios.service";
import type { TxManager } from "../support/db.provider";
import { generarPremiosPolla } from "../support/pozo";

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

function createUsuariosRepositoryMock(
	count = 3,
): jest.Mocked<IUsuariosRepository> {
	const repo = {
		create: jest.fn().mockResolvedValue(undefined),
		delete: jest.fn().mockResolvedValue(undefined),
		list: jest.fn().mockResolvedValue([]),
		updateUsername: jest.fn().mockResolvedValue(undefined),
		count: jest.fn().mockResolvedValue(count),
		withTx: jest.fn(),
	} as unknown as jest.Mocked<IUsuariosRepository>;

	repo.withTx.mockReturnValue(repo);

	return repo;
}

function createEstaticoRepositoryMock(): jest.Mocked<IEstaticoRepository> {
	const repo = {
		limpiezaDistribucionPremios: jest.fn().mockResolvedValue(undefined),
		agregarEntradaDistribucionPremio: jest.fn().mockResolvedValue(undefined),
		verEquipos: jest.fn().mockResolvedValue([]),
		withTx: jest.fn(),
	} as unknown as jest.Mocked<IEstaticoRepository>;

	repo.withTx.mockReturnValue(repo);

	return repo;
}

describe("UsuariosService", () => {
	it("listUsuarios delegates to usuariosRepo.list", async () => {
		const expected = [{ id: "1", username: "alice" }] as Awaited<
			ReturnType<IUsuariosRepository["list"]>
		>;
		const usuariosRepo = createUsuariosRepositoryMock();
		usuariosRepo.list.mockResolvedValue(expected);
		const estaticoRepo = createEstaticoRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);

		await expect(service.listUsuarios()).resolves.toEqual(expected);
		expect(usuariosRepo.list).toHaveBeenCalledTimes(1);
	});

	it("verEquipos delegates to estaticoRepo.verEquipos with nullable optional filters", async () => {
		const usuariosRepo = createUsuariosRepositoryMock();
		const estaticoRepo = createEstaticoRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const expected = [{ id: 1, nombre: "Argentina" }];

		estaticoRepo.verEquipos.mockResolvedValue(
			expected as Awaited<ReturnType<IEstaticoRepository["verEquipos"]>>,
		);

		await expect(service.verEquipos({ blanco: false })).resolves.toEqual(
			expected,
		);
		expect(estaticoRepo.verEquipos).toHaveBeenCalledWith({
			blanco: false,
			negro: null,
		});
	});

	it("createUsuario runs repository updates inside a transaction and rebuilds prize distribution", async () => {
		const usuariosRepo = createUsuariosRepositoryMock(3);
		const estaticoRepo = createEstaticoRepositoryMock();
		const tx = {} as PoolClient;
		const txManager = createTxManagerMock(async (fn) => {
			await fn(tx);
		});
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const args = { id: "user-1", username: "alice" };
		const expectedCreateArgs = {
			id: "user-1",
			username: "alice",
		};
		const expectedEntries = generarPremiosPolla(3).listaPremios.flatMap(
			(puesto) => {
				const entries = [] as Array<{ premio: string; puesto: number }>;

				for (let i = puesto.min; i < puesto.max + 1; i++) {
					entries.push({
						premio: puesto.premio.toString(),
						puesto: i,
					});
				}

				return entries;
			},
		);

		await service.createUsuario(args);

		expect(txManager.runInTx).toHaveBeenCalledTimes(1);
		expect(usuariosRepo.withTx).toHaveBeenCalledWith(tx);
		expect(usuariosRepo.create).toHaveBeenCalledWith(expectedCreateArgs);
		expect(usuariosRepo.count).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.withTx).toHaveBeenCalledWith(tx);
		expect(estaticoRepo.limpiezaDistribucionPremios).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.agregarEntradaDistribucionPremio).toHaveBeenCalledWith(
			expectedEntries,
		);
	});

	it("createUsuario does not resolve before the transaction work finishes", async () => {
		const usuariosRepo = createUsuariosRepositoryMock();
		const estaticoRepo = createEstaticoRepositoryMock();
		let releaseTransaction!: () => void;
		const transactionFinished = new Promise<void>((resolve) => {
			releaseTransaction = resolve;
		});
		const txManager = createTxManagerMock(async (fn) => {
			await fn({} as PoolClient);
			await transactionFinished;
		});
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);

		let resolved = false;
		const pending = service
			.createUsuario({ id: "user-2", username: "bob" })
			.then(() => {
				resolved = true;
			});

		await Promise.resolve();
		expect(resolved).toBe(false);

		releaseTransaction();
		await pending;
		expect(resolved).toBe(true);
	});

	it("deleteUsuario runs repository updates inside a transaction and rebuilds prize distribution", async () => {
		const usuariosRepo = createUsuariosRepositoryMock(2);
		const estaticoRepo = createEstaticoRepositoryMock();
		const tx = {} as PoolClient;
		const txManager = createTxManagerMock(async (fn) => {
			await fn(tx);
		});
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const args = { id: "user-1" };
		const expectedEntries = generarPremiosPolla(2).listaPremios.flatMap(
			(puesto) => {
				const entries = [] as Array<{ premio: string; puesto: number }>;

				for (let i = puesto.min; i < puesto.max + 1; i++) {
					entries.push({
						premio: puesto.premio.toString(),
						puesto: i,
					});
				}

				return entries;
			},
		);

		await service.deleteUsuario(args);

		expect(txManager.runInTx).toHaveBeenCalledTimes(1);
		expect(usuariosRepo.withTx).toHaveBeenCalledWith(tx);
		expect(usuariosRepo.delete).toHaveBeenCalledWith(args);
		expect(usuariosRepo.count).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.withTx).toHaveBeenCalledWith(tx);
		expect(estaticoRepo.limpiezaDistribucionPremios).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.agregarEntradaDistribucionPremio).toHaveBeenCalledWith(
			expectedEntries,
		);
	});

	it("deleteUsuario does not resolve before the transaction work finishes", async () => {
		const usuariosRepo = createUsuariosRepositoryMock();
		const estaticoRepo = createEstaticoRepositoryMock();
		let releaseTransaction!: () => void;
		const transactionFinished = new Promise<void>((resolve) => {
			releaseTransaction = resolve;
		});
		const txManager = createTxManagerMock(async (fn) => {
			await fn({} as PoolClient);
			await transactionFinished;
		});
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);

		let resolved = false;
		const pending = service.deleteUsuario({ id: "user-2" }).then(() => {
			resolved = true;
		});

		await Promise.resolve();
		expect(resolved).toBe(false);

		releaseTransaction();
		await pending;
		expect(resolved).toBe(true);
	});
});
