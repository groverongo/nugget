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

const SeedRefSchema = z.object({
	from: z.string().min(1),
	by: z.string().min(1),
});

const SeedFileSchema = z.object({
	table: z.string().min(1),
	refs: z.record(z.string(), SeedRefSchema).optional(),
	rows: z.array(SeedRowSchema),
});

type SeedFile = z.infer<typeof SeedFileSchema>;
type SeedRow = z.infer<typeof SeedRowSchema>;
type SeedRefMap = NonNullable<SeedFile["refs"]>;
type LoadedSeedFile = {
	filePath: string;
	fileName: string;
	seed: SeedFile;
	columns: string[];
};

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

function getRefEntries(refs?: SeedRefMap) {
	return Object.entries(refs ?? {});
}

function loadSeedMetadata(filePath: string, seed: SeedFile): LoadedSeedFile {
	const columns = getRowColumns(seed.rows, filePath);

	for (const [column, ref] of getRefEntries(seed.refs)) {
		if (!columns.includes(column)) {
			throw new Error(
				`Invalid ref column '${column}' in ${path.basename(filePath)}: column is not present in seed rows`,
			);
		}

		if (ref.from.trim().length === 0) {
			throw new Error(
				`Invalid ref for column '${column}' in ${path.basename(filePath)}: 'from' must be non-empty`,
			);
		}

		if (ref.by.trim().length === 0) {
			throw new Error(
				`Invalid ref for column '${column}' in ${path.basename(filePath)}: 'by' must be non-empty`,
			);
		}
	}

	return {
		filePath,
		fileName: path.basename(filePath),
		seed,
		columns,
	};
}

async function loadSeedFiles(): Promise<LoadedSeedFile[]> {
	const filePaths = await getSeedFilePaths();

	if (filePaths.length === 0) {
		return [];
	}

	const loadedSeeds: LoadedSeedFile[] = [];

	for (const filePath of filePaths) {
		logger.info(`Loading seed file ${path.basename(filePath)}...`);
		const seed = await readSeedFile(filePath);

		loadedSeeds.push(loadSeedMetadata(filePath, seed));
	}

	return loadedSeeds;
}

function validateSeedDependencies(loadedSeeds: LoadedSeedFile[]) {
	const seedByTable = new Map(
		loadedSeeds.map((loaded) => [loaded.seed.table, loaded]),
	);

	for (const loadedSeed of loadedSeeds) {
		for (const [column, ref] of getRefEntries(loadedSeed.seed.refs)) {
			const dependencySeed = seedByTable.get(ref.from);

			if (!dependencySeed) {
				throw new Error(
					`Missing dependency seed table '${ref.from}' referenced by ${loadedSeed.seed.table}.${column} in ${loadedSeed.fileName}`,
				);
			}

			if (!dependencySeed.columns.includes(ref.by)) {
				throw new Error(
					`Invalid ref lookup '${ref.by}' for ${loadedSeed.seed.table}.${column} in ${loadedSeed.fileName}: referenced table '${ref.from}' does not expose that column in its seed rows`,
				);
			}
		}
	}
}

