import type {
	VerMisTimbasPorFechaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasMedioTiempoPorPartidoRow,
	VerTimbasPorPartidoRow,
} from "@sqlc/timba_sql";
import type { APIMessageTopLevelComponent } from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
} from "discord.js";
import type {
	AceptarTimbaResult,
	CrearContraofertaResult,
	CrearTimbaResult,
} from "../../../interface/service/timba.service";
import { fechaADiscordTimestamp } from "../utils/fecha";
import {
	buildFechaPaginationRow,
	paginarFechas,
} from "../utils/fecha-pagination";

export const TIMBA_ACEPTAR_PREFIX = "timba:aceptar:";
export const TIMBA_ACEPTAR_CONFIRMAR_PREFIX = "timba:aceptar:confirmar:";
export const TIMBA_ACEPTAR_CANCELAR_PREFIX = "timba:aceptar:cancelar:";
export const TIMBA_CONTRAOFERTA_PREFIX = "timba:contraoferta:";
export const TIMBA_CONTRAOFERTA_ACEPTAR_PREFIX = "timba:contraoferta:aceptar:";
export const TIMBA_CONTRAOFERTA_RECHAZAR_PREFIX =
	"timba:contraoferta:rechazar:";
export const TIMBA_RESOLVER_J1_PREFIX = "timba:resolver:j1:";
export const TIMBA_RESOLVER_J2_PREFIX = "timba:resolver:j2:";
export const TIMBA_MT_RESOLVER_J1_PREFIX = "timba:mt:resolver:j1:";
export const TIMBA_MT_RESOLVER_J2_PREFIX = "timba:mt:resolver:j2:";
export const TIMBA_MT_REVERTIR_PREFIX = "timba:mt:revertir:";
export const TIMBA_MT_SKIP_PREFIX = "timba:mt:skip:";
export const TIMBA_MT_SIN_PENDIENTES_PREFIX = "timba:mt:sin-pendientes:";
export const TIMBA_ANULAR_PREFIX = "timba:anular:";
export const MIS_TIMBAS_DATE_SELECT_CUSTOM_ID = "mis-timbas:date-select";
export const MIS_TIMBAS_DATE_PAGE_PREFIX = "mis-timbas:date-page:";

export const TIMBA_ANULAR_VOTO_EMOJI = "🪤";
export const TIMBA_ANULAR_VOTO_DIVISOR = 5;

function puntosStr(puntos: number): string {
	return `${puntos} ${puntos === 1 ? "punto" : "puntos"}`;
}

