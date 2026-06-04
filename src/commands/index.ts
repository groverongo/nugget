import type { Message } from "discord.js";
import type { AppContext } from "../types/app-context";
import { handleAnonCommand } from "./anon.command";
import { handleHelpCommand } from "./help.command";
import { handleMatchesCommand } from "./matches.command";
import { handlePingCommand } from "./ping.command";
import { handleSayCommand } from "./say.command";

export async function dispatchCommand(
	message: Message,
	context: AppContext,
): Promise<void> {
	const content = message.content.trim();
	if (!content.startsWith("!")) {
		return;
	}

	const [command] = content.slice(1).trim().split(/\s+/);
	if (!command) {
		// Si solo se presionó "!", mostrar ayuda
		await handleHelpCommand(message);
		return;
	}

	switch (command.toLowerCase()) {
		case "ping":
			await handlePingCommand(message);
			break;
		case "say":
			await handleSayCommand(message, content);
			break;
		case "anon":
			await handleAnonCommand(message, content);
			break;
		case "matches":
			await handleMatchesCommand(message, content, context.db);
			break;
		case "help":
			await handleHelpCommand(message);
			break;
		default:
			return;
	}
}
