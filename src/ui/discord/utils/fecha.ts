export const obtenerYYYYMMDDPeru = () => {
	const hoursToSubtract = 5;

	const date = new Date();

	date.setUTCHours(date.getUTCHours() - hoursToSubtract);

	const formattedDate = date.toISOString().split("T")[0];

	return formattedDate;
};
