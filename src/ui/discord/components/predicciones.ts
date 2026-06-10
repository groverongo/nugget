import type { APIMessageTopLevelComponent } from "discord.js";
import {
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
import type { PrediccionesService } from "../../../service/predicciones.service";
import { PARTIDOS_BUTTON_CUSTOM_ID_PREFIX } from "./partidos";

export const PREDICCIONES_DATE_SELECT_CUSTOM_ID = "predicciones:date-select";

type MisPrediccionesPorFecha = Awaited<
	ReturnType<PrediccionesService["verMisPredicciones"]>
>;
type MiPrediccionPorFecha = MisPrediccionesPorFecha[number];

function formatMarcadorReal(prediccion: MiPrediccionPorFecha): string {
	if (
		prediccion.partidoGolesLocal === null ||
		prediccion.partidoGolesVisitante === null
	) {
		return "Sin resultado final";
	}

	return `Resultado: ${prediccion.partidoGolesLocal}-${prediccion.partidoGolesVisitante}`;
}

function formatPrediccionLine(prediccion: MiPrediccionPorFecha): string {
	const fechaPartido = prediccion.fechaPartido
		? `<t:${prediccion.fechaPartido.getTime() / 1_000}:t>`
		: "Hora pendiente";

	return [
		`### ${prediccion.equipoLocalNombre} vs ${prediccion.equipoVisitanteNombre}`,
		`Mi predicción: ${prediccion.prediccionGolesLocal}-${prediccion.prediccionGolesVisitante}`,
		formatMarcadorReal(prediccion),
		`Estado: ${prediccion.estado}`,
		`Hora Perú: ${fechaPartido}`,
	].join("\n");
}

export function buildMisPrediccionesComponents(
	date: string | null,
	predicciones: MisPrediccionesPorFecha,
	fechas: string[],
): APIMessageTopLevelComponent[] {
	const titulo = date
		? `## Mis predicciones para ${date} (Hora Perú)`
		: "## Todas mis predicciones";

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(titulo),
	);

	if (predicciones.length === 0) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				date
					? `No registraste predicciones para la fecha ${date}.`
					: "No has realizado ninguna predicción.",
			),
		);
	} else {
		for (const prediccion of predicciones) {
			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							formatPrediccionLine(prediccion),
						),
					)
					.setButtonAccessory(
						new ButtonBuilder()
							.setCustomId(
								`${PARTIDOS_BUTTON_CUSTOM_ID_PREFIX}${prediccion.partidoId}`,
							)
							.setLabel("Actualizar")
							.setStyle(ButtonStyle.Primary),
					),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);
		}
	}

	container.addActionRowComponents((actionRow) =>
		actionRow.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(PREDICCIONES_DATE_SELECT_CUSTOM_ID)
				.setPlaceholder("Selecciona otra fecha")
				.addOptions(
					fechas.map((optionDate) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(optionDate)
							.setValue(optionDate)
							.setDefault(optionDate === date),
					),
				),
		),
	);

	return [container.toJSON()];
}
