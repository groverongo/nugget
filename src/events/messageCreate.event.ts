import { logger } from "@support/logger";
import type { Message } from "discord.js";
import { dispatchCommand } from "../commands";
import type { AppContext } from "../types/app-context";

export async function handleMessageCreate(
	message: Message,
	context: AppContext,
): Promise<void> {
	if (message.author.bot) {
		return;
	}

	try {
		await dispatchCommand(message, context);
	} catch (error) {
		logger.error({ err: error }, "Error procesando mensaje");
	}
}
