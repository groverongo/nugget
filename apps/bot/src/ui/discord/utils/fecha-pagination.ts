import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const FECHAS_PAGE_SIZE = 25;

export function paginarFechas(
	fechas: string[],
	pageOffset: number,
): { visibles: string[]; page: number; totalPages: number } {
	const fechasDesc = fechas.slice().reverse();
	const totalPages = Math.max(
		1,
		Math.ceil(fechasDesc.length / FECHAS_PAGE_SIZE),
	);
	const page = Math.min(Math.max(pageOffset, 0), totalPages - 1);
	const visibles = fechasDesc.slice(
		page * FECHAS_PAGE_SIZE,
		(page + 1) * FECHAS_PAGE_SIZE,
	);
	return { visibles, page, totalPages };
}

/** customIdPrefix debe terminar en ":" - se le agrega el numero de pagina destino */
export function buildFechaPaginationRow(
	customIdPrefix: string,
	page: number,
	totalPages: number,
): ActionRowBuilder<ButtonBuilder> | null {
	if (totalPages <= 1) return null;

	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`${customIdPrefix}${page + 1}`)
			.setLabel("◀️ Fechas más antiguas")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page + 1 >= totalPages),
		new ButtonBuilder()
			.setCustomId(`${customIdPrefix}${page - 1}`)
			.setLabel("Fechas más recientes ▶️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page <= 0),
	);
}
