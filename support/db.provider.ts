import type { PoolClient, QueryResultRow } from "pg";
import { Pool } from "pg";
import { config } from "./config";

export type DBExecutor = Pool | PoolClient;

export class TxManager {
	constructor(private readonly pool: Pool) {}

	async runInTx<T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.pool.connect();

		try {
			await client.query("BEGIN");
			const result = await fn(client);
			await client.query("COMMIT");

			return result;
		} catch (error) {
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				if (error instanceof Error) {
					throw new Error(
						`${error.message}. Rollback also failed: ${String(rollbackError)}`,
					);
				}

				throw new Error(`Rollback failed: ${String(rollbackError)}`);
			}

			throw error;
		} finally {
			client.release();
		}
	}

	db(): Pool {
		return this.pool;
	}
}

export function ProvideDB(): Pool {
	return new Pool({
		connectionString: config.database.url,
	});
}

export function ProvideTxManager(database: Pool): TxManager {
	return new TxManager(database);
}

export async function query<T extends QueryResultRow>(
	db: DBExecutor,
	text: string,
	params?: unknown[],
) {
	return db.query<T>(text, params);
}
