import { logger } from "@support/logger";
import type { GuildMember } from "discord.js";
import type { AppContext } from "../types/app-context";

export async function handleGuildMemberAdd(
	member: GuildMember,
	context: AppContext,
): Promise<void> {
	logger.info(
		{ userId: member.id, username: member.user.username },
		"Nuevo miembro entro al servidor",
	);

	try {
		await context.services.usuarios.createUsuario({
			id: member.id,
			username: member.user.username,
			partidosApostados: 0,
			partidosGanados: 0,
			partidosPerdidos: 0,
			puntos: 0,
			racha: 0,
			winRate: "0.00",
		});
	} catch (error) {
		logger.error(
			{ err: error, userId: member.id },
			"Error creando usuario en DB",
		);
	}
}
