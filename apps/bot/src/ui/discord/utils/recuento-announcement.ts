import type { VerAwardsParaRecuentoRow } from "@sqlc/recuento_sql";
import { generarPremiosPolla } from "@support/pozo";
import type { AwardGanadoresGrupo } from "../../../interface/service/awards.service";
import type { DatosRecuento } from "../../../interface/service/recuento.service";

const AWARD_LABELS: Record<string, string> = {
	campeon: "Campeón",
	goleador: "Goleador",
	mejorJugador: "Mejor jugador",
	mejorArquero: "Mejor arquero",
	mejorJugadorJoven: "Mejor jugador joven",
	mejorGol: "Mejor gol",
	seleccionDecepcion: "Selección decepción",
	seleccionSorpresa: "Selección sorpresa",
	finalistasKO: "Finalistas (KO)",
	campeonKO: "Campeón (KO)",
	goleadorKO: "Goleador (KO)",
};

function premioStr(premio: number): string {
	return `S/${premio}`;
}

function getPremioParaPuesto(
	puesto: number,
	listaPremios: { min: number; max: number; premio: number }[],
): number {
	const bloque = listaPremios.find((p) => puesto >= p.min && puesto <= p.max);
	return bloque?.premio ?? 0;
}

/** Arma la(s) linea(s) de un award "comparativo" (decepcion/sorpresa) separando acertados (✅) de descartados (❌) */
function buildSplitAwardLine(
	label: string,
	afectados: VerAwardsParaRecuentoRow[],
	equipoIdDeUsuario: (r: VerAwardsParaRecuentoRow) => number | null,
	equipoGanadorId: number | null,
): string[] {
	if (afectados.length === 0) return [];

	const ganadores = afectados
		.filter((r) => equipoIdDeUsuario(r) === equipoGanadorId)
		.map((r) => `<@${r.usuarioId}>`);
	const perdedores = afectados
		.filter((r) => equipoIdDeUsuario(r) !== equipoGanadorId)
		.map((r) => `<@${r.usuarioId}>`);

	const lineas: string[] = [];
	if (ganadores.length > 0) {
		lineas.push(`- ***${label}:*** ${ganadores.join("/")} ✅ `);
	}
	if (perdedores.length > 0) {
		const prefijo = ganadores.length > 0 ? "" : `- ***${label}:*** `;
		lineas.push(`${prefijo}${perdedores.join("/")} ❌`);
	}
	return lineas;
}

/** Arma la(s) linea(s) de un award KO que solo se revela una vez que hay suficiente info (finalistas/campeon confirmados) */
function buildRevealedAwardLine(
	label: string,
	elegibles: VerAwardsParaRecuentoRow[],
	acerto: (r: VerAwardsParaRecuentoRow) => boolean,
): string[] {
	if (elegibles.length === 0) return [];

	const ganadores = elegibles.filter(acerto).map((r) => `<@${r.usuarioId}>`);
	const perdedores = elegibles
		.filter((r) => !acerto(r))
		.map((r) => `<@${r.usuarioId}>`);

	const lineas: string[] = [];
	if (ganadores.length > 0) {
		lineas.push(`- ***${label}:*** ${ganadores.join("/")} ✅ `);
	}
	if (perdedores.length > 0) {
		const prefijo = ganadores.length > 0 ? "" : `- ***${label}:*** `;
		lineas.push(`${prefijo}${perdedores.join("/")} ❌`);
	}
	return lineas;
}

/** Award ya resuelto vía /resolver-award: reemplaza la heurística de esa categoría puntual por los ganadores confirmados. */
function lineasGanadoresConfirmados(grupo: AwardGanadoresGrupo): string[] {
	const lineas = [`- ***${grupo.etiqueta}:*** ${grupo.resultadoDisplay}`];
	if (grupo.ganadores.length === 0) {
		lineas.push("  _Nadie atinó este award._");
	} else {
		for (const g of grupo.ganadores) {
			lineas.push(`  ✅ <@${g.usuarioId}> +${g.puntos} 💠`);
		}
	}
	return lineas;
}