function getExecutionOrder(loadedSeeds: LoadedSeedFile[]) {
	const seedByTable = new Map(
		loadedSeeds.map((loaded) => [loaded.seed.table, loaded]),
	);
	const dependenciesByTable = new Map<string, Set<string>>();
	const dependentsByTable = new Map<string, Set<string>>();

	for (const loadedSeed of loadedSeeds) {
		const dependencies = new Set(
			getRefEntries(loadedSeed.seed.refs).map(([, ref]) => ref.from),
		);

		dependenciesByTable.set(loadedSeed.seed.table, dependencies);

		for (const dependency of dependencies) {
			const dependents = dependentsByTable.get(dependency) ?? new Set<string>();
			dependents.add(loadedSeed.seed.table);
			dependentsByTable.set(dependency, dependents);
		}
	}

	const ready = loadedSeeds
		.filter(
			(loadedSeed) =>
				(dependenciesByTable.get(loadedSeed.seed.table)?.size ?? 0) === 0,
		)
		.map((loadedSeed) => loadedSeed.seed.table)
		.sort((left, right) => left.localeCompare(right));
	const orderedTables: string[] = [];

	while (ready.length > 0) {
		const nextTable = ready.shift();

		if (!nextTable) {
			break;
		}

		orderedTables.push(nextTable);

		for (const dependentTable of [
			...(dependentsByTable.get(nextTable) ?? []),
		].sort((left, right) => left.localeCompare(right))) {
			const dependencies = dependenciesByTable.get(dependentTable);

			if (!dependencies) {
				continue;
			}

			dependencies.delete(nextTable);

			if (dependencies.size === 0) {
				ready.push(dependentTable);
				ready.sort((left, right) => left.localeCompare(right));
			}
		}
	}

	if (orderedTables.length !== loadedSeeds.length) {
		const remainingTables = [...dependenciesByTable.entries()]
			.filter(([, dependencies]) => dependencies.size > 0)
			.map(([table]) => table)
			.sort((left, right) => left.localeCompare(right));

		throw new Error(
			`Circular dependency detected among seed tables: ${remainingTables.join(", ")}`,
		);
	}

	return orderedTables.map((table) => {
		const loadedSeed = seedByTable.get(table);

		if (!loadedSeed) {
			throw new Error(`Missing loaded seed metadata for table '${table}'`);
		}

		return loadedSeed;
	});
}

async function resolveRowValues(
	loadedSeed: LoadedSeedFile,
	row: SeedRow,
	rowIndex: number,
) {
	const resolvedRow: SeedRow = { ...row };

	for (const [column, ref] of getRefEntries(loadedSeed.seed.refs)) {
		const lookupValue = row[column];
		const lookupTable = quoteIdentifier(ref.from);
		const lookupColumn = quoteIdentifier(ref.by);
		const result = await client.query(
			`SELECT id FROM ${lookupTable} WHERE ${lookupColumn} = $1`,
			[lookupValue],
		);
		const matchCount = result.rows.length;

		if (matchCount === 0) {
			throw new Error(
				`Unresolved ref in ${loadedSeed.seed.table} row ${rowIndex + 1} for column '${column}': no row found in '${ref.from}' where '${ref.by}' = ${JSON.stringify(lookupValue)}`,
			);
		}

		if (matchCount > 1) {
			throw new Error(
				`Ambiguous ref in ${loadedSeed.seed.table} row ${rowIndex + 1} for column '${column}': multiple rows found in '${ref.from}' where '${ref.by}' = ${JSON.stringify(lookupValue)}`,
			);
		}

		resolvedRow[column] = result.rows[0].id;
	}

	return resolvedRow;
}

async function seedTable(loadedSeed: LoadedSeedFile) {
	const { seed, columns, fileName } = loadedSeed;
	const tableName = quoteIdentifier(seed.table);
	const columnSql = columns.map((column) => quoteIdentifier(column)).join(", ");

	logger.info(
		`Seeding table ${seed.table} from ${fileName} with ${seed.rows.length} rows...`,
	);

	for (const [rowIndex, row] of seed.rows.entries()) {
		const resolvedRow = await resolveRowValues(loadedSeed, row, rowIndex);
		const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
		const values = columns.map((column) => resolvedRow[column]);

		await client.query(
			`INSERT INTO ${tableName} (${columnSql}) VALUES (${placeholders})`,
			values,
		);
	}

	logger.info(`Seeded ${seed.rows.length} rows into ${seed.table}`);
}

async function runSeed() {
	const loadedSeeds = await loadSeedFiles();

	if (loadedSeeds.length === 0) {
		logger.info("No seed files found.");
		return;
	}

	validateSeedDependencies(loadedSeeds);

	const orderedSeeds = getExecutionOrder(loadedSeeds);

	logger.info(
		`Seed execution order: ${orderedSeeds.map((loadedSeed) => loadedSeed.seed.table).join(" -> ")}`,
	);

	for (const loadedSeed of orderedSeeds) {
		await seedTable(loadedSeed);
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
