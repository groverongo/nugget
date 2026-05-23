import fs from "fs/promises";
import path from "path";
import { Client } from "pg";
import { config } from "../../support/config";
import { logger } from "../../support/logger";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

const client = new Client({
	connectionString: config.database.url,
});

type Migration = {
	id: string;
	upPath: string;
	downPath: string;
};

async function ensureMigrationsTable() {
	await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAllMigrations(): Promise<Migration[]> {
	const files = await fs.readdir(MIGRATIONS_DIR);

	const ups = files.filter((f) => f.endsWith(".up.sql"));

	return ups
		.map((upFile) => {
			const id = upFile.replace(".up.sql", "");

			return {
				id,
				upPath: path.join(MIGRATIONS_DIR, `${id}.up.sql`),
				downPath: path.join(MIGRATIONS_DIR, `${id}.down.sql`),
			};
		})
		.sort((a, b) => a.id.localeCompare(b.id));
}

async function getAppliedMigrationIds(): Promise<string[]> {
	const result = await client.query(`
    SELECT id
    FROM schema_migrations
    ORDER BY id;
  `);

	return result.rows.map((r) => r.id);
}

async function runUp() {
	const migrations = await getAllMigrations();
	const applied = new Set(await getAppliedMigrationIds());

	const pending = migrations.filter((m) => !applied.has(m.id));

	if (pending.length === 0) {
		logger.info("No pending migrations.");
		return;
	}

	for (const migration of pending) {
		logger.info(`Applying ${migration.id}...`);

		const sql = await fs.readFile(migration.upPath, "utf8");

		try {
			await client.query("BEGIN");

			await client.query(sql);

			await client.query(
				`
        INSERT INTO schema_migrations (id)
        VALUES ($1)
      `,
				[migration.id],
			);

			await client.query("COMMIT");

			logger.info(`Applied ${migration.id}`);
		} catch (err) {
			await client.query("ROLLBACK");
			throw err;
		}
	}
}

async function runDown() {
	const migrations = await getAllMigrations();
	const appliedIds = await getAppliedMigrationIds();

	if (appliedIds.length === 0) {
		logger.info("No migrations to rollback.");
		return;
	}

	const latestId = appliedIds[appliedIds.length - 1];

	const migration = migrations.find((m) => m.id === latestId);

	if (!migration) {
		throw new Error(`Migration file missing for ${latestId}`);
	}

	logger.info(`Rolling back ${migration.id}...`);

	const sql = await fs.readFile(migration.downPath, "utf8");

	try {
		await client.query("BEGIN");

		await client.query(sql);

		await client.query(
			`
      DELETE FROM schema_migrations
      WHERE id = $1
    `,
			[migration.id],
		);

		await client.query("COMMIT");

		logger.info(`Rolled back ${migration.id}`);
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	}
}

async function runStatus() {
	const migrations = await getAllMigrations();
	const applied = new Set(await getAppliedMigrationIds());

	for (const migration of migrations) {
		const status = applied.has(migration.id) ? "APPLIED" : "PENDING";

		logger.info(`${status.padEnd(10)} ${migration.id}`);
	}
}

function utcTimestamp() {
	const now = new Date();

	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(now.getUTCDate()).padStart(2, "0");

	const hh = String(now.getUTCHours()).padStart(2, "0");
	const mi = String(now.getUTCMinutes()).padStart(2, "0");
	const ss = String(now.getUTCSeconds()).padStart(2, "0");

	return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function normalizeMigrationName(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_]/g, "");
}

async function createMigration(name: string) {
	if (!name) {
		throw new Error("Migration name is required.");
	}

	const timestamp = utcTimestamp();

	const normalizedName = normalizeMigrationName(name);

	const baseName = `${timestamp}_${normalizedName}`;

	const upPath = path.join(MIGRATIONS_DIR, `${baseName}.up.sql`);

	const downPath = path.join(MIGRATIONS_DIR, `${baseName}.down.sql`);

	await fs.mkdir(MIGRATIONS_DIR, { recursive: true });

	await fs.writeFile(upPath, `-- UP MIGRATION: ${baseName}\n`, "utf8");

	await fs.writeFile(downPath, `-- DOWN MIGRATION: ${baseName}\n`, "utf8");

	logger.info("Created:");
	logger.info(`  ${path.basename(upPath)}`);
	logger.info(`  ${path.basename(downPath)}`);
}

async function main() {
	const command = process.argv[2];

	if (!command) {
		logger.info("Usage:");
		logger.info("  tsx migrate.ts up");
		logger.info("  tsx migrate.ts down");
		logger.info("  tsx migrate.ts status");
		logger.info("  tsx migrate.ts create <name>");
		process.exit(1);
	}

	if (command === "create") {
		const name = process.argv.slice(3).join(" ");

		await createMigration(name);

		return;
	}

	await client.connect();

	try {
		await ensureMigrationsTable();

		switch (command.toLowerCase()) {
			case "up":
				await runUp();
				break;

			case "down":
				await runDown();
				break;

			case "status":
				await runStatus();
				break;

			default:
				throw new Error(`Unknown command: ${command}`);
		}
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	logger.error(err);
	process.exit(1);
});