function buildAwardsSection(
	awards: VerAwardsParaRecuentoRow[],
	eliminadosIds: Set<number>,
	decepcionEquipoGanadorId: number | null,
	sorpresaEquipoGanadorId: number | null,
	finalistaIds: [number, number] | null,
	campeonKOId: number | null,
	awardsGanadores: AwardGanadoresGrupo[],
): string[] {
	if (awards.length === 0 && !awardsGanadores.some((g) => g.resuelto)) {
		return [];
	}

	const grupoPorKey = (key: string) =>
		awardsGanadores.find((g) => g.key === key);
	const hayAlgunAwardResuelto = awardsGanadores.some((g) => g.resuelto);

	if (
		!hayAlgunAwardResuelto &&
		eliminadosIds.size === 0 &&
		finalistaIds === null &&
		campeonKOId === null
	) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	type AwardDef = {
		key: string;
		label: string;
		isEliminated: (r: VerAwardsParaRecuentoRow) => boolean;
	};

	const regularDefs: AwardDef[] = [
		{
			key: "campeon",
			label: AWARD_LABELS.campeon,
			isEliminated: (r) =>
				r.campeonId !== null && eliminadosIds.has(r.campeonId),
		},
		{
			key: "goleador",
			label: AWARD_LABELS.goleador,
			isEliminated: (r) =>
				r.goleadorEquipoId !== null && eliminadosIds.has(r.goleadorEquipoId),
		},
		{
			key: "mejor-jugador",
			label: AWARD_LABELS.mejorJugador,
			isEliminated: (r) =>
				r.mejorJugadorEquipoId !== null &&
				eliminadosIds.has(r.mejorJugadorEquipoId),
		},
		{
			key: "mejor-arquero",
			label: AWARD_LABELS.mejorArquero,
			isEliminated: (r) =>
				r.mejorArqueroEquipoId !== null &&
				eliminadosIds.has(r.mejorArqueroEquipoId),
		},
		{
			key: "mejor-jugador-joven",
			label: AWARD_LABELS.mejorJugadorJoven,
			isEliminated: (r) =>
				r.mejorJugadorJovenEquipoId !== null &&
				eliminadosIds.has(r.mejorJugadorJovenEquipoId),
		},
		{
			key: "mejor-gol",
			label: AWARD_LABELS.mejorGol,
			isEliminated: (r) =>
				r.mejorGolEquipoId !== null && eliminadosIds.has(r.mejorGolEquipoId),
		},
		{
			key: "ko-goleador",
			label: AWARD_LABELS.goleadorKO,
			isEliminated: (r) =>
				r.koGoleadorEquipoId !== null &&
				eliminadosIds.has(r.koGoleadorEquipoId),
		},
	];

	const lineas: string[] = [];
	let hayContenido = false;

	for (const def of regularDefs) {
		const grupo = grupoPorKey(def.key);
		if (grupo?.resuelto) {
			hayContenido = true;
			lineas.push(...lineasGanadoresConfirmados(grupo));
			continue;
		}
		const muertos = awards
			.filter((r) => def.isEliminated(r))
			.map((r) => `<@${r.usuarioId}>`);
		if (muertos.length > 0) {
			hayContenido = true;
			lineas.push(`- ***${def.label}:*** ${muertos.join("/")} ❌`);
		}
	}

	const decepcionGrupo = grupoPorKey("seleccion-decepcion");
	if (decepcionGrupo?.resuelto) {
		hayContenido = true;
		lineas.push(...lineasGanadoresConfirmados(decepcionGrupo));
	} else {
		const decepcionAfectados = awards.filter(
			(r) =>
				r.seleccionDecepcionId !== null &&
				eliminadosIds.has(r.seleccionDecepcionId),
		);
		const decepcionLineas = buildSplitAwardLine(
			AWARD_LABELS.seleccionDecepcion,
			decepcionAfectados,
			(r) => r.seleccionDecepcionId,
			decepcionEquipoGanadorId,
		);
		if (decepcionLineas.length > 0) {
			hayContenido = true;
			lineas.push(...decepcionLineas);
		}
	}

	const sorpresaGrupo = grupoPorKey("seleccion-sorpresa");
	if (sorpresaGrupo?.resuelto) {
		hayContenido = true;
		lineas.push(...lineasGanadoresConfirmados(sorpresaGrupo));
	} else {
		const sorpresaAfectados = awards.filter(
			(r) =>
				r.seleccionSorpresaId !== null &&
				eliminadosIds.has(r.seleccionSorpresaId),
		);
		const sorpresaLineas = buildSplitAwardLine(
			AWARD_LABELS.seleccionSorpresa,
			sorpresaAfectados,
			(r) => r.seleccionSorpresaId,
			sorpresaEquipoGanadorId,
		);
		if (sorpresaLineas.length > 0) {
			hayContenido = true;
			lineas.push(...sorpresaLineas);
		}
	}

	// Finalistas + Campeón (KO): en /resolver-award son un solo award combinado,
	// así que una vez resuelto reemplaza las dos líneas heurísticas de una.
	const finalistasGrupo = grupoPorKey("ko-finalistas");
	if (finalistasGrupo?.resuelto) {
		hayContenido = true;
		lineas.push(...lineasGanadoresConfirmados(finalistasGrupo));
	} else {
		// Mientras no se conozcan los 2 finalistas reales, se descarta
		// progresivamente a quien ya tenga un pick eliminado (ya no puede ganar la categoria).
		// Una vez existe el partido de la final, se resuelve del todo (✅/❌ para todos).
		let finalistasLineas: string[] = [];
		if (finalistaIds !== null) {
			const finalistasSet = new Set(finalistaIds);
			const elegibles = awards.filter(
				(r) => r.koFinalista1Id !== null && r.koFinalista2Id !== null,
			);
			finalistasLineas = buildRevealedAwardLine(
				AWARD_LABELS.finalistasKO,
				elegibles,
				(r) =>
					finalistasSet.has(r.koFinalista1Id as number) &&
					finalistasSet.has(r.koFinalista2Id as number),
			);
		} else {
			const descartados = awards
				.filter(
					(r) =>
						(r.koFinalista1Id !== null &&
							eliminadosIds.has(r.koFinalista1Id)) ||
						(r.koFinalista2Id !== null && eliminadosIds.has(r.koFinalista2Id)),
				)
				.map((r) => `<@${r.usuarioId}>`);
			if (descartados.length > 0) {
				finalistasLineas = [
					`- ***${AWARD_LABELS.finalistasKO}:*** ${descartados.join("/")} ❌`,
				];
			}
		}
		if (finalistasLineas.length > 0) {
			hayContenido = true;
			lineas.push(...finalistasLineas);
		}

		// Campeon (KO): mismo criterio - descarte progresivo antes de que termine la final,
		// resolucion completa (✅/❌) una vez que la final esta finalizada.
		let campeonKOLineas: string[] = [];
		if (campeonKOId !== null) {
			const elegibles = awards.filter((r) => r.koCampeonId !== null);
			campeonKOLineas = buildRevealedAwardLine(
				AWARD_LABELS.campeonKO,
				elegibles,
				(r) => r.koCampeonId === campeonKOId,
			);
		} else {
			const descartados = awards
				.filter(
					(r) => r.koCampeonId !== null && eliminadosIds.has(r.koCampeonId),
				)
				.map((r) => `<@${r.usuarioId}>`);
			if (descartados.length > 0) {
				campeonKOLineas = [
					`- ***${AWARD_LABELS.campeonKO}:*** ${descartados.join("/")} ❌`,
				];
			}
		}
		if (campeonKOLineas.length > 0) {
			hayContenido = true;
			lineas.push(...campeonKOLineas);
		}
	}

	// Awards sin heurística posible (no hay señal de eliminación de equipos que aplique):
	// solo aparecen una vez resueltos formalmente.
	for (const key of ["ko-mejor-partido", "ko-num-suplementarios"]) {
		const grupo = grupoPorKey(key);
		if (grupo?.resuelto) {
			hayContenido = true;
			lineas.push(...lineasGanadoresConfirmados(grupo));
		}
	}

	if (!hayContenido) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	return lineas;
}

