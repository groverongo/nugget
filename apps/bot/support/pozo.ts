import { config } from "./config";

interface Bloque {
	min: number;
	max: number;
	tamano: number;
	premio: number;
}

interface PremioResultado {
	listaPremios: Array<{ min: number; max: number; premio: number }>;
	comisionOrg: number;
}

// Estructura de la tabla: 4 puestos individuales arriba,
// luego bloques de 2, de 3 y de 4, y un descenso de 4 puestos con S/0.
const PUESTOS_INDIVIDUALES = 4;
const TAMANO_DESCENSO = 4;
const TAMANO_BLOQUE_MAXIMO = 4;

// Decaimiento geométrico: cada bloque recibe ~70% del anterior (por persona).
// Es lo que produce la curva 1000 / 590 / 345 / 240 / 170... de la tabla original.
const RATIO_DECAIMIENTO = 0.7;

/**
 * Construye la lista de tamaños de bloque para N participantes:
 * [1,1,1,1, 2..., 3..., 4..., 4(descenso)]
 * Busca cuántos bloques de 2 (c2) y de 3 (c3) usar para que el resto
 * sea divisible entre 4, prefiriendo que existan ambos tamaños (gradualidad).
 */
function construirTamanos(N: number): number[] {
	const restante = N - PUESTOS_INDIVIDUALES - TAMANO_DESCENSO;
	if (restante < 0) {
		throw new Error(
			`N=${N} es demasiado pequeño para esta estructura (mínimo ${PUESTOS_INDIVIDUALES + TAMANO_DESCENSO}).`,
		);
	}

	let mejor: {
		c2: number;
		c3: number;
		c4: number;
		score: number;
		suma: number;
	} | null = null;

	for (let c2 = 3; c2 >= 0; c2--) {
		for (let c3 = 3; c3 >= 0; c3--) {
			const sobra = restante - 2 * c2 - 3 * c3;
			if (sobra < 0 || sobra % TAMANO_BLOQUE_MAXIMO !== 0) continue;

			const candidato = {
				c2,
				c3,
				c4: sobra / TAMANO_BLOQUE_MAXIMO,
				// Preferir estructuras que incluyan bloques de 2 Y de 3
				score: (c2 >= 1 ? 1 : 0) + (c3 >= 1 ? 1 : 0),
				suma: c2 + c3,
			};

			if (
				!mejor ||
				candidato.score > mejor.score ||
				(candidato.score === mejor.score && candidato.suma > mejor.suma)
			) {
				mejor = candidato;
			}
		}
	}

	if (!mejor) {
		throw new Error(
			`No se pudo construir la estructura de bloques para N=${N}.`,
		);
	}

	const tamanos: number[] = [];
	for (let i = 0; i < PUESTOS_INDIVIDUALES; i++) tamanos.push(1);
	for (let i = 0; i < mejor.c2; i++) tamanos.push(2);
	for (let i = 0; i < mejor.c3; i++) tamanos.push(3);
	for (let i = 0; i < mejor.c4; i++) tamanos.push(4);
	tamanos.push(TAMANO_DESCENSO); // Zona de descenso (S/0)
	return tamanos;
}

export function generarPremiosPolla(
	N: number,
	costoEntrada: number = config.polla.costo_entrada,
): PremioResultado {
	const pozoTotal = N * costoEntrada;
	let comisionOrg = Math.floor(pozoTotal * config.polla.fraccion_comision_org);
	const pozoARepartir = pozoTotal - comisionOrg;

	// 1. Construir bloques a partir de la estructura de tamaños
	const tamanos = construirTamanos(N);
	const bloques: Bloque[] = [];
	let puesto = 1;
	for (const t of tamanos) {
		bloques.push({ min: puesto, max: puesto + t - 1, tamano: t, premio: 0 });
		puesto += t;
	}

	// 2. Campeón: 25% del pozo TOTAL
	const premioCampeon = Math.floor(
		pozoTotal * config.polla.fraccion_extra_campeon,
	);
	bloques[0].premio = premioCampeon;
	const pozoRestante = pozoARepartir - premioCampeon;

	// 3. Bloques medios: del 2° lugar hasta antes del descenso
	const medios = bloques.slice(1, -1);

	// Pesos geométricos: peso del bloque = tamaño * ratio^i
	let sumaPesos = 0;
	for (let i = 0; i < medios.length; i++) {
		sumaPesos += medios[i].tamano * RATIO_DECAIMIENTO ** i;
	}

	// Premio individual ideal, redondeado a múltiplos de S/5 (mínimo S/5)
	for (let i = 0; i < medios.length; i++) {
		const porPersona = (pozoRestante * RATIO_DECAIMIENTO ** i) / sumaPesos;
		medios[i].premio = Math.max(5, Math.round(porPersona / 5) * 5);
	}

	// 4. Garantizar orden estrictamente decreciente (mínimo S/5 de diferencia)
	for (let i = medios.length - 2; i >= 0; i--) {
		if (medios[i].premio <= medios[i + 1].premio) {
			medios[i].premio = medios[i + 1].premio + 5;
		}
	}

	// 5. Cuadrar el residuo del redondeo sobre los puestos individuales (2°, 3°, 4°)
	const individuales = medios.filter((b) => b.tamano === 1);
	const costoActual = () => medios.reduce((s, b) => s + b.premio * b.tamano, 0);

	let diff = pozoRestante - costoActual();
	let idx = 0;

	// Sobró dinero: repartirlo de a S/5 entre 2°, 3°, 4°
	while (diff >= 5 && individuales.length > 0) {
		individuales[idx % individuales.length].premio += 5;
		diff -= 5;
		idx++;
	}

	// Faltó dinero (los redondeos se pasaron): quitar de a S/5 sin romper el orden
	idx = 0;
	let intentos = 0;
	while (diff <= -5 && individuales.length > 0 && intentos < 1000) {
		const b = individuales[idx % individuales.length];
		const posicion = medios.indexOf(b);
		const siguiente = medios[posicion + 1];
		if (b.premio - 5 > (siguiente ? siguiente.premio : 0)) {
			b.premio -= 5;
			diff += 5;
		}
		idx++;
		intentos++;
	}

	// Re-garantizar 2° > 3° > 4° tras el ajuste
	for (let i = individuales.length - 2; i >= 0; i--) {
		if (individuales[i].premio <= individuales[i + 1].premio) {
			individuales[i].premio = individuales[i + 1].premio + 5;
		}
	}

	// El residuo final (< S/5, no repartible en múltiplos de 5) va a la comisión
	diff = pozoRestante - costoActual();
	if (diff > 0) comisionOrg += diff;

	// 6. Formato final
	return {
		listaPremios: bloques.map((b) => ({
			min: b.min,
			max: b.max,
			premio: b.premio,
		})),
		comisionOrg,
	};
}
