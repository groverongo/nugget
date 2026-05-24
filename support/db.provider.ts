import { Pool } from "pg";
import { config } from "./config";

export function ProvideDB() {
	const pool = new Pool({
		connectionString: config.database.url,
	});

	return pool.connect();
}
