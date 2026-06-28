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

export const AWARDS_KO_BUTTON_FINALISTAS = "awards-ko:finalistas";
export const AWARDS_KO_BUTTON_MEJOR_PARTIDO = "awards-ko:mejor-partido";
export const AWARDS_KO_BUTTON_SUPLEMENTARIOS = "awards-ko:suplementarios";
export const AWARDS_KO_BUTTON_GOLEADOR = "awards-ko:goleador";

export interface AwardsKODisplay {
	finalista1: string | null;
	finalista2: string | null;
	campeon: string | null;
	mejorPartidoEquipo1: string | null;
	mejorPartidoEquipo2: string | null;
	mejorPartidoMasGoles: string | null;
	numSuplementarios: number | null;
	goleador: string | null;
}

function seccionFinalistas(d: AwardsKODisplay): string {
	if (!d.finalista1 && !d.finalista2 && !d.campeon) {
		return "_Sin registrar_";
	}
	const lineas: string[] = [];
	if (d.finalista1) lineas.push(`Finalista 1: **${d.finalista1}**`);
	if (d.finalista2) lineas.push(`Finalista 2: **${d.finalista2}**`);
	if (d.campeon) lineas.push(`Campeón: **${d.campeon}**`);
	return lineas.join("\n");
}

function seccionMejorPartido(d: AwardsKODisplay): string {
	if (!d.mejorPartidoEquipo1 && !d.mejorPartidoEquipo2) {
		return "_Sin registrar_";
	}
	const lineas: string[] = [];
	if (d.mejorPartidoEquipo1)
		lineas.push(`Equipo 1: **${d.mejorPartidoEquipo1}**`);
	if (d.mejorPartidoEquipo2)
		lineas.push(`Equipo 2: **${d.mejorPartidoEquipo2}**`);
	const masGoles = d.mejorPartidoMasGoles ?? "Empate";
	lineas.push(`Más goles: **${masGoles}**`);
	return lineas.join("\n");
}

function seccionSupplementarios(d: AwardsKODisplay): string {
	if (d.numSuplementarios === null) return "_Sin registrar_";
	return `Cantidad: **${d.numSuplementarios}**`;
}

function seccionGoleador(d: AwardsKODisplay): string {
	if (!d.goleador) return "_Sin registrar_";
	return `Jugador: **${d.goleador}**`;
}

export function buildAwardsKOComponents(
	display: AwardsKODisplay,
): APIMessageTopLevelComponent[] {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			"## Awards Eliminatorias ⚽\n-# Cierre: domingo 29/06 a las 2pm",
		),
	);

	container
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### 🥈 Finalistas\n${seccionFinalistas(display)}`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(AWARDS_KO_BUTTON_FINALISTAS)
						.setLabel(display.finalista1 ? "Editar" : "Registrar")
						.setStyle(
							display.finalista1 ? ButtonStyle.Secondary : ButtonStyle.Primary,
						),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### ⚽ Mejor Partido\n${seccionMejorPartido(display)}`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(AWARDS_KO_BUTTON_MEJOR_PARTIDO)
						.setLabel(display.mejorPartidoEquipo1 ? "Editar" : "Registrar")
						.setStyle(
							display.mejorPartidoEquipo1
								? ButtonStyle.Secondary
								: ButtonStyle.Primary,
						),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### 🔁 Suplementarios\n${seccionSupplementarios(display)}`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(AWARDS_KO_BUTTON_SUPLEMENTARIOS)
						.setLabel(
							display.numSuplementarios !== null ? "Editar" : "Registrar",
						)
						.setStyle(
							display.numSuplementarios !== null
								? ButtonStyle.Secondary
								: ButtonStyle.Primary,
						),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### 👟 Goleador KO\n${seccionGoleador(display)}`,
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(AWARDS_KO_BUTTON_GOLEADOR)
						.setLabel(display.goleador ? "Editar" : "Registrar")
						.setStyle(
							display.goleador ? ButtonStyle.Secondary : ButtonStyle.Primary,
						),
				),
		);

	return [container.toJSON()];
}
