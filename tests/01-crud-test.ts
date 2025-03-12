// 01-crud-test.ts
import { BaseClient, Prism } from "@yrrrrrf/prism-ts";
import {
	cyan,
	green,
	log,
	LogLevel,
	red,
	yellow,
} from "../src/tools/logging.ts";
// import { log, LogLevel } from "@yrrrrrf/prism-ts/tools/logging";
// import { cyan, green, red, yellow } from "@yrrrrrf/prism-ts/tools/logging";

// Import crypto for UUID generation
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Set log level for test verbosity
log.setLevel(LogLevel.DEBUG);

// Configuration
const API_URL = "http://localhost:8000";

// Define record type to avoid 'any'
interface TableRecord {
	id: string; // Make this explicitly a string since we're dealing with UUIDs
	[key: string]: unknown;
}

/**
 * Generate a UUID v4 string
 * This is needed since the API requires client-generated UUIDs
 */
function generateUUID(): string {
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
 * This test performs a complete CRUD lifecycle on a database table
 */
async function testCrudOperations() {
	log.section("CRUD Operations Test");

	// Create client and connect to API
	const client = new BaseClient(API_URL);
	const prism = new Prism(client);

	try {
		// Initialize the client
		await prism.initialize();
		log.info("Client initialized successfully");

		// Get available schemas to find tables
		const schemas = await prism.getSchemas();
		if (schemas.length === 0) {
			log.error("No schemas available to test");
			return;
		}

		// Find first schema with tables to test
		let schemaName = "";
		let tableName = "";
		let testTable = null;

		// Search for a suitable table to test
		for (const s of schemas) {
			const tables = Object.keys(s.tables || {});
			if (tables.length > 0) {
				schemaName = s.name;
				tableName = tables[0];
				testTable = s.tables[tableName];
				break;
			}
		}

		if (!testTable || !schemaName || !tableName) {
			log.error("No tables found to test CRUD operations");
			return;
		}

		log.info(
			`Testing CRUD operations on ${cyan(schemaName)}.${
				green(tableName)
			}`,
		);

		// Display table structure
		log.info("Table structure:");
		testTable.columns.forEach((column) => {
			const isPK = column.isPrimaryKey ? yellow("PK") : "";
			const isNullable = column.nullable ? "" : red("*");
			log.simple(
				`  ${column.name.padEnd(20)} ${
					column.type.padEnd(15)
				} ${isPK} ${isNullable}`,
			);
		});

		// Get CRUD operations for the table
		interface TableRecord {
			id: string; // Make this explicitly a string since we're dealing with UUIDs
			[key: string]: unknown;
		}

		const tableOps = await prism.getTableOperations<TableRecord>(
			schemaName,
			tableName,
		);

		// 1. READ - List existing records
		log.info("\n1. Reading existing records...");
		const existingRecords = await tableOps.findAll({ limit: 5 });
		log.info(`Found ${existingRecords.length} existing records`);

		if (existingRecords.length > 0) {
			log.info("Sample record:");
			console.log(existingRecords[0]);
		}

		// 2. CREATE - Create a new record
		log.info("\n2. Creating new record...");

		// Generate test data based on table structure
		const testData: { [key: string]: unknown } = {};
		testTable.columns.forEach((column) => {
			// Generate appropriate test data based on column type
			const type = column.type.toLowerCase();
			const name = column.name;

			if (name === "id" || column.isPrimaryKey) {
				// Generate UUID for id field
				if (type.includes("uuid")) {
					testData[name] = generateUUID();
				} else if (type.includes("int")) {
					// Skip auto-increment integers, they'll be handled by the database
					if (!column.isPrimaryKey) {
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

		try {
			// Ensure we have an ID for this record
			if (
				!testData.id &&
				testTable.columns.some((col) =>
					col.name === "id" && col.type.toLowerCase().includes("uuid")
				)
			) {
				testData.id = generateUUID();
				log.info(`Generated UUID for id field: ${String(testData.id)}`);
			}

			log.info("Final test data for creation:");
			console.log(testData);

			const createdRecord = await tableOps.create(testData);
			log.info("Successfully created record:");
			console.log(createdRecord);

			// Get the record ID as string (since we're dealing with UUIDs)
			const recordId = typeof createdRecord.id === "string" ||
					typeof createdRecord.id === "number"
				? createdRecord.id
				: String(testData.id);

			if (!recordId) {
				throw new Error("Created record doesn't have an ID");
			}

			// 3. READ - Verify created record
			log.info("\n3. Verifying created record...");
			const fetchedRecord = await tableOps.findOne(recordId);
			log.info("Fetched record by ID:");
			console.log(fetchedRecord);

			// 4. UPDATE - Update the record
			log.info("\n4. Updating record...");

			// Get the required fields from the fetched record
			const requiredFields = testTable.columns
				.filter((col) => !col.nullable)
				.map((col) => col.name);

			log.info(
				`Required fields for update: ${requiredFields.join(", ")}`,
			);

			// Create update data with all required fields
			const updateData: { [key: string]: unknown } = {};

			// First, copy all required fields from the fetched record
			if (requiredFields.length > 0) {
				requiredFields.forEach((field) => {
					// Include the original value in our update
					updateData[field] = fetchedRecord[field];
				});
			}

			// Then modify one field that isn't an ID
			const updateableFields = Object.keys(testData).filter((k) =>
				!k.includes("id") && !requiredFields.includes(k)
			);

			if (updateableFields.length > 0) {
				const fieldToUpdate = updateableFields[0];

				if (typeof testData[fieldToUpdate] === "string") {
					updateData[fieldToUpdate] = `Updated_${
						Math.random().toString(36).substring(2, 7)
					}`;
				} else if (typeof testData[fieldToUpdate] === "number") {
					updateData[fieldToUpdate] =
						Math.floor(Math.random() * 100) + 100;
				} else if (typeof testData[fieldToUpdate] === "boolean") {
					updateData[fieldToUpdate] = !testData[fieldToUpdate];
				}

				log.info(
					`Updating field "${fieldToUpdate}" with: ${
						String(updateData[fieldToUpdate])
					}`,
				);
			}

			// Log the full update data
			log.info("Full update data:");
			console.log(updateData);

			// Make the update request
			const updatedRecord = await tableOps.update(recordId, updateData);
			log.info("Successfully updated record:");
			console.log(updatedRecord);

			// 5. DELETE - Delete the record
			log.info("\n5. Deleting record...");
			await tableOps.delete(recordId);
			log.info(`Successfully deleted record with ID: ${recordId}`);

			// 6. VERIFY DELETE - Try to fetch deleted record
			log.info("\n6. Verifying deletion...");
			try {
				const deletedRecord = await tableOps.findOne(recordId);

				if (deletedRecord) {
					log.error("❌ Record still exists after deletion!");
					console.log(deletedRecord);
				} else {
					log.info("✅ Record successfully deleted (returned null)");
				}
			} catch (_error) { // Prefixed with underscore to avoid unused var warning
				log.info(
					"✅ Record successfully deleted (not found exception)",
				);
			}
		} catch (error) {
			log.error(
				`CRUD operations failed: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
			console.error(error);
		}
	} catch (error) {
		log.error(
			`Test failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		console.error(error);
	}
}

// Run the test
testCrudOperations()
	.then(() => log.info("CRUD test completed"))
	.catch((error) => log.error(`CRUD test failed: ${error.message}`));