export function buildTimbaCreacionComponent(
	result: CrearTimbaResult,
): APIMessageTopLevelComponent[] {
	const simetrico = result.puntosPropuestos === result.puntosArriesgados;
	const puntosLine = simetrico
		? `💠 **${puntosStr(result.puntosPropuestos)}** en juego a: _"${result.descripcion}"_`
		: [
				`💠 Aposté **${puntosStr(result.puntosPropuestos)}** — el retador debe arriesgar **${puntosStr(result.puntosArriesgados)}**`,
				`_"${result.descripcion}"_`,
			].join("\n");

	const container = new ContainerBuilder().addSectionComponents(
		new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					[
						`🎰 **Timba Time** — <@${result.jugador1Id}>`,
						`*${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}*`,
						puntosLine,
					].join("\n"),
				),
			)
			.setButtonAccessory(
				new ButtonBuilder()
					.setCustomId(`${TIMBA_ACEPTAR_PREFIX}${result.timbaId}`)
					.setLabel("Aceptar reto")
					.setStyle(ButtonStyle.Success),
			),
	);
	container.addSectionComponents(
		new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					"¿Quieres proponer condiciones distintas?",
				),
			)
			.setButtonAccessory(
				new ButtonBuilder()
					.setCustomId(`${TIMBA_CONTRAOFERTA_PREFIX}${result.timbaId}`)
					.setLabel("Contraoferta 🔄")
					.setStyle(ButtonStyle.Secondary),
			),
	);
	container.addSectionComponents(
		new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("¿Ya no quieres esta timba?"),
			)
			.setButtonAccessory(
				new ButtonBuilder()
					.setCustomId(`${TIMBA_ANULAR_PREFIX}${result.timbaId}`)
					.setLabel("Cancelar 🚫")
					.setStyle(ButtonStyle.Danger),
			),
	);
	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildTimbaAceptarConfirmacionContent(timba: VerTimbaRow): {
	content: string;
	components: ActionRowBuilder<ButtonBuilder>[];
} {
	const simetrico = timba.puntosPropuestos === timba.puntosArriesgados;
	const puntosLine = simetrico
		? `**${puntosStr(timba.puntosArriesgados)}**`
		: `**${puntosStr(timba.puntosArriesgados)}** (${timba.jugador_1Nombre} arriesga ${puntosStr(timba.puntosPropuestos)})`;

	return {
		content: [
			`🎰 ¿Confirmas aceptar el reto de **${timba.jugador_1Nombre}**?`,
			`*${timba.equipoLocalSiglas} ${timba.equipoLocalBandera} vs. ${timba.equipoVisitanteSiglas} ${timba.equipoVisitanteBandera}* — _"${timba.descripcion}"_`,
			`💠 Arriesgas ${puntosLine}`,
		].join("\n"),
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${TIMBA_ACEPTAR_CONFIRMAR_PREFIX}${timba.id}`)
					.setLabel("Sí, confirmar ✅")
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(`${TIMBA_ACEPTAR_CANCELAR_PREFIX}${timba.id}`)
					.setLabel("Cancelar")
					.setStyle(ButtonStyle.Secondary),
			),
		],
	};
}

export function buildContraofertaComponent(
	result: CrearContraofertaResult,
	timbaOriginalJugador1Id: string,
): APIMessageTopLevelComponent[] {
	const simetrico = result.puntosPropuestos === result.puntosArriesgados;
	const puntosLine = simetrico
		? `💠 **${puntosStr(result.puntosPropuestos)}** en juego a: _"${result.descripcion}"_`
		: `💠 Propone **${puntosStr(result.puntosPropuestos)}** — el retador (<@${timbaOriginalJugador1Id}>) debe arriesgar **${puntosStr(result.puntosArriesgados)}** a: _"${result.descripcion}"_`;

	const container = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				[
					`🔄 **Contraoferta** de <@${result.jugador1Id}> para <@${timbaOriginalJugador1Id}>`,
					`*${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}*`,
					puntosLine,
				].join("\n"),
			),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`<@${timbaOriginalJugador1Id}>, ¿aceptas esta contraoferta?`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${TIMBA_CONTRAOFERTA_ACEPTAR_PREFIX}${result.contraofertaId}`,
						)
						.setLabel("Aceptar ✅")
						.setStyle(ButtonStyle.Success),
				),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent("O puedes rechazarla"),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${TIMBA_CONTRAOFERTA_RECHAZAR_PREFIX}${result.contraofertaId}`,
						)
						.setLabel("Rechazar ❌")
						.setStyle(ButtonStyle.Danger),
				),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						"¿Quieres proponer condiciones distintas?",
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`${TIMBA_CONTRAOFERTA_PREFIX}${result.contraofertaId}`)
						.setLabel("Contraoferta 🔄")
						.setStyle(ButtonStyle.Secondary),
				),
		);
	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildTimbaAceptadaComponent(
	result: AceptarTimbaResult,
): APIMessageTopLevelComponent[] {
	const simetrico = result.puntosPropuestos === result.puntosArriesgados;
	const puntosLine = simetrico
		? `💠 **${puntosStr(result.puntosPropuestos)}** en juego a: _"${result.descripcion}"_`
		: `💠 <@${result.jugador1Id}> arriesga **${puntosStr(result.puntosPropuestos)}** — <@${result.jugador2Id}> arriesga **${puntosStr(result.puntosArriesgados)}** — _"${result.descripcion}"_`;

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			[
				`🎰 **Timba Time** — <@${result.jugador1Id}> vs <@${result.jugador2Id}>`,
				`*${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}*`,
				puntosLine,
				`✅ ¡Aceptada! Pendiente de resolución.`,
			].join("\n"),
		),
	);
	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildTimbaResolucionComponents(
	timbas: VerTimbasCerradasPorPartidoRow[],
	partidoId: number,
): APIMessageTopLevelComponent[] {
	if (timbas.length === 0) return [];

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			"🎲 **Timba Times pendientes de resolución**",
		),
	);

	for (const timba of timbas) {
		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);
		const simetricoRes = timba.puntosPropuestos === timba.puntosArriesgados;
		const puntosResLine = simetricoRes
			? `**${timba.puntosPropuestos} 💠**`
			: `J1 arriesga **${timba.puntosPropuestos} 💠** / J2 arriesga **${timba.puntosArriesgados} 💠**`;
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`**#${timba.id}** — ${puntosResLine} — _"${timba.descripcion}"_`,
			),
		);
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🗡️ <@${timba.jugador_1Id}> (${timba.jugador_1Nombre}) — gana **${timba.puntosArriesgados} 💠**`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`${TIMBA_RESOLVER_J1_PREFIX}${timba.id}:${partidoId}`)
						.setLabel("J1 ganó ✅")
						.setStyle(ButtonStyle.Primary),
				),
		);
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🛡️ <@${timba.jugador_2Id}> (${timba.jugador_2Nombre}) — gana **${timba.puntosPropuestos} 💠**`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`${TIMBA_RESOLVER_J2_PREFIX}${timba.id}:${partidoId}`)
						.setLabel("J2 ganó ✅")
						.setStyle(ButtonStyle.Primary),
				),
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildVerTimbasComponent(
	timbas: VerTimbasPorPartidoRow[],
): APIMessageTopLevelComponent[] {
	if (timbas.length === 0) return [];

	const first = timbas[0];
	const partido = `${first.equipoLocalSiglas} ${first.equipoLocalBandera} vs. ${first.equipoVisitanteSiglas} ${first.equipoVisitanteBandera}`;

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`## 🎰 Timba Times — ${partido}`),
	);

	for (const timba of timbas) {
		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const estadoBadge =
			timba.estado === "abierta"
				? "🟡 Abierta"
				: timba.estado === "contraoferta"
					? "🔄 Contraoferta"
					: "🔒 Cerrada";
		const j2Line = timba.jugador_2Id
			? `<@${timba.jugador_2Id}>`
			: "_Sin aceptar_";

		const puntosLineVer =
			timba.puntosPropuestos === timba.puntosArriesgados
				? `💠 **${puntosStr(timba.puntosPropuestos)}** en juego a: _"${timba.descripcion}"_`
				: `💠 J1 arriesga **${puntosStr(timba.puntosPropuestos)}** / retador arriesga **${puntosStr(timba.puntosArriesgados)}** — _"${timba.descripcion}"_`;
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				[
					estadoBadge,
					puntosLineVer,
					`<@${timba.jugador_1Id}> 🆚 ${j2Line}`,
				].join("\n"),
			),
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

