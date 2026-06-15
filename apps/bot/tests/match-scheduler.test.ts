import { AttachmentBuilder } from "discord.js";
import * as interactions from "../src/ui/discord/handlers/interactions";
import { enviarEstadisticasPrePartido } from "../src/ui/discord/services/match-scheduler";
import * as utilityClient from "../src/ui/discord/services/utility-client";

jest.mock("../src/ui/discord/handlers/interactions", () => ({
	sendAlertsChannel: jest.fn(),
	sendAlertsChannelWithFiles: jest.fn(),
}));

jest.mock("../src/ui/discord/services/utility-client", () => ({
	generarHeatmapPredicciones: jest.fn(),
}));

function createInfo(partidoId = 42) {
	return {
		partidoId,
		equipoLocalNombre: "Peru",
		equipoLocalBandera: "🇵🇪",
		equipoVisitanteNombre: "Brasil",
		equipoVisitanteBandera: "🇧🇷",
		fechaPartido: new Date("2026-06-06T10:00:00.000Z"),
	};
}

describe("match scheduler pre-partido", () => {
	it("sends alert with heatmap attachment when utility returns png", async () => {
		const sendAlertsChannelWithFiles = jest.mocked(
			interactions.sendAlertsChannelWithFiles,
		);
		const sendAlertsChannel = jest.mocked(interactions.sendAlertsChannel);
		const generarHeatmapPredicciones = jest.mocked(
			utilityClient.generarHeatmapPredicciones,
		);

		generarHeatmapPredicciones.mockResolvedValue(Buffer.from("png-data"));

		const services = {
			partidos: {
				verInformacionPartido: jest.fn().mockResolvedValue(createInfo()),
			},
			predicciones: {
				verPrediccionesPorPartido: jest.fn().mockResolvedValue([
					{ prediccionGolesLocal: 2, prediccionGolesVisitante: 1 },
					{ prediccionGolesLocal: 1, prediccionGolesVisitante: 1 },
				]),
				verParticipantesSinPrediccion: jest.fn().mockResolvedValue([]),
			},
		};
		const client = {};

		const enviado = await enviarEstadisticasPrePartido(
			42,
			services as never,
			client as never,
		);

		expect(enviado).toBe(true);
		expect(generarHeatmapPredicciones).toHaveBeenCalledWith(
			expect.objectContaining({
				partidoId: 42,
				equipoLocalNombre: "Peru",
				equipoVisitanteNombre: "Brasil",
			}),
			expect.arrayContaining([
				expect.objectContaining({
					prediccionGolesLocal: 2,
					prediccionGolesVisitante: 1,
				}),
			]),
		);
		expect(sendAlertsChannelWithFiles).toHaveBeenCalledTimes(1);
		expect(sendAlertsChannel).not.toHaveBeenCalled();
		const [, , files] = sendAlertsChannelWithFiles.mock.calls[0];
		expect(files).toHaveLength(1);
		expect(files[0]).toBeInstanceOf(AttachmentBuilder);
	});

	it("falls back to text-only alert when no heatmap is returned", async () => {
		const sendAlertsChannelWithFiles = jest.mocked(
			interactions.sendAlertsChannelWithFiles,
		);
		const sendAlertsChannel = jest.mocked(interactions.sendAlertsChannel);
		const generarHeatmapPredicciones = jest.mocked(
			utilityClient.generarHeatmapPredicciones,
		);

		generarHeatmapPredicciones.mockResolvedValue(null);

		const services = {
			partidos: {
				verInformacionPartido: jest.fn().mockResolvedValue(createInfo(7)),
			},
			predicciones: {
				verPrediccionesPorPartido: jest.fn().mockResolvedValue([]),
				verParticipantesSinPrediccion: jest.fn().mockResolvedValue([]),
			},
		};
		const client = {};

		const enviado = await enviarEstadisticasPrePartido(
			7,
			services as never,
			client as never,
		);

		expect(enviado).toBe(true);
		expect(sendAlertsChannel).toHaveBeenCalledTimes(1);
		expect(sendAlertsChannelWithFiles).not.toHaveBeenCalled();
	});
});
