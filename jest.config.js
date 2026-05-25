const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");
const { "*": _ignore, ...paths } = compilerOptions.paths ?? {};

module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests"],
	clearMocks: true,
	moduleFileExtensions: ["ts", "js", "json"],
	moduleDirectories: ["node_modules", "<rootDir>"],
	moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" }),
};
