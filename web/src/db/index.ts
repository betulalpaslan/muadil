import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

// Geliştirmede sıcak yeniden yükleme her seferinde yeni bağlantı havuzu açmasın diye global'de tutulur.
// Derleme sırasında çok sayıda işçi süreç paralel sayfa üretir; her birinin havuzu küçük tutulur.
const derleme = process.env.NEXT_PHASE === "phase-production-build";
const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL!, { max: derleme ? 2 : 10 });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
