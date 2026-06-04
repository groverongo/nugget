import type { Message } from "discord.js";
import type { Pool } from "pg";

const permittedStates = ["programado", "en_vivo"] as const;

type MatchRow = {
	id: number;
	fecha_partido: Date | null;
	estado: string;
	local: string | null;
	visitante: string | null;
};

export async function handleMatchesCommand(
	message: Message,
	content: string,
	db: Pool,
): Promise<void> {
	const args = content.trim().split(/\s+/).slice(1);
	const requestedState = args[0]?.toLowerCase();

	if (
		requestedState &&
		!permittedStates.includes(
			requestedState as (typeof permittedStates)[number],
		)
	) {
		await message.reply(`Uso: !matches [programado|en_vivo]`);
		return;
	}

	const whereClauses = ["p.estado IN ('programado', 'en_vivo')"];
	const params: unknown[] = [];

	if (requestedState) {
		whereClauses.push("p.estado = $1");
		params.push(requestedState);
	}

	const sql = `
SELECT
	p.id,
	p.fecha_partido,
	p.estado,
	el.nombre AS local,
	ev.nombre AS visitante
FROM partidos p
LEFT JOIN estatico_equipos el ON p.equipo_local_id = el.id
LEFT JOIN estatico_equipos ev ON p.equipo_visitante_id = ev.id
WHERE ${whereClauses.join(" AND ")}
ORDER BY p.fecha_partido NULLS LAST, p.id
LIMIT 20;
`;

	const result = await db.query<MatchRow>(sql, params);
	if (result.rows.length === 0) {
		await message.reply(
			"No hay partidos programados o en vivo en este momento.",
		);
		return;
	}

	const lines = result.rows.map((row) => {
		const dateText = row.fecha_partido
			? new Date(row.fecha_partido).toLocaleString("es-ES", {
					dateStyle: "short",
					timeStyle: "short",
				})
			: "Fecha no definida";
		const local = row.local ?? "[sin equipo local]";
		const visitante = row.visitante ?? "[sin equipo visitante]";
		return `#${row.id} ${local} vs ${visitante} — ${row.estado} — ${dateText}`;
	});

	await message.reply(lines.join("\n"));
}
