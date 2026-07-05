import { ZenStackClient } from "@zenstackhq/orm";
import { type ClientContract } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { Pool } from "pg";

import { schema, type SchemaType } from "~/zenstack/output/schema";

export type DBClient = ClientContract<SchemaType>;

export const db = new ZenStackClient(schema, {
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL,
		}),
	}),
});
