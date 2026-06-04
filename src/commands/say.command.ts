import type { Message, TextBasedChannel } from "discord.js";

export async function handleSayCommand(
	message: Message,
	content: string,
): Promise<void> {
	const args = content.trim().split(/\s+/).slice(1).join(" ");

	if (!args) {
		await message.reply("Uso: !say <texto>");
		return;
	}

	const member = message.member;
	if (!member) {
		await message.reply("Este comando solo funciona dentro de un servidor.");
		return;
	}

	const isAdmin = member.roles.cache.some(
		(role) => role.name.toLowerCase() === "admin",
	);
	if (!isAdmin) {
		await message.reply(
			"No tienes permiso para usar este comando. Solo ADMIN puede ejecutar !say.",
		);
		return;
	}

	const channel = message.channel;
	if (!channel.isTextBased() || typeof (channel as any).send !== "function") {
		await message.reply("No puedo publicar ese mensaje en este canal.");
		return;
	}

	await (channel as any).send(args);
}
