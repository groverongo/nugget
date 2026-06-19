import type { VerInformacionPartidoRow } from "@sqlc/partidos_sql";
import type {
	VerParticipantesSinPrediccionRow,
	VerPrediccionesPorPartidoRow,
	VerPuntajesPartidoRow,
} from "@sqlc/predicciones_sql";

function groupAndSort(
	predicciones: VerPrediccionesPorPartidoRow[],
): [string, string[]][] {
	const grouped = new Map<string, string[]>();
	for (const p of predicciones) {
		const key = `${p.prediccionGolesLocal}-${p.prediccionGolesVisitante}`;
		const group = grouped.get(key) ?? [];
		group.push(`<@${p.usuarioId}>`);
		grouped.set(key, group);
	}
	return [...grouped.entries()].sort(([a], [b]) => {
		const [aL, aV] = a.split("-").map(Number);
		const [bL, bV] = b.split("-").map(Number);
		const diff = bL + bV - (aL + aV);
		return diff !== 0 ? diff : bL - aL;
	});
}

function sinPrediccionLine(
	sinPrediccion: VerParticipantesSinPrediccionRow[],
): string | null {
	if (sinPrediccion.length === 0) return null;
	const menciones =
		sinPrediccion.length <= 7
			? sinPrediccion.map((u) => `<@${u.id}>`).join(", ")
			: `${sinPrediccion.length} personas`;
	return `📵 Sin apostar: ${menciones}`;
}

export function buildAlertaMedioTiempo(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
	sinPrediccion: VerParticipantesSinPrediccionRow[],
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;

	const lineas = [
		`**⏸️ ¡MEDIO TIEMPO!**`,
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}***`,
		`**Resultado parcial: (${gL} - ${gV})**`,
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = groupAndSort(predicciones);
	const ganadoresActuales: string[] = [];

	for (const [key, menciones] of grouped) {
		const [pL, pV] = key.split("-").map(Number);
		let emoji: string;
		if (pL === gL && pV === gV) {
			emoji = "❇️";
			ganadoresActuales.push(...menciones);
		} else if (gL > pL || gV > pV) {
			emoji = "❌";
		} else {
			emoji = "⏺️";
		}
		lineas.push(`${key}: ${menciones.join("/")} ${emoji}`);
	}

	lineas.push("");
	if (ganadoresActuales.length > 0) {
		lineas.push(`❇️ *Ganador(es) por ahora:* ${ganadoresActuales.join(", ")}`);
	} else {
		lineas.push(`⏺️ *Nadie ha atinado por ahora.*`);
	}
	const sinLine = sinPrediccionLine(sinPrediccion);
	if (sinLine) lineas.push(sinLine);

	return lineas.join("\n");
}

export function buildAlertaFinPartido(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
	sinPrediccion: VerParticipantesSinPrediccionRow[],
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;

	const lineas = [
		`**🏁 ¡TIEMPO COMPLETO!**`,
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}***`,
		`**Resultado final: (${gL} - ${gV})**`,
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = groupAndSort(predicciones);
	const hayGanadores = grouped.some(([key]) => {
		const [pL, pV] = key.split("-").map(Number);
		return pL === gL && pV === gV;
	});

	const ganadores: string[] = [];

	const resultadoReal = gL > gV ? "local" : gL < gV ? "visitante" : "empate";

	for (const [key, menciones] of grouped) {
		const [pL, pV] = key.split("-").map(Number);
		const esExacto = pL === gL && pV === gV;
		const resultadoPred = pL > pV ? "local" : pL < pV ? "visitante" : "empate";
		const esBuenIntento = !esExacto && resultadoPred === resultadoReal;
		let emoji: string;
		if (!hayGanadores) {
			emoji = "⏹️";
		} else if (esExacto) {
			emoji = "✅";
			ganadores.push(...menciones);
		} else if (esBuenIntento) {
			emoji = "⚡";
		} else {
			emoji = "❌";
		}
		lineas.push(`${key}: ${menciones.join("/")} ${emoji}`);
	}

	lineas.push("");

	const extras: string[] = [];
	if (info.extraPartidazo) extras.push("**Partidazo 💥**");
	if (info.extraMilagro) extras.push("**Milagro ✝️**");
	if (info.extraBatacazo) extras.push("**Batacazo 🐴**");
	if (info.extraElElegido) extras.push("**El Elegido 👑**");
	if (extras.length > 0) lineas.push(extras.join(" · "));

	if (!hayGanadores) {
		lineas.push(`⏹️ ***¡No Winner!** Nadie atinó el resultado.*`);
	} else {
		lineas.push(`✅ ***¡Bravo!** Ganador(es):* ${ganadores.join(", ")}`);
	}
	const sinLine = sinPrediccionLine(sinPrediccion);
	if (sinLine) lineas.push(sinLine);

	return lineas.join("\n");
}

export function buildAlertaGol(
	info: VerInformacionPartidoRow,
	equipo: "local" | "visitante",
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;
	const equipoGol =
		equipo === "local"
			? `${info.equipoLocalNombre} ${info.equipoLocalBandera}`
			: `${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}`;
	return [
		`***¡GOOOL!** de ${equipoGol}*`,
		`${info.equipoLocalBandera} ${info.equipoLocalSiglas} ${gL}-${gV} ${info.equipoVisitanteSiglas} ${info.equipoVisitanteBandera}`,
	].join("\n");
}

export function buildAlertaAuraPoints(
	puntajes: VerPuntajesPartidoRow[],
): string | null {
	if (puntajes.length === 0) return null;

	const lineas = [`💠 ***Aura Points** ganados:*`];
	for (const p of puntajes) {
		lineas.push(
			`• <@${p.usuarioId}> ganó **+${p.puntosGanados}** 💠 (total: ${p.puntosAcumulados})`,
		);
	}
	return lineas.join("\n");
}
