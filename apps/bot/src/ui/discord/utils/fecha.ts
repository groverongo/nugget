/** Agrega " (ET)" al nombre de un partido si es suplementario */
export function etLabel(partidoOriginalId: number | null | undefined): string {
	return partidoOriginalId != null ? " (ET)" : "";
}

export function fechaADiscordTimestamp(yyyymmdd: string): number {
	return Math.floor(new Date(`${yyyymmdd}T12:00:00Z`).getTime() / 1000);
}

export const obtenerYYYYMMDDPeru = () => {
	const hoursToSubtract = 5;

	const date = new Date();

	date.setUTCHours(date.getUTCHours() - hoursToSubtract);

	const formattedDate = date.toISOString().split("T")[0];

	return formattedDate;
};
