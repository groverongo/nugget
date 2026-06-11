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
	participantes = 0,
): jest.Mocked<IUsuariosRepository> {
	const repo = {
		create: jest.fn().mockResolvedValue(undefined),
		delete: jest.fn().mockResolvedValue(undefined),
		list: jest.fn().mockResolvedValue([]),
		updateUsername: jest.fn().mockResolvedValue(undefined),
		actualizarParticipante: jest.fn().mockResolvedValue(undefined),
		actualizarStats: jest.fn().mockResolvedValue(undefined),
		count: jest.fn().mockResolvedValue(0),
		countParticipantes: jest.fn().mockResolvedValue(participantes),
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

	it("createUsuario delegates directly to usuariosRepo.create", async () => {
		const usuariosRepo = createUsuariosRepositoryMock();
		const estaticoRepo = createEstaticoRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const args = { id: "user-1", username: "alice" };

		await service.createUsuario(args);

		expect(usuariosRepo.create).toHaveBeenCalledWith(args);
		expect(txManager.runInTx).not.toHaveBeenCalled();
		expect(estaticoRepo.limpiezaDistribucionPremios).not.toHaveBeenCalled();
	});

	it("deleteUsuario delegates directly to usuariosRepo.delete", async () => {
		const usuariosRepo = createUsuariosRepositoryMock();
		const estaticoRepo = createEstaticoRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const args = { id: "user-1" };

		await service.deleteUsuario(args);

		expect(usuariosRepo.delete).toHaveBeenCalledWith(args);
		expect(txManager.runInTx).not.toHaveBeenCalled();
		expect(estaticoRepo.limpiezaDistribucionPremios).not.toHaveBeenCalled();
	});

	it("recalcularPremios runs inside a transaction and rebuilds prize distribution", async () => {
		const participantes = 10;
		const usuariosRepo = createUsuariosRepositoryMock(participantes);
		const estaticoRepo = createEstaticoRepositoryMock();
		const tx = {} as PoolClient;
		const txManager = createTxManagerMock(async (fn) => {
			await fn(tx);
		});
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);
		const expectedEntries = generarPremiosPolla(
			participantes,
		).listaPremios.flatMap((puesto) => {
			const entries = [] as Array<{ premio: string; puesto: number }>;
			for (let i = puesto.min; i <= puesto.max; i++) {
				entries.push({ premio: puesto.premio.toString(), puesto: i });
			}
			return entries;
		});

		await service.recalcularPremios();

		expect(usuariosRepo.countParticipantes).toHaveBeenCalledTimes(1);
		expect(txManager.runInTx).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.withTx).toHaveBeenCalledWith(tx);
		expect(estaticoRepo.limpiezaDistribucionPremios).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.agregarEntradaDistribucionPremio).toHaveBeenCalledWith(
			expectedEntries,
		);
	});

	it("recalcularPremios with 0 participantes only clears the table", async () => {
		const usuariosRepo = createUsuariosRepositoryMock(0);
		const estaticoRepo = createEstaticoRepositoryMock();
		const txManager = createTxManagerMock();
		const service = new UsuariosService(usuariosRepo, estaticoRepo, txManager);

		await service.recalcularPremios();

		expect(usuariosRepo.countParticipantes).toHaveBeenCalledTimes(1);
		expect(txManager.runInTx).toHaveBeenCalledTimes(1);
		expect(estaticoRepo.limpiezaDistribucionPremios).toHaveBeenCalledTimes(1);
		expect(
			estaticoRepo.agregarEntradaDistribucionPremio,
		).not.toHaveBeenCalled();
	});
});