type MiTimbaPorFecha = VerMisTimbasPorFechaRow;

function getMiTimbaEstadoBadge(
	timba: MiTimbaPorFecha,
	usuarioId: string,
): string {
	switch (timba.estado) {
		case "abierta":
			return "🟡 Esperando rival";
		case "cerrada":
			return "🔒 Cerrada — pendiente de resolución";
		case "resuelta":
			return timba.ganadorId === usuarioId ? "🏆 ¡Ganaste!" : "💀 Perdiste";
		case "cancelada":
			return "🚫 Cancelada";
		case "anulada":
			return "🪤 Anulada — puntos congelados hasta que finalice el partido";
		default:
			return "";
	}
}

function formatMiTimbaLine(timba: MiTimbaPorFecha, usuarioId: string): string {
	const esJugador1 = timba.jugador_1Id === usuarioId;
	const oponenteNombre = esJugador1
		? timba.jugador_2Nombre || "Sin aceptar"
		: timba.jugador_1Nombre;
	const fechaPartido = timba.fechaPartido
		? `<t:${Math.floor(timba.fechaPartido.getTime() / 1_000)}:t>`
		: "Hora pendiente";

	return [
		`### ${timba.equipoLocalNombre} ${timba.equipoLocalBandera} vs. ${timba.equipoVisitanteNombre} ${timba.equipoVisitanteBandera}`,
		timba.puntosPropuestos === timba.puntosArriesgados
			? `**${timba.puntosPropuestos} 💠** en juego a: _"${timba.descripcion}"_`
			: `J1 arriesga **${timba.puntosPropuestos} 💠** / J2 arriesga **${timba.puntosArriesgados} 💠** — _"${timba.descripcion}"_`,
		`Rival: ${oponenteNombre}`,
		getMiTimbaEstadoBadge(timba, usuarioId),
		fechaPartido,
	].join("\n");
}

