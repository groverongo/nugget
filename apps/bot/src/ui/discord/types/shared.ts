import z from "zod";
import { obtenerYYYYMMDDPeru } from "../utils/fecha";

export const fechaSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.nullable()
	.transform((f) => f ?? obtenerYYYYMMDDPeru());

export const golesSchema = z.coerce.number().int().min(0).max(99);

export const puntosApuestaSchema = z.coerce.number().int().min(1).max(999999);
