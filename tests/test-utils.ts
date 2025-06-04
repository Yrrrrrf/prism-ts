// tests/test_utils.ts
import { BaseClient, Prism } from "../src/mod.ts";
import { ColumnMetadata, TableMetadata } from "../src/client/types.ts"; // For stricter typing
import { log } from "../src/tools/logging.ts";

// Define record type to avoid 'any'
export interface TestTableRecord { // Renamed to avoid conflict if imported elsewhere
	id?: string | number; // ID can be string (UUID) or number (serial)
	[key: string]: unknown;
}

// Test context to share state between functions
export interface TestContext {
	client: BaseClient;
	prism: Prism;
	schemaName: string;
	tableName: string;
	tableMetadata: TableMetadata; // Stricter type
	tableOps: any; // Consider creating a more specific type if CrudOperations is stable
	createdRecordId?: string | number; // ID can be string or number
	testData?: Record<string, unknown>;
	fetchedRecord?: TestTableRecord;
}

/**
 * Generate a UUID v4 string
 */
export function generateUUID(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// Set version (4) and variant (RFC4122)
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	// Convert to hex string
	const uuid = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Format with dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${
		uuid.slice(16, 20)
	}-${uuid.slice(20)}`;
}

/**
 * Generate synthetic test data based on table metadata.
 * This function attempts to create plausible data for various column types.
 * It intentionally omits 'created_at' and 'updated_at' fields, assuming
 * the database handles their generation (e.g., with DEFAULT NOW() or triggers).
 */
export function generateTestData(
	tableMetadata: TableMetadata,
): Record<string, unknown> {
	const testData: Record<string, unknown> = {};
	const now = new Date(); // Use a single 'now' for consistency for any dates we DO generate

	tableMetadata.columns.forEach((column: ColumnMetadata) => {
		const type = column.type.toLowerCase();
		const name = column.name;

		// Skip 'created_at' and 'updated_at' as they are usually DB-generated
		if (name === "created_at" || name === "updated_at") {
			return; // Do not add to testData
		}

		// Handle Primary Keys (PKs)
		if (column.is_pk) {
			if (name === "id") { // Common convention for primary key name
				if (type.includes("uuid")) {
					testData[name] = generateUUID();
				} else if (type.includes("int") || type.includes("serial")) {
					// For serial/auto-increment integer PKs, we usually don't send a value.
					// The database assigns it. So, we skip adding it to testData.
					// If it's an int PK that ISN'T auto-increment, you'd need to provide it.
					// For this generic helper, we'll assume serials are handled by DB.
					// If you have int PKs that are not serial, add logic here.
					log.debug(
						`Skipping PK int field '${name}' in test data generation (assuming auto-increment).`,
					);
				} else {
					// Fallback for other PK types (e.g., varchar PK)
					testData[name] = `pk_${name}_${
						Math.random().toString(36).substring(2, 9)
					}`;
				}
			} else {
				// For composite PKs or PKs not named 'id'
				if (type.includes("uuid")) {
					testData[name] = generateUUID();
				} else if (type.includes("int") && !type.includes("serial")) {
					// If it's a non-serial int PK part, generate a random number
					testData[name] = Math.floor(Math.random() * 10000);
				} else if (!type.includes("serial")) { // Avoid serials here too
					testData[name] = `pkpart_${name}_${
						Math.random().toString(36).substring(2, 9)
					}`;
				}
			}
			return; // Handled PK, move to next column
		}

		// Handle common field names with specific test data
		if (name === "email") {
			testData[name] = `test_${
				Math.random().toString(36).substring(2, 7)
			}@example.com`;
		} else if (name === "username") {
			testData[name] = `user_${
				Math.random().toString(36).substring(2, 8)
			}`;
		} else if (
			name === "status" &&
			(type.includes("varchar") || type.includes("text") ||
				column.is_enum)
		) {
			// Example for a status field, assuming 'active' is a common valid value
			// If it's an enum, this might need to pick from actual enum values.
			testData[name] = "active";
		} else if (name === "is_active" && type.includes("bool")) {
			testData[name] = true;
		} // Add more specific field name handlers here as needed

		// Handle general types for fields not specifically named above
		else if (
			type.includes("varchar") || type.includes("text") ||
			type.includes("char")
		) {
			testData[name] = `TestVal_${name}_${
				Math.random().toString(36).substring(2, 10)
			}`;
		} else if (
			type.includes("int") && !type.includes("serial") && !column.is_pk
		) { // Non-PK, non-serial integers
			testData[name] = Math.floor(Math.random() * 1000);
		} else if (
			type.includes("numeric") || type.includes("decimal") ||
			type.includes("float") || type.includes("double") ||
			type.includes("real")
		) {
			// For floating point or fixed-precision numbers
			const randomNum = Math.random() * 100;
			// Adjust precision based on common needs, e.g., 2 decimal places for money-like fields
			if (type.includes("numeric") || type.includes("decimal")) {
				// If precision/scale is available in column.type, could use that
				// e.g. "numeric(10,2)" -> scale = 2
				testData[name] = parseFloat(randomNum.toFixed(2));
			} else {
				testData[name] = randomNum;
			}
		} else if (type.includes("bool")) {
			testData[name] = Math.random() < 0.5; // Random boolean
		} else if (type.includes("date") && !type.includes("timestamp")) { // Just date, no time
			// Format as YYYY-MM-DD
			const d = new Date(
				now.setDate(now.getDate() - Math.floor(Math.random() * 30)),
			); // Random date in last 30 days
			testData[name] = d.toISOString().split("T")[0];
		} else if (type.includes("timestamp") || type.includes("datetime")) { // Timestamp or datetime
			// Use a slightly varied timestamp to avoid exact same values if multiple are generated
			const variedNow = new Date(
				now.getTime() - Math.floor(Math.random() * 10000),
			);
			testData[name] = variedNow.toISOString();
		} else if (type.includes("time") && !type.includes("timestamp")) { // Just time
			const d = new Date();
			d.setHours(Math.floor(Math.random() * 24));
			d.setMinutes(Math.floor(Math.random() * 60));
			d.setSeconds(Math.floor(Math.random() * 60));
			testData[name] = d.toTimeString().split(" ")[0]; // HH:MM:SS
		} else if (type.includes("jsonb") || type.includes("json")) {
			testData[name] = {
				sampleKey: `sampleValue_${
					Math.random().toString(36).substring(2, 7)
				}`,
				nested: { count: Math.floor(Math.random() * 10) },
			};
		} else if (type.includes("uuid") && !column.is_pk) { // Non-PK UUID fields
			testData[name] = generateUUID();
		} // Add more specific type handlers as needed (e.g., for arrays, enums from column.is_enum)
		// For enums, you'd ideally pick a random value from `column.type` if it's a parsed enum object,
		// or if you have fetched EnumMetadata. For now, it might fall into varchar/text.
		else {
			log.warn(
				`Unhandled type '${type}' for column '${name}' in generateTestData. Setting to null.`,
			);
			testData[name] = null; // Default for unhandled types, or could throw error
		}
	});

	return testData;
}