export function buildMisTimbasComponents(
	date: string,
	usuarioId: string,
	timbas: MiTimbaPorFecha[],
	fechas: string[],
	pageOffset = 0,
): APIMessageTopLevelComponent[] {
	const titulo = `## Mis Timba Times del <t:${fechaADiscordTimestamp(date)}:D>`;

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(titulo),
	);

	if (timbas.length === 0) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`No tienes timba times para el <t:${fechaADiscordTimestamp(date)}:D>.`,
			),
		);
	} else {
		for (const timba of timbas) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					formatMiTimbaLine(timba, usuarioId),
				),
			);
			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);
		}
	}

	const { visibles, page, totalPages } = paginarFechas(fechas, pageOffset);

	container.addActionRowComponents((actionRow) =>
		actionRow.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(MIS_TIMBAS_DATE_SELECT_CUSTOM_ID)
				.setPlaceholder("Selecciona otra fecha")
				.addOptions(
					visibles.map((optionDate) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(optionDate)
							.setValue(optionDate)
							.setDefault(optionDate === date),
					),
				),
		),
	);

	const paginationRow = buildFechaPaginationRow(
		`${MIS_TIMBAS_DATE_PAGE_PREFIX}${date}:`,
		page,
		totalPages,
	);
	if (paginationRow) container.addActionRowComponents(paginationRow);
	return [container.toJSON()];
}

export function buildTimbaResolucionMedioTiempoComponents(
	timbas: VerTimbasMedioTiempoPorPartidoRow[],
	partidoId: number,
	skippedIds: number[] = [],
): APIMessageTopLevelComponent[] {
	const visible = timbas.filter((t) => !skippedIds.includes(t.id)).slice(0, 3);
	if (visible.length === 0) return [];

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			"⏸️ **Timba Times — Revisión de Medio Tiempo**",
		),
	);

	for (const timba of visible) {
		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);
		const simetricoMt = timba.puntosPropuestos === timba.puntosArriesgados;
		const puntosMtLine = simetricoMt
			? `**${timba.puntosPropuestos} 💠**`
			: `J1 arriesga **${timba.puntosPropuestos} 💠** / J2 arriesga **${timba.puntosArriesgados} 💠**`;
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`**#${timba.id}** — ${puntosMtLine} — _"${timba.descripcion}"_${timba.estado === "resuelta" ? ` ✅ Ganador actual: <@${timba.ganadorId}> (${timba.ganadorNombre})` : ""}`,
			),
		);
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🗡️ <@${timba.jugador_1Id}> (${timba.jugador_1Nombre}) — gana **${timba.puntosArriesgados} 💠**`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${TIMBA_MT_RESOLVER_J1_PREFIX}${timba.id}:${partidoId}`,
						)
						.setLabel("J1 ganó ✅")
						.setStyle(ButtonStyle.Primary),
				),
		);
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🛡️ <@${timba.jugador_2Id}> (${timba.jugador_2Nombre}) — gana **${timba.puntosPropuestos} 💠**`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(
							`${TIMBA_MT_RESOLVER_J2_PREFIX}${timba.id}:${partidoId}`,
						)
						.setLabel("J2 ganó ✅")
						.setStyle(ButtonStyle.Primary),
				),
		);
		const nextSkipped = [...skippedIds, timba.id].join(",");
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent("Resolver más tarde"),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`${TIMBA_MT_SKIP_PREFIX}${partidoId}:${nextSkipped}`)
						.setLabel("⏭️ Saltar")
						.setStyle(ButtonStyle.Secondary),
				),
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildTimbaSinPendientesComponents(
	partidoId: number,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				"⏸️ **Timba Times — Revisión de Medio Tiempo**",
			),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						"No hay timbas pendientes de resolver para este partido.",
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`${TIMBA_MT_SIN_PENDIENTES_PREFIX}${partidoId}`)
						.setLabel("No hay timbas por resolver aún")
						.setStyle(ButtonStyle.Secondary),
				),
		);

	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}