export function buildAlertaEliminacion(
	equipo: { nombre: string; bandera: string },
	awards: VerAwardsParaRecuentoRow[],
	equipoId: number,
	decepcionEquipoGanadorId: number | null,
	sorpresaEquipoGanadorId: number | null,
	finalistaIds: [number, number] | null,
	campeonKOId: number | null,
	awardsGanadores: AwardGanadoresGrupo[],
): string {
	const lineas: string[] = [
		`_***${equipo.nombre} ${equipo.bandera}*** fue eliminado_`,
	];

	const afectadas = buildAwardsSection(
		awards,
		new Set([equipoId]),
		decepcionEquipoGanadorId,
		sorpresaEquipoGanadorId,
		finalistaIds,
		campeonKOId,
		awardsGanadores,
	);
	if (
		afectadas.length > 0 &&
		afectadas[0] !== "🏅 🟢 _Todas las **awards** siguen abiertas._"
	) {
		lineas.push(...afectadas);
	}

	return lineas.join("\n");
}

const TABLA_CHUNK_SIZE = 10;

export function buildTabla(datos: DatosRecuento): string[] {
	const { ranking } = datos;
	if (ranking.length === 0) return ["No hay participantes."];

	const { listaPremios } = generarPremiosPolla(ranking.length);
	const entradas: string[] = [];

	ranking.forEach((u, i) => {
		const puesto = i + 1;
		const puestoStr = puesto < 10 ? `#${puesto} ` : `#${puesto}`;
		const rachaStr = u.racha > 0 ? ` 🔥${u.racha}` : "";
		const wr = Number.parseFloat(u.winRate).toFixed(1);
		const premio = getPremioParaPuesto(puesto, listaPremios);
		const premioLabel = premio > 0 ? ` · ${premioStr(premio)}` : " · S/0";

		entradas.push(
			`**${puestoStr}** <@${u.id}>\t**${u.puntos} 💠**${rachaStr} · ${wr}% ⭐ · ${u.partidosApostados} 🎲 (${u.partidosGanados} ✅ / ${u.partidosBuenIntento} ⚡ / ${u.partidosPerdidos} ❌)${premioLabel}`,
		);
	});

	const chunks: string[] = [];
	for (let i = 0; i < entradas.length; i += TABLA_CHUNK_SIZE) {
		const slice = entradas.slice(i, i + TABLA_CHUNK_SIZE);
		if (i === 0) slice.unshift("🏆 ***Tabla de Posiciones***");
		chunks.push(slice.join("\n"));
	}
	return chunks;
}

