import { BaseClient, Prism } from "../src/mod.ts";

// Define record type to avoid 'any'
interface TableRecord {
	id: string;
	[key: string]: unknown;
}

// Test context to share state between functions
export interface TestContext {
	client: BaseClient;
	prism: Prism;
	schemaName: string;
	tableName: string;
	tableMetadata: any;
	tableOps: any;
	createdRecordId?: string;
	testData?: Record<string, unknown>;
	fetchedRecord?: TableRecord;
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
 * Generate synthetic test data based on table metadata
 */
export function generateTestData(tableMetadata: any): Record<string, unknown> {
	const testData: Record<string, unknown> = {};

	tableMetadata.columns.forEach((column: any) => {
		// Generate appropriate test data based on column type
		const type = column.type.toLowerCase();
		const name = column.name;

		if (name === "id" || column.isPk) {
			// Generate UUID for id field
			if (type.includes("uuid")) {
				testData[name] = generateUUID();
			} else if (type.includes("int")) {
				// Skip auto-increment integers, they'll be handled by the database
				if (!column.isPk) {
					testData[name] = Math.floor(Math.random() * 100);
				}
			}
		} else if (name === "status") {
			// Handle status field specifically - likely has a check constraint
			testData[name] = "active"; // Use a valid value that passes the check constraint
		} else if (type.includes("varchar") || type.includes("text")) {
			testData[name] = `Test_${
				Math.random().toString(36).substring(2, 7)
			}`;
		} else if (type.includes("int")) {
			testData[name] = Math.floor(Math.random() * 100);
		} else if (type.includes("bool")) {
			testData[name] = true;
		} else if (type.includes("date") || type.includes("timestamp")) {
			testData[name] = new Date().toISOString();
		}
	});

	return testData;
}
