import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { AppContext } from "../../../app";

export type DiscordCommandHandler = (
	interaction: ChatInputCommandInteraction,
	appContext: AppContext,
) => Promise<void>;

export type DiscordAutocompleteHandler = (
	interaction: AutocompleteInteraction,
	appContext: AppContext,
) => Promise<void>;

export type DiscordCommand = {
	definition:
		| SlashCommandBuilder
		| SlashCommandOptionsOnlyBuilder
		| SlashCommandSubcommandsOnlyBuilder;
	handle: DiscordCommandHandler;
	autocomplete?: DiscordAutocompleteHandler;
};

export type DiscordCommandPayload = RESTPostAPIApplicationCommandsJSONBody;
