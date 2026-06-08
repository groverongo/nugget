import type {
	ChatInputCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import type { AppContext } from "../../../app";

export type DiscordCommandHandler = (
	interaction: ChatInputCommandInteraction,
	appContext: AppContext,
) => Promise<void>;

export type DiscordCommand = {
	definition: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	handle: DiscordCommandHandler;
};

export type DiscordCommandPayload = RESTPostAPIApplicationCommandsJSONBody;
