import {
	handlePartidosButtonInteraction,
	handlePrediccionModalSubmitInteraction,
} from "../src/ui/discord/handlers/interactions";

type PartidosServiceMock = {
	verInformacionPartido: jest.Mock;
};

type PrediccionesServiceMock = {
	agregarPrediccion: jest.Mock;
};

type DiscordAppContextMock = {
	services: {
		partidos: PartidosServiceMock;
		predicciones: PrediccionesServiceMock;
	};
};

function createPartidoDetalle(partidoId = 42) {
	return {
		partidoId,
		equipoLocalNombre: "Peru",
		equipoVisitanteNombre: "Brasil",
		equipoLocalGrupo: "A",
		equipoVisitanteGrupo: "B",
		estado: "pendiente",
		partidoGolesLocal: null,
		partidoGolesVisitante: null,
		fechaPartido: new Date("2026-06-06T10:00:00.000Z"),
	};
}

describe("Discord interaction handlers", () => {
	it("shows a prediction modal when the Ver button references an existing partido", async () => {
		const showModal = jest.fn().mockResolvedValue(undefined);
		const interaction = {
			customId: "partidos:pick:42",
			showModal,
			reply: jest.fn(),
		} as const;
		const appContext = {
			services: {
				partidos: {
					verInformacionPartido: jest
						.fn()
						.mockResolvedValue(createPartidoDetalle()),
				},
				predicciones: {
					agregarPrediccion: jest.fn(),
				},
			},
		} satisfies DiscordAppContextMock;

		await handlePartidosButtonInteraction(
			interaction as unknown as Parameters<
				typeof handlePartidosButtonInteraction
			>[0],
			appContext as unknown as Parameters<
				typeof handlePartidosButtonInteraction
			>[1],
		);

		expect(
			appContext.services.partidos.verInformacionPartido,
		).toHaveBeenCalledWith({
			id: 42,
		});
		expect(showModal).toHaveBeenCalledTimes(1);
		const modal = showModal.mock.calls[0][0];
		expect(modal.toJSON().custom_id).toBe("prediccion:create:42");
		expect(modal.toJSON().components[0].components[0].label).toContain(
			"Goles de Peru",
		);
	});

	it("replies with validation error when modal scores are invalid", async () => {
		const reply = jest.fn().mockResolvedValue(undefined);
		const interaction = {
			customId: "prediccion:create:42",
			fields: {
				getTextInputValue: jest.fn((fieldId: string) =>
					fieldId === "goles-local" ? "abc" : "1",
				),
			},
			reply,
			deferReply: jest.fn(),
			editReply: jest.fn(),
			user: { id: "discord-user-1", displayName: "Juan" },
		} as const;
		const appContext = {
			services: {
				partidos: {
					verInformacionPartido: jest.fn(),
				},
				predicciones: {
					agregarPrediccion: jest.fn(),
				},
			},
		} satisfies DiscordAppContextMock;

		await handlePrediccionModalSubmitInteraction(
			interaction as unknown as Parameters<
				typeof handlePrediccionModalSubmitInteraction
			>[0],
			appContext as unknown as Parameters<
				typeof handlePrediccionModalSubmitInteraction
			>[1],
		);

		expect(reply).toHaveBeenCalledWith({
			content: "Juan es un webonaso, puso mal el resultado",
		});
		expect(
			appContext.services.predicciones.agregarPrediccion,
		).not.toHaveBeenCalled();
	});

	it("submits a valid prediction with the Discord user id and partido description", async () => {
		const deferReply = jest.fn().mockResolvedValue(undefined);
		const editReply = jest.fn().mockResolvedValue(undefined);
		const interaction = {
			customId: "prediccion:create:42",
			fields: {
				getTextInputValue: jest.fn((fieldId: string) =>
					fieldId === "goles-local" ? "2" : "1",
				),
			},
			deferReply,
			editReply,
			reply: jest.fn(),
			user: { id: "discord-user-1" },
		} as const;
		const appContext = {
			services: {
				partidos: {
					verInformacionPartido: jest
						.fn()
						.mockResolvedValue(createPartidoDetalle()),
				},
				predicciones: {
					agregarPrediccion: jest.fn().mockResolvedValue(undefined),
				},
			},
		} satisfies DiscordAppContextMock;

		await handlePrediccionModalSubmitInteraction(
			interaction as unknown as Parameters<
				typeof handlePrediccionModalSubmitInteraction
			>[0],
			appContext as unknown as Parameters<
				typeof handlePrediccionModalSubmitInteraction
			>[1],
		);

		expect(deferReply).toHaveBeenCalledWith({ ephemeral: true });
		expect(
			appContext.services.partidos.verInformacionPartido,
		).toHaveBeenCalledWith({ id: 42 });
		expect(
			appContext.services.predicciones.agregarPrediccion,
		).toHaveBeenCalledWith({
			usuarioId: "discord-user-1",
			partidoId: 42,
			golesLocal: 2,
			golesVisitante: 1,
		});
		expect(editReply).toHaveBeenCalledWith(
			"Predicción registrada para Peru vs Brasil: 2-1.",
		);
	});
});
