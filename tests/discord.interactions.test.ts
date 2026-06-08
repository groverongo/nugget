import {
	handlePartidosButtonInteraction,
	handlePrediccionModalSubmitInteraction,
} from "../src/ui/discord/handlers/interactions";

type PartidosRepoMock = {
	obtenerPartido: jest.Mock;
};

type PrediccionesServiceMock = {
	agregarPrediccion: jest.Mock;
};

type DiscordAppContextMock = {
	repositories: {
		partidos: PartidosRepoMock;
	};
	services?: {
		predicciones: PrediccionesServiceMock;
	};
};

describe("Discord interaction handlers", () => {
	it("shows a prediction modal when the Ver button references an existing partido", async () => {
		const showModal = jest.fn().mockResolvedValue(undefined);
		const interaction = {
			customId: "partidos:pick:42",
			showModal,
			reply: jest.fn(),
		} as const;
		const appContext = {
			repositories: {
				partidos: {
					obtenerPartido: jest.fn().mockResolvedValue({ id: 42 }),
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
			appContext.repositories.partidos.obtenerPartido,
		).toHaveBeenCalledWith({
			id: 42,
		});
		expect(showModal).toHaveBeenCalledTimes(1);
		const modal = showModal.mock.calls[0][0];
		expect(modal.toJSON().custom_id).toBe("prediccion:create:42");
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
			user: { id: "discord-user-1" },
		} as const;
		const appContext = {
			repositories: {
				partidos: {
					obtenerPartido: jest.fn(),
				},
			},
			services: {
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
			content: "Ingresa goles válidos usando números enteros entre 0 y 99.",
			ephemeral: true,
		});
		expect(
			appContext.services.predicciones.agregarPrediccion,
		).not.toHaveBeenCalled();
	});

	it("submits a valid prediction with the Discord user id", async () => {
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
			repositories: {
				partidos: {
					obtenerPartido: jest.fn().mockResolvedValue({ id: 42 }),
				},
			},
			services: {
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
			appContext.services.predicciones.agregarPrediccion,
		).toHaveBeenCalledWith({
			usuarioId: "discord-user-1",
			partidoId: 42,
			golesLocal: 2,
			golesVisitante: 1,
		});
		expect(editReply).toHaveBeenCalledWith(
			"Predicción registrada para el partido 42: 2-1.",
		);
	});
});
