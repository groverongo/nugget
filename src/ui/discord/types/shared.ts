import z from "zod";
import { obtenerYYYYMMDDPeru } from "../utils/fecha";

export const fechaSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.nullable()
	.transform((f) => f ?? obtenerYYYYMMDDPeru());