export function buildRecuento(datos: DatosRecuento): string {
	const {
		titulo,
		partidosFinalizados,
		partidosTotal,
		suplementariosOcurridos,
		suplementariosPosibles,
		exactos,
		totalFinalizados,
		ranking,
		rankingWinRate,
		rankingRacha,
		eliminados,
		awards,
		hitMasGoles,
		decepcionEquipoGanadorId,
		sorpresaEquipoGanadorId,
		finalistaIds,
		campeonKOId,
		awardsGanadores,
	} = datos;

	const pct =
		partidosTotal > 0
			? `${((partidosFinalizados / partidosTotal) * 100).toFixed(1)}%`
			: "0%";
	const suplePct =
		suplementariosPosibles > 0
			? `${((suplementariosOcurridos / suplementariosPosibles) * 100).toFixed(1)}%`
			: "0%";
	const wrPct =
		totalFinalizados > 0
			? `${((exactos / totalFinalizados) * 100).toFixed(1)}%`
			: "0%";

	const eliminadosIds = new Set(eliminados.map((e) => e.id));

	const lineas: string[] = [
		`⚽ 🏆  ***RECUENTO: POLLITA FWC 2026***`,
		`_***${titulo}***_`,
		`_***${partidosFinalizados}/${partidosTotal}*** partidos disputados_ (${pct})`,
		`_***${suplementariosOcurridos}/${suplementariosPosibles}*** suplementarios posibles_ (${suplePct})`,
		`_***Win Rate grupal:*** ${exactos}/${totalFinalizados} atinados_ (${wrPct})`,
	];

	// Eliminados
	if (eliminados.length === 0) {
		lineas.push("_🙅 Ningún equipo eliminado aún._");
	} else {
		const equiposStr = eliminados.map((e) => e.bandera).join(" ");
		lineas.push(`_Equipos eliminados: ${equiposStr}_`);
	}

	// Awards
	const awardsLineas = buildAwardsSection(
		awards,
		eliminadosIds,
		decepcionEquipoGanadorId,
		sorpresaEquipoGanadorId,
		finalistaIds,
		campeonKOId,
		awardsGanadores,
	);
	if (awardsLineas.length > 0) {
		lineas.push("");
		if (eliminados.length > 0) {
			const equiposQueAfectanAward = eliminados.filter((e) =>
				awards.some(
					(r) =>
						(r.campeonId !== null && r.campeonId === e.id) ||
						(r.goleadorEquipoId !== null && r.goleadorEquipoId === e.id) ||
						(r.mejorJugadorEquipoId !== null &&
							r.mejorJugadorEquipoId === e.id) ||
						(r.mejorArqueroEquipoId !== null &&
							r.mejorArqueroEquipoId === e.id) ||
						(r.mejorJugadorJovenEquipoId !== null &&
							r.mejorJugadorJovenEquipoId === e.id) ||
						(r.mejorGolEquipoId !== null && r.mejorGolEquipoId === e.id) ||
						(r.seleccionDecepcionId !== null &&
							r.seleccionDecepcionId === e.id) ||
						(r.seleccionSorpresaId !== null &&
							r.seleccionSorpresaId === e.id) ||
						(r.koFinalista1Id !== null && r.koFinalista1Id === e.id) ||
						(r.koFinalista2Id !== null && r.koFinalista2Id === e.id) ||
						(r.koCampeonId !== null && r.koCampeonId === e.id) ||
						(r.koGoleadorEquipoId !== null && r.koGoleadorEquipoId === e.id),
				),
			);
			if (equiposQueAfectanAward.length > 0) {
				const eliminadosStr = equiposQueAfectanAward
					.map((e) => `**${e.siglas} ${e.bandera}**`)
					.join(" / ");
				lineas.push(
					`_***Awards*** resueltas tras la eliminación de ${eliminadosStr}:_`,
				);
			}
		}
		lineas.push(...awardsLineas);
	}

	// Aura Points ranking top 6
	if (ranking.length > 0) {
		const { listaPremios } = generarPremiosPolla(ranking.length);
		lineas.push("");
		lineas.push("💠 _***Aura Points:***_");
		const top = ranking.slice(0, 6);
		top.forEach((u, i) => {
			const puesto = i + 1;
			const premio = getPremioParaPuesto(puesto, listaPremios);
			const premioLabel = premio > 0 ? ` _(+${premioStr(premio)})_` : "";
			lineas.push(`${puesto}. <@${u.id}> (${u.puntos})${premioLabel}`);
		});
	}

	// Win Rate ranking — top 3 positions (including ties)
	if (rankingWinRate.length > 0) {
		lineas.push("");
		lineas.push("🏅 _**Bonus Récords:**_");
		lineas.push("⭐ _Win Rates:_");
		lineas.push("_Otorga ***+5 💠*** al final de la Polla_");

		let prevWr = "";
		let prevPuesto = 0;
		for (const u of rankingWinRate) {
			const wr = Number.parseFloat(u.winRate).toFixed(2);
			const puesto = wr === prevWr ? prevPuesto : prevPuesto + 1;
			prevPuesto = puesto;
			prevWr = wr;
			if (puesto > 3) break;
			lineas.push(`${puesto}. <@${u.id}> (${wr}%)`);
		}
	}

	// Racha máxima — solo el mejor (con empates)
	if (rankingRacha.length > 0) {
		lineas.push("");
		lineas.push("🔥 _Rachas máximas:_");
		lineas.push("_Otorga ***+3 💠*** al final de la Polla_");

		const mejorRacha = rankingRacha[0].rachaMaxima;
		const ganadores = rankingRacha
			.filter((u) => u.rachaMaxima === mejorRacha)
			.map((u) => `<@${u.id}>`);
		lineas.push(`${ganadores.join("/")} (${mejorRacha})`);
	}

	// Hit más goles — top 1 (including ties), deduplicated users
	if (hitMasGoles !== null) {
		lineas.push("");
		lineas.push("⚽ _Hit de más goles:_");
		lineas.push("_Otorgan ***+2 💠*** al final de la Polla_");
		const ganadores = hitMasGoles.usuarios
			.map((u) => `<@${u.usuarioId}>`)
			.join("/");
		const partidosStr = hitMasGoles.partidos.join(" / ");
		lineas.push(
			`${ganadores} — ${hitMasGoles.totalGoles} goles (${partidosStr})`,
		);
	}

	return lineas.join("\n");
}
