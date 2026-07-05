import fs from "node:fs";
import path from "node:path";

// 0. Manual .env loading BEFORE anything else to ensure ZenStack picks it up
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
	const envContent = fs.readFileSync(envPath, "utf8");
	envContent.split(/\r?\n/).forEach((line) => {
		const trimmedLine = line.trim();
		if (trimmedLine && !trimmedLine.startsWith("#")) {
			const eqIndex = trimmedLine.indexOf("=");
			if (eqIndex !== -1) {
				const key = trimmedLine.substring(0, eqIndex).trim();
				const value = trimmedLine
					.substring(eqIndex + 1)
					.trim()
					.replace(/^"|"$/g, "");
				process.env[key] = value;
			}
		}
	});
}

// Prefer DIRECT_URL (port 5432) over pooled connection (6543) for this script
if (process.env.DIRECT_URL) {
	process.env.DATABASE_URL = process.env.DIRECT_URL;
}

// 1. Dynamic import of the DB client after environment is ready
const { db } = await import("../src/lib/db");
const { schema } = await import("../zenstack/output/schema");

async function exportToCSV() {
	const exportDir = "./exports";

	if (!process.env.DATABASE_URL) {
		console.error("Error: DATABASE_URL not found.");
		process.exit(1);
	}

	// 2. Clear previous files & create new directory
	if (fs.existsSync(exportDir)) {
		await fs.promises.rm(exportDir, { recursive: true, force: true });
	}
	fs.mkdirSync(exportDir, { recursive: true });

	// 3. Iterate through models in schema
	const modelEntries = Object.entries(schema.models);

	for (const [modelName, modelDef] of modelEntries) {
		const modelKey = modelName[0].toLowerCase() + modelName.slice(1);
		const modelInstance = (db as any)[modelKey];

		if (!modelInstance || typeof modelInstance.findMany !== "function") continue;

		console.log(`Exporting ${modelName}...`);

		let data: any[];
		try {
			data = await modelInstance.findMany();
		} catch (e: any) {
			console.error(`Failed to fetch ${modelName}:`, e.message || e);
			continue;
		}

		// 4. Determine columns from schema fields
		const fields = (modelDef as any).fields;
		const columns = Object.keys(fields).filter((fieldName) => {
			const field = fields[fieldName];
			if (field.relation) return false;
			// The user wants to avoid incremental values like 'id' from matches/innings
			if (fieldName === "id") return false;
			return true;
		});

		if (columns.length === 0) continue;

		// 5. Determine output filename (use @@map value if available)
		let tableName = modelName.toLowerCase();
		const mapAttr = (modelDef as any).attributes?.find((a: any) => a.name === "@@map");
		if (mapAttr && mapAttr.args?.[0]?.value?.value) {
			tableName = mapAttr.args[0].value.value;
		}

		// 6. Generate CSV content
		const csvHeader = columns.join(",");
		const csvRows = data.map((row: any) =>
			columns
				.map((col) => {
					const val = row[col];

					if (val === null || val === undefined) return "";

					// Date Format YYYY-MM-DD
					if (val instanceof Date) {
						return (
							val.getUTCFullYear() + "-" + String(val.getUTCMonth() + 1).padStart(2, "0") + "-" + String(val.getUTCDate()).padStart(2, "0")
						);
					}

					const strVal = String(val);
					if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
						return `"${strVal.replace(/"/g, '""')}"`;
					}
					return strVal;
				})
				.join(","),
		);

		const csvContent = [csvHeader, ...csvRows].join("\n");
		const filePath = path.join(exportDir, `${tableName}.csv`);

		await fs.promises.writeFile(filePath, csvContent);
		console.log(`Saved ${csvRows.length} rows to ${filePath}`);
	}
	console.log("\n--- Export Complete ---");
}

exportToCSV().catch((err: any) => {
	console.error("Export script failed:", err);
	process.exit(1);
});
