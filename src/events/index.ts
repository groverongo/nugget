import { logger } from "@support/logger";
import type { Client } from "discord.js";
import { Events } from "discord.js";
import type { AppContext } from "../types/app-context";
import { handleGuildMemberAdd } from "./guildMemberAdd.event";
import { handleMessageCreate } from "./messageCreate.event";

export function registerDiscordEvents(client: Client, context: AppContext) {
	client.once(Events.ClientReady, () => {
		logger.info({ user: client.user?.tag }, "Discord bot listo");
	});

	client.on(Events.GuildMemberAdd, async (member) => {
		await handleGuildMemberAdd(member, context);
	});

	client.on(Events.MessageCreate, async (message) => {
		await handleMessageCreate(message, context);
	});
}
