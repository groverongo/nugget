const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");
const { "*": _ignore, ...paths } = compilerOptions.paths ?? {};

process.env.DISCORD_TOKEN =
	process.env.DISCORD_TOKEN || "dummy_token_for_tests";
process.env.DISCORD_OWNER_ID =
	process.env.DISCORD_OWNER_ID || "000000000000000000";
process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID =
	process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID || "000000000000000000";
process.env.DISCORD_GENERAL_CHANNEL_ID =
	process.env.DISCORD_GENERAL_CHANNEL_ID || "000000000000000000";

module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests"],
	clearMocks: true,
	moduleFileExtensions: ["ts", "js", "json"],
	moduleDirectories: ["node_modules", "<rootDir>"],
	moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" }),
};
