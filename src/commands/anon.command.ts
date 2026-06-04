import type { Message } from "discord.js";
import { config } from "../../support/config";

export async function handleAnonCommand(
	message: Message,
	content: string,
): Promise<void> {
	const args = content.trim().split(/\s+/).slice(1).join(" ");
	if (!args) {
		await message.reply("Uso: !anon <mensaje>");
		return;
	}

	const ownerId = config.discord.owner.id;
	if (!ownerId) {
		await message.reply(
			"El ID del propietario del bot no está configurado. Define DISCORD_OWNER_ID o discord.owner.id en config.yaml.",
		);
		return;
	}

	try {
		const owner = await message.client.users.fetch(ownerId);
		await owner.send(`📨 Mensaje anónimo de <@${message.author.id}>:\n${args}`);
		await message.reply("Tu mensaje anónimo ha sido enviado correctamente.");
	} catch (error) {
		await message.reply(
			"No se pudo enviar el mensaje anónimo. Revisa la configuración del bot o el ID del propietario.",
		);
	}
}
