const DIAS = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
];

const MESES = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
];

export function formatearFechaLegible(yyyymmdd: string): string {
	const [year, month, day] = yyyymmdd.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	return `${DIAS[date.getDay()]} ${day} de ${MESES[month - 1]}`;
}

export const obtenerYYYYMMDDPeru = () => {
	const hoursToSubtract = 5;

	const date = new Date();

	date.setUTCHours(date.getUTCHours() - hoursToSubtract);

	const formattedDate = date.toISOString().split("T")[0];

	return formattedDate;
};
