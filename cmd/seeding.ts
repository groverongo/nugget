import fs from "fs/promises";
import path from "path";
import { Client } from "pg";
import z from "zod";
import { config } from "../support/config";
import { logger } from "../support/logger";

const SEED_DIR = path.join(process.cwd(), "db", "seed");

const client = new Client({
	connectionString: config.database.url,
});

const SeedRowSchema = z.record(
	z.string(),
	z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

const SeedFileSchema = z.object({
	table: z.string().min(1),
	rows: z.array(SeedRowSchema),
});

type SeedFile = z.infer<typeof SeedFileSchema>;
type SeedRow = z.infer<typeof SeedRowSchema>;

function quoteIdentifier(identifier: string) {
	if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
		throw new Error(`Invalid SQL identifier: ${identifier}`);
	}

	return `"${identifier.replaceAll('"', '""')}"`;
}

async function getSeedFilePaths() {
	const entries = await fs.readdir(SEED_DIR, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
		.map((entry) => path.join(SEED_DIR, entry.name))
		.sort((a, b) => a.localeCompare(b));
}

async function readSeedFile(filePath: string): Promise<SeedFile> {
	const raw = await fs.readFile(filePath, "utf8");
	const parsed = JSON.parse(raw) as unknown;

	return SeedFileSchema.parse(parsed);
}

function getRowColumns(rows: SeedRow[], filePath: string) {
	if (rows.length === 0) {
		throw new Error(`Seed file has no rows: ${filePath}`);
	}

	const columns = Object.keys(rows[0]);

	if (columns.length === 0) {
		throw new Error(`Seed row has no attributes: ${filePath}`);
	}

	for (const row of rows) {
		const rowColumns = Object.keys(row);

		if (rowColumns.length !== columns.length) {
			throw new Error(`Seed rows must share the same attributes: ${filePath}`);
		}

		for (const column of columns) {
			if (!(column in row)) {
				throw new Error(
					`Missing attribute '${column}' in seed row: ${filePath}`,
				);
			}
		}
	}

	return columns;
}

async function seedTable(seed: SeedFile, sourcePath: string) {
	const columns = getRowColumns(seed.rows, sourcePath);
	const tableName = quoteIdentifier(seed.table);
	const columnSql = columns.map((column) => quoteIdentifier(column)).join(", ");

	for (const row of seed.rows) {
		const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
		const values = columns.map((column) => row[column]);

		await client.query(
			`INSERT INTO ${tableName} (${columnSql}) VALUES (${placeholders})`,
			values,
		);
	}

	logger.info(`Seeded ${seed.rows.length} rows into ${seed.table}`);
}

async function runSeed() {
	const filePaths = await getSeedFilePaths();

	if (filePaths.length === 0) {
		logger.info("No seed files found.");
		return;
	}

	for (const filePath of filePaths) {
		logger.info(`Loading seed file ${path.basename(filePath)}...`);
		const seed = await readSeedFile(filePath);

		await seedTable(seed, filePath);
	}
}

async function main() {
	await client.connect();

	try {
		await client.query("BEGIN");
		await runSeed();
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	logger.error(err);
	process.exit(1);
});
