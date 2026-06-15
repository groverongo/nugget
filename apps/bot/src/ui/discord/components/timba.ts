import type {
	VerTimbasCerradasPorPartidoRow,
	VerTimbasPorPartidoRow,
} from "@sqlc/timba_sql";
import type { APIMessageTopLevelComponent } from "discord.js";
import {
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";
import type {
	AceptarTimbaResult,
	CrearTimbaResult,
} from "../../../interface/service/timba.service";

export const TIMBA_ACEPTAR_PREFIX = "timba:aceptar:";
export const TIMBA_RESOLVER_J1_PREFIX = "timba:resolver:j1:";
export const TIMBA_RESOLVER_J2_PREFIX = "timba:resolver:j2:";

function puntosStr(puntos: number): string {
	return `${puntos} ${puntos === 1 ? "punto" : "puntos"}`;
}

export function buildTimbaCreacionComponent(
	result: CrearTimbaResult,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addSectionComponents(
		new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					[
						`🎰 **Timba Time** — <@${result.jugador1Id}>`,
						`*${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}*`,
						`💠 **${puntosStr(result.puntos)}** en juego a: _"${result.descripcion}"_`,
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
	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}

export function buildTimbaAceptadaComponent(
	result: AceptarTimbaResult,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			[
				`🎰 **Timba Time** — <@${result.jugador1Id}> vs <@${result.jugador2Id}>`,
				`*${result.equipoLocalSiglas} ${result.equipoLocalBandera} vs. ${result.equipoVisitanteSiglas} ${result.equipoVisitanteBandera}*`,
				`💠 **${puntosStr(result.puntos)}** en juego a: _"${result.descripcion}"_`,
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
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`**#${timba.id}** — **${timba.puntos} 💠** — _"${timba.descripcion}"_`,
			),
		);
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`<@${timba.jugador1Id}> (${timba.jugador1Nombre})`,
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
						`<@${timba.jugador2Id}> (${timba.jugador2Nombre})`,
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
			timba.estado === "abierta" ? "🟡 Abierta" : "🔒 Cerrada";
		const j2Line = timba.jugador2Id
			? `<@${timba.jugador2Id}> (${timba.jugador2Nombre})`
			: "_Sin aceptar_";

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				[
					`**#${timba.id}** — ${estadoBadge}`,
					`💠 **${puntosStr(timba.puntos)}** en juego a: _"${timba.descripcion}"_`,
					`<@${timba.jugador1Id}> (${timba.jugador1Nombre}) 🆚 ${j2Line}`,
				].join("\n"),
			),
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: components v2 type mismatch
	return [container.toJSON() as any];
}
