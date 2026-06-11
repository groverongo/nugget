import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import z from "zod";

const ConfigSchema = z.object({
	database: z.object({
		url: z.string(),
	}),
	discord: z.object({
		token: z.string().min(1),
		owner: z.object({
			id: z.preprocess(
				(val) =>
					typeof val === "string" ? val.split(":").filter(Boolean) : val,
				z.array(z.string()).min(1),
			),
		}),
		announcements: z.object({
			channel: z.object({
				id: z.string().min(1),
			}),
		}),
	}),
	polla: z.object({
		costo_entrada: z.number(),
		fraccion_comision_org: z.number().min(0).max(1),
		fraccion_extra_campeon: z.number().min(0).max(1),
		factor_bloque_maximo: z.number(),
		fecha_inicio_torneo: z.string().default("2026-06-11T19:00:00.000Z"),
	}),
});

export type Config = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG: Config = {
	database: {
		url: "postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable",
	},
	discord: {
		token: "",
		owner: {
			id: [],
		},
		announcements: {
			channel: {
				id: "",
			},
		},
	},
	polla: {
		costo_entrada: 100,
		fraccion_comision_org: 0.1,
		fraccion_extra_campeon: 0.25,
		factor_bloque_maximo: 10,
		fecha_inicio_torneo: "2026-06-11T19:00:00.000Z",
	},
};

class ConfigService {
	private static instance: ConfigService;

	private config!: Config;

	private constructor() {
		this.load();
	}

	static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}

		return ConfigService.instance;
	}

	/**
	 * Public config accessor
	 */
	get(): Config {
		return this.config;
	}

	private load() {
		const yamlConfig = this.loadYaml();

		const merged = this.deepMerge(
			this.deepMerge(DEFAULT_CONFIG, yamlConfig),
			this.fromEnv(),
		);

		this.config = ConfigSchema.parse(merged);
	}

	private loadYaml(): Record<string, unknown> {
		const fullPath = path.join(process.cwd(), "config.yaml");

		if (!fs.existsSync(fullPath)) {
			return {};
		}

		const raw = fs.readFileSync(fullPath, "utf8");

		return (yaml.load(raw) as Record<string, unknown>) ?? {};
	}

	private fromEnv(): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(process.env)) {
			if (value === undefined) {
				continue;
			}

			const pathParts = key.toLowerCase().split("_");

			this.setDeep(result, pathParts, value);
		}

		return result;
	}

	private setDeep(
		obj: Record<string, unknown>,
		path: string[],
		value: unknown,
	) {
		let current = obj;

		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			const next = current[key];

			if (!this.isObject(next)) {
				current[key] = {};
			}

			current = current[key] as Record<string, unknown>;
		}

		current[path[path.length - 1]] = value;
	}

	private deepMerge(
		target: Record<string, unknown>,
		source: Record<string, unknown>,
	): Record<string, unknown> {
		const result = { ...target };

		for (const key of Object.keys(source)) {
			const sourceValue = source[key];
			const targetValue = target[key];

			if (this.isObject(sourceValue) && this.isObject(targetValue)) {
				result[key] = this.deepMerge(targetValue, sourceValue);
			} else {
				result[key] = sourceValue;
			}
		}

		return result;
	}

	private isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
}

export const config = ConfigService.getInstance().get();
