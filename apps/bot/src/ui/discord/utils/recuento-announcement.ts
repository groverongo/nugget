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
): string[] {
	if (awards.length === 0) return [];

	if (eliminadosIds.size === 0) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	type AwardKey = {
		label: string;
		isEliminated: (r: VerAwardsParaRecuentoRow) => boolean;
	};

	const awardDefs: AwardKey[] = [
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
			label: AWARD_LABELS.seleccionDecepcion,
			isEliminated: (r) =>
				r.seleccionDecepcionId !== null &&
				eliminadosIds.has(r.seleccionDecepcionId),
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

	for (const def of awardDefs) {
		const muertos = awards
			.filter((r) => def.isEliminated(r))
			.map((r) => `<@${r.usuarioId}>`);
		if (muertos.length > 0) {
			hayMuertas = true;
			lineas.push(`- ***${def.label}:*** ${muertos.join("/")} ❌`);
		}
	}

	if (!hayMuertas) {
		return ["🏅 🟢 _Todas las **awards** siguen abiertas._"];
	}

	return lineas;
}

export function buildTabla(datos: DatosRecuento): string {
	const { ranking } = datos;
	if (ranking.length === 0) return "No hay participantes.";

	const { listaPremios } = generarPremiosPolla(ranking.length);
	const lineas: string[] = ["🏆 ***Tabla de Posiciones***", ""];

	ranking.forEach((u, i) => {
		const puesto = i + 1;
		const rachaStr = u.racha > 0 ? ` 🔥${u.racha}` : "";
		const wr = Number.parseFloat(u.winRate).toFixed(1);
		const premio = getPremioParaPuesto(puesto, listaPremios);
		const premioLabel = premio > 0 ? ` · ${premioStr(premio)}` : " · S/0";

		lineas.push(
			`**#${puesto}** <@${u.id}> — **${u.puntos} 💠**${rachaStr} · ${wr}% ⭐ · ${u.partidosApostados} 🎲 (${u.partidosGanados} ✅ / ${u.partidosBuenIntento} ⚡ / ${u.partidosPerdidos} ❌)${premioLabel}`,
		);
	});

	return lineas.join("\n");
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
		const equiposStr = eliminados
			.map((e) => `${e.siglas} ${e.bandera}`)
			.join(" / ");
		lineas.push(`_Equipos eliminados: ${equiposStr}_`);
	}

	// Awards
	const awardsLineas = buildAwardsSection(awards, eliminadosIds);
	if (awardsLineas.length > 0) {
		lineas.push("");
		if (eliminados.length > 0) {
			const eliminadosStr = eliminados
				.map((e) => `**${e.siglas} ${e.bandera}**`)
				.join(" / ");
			lineas.push(
				`_***Awards*** resueltas tras la eliminación de ${eliminadosStr}:_`,
			);
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
		const partidosStr = hitMasGoles.partidos.join(", ");
		lineas.push(
			`${ganadores} — ${hitMasGoles.totalGoles} goles (${partidosStr})`,
		);
	}

	return lineas.join("\n");
}
