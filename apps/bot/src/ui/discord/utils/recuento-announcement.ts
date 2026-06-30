import type { VerAwardsParaRecuentoRow } from "@sqlc/recuento_sql";
import { generarPremiosPolla } from "@support/pozo";
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

function buildAwardsSection(
	awards: VerAwardsParaRecuentoRow[],
	eliminadosIds: Set<number>,
	firstEliminadoId?: number | null,
): string[] {
	if (awards.length === 0) return [];

	if (eliminadosIds.size === 0) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	type AwardDef = {
		label: string;
		isEliminated: (r: VerAwardsParaRecuentoRow) => boolean;
	};

	// Awards regulares: si tu equipo fue eliminado → ❌ (perdiste la award)
	const regularDefs: AwardDef[] = [
		{
			label: AWARD_LABELS.campeon,
			isEliminated: (r) =>
				r.campeonId !== null && eliminadosIds.has(r.campeonId),
		},
		{
			label: AWARD_LABELS.goleador,
			isEliminated: (r) =>
				r.goleadorEquipoId !== null && eliminadosIds.has(r.goleadorEquipoId),
		},
		{
			label: AWARD_LABELS.mejorJugador,
			isEliminated: (r) =>
				r.mejorJugadorEquipoId !== null &&
				eliminadosIds.has(r.mejorJugadorEquipoId),
		},
		{
			label: AWARD_LABELS.mejorArquero,
			isEliminated: (r) =>
				r.mejorArqueroEquipoId !== null &&
				eliminadosIds.has(r.mejorArqueroEquipoId),
		},
		{
			label: AWARD_LABELS.mejorJugadorJoven,
			isEliminated: (r) =>
				r.mejorJugadorJovenEquipoId !== null &&
				eliminadosIds.has(r.mejorJugadorJovenEquipoId),
		},
		{
			label: AWARD_LABELS.mejorGol,
			isEliminated: (r) =>
				r.mejorGolEquipoId !== null && eliminadosIds.has(r.mejorGolEquipoId),
		},
		{
			label: AWARD_LABELS.seleccionSorpresa,
			isEliminated: (r) =>
				r.seleccionSorpresaId !== null &&
				eliminadosIds.has(r.seleccionSorpresaId),
		},
	];

	const lineas: string[] = [];
	let hayMuertas = false;

	for (const def of regularDefs) {
		const muertos = awards
			.filter((r) => def.isEliminated(r))
			.map((r) => `<@${r.usuarioId}>`);
		if (muertos.length > 0) {
			hayMuertas = true;
			lineas.push(`- ***${def.label}:*** ${muertos.join("/")} ❌`);
		}
	}

	// Selección decepción: gana quien acertó la PRIMERA selección eliminada
	// Si tu selección = primera eliminada → ✅
	// Cualquier otra selección (aún viva o eliminada después) → ❌
	const decepcionGanadores = awards
		.filter(
			(r) =>
				r.seleccionDecepcionId !== null &&
				firstEliminadoId != null &&
				r.seleccionDecepcionId === firstEliminadoId,
		)
		.map((r) => `<@${r.usuarioId}>`);
	const decepcionPerdedores = awards
		.filter(
			(r) =>
				r.seleccionDecepcionId !== null &&
				r.seleccionDecepcionId !== firstEliminadoId,
		)
		.map((r) => `<@${r.usuarioId}>`);

	if (decepcionGanadores.length > 0 || decepcionPerdedores.length > 0) {
		hayMuertas = true;
		const parts: string[] = [];
		if (decepcionGanadores.length > 0)
			parts.push(`${decepcionGanadores.join("/")} ✅`);
		if (decepcionPerdedores.length > 0)
			parts.push(`${decepcionPerdedores.join("/")} ❌`);
		lineas.push(`- ***${AWARD_LABELS.seleccionDecepcion}:*** ${parts.join(" · ")}`);
	}

	if (!hayMuertas) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	return lineas;
}

export function buildAlertaEliminacion(
	equipo: { nombre: string; bandera: string },
	awards: VerAwardsParaRecuentoRow[],
	equipoId: number,
	firstEliminadoId: number,
): string {
	const lineas: string[] = [
		`_***${equipo.nombre} ${equipo.bandera}*** fue eliminado_`,
	];

	const afectadas = buildAwardsSection(
		awards,
		new Set([equipoId]),
		firstEliminadoId,
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
		exactos,
		totalFinalizados,
		ranking,
		rankingWinRate,
		rankingRacha,
		eliminados,
		awards,
		hitMasGoles,
	} = datos;

	const pct =
		partidosTotal > 0
			? `${((partidosFinalizados / partidosTotal) * 100).toFixed(0)}%`
			: "0%";
	const wrPct =
		totalFinalizados > 0
			? `${((exactos / totalFinalizados) * 100).toFixed(1)}%`
			: "0%";

	const eliminadosIds = new Set(eliminados.map((e) => e.id));
	// eliminados está ordenado por eliminado_at ASC → el primero fue el primero en caer
	const firstEliminadoId = eliminados[0]?.id ?? null;

	const lineas: string[] = [
		`⚽ 🏆  ***RECUENTO: POLLITA FWC 2026***`,
		`_***${titulo}***_`,
		`_***${partidosFinalizados}/${partidosTotal}*** partidos disputados_ (${pct})`,
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
	const awardsLineas = buildAwardsSection(awards, eliminadosIds, firstEliminadoId);
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
						(r.seleccionSorpresaId !== null && r.seleccionSorpresaId === e.id),
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
