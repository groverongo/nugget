import type { Message } from "discord.js";

export async function handleHelpCommand(message: Message): Promise<void> {
	const commands = [
		"**!ping** — Verifica que el bot está vivo",
		"**!say <texto>** — Publica un mensaje en el canal (solo ADMIN)",
		"**!anon <mensaje>** — Envía un mensaje anónimo al propietario del bot",
		"**!matches [programado|en_vivo]** — Lista los partidos programados o en vivo",
		"**!help** — Muestra esta lista de comandos",
	];

	await message.reply("📋 **Comandos disponibles:**\n" + commands.join("\n"));
}
