import { config } from "./config";

interface Bloque {
	min: number;
	max: number;
	tamano: number;
	premio: number;
	peso?: number; // Opcional porque solo se usa en el paso 2 y 3
}

interface PremioResultado {
	listaPremios: Array<{ min: number; max: number; premio: number }>;
	comisionOrg: number;
}

export function generarPremiosPolla(
	N: number,
	costoEntrada: number = config.polla.costo_entrada,
): PremioResultado {
	const pozoTotal = N * costoEntrada;
	const comisionOrg = Math.floor(
		pozoTotal * config.polla.fraccion_comision_org,
	);
	const pozoARepartir = pozoTotal - comisionOrg;

	// Tamaño máximo de bloque permitido (N/10)
	const bMax = Math.max(1, Math.floor(N / config.polla.factor_bloque_maximo));

	const bloques: Bloque[] = [];
	let puestoActual = 1;
	let tamanoBloque = 1;

	// 1. Construir la estructura de bloques graduales
	while (puestoActual <= N - bMax) {
		let finBloque = puestoActual + tamanoBloque - 1;

		if (finBloque > N - bMax) {
			finBloque = N - bMax;
		}

		bloques.push({
			min: puestoActual,
			max: finBloque,
			tamano: finBloque - puestoActual + 1,
			premio: 0,
		});

		puestoActual = finBloque + 1;

		if (tamanoBloque < bMax) {
			tamanoBloque += 1;
		}
	}

	// Añadir el bloque de Descenso (Últimos N/10 puestos a S/0)
	bloques.push({
		min: N - bMax + 1,
		max: N,
		tamano: bMax,
		premio: 0,
	});

	// 2. Asignar el 25% del pozo TOTAL al primer puesto
	const premioPrimerPuesto = Math.floor(
		pozoTotal * config.polla.fraccion_extra_campeon,
	);
	bloques[0].premio = premioPrimerPuesto;

	const pozoRestante = pozoARepartir - premioPrimerPuesto;

	// Calcular pesos invertidos para el bloque medio
	let sumaPesos = 0;
	const cantBloquesMedio = bloques.length - 2;

	for (let i = 1; i < bloques.length - 1; i++) {
		bloques[i].peso = (cantBloquesMedio - i + 1) * bloques[i].tamano;
		sumaPesos += bloques[i].peso ?? 0;
	}

	// 3. Distribuir el dinero restante y redondear a múltiplos de S/5
	for (let i = 1; i < bloques.length - 1; i++) {
		const peso = bloques[i].peso ?? 0;
		const porcentajeBloque = sumaPesos === 0 ? 0 : peso / sumaPesos;
		const dineroTotalBloque = pozoRestante * porcentajeBloque;
		const premioIndividual = dineroTotalBloque / bloques[i].tamano;
		bloques[i].premio = Math.floor(5 * Math.round(premioIndividual / 5));
	}

	// 4. Limpieza final para retornar la lista formateada
	const listaFinal = bloques.map((b) => ({
		min: b.min,
		max: b.max,
		premio: b.premio,
	}));

	return {
		listaPremios: listaFinal,
		comisionOrg: comisionOrg,
	};
}
