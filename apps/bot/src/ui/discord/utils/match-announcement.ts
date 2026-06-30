import type { VerInformacionPartidoRow } from "@sqlc/partidos_sql";
import type {
	VerParticipantesSinPrediccionRow,
	VerPrediccionesPorPartidoRow,
	VerPuntajesPartidoRow,
} from "@sqlc/predicciones_sql";
import { etLabel } from "./fecha";

type Grouped = {
	label: string;
	menciones: string[];
	gL: number;
	gV: number;
	penalesId: number | null;
};

function groupAndSort(
	predicciones: VerPrediccionesPorPartidoRow[],
	localId?: number | null,
	localBandera?: string,
	localSiglas?: string,
	visitanteBandera?: string,
	visitanteSiglas?: string,
): Grouped[] {
	const map = new Map<string, Grouped>();
	for (const p of predicciones) {
		const scoreLabel = `${p.prediccionGolesLocal}-${p.prediccionGolesVisitante}`;
		const penalesLabel =
			p.prediccionPenalesGanadorId != null && localId != null
				? ` (${p.prediccionPenalesGanadorId === localId ? `${localBandera} ${localSiglas}` : `${visitanteBandera} ${visitanteSiglas}`})`
				: "";
		const label = `${scoreLabel}${penalesLabel}`;
		const mapKey = `${scoreLabel}-${p.prediccionPenalesGanadorId ?? ""}`;
		const entry = map.get(mapKey) ?? {
			label,
			menciones: [],
			gL: p.prediccionGolesLocal,
			gV: p.prediccionGolesVisitante,
			penalesId: p.prediccionPenalesGanadorId,
		};
		entry.menciones.push(`<@${p.usuarioId}>`);
		map.set(mapKey, entry);
	}
	return [...map.values()].sort((a, b) => {
		const diff = b.gL + b.gV - (a.gL + a.gV);
		return diff !== 0 ? diff : b.gL - a.gL;
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
	esPrePenales = false,
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;

	const lineas = [
		esPrePenales ? `**⏸️ FIN DEL TIEMPO EXTRA**` : `**⏸️ ¡MEDIO TIEMPO!**`,
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}${etLabel(info.partidoOriginalId)}***`,
		`**Resultado parcial: (${gL} - ${gV})**`,
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = groupAndSort(
		predicciones,
		info.equipoLocalId,
		info.equipoLocalBandera,
		info.equipoLocalSiglas,
		info.equipoVisitanteBandera,
		info.equipoVisitanteSiglas,
	);
	const ganadoresActuales: string[] = [];

	for (const { label, menciones, gL: pL, gV: pV } of grouped) {
		let emoji: string;
		if (pL === gL && pV === gV) {
			emoji = "❇️";
			ganadoresActuales.push(...menciones);
		} else if (gL > pL || gV > pV) {
			emoji = "❌";
		} else {
			emoji = "⏺️";
		}
		lineas.push(`${label}: ${menciones.join("/")} ${emoji}`);
	}

	const sinLine = sinPrediccionLine(sinPrediccion);
	if (sinLine) lineas.push(sinLine);

	lineas.push("");
	if (ganadoresActuales.length > 0) {
		lineas.push(`❇️ *Ganador(es) por ahora:* ${ganadoresActuales.join(", ")}`);
	} else {
		lineas.push(`⏺️ *Nadie ha atinado por ahora.*`);
	}

	return lineas.join("\n");
}

export function buildAlertaFinPartido(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
	sinPrediccion: VerParticipantesSinPrediccionRow[],
	penalesGanadorId?: number | null,
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;

	const lineas = [
		`**🏁 ¡TIEMPO COMPLETO!**`,
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}${etLabel(info.partidoOriginalId)}***`,
		`**Resultado final: (${gL} - ${gV})**`,
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = groupAndSort(
		predicciones,
		info.equipoLocalId,
		info.equipoLocalBandera,
		info.equipoLocalSiglas,
		info.equipoVisitanteBandera,
		info.equipoVisitanteSiglas,
	);

	const hayGanadores = grouped.some(({ gL: pL, gV: pV, penalesId }) => {
		if (pL !== gL || pV !== gV) return false;
		if (penalesGanadorId != null) return penalesId === penalesGanadorId;
		return true;
	});

	const ganadores: string[] = [];
	const resultadoReal = gL > gV ? "local" : gL < gV ? "visitante" : "empate";

	for (const { label, menciones, gL: pL, gV: pV, penalesId } of grouped) {
		const scoreMatch = pL === gL && pV === gV;
		const esExacto =
			scoreMatch &&
			(penalesGanadorId == null || penalesId === penalesGanadorId);
		const resultadoPred = pL > pV ? "local" : pL < pV ? "visitante" : "empate";
		const mismaDiferencia = pL - pV === gL - gV;
		// En supple con empate+penales: penales incorrectos → fallado (no buenIntento)
		const esBuenIntento =
			!esExacto &&
			resultadoPred === resultadoReal &&
			mismaDiferencia &&
			(penalesGanadorId == null || pL !== pV || penalesId === penalesGanadorId);

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
		lineas.push(`${label}: ${menciones.join("/")} ${emoji}`);
	}

	const sinLine = sinPrediccionLine(sinPrediccion);
	if (sinLine) lineas.push(sinLine);

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

	return lineas.join("\n");
}

export function buildAlertaSupleCreado(
	info: VerInformacionPartidoRow,
	predicciones: VerPrediccionesPorPartidoRow[],
	sinPrediccion: VerParticipantesSinPrediccionRow[],
): string {
	const gL = info.partidoGolesLocal ?? 0;
	const gV = info.partidoGolesVisitante ?? 0;

	const lineas = [
		`**⏱️ ¡SUPLEMENTARIO!**`,
		`***${info.equipoLocalNombre} ${info.equipoLocalBandera} vs. ${info.equipoVisitanteNombre} ${info.equipoVisitanteBandera}***`,
		`**Resultado 90': (${gL} - ${gV}) → Se va a tiempo extra**`,
	];

	if (predicciones.length === 0) {
		lineas.push("_Nadie apostó en este partido._");
		return lineas.join("\n");
	}

	const grouped = groupAndSort(
		predicciones,
		info.equipoLocalId,
		info.equipoLocalBandera,
		info.equipoLocalSiglas,
		info.equipoVisitanteBandera,
		info.equipoVisitanteSiglas,
	);

	const vivos: string[] = [];

	for (const { label, menciones, gL: pL, gV: pV } of grouped) {
		const scoreMatch = pL === gL && pV === gV;
		let emoji: string;
		if (scoreMatch) {
			emoji = "⏺️";
			vivos.push(...menciones);
		} else {
			emoji = "❌";
		}
		lineas.push(`${label}: ${menciones.join("/")} ${emoji}`);
	}

	const sinLine = sinPrediccionLine(sinPrediccion);
	if (sinLine) lineas.push(sinLine);

	lineas.push("");
	if (vivos.length > 0) {
		lineas.push(`⏺️ *Con chances: ${vivos.join(", ")}*`);
	} else {
		lineas.push(`❌ *Nadie atinó el 90' exacto.*`);
	}

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
		`***¡GOOOL!** de ${equipoGol}${etLabel(info.partidoOriginalId)}*`,
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
