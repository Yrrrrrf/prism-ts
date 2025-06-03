// improved-crud-test.ts
import { BaseClient, Prism } from "@yrrrrrf/prism-ts";
import {
	cyan,
	green,
	log,
	LogLevel,
	red,
	yellow,
} from "../src/tools/logging.ts";
import {
	generateTestData,
	generateUUID,
	TestContext,
} from "../examples/setup-test.ts";

// Set log level for test verbosity
log.setLevel(LogLevel.DEBUG);

// Configuration
const API_URL = "http://localhost:8000";

// Define record type to avoid 'any'
interface TableRecord {
	id: string;
	[key: string]: unknown;
}

/**
 * Set up test environment and find a suitable table to test
 */
async function setupTest(): Promise<TestContext | null> {
	const context: TestContext = {
		client: new BaseClient(API_URL),
		prism: null as unknown as Prism,
		schemaName: "",
		tableName: "",
		tableMetadata: null,
		tableOps: null,
	};

	// Initialize the Prism client
	context.prism = new Prism(context.client);
	await context.prism.initialize();
	log.info("Client initialized successfully");

	// Get available schemas to find tables
	const schemas = await context.prism.getSchemas();
	if (schemas.length === 0) {
		log.error("No schemas available to test");
		return null;
	}

	// Find first schema with tables to test
	for (const s of schemas) {
		const tables = Object.keys(s.tables || {});
		if (tables.length > 0) {
			context.schemaName = s.name;
			context.tableName = tables[0];
			context.tableMetadata = s.tables[context.tableName];
			break;
		}
	}

	if (!context.tableMetadata) {
		log.error("No tables found to test CRUD operations");
		return null;
	}

	log.info(
		`Testing CRUD operations on ${cyan(context.schemaName)}.${
			green(context.tableName)
		}`,
	);

	// Display table structure
	log.info("Table structure:");
	context.tableMetadata.columns.forEach((column: any) => {
		const isPK = column.isPk ? yellow("PK") : "";
		const isNullable = column.nullable ? "" : red("*");
		log.simple(
			`  ${column.name.padEnd(20)} ${
				column.type.padEnd(15)
			} ${isPK} ${isNullable}`,
		);
	});

	// Get CRUD operations for the table
	context.tableOps = await context.prism.getTableOperations<TableRecord>(
		context.schemaName,
		context.tableName,
	);

	return context;
}

/**
 * Test reading records
 */
async function testRead(context: TestContext): Promise<void> {
	log.info("\n=== TEST: READ OPERATION ===");

	// List existing records
	const existingRecords = await context.tableOps.findAll({ limit: 5 });
	log.info(`Found ${existingRecords.length} existing records`);

	if (existingRecords.length > 0) {
		log.info("Sample record:");
		console.log(existingRecords[0]);
	}

	log.info("✅ Read operation completed successfully");
}

/**
 * Test creating a new record
 */
async function testCreate(context: TestContext): Promise<string | null> {
	log.info("\n=== TEST: CREATE OPERATION ===");

	// Generate test data
	const testData = generateTestData(context.tableMetadata);

	// Ensure we have an ID for this record
	if (
		!testData.id &&
		context.tableMetadata.columns.some((col: any) =>
			col.name === "id" && col.type.toLowerCase().includes("uuid")
		)
	) {
		testData.id = generateUUID();
		log.info(`Generated UUID for id field: ${String(testData.id)}`);
	}

	log.info("Test data for creation:");
	console.log(testData);

	try {
		const createdRecord = await context.tableOps.create(testData);
		log.info("Successfully created record:");
		console.log(createdRecord);

		// Store test data for later use
		context.testData = testData;

		// Get the record ID
		const recordId = typeof createdRecord.id === "string" ||
				typeof createdRecord.id === "number"
			? String(createdRecord.id)
			: String(testData.id);

		if (!recordId) {
			throw new Error("Created record doesn't have an ID");
		}

		log.info(
			`✅ Create operation completed successfully (ID: ${recordId})`,
		);
		return recordId;
	} catch (error) {
		log.error(
			`❌ Create operation failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		console.error(error);
		return null;
	}
}

/**
 * Test reading a specific record by ID
 */
async function testReadById(
	context: TestContext,
	recordId: string,
): Promise<TableRecord | null> {
	log.info("\n=== TEST: READ BY ID OPERATION ===");

	try {
		const fetchedRecord = await context.tableOps.findOne(recordId);
		log.info("Fetched record by ID:");
		console.log(fetchedRecord);

		log.info("✅ Read by ID operation completed successfully");
		return fetchedRecord;
	} catch (error) {
		log.error(
			`❌ Read by ID operation failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		return null;
	}
}

/**
 * Test updating a record
 */
async function testUpdate(
	context: TestContext,
	recordId: string,
	fetchedRecord: TableRecord,
): Promise<boolean> {
	log.info("\n=== TEST: UPDATE OPERATION ===");

	// Get the required fields from the table metadata
	const requiredFields = context.tableMetadata.columns
		.filter((col: any) => !col.nullable)
		.map((col: any) => col.name);

	log.info(`Required fields for update: ${requiredFields.join(", ")}`);

	// Create update data with all required fields
	const updateData: Record<string, unknown> = {};

	// First, copy all required fields from the fetched record
	if (requiredFields.length > 0) {
		requiredFields.forEach((field: string) => {
			updateData[field] = fetchedRecord[field];
		});
	}

	// Then modify one field that isn't an ID
	if (context.testData) {
		const updateableFields = Object.keys(context.testData).filter((k) =>
			!k.includes("id") && !requiredFields.includes(k)
		);

		if (updateableFields.length > 0) {
			const fieldToUpdate = updateableFields[0];

			if (typeof context.testData[fieldToUpdate] === "string") {
				updateData[fieldToUpdate] = `Updated_${
					Math.random().toString(36).substring(2, 7)
				}`;
			} else if (typeof context.testData[fieldToUpdate] === "number") {
				updateData[fieldToUpdate] = Math.floor(Math.random() * 100) +
					100;
			} else if (typeof context.testData[fieldToUpdate] === "boolean") {
				updateData[fieldToUpdate] = !context.testData[fieldToUpdate];
			}

			log.info(
				`Updating field "${fieldToUpdate}" with: ${
					String(updateData[fieldToUpdate])
				}`,
			);
		}
	}

	// Log the full update data
	log.info("Full update data:");
	console.log(updateData);

	try {
		// Make the update request
		const updatedRecord = await context.tableOps.update(
			recordId,
			updateData,
		);
		log.info("Successfully updated record:");
		console.log(updatedRecord);

		log.info("✅ Update operation completed successfully");
		return true;
	} catch (error) {
		log.error(
			`❌ Update operation failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		console.error(error);
		return false;
	}
}

/**
 * Test deleting a record
 */
async function testDelete(
	context: TestContext,
	recordId: string,
): Promise<boolean> {
	log.info("\n=== TEST: DELETE OPERATION ===");

	try {
		// Delete the record
		await context.tableOps.delete(recordId);
		log.info(`Successfully deleted record with ID: ${recordId}`);

		// Verify deletion
		log.info("Verifying deletion...");
		try {
			const deletedRecord = await context.tableOps.findOne(recordId);

			if (deletedRecord) {
				log.error("❌ Record still exists after deletion!");
				console.log(deletedRecord);
				return false;
			} else {
				log.info("✅ Record successfully deleted (returned null)");
				return true;
			}
		} catch (_error) {
			log.info("✅ Record successfully deleted (not found exception)");
			return true;
		}
	} catch (error) {
		log.error(
			`❌ Delete operation failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		console.error(error);
		return false;
	}
}

/**
 * Run all CRUD tests in sequence
 */
async function runCrudTests(): Promise<void> {
	log.section("CRUD Operations Test Suite");

	// Set up test environment
	const context = await setupTest();
	if (!context) {
		log.error("Failed to set up test environment");
		return;
	}

	try {
		// 1. Test reading records (list)
		await testRead(context);

		// 2. Test creating a record
		const recordId = await testCreate(context);
		if (!recordId) {
			log.error("Cannot continue tests without a valid record ID");
			return;
		}

		// 3. Test reading the created record by ID
		const fetchedRecord = await testReadById(context, recordId);
		if (!fetchedRecord) {
			log.error(
				"Cannot continue tests without fetching the created record",
			);
			return;
		}

		// 4. Test updating the record
		const updateSuccess = await testUpdate(
			context,
			recordId,
			fetchedRecord,
		);
		if (!updateSuccess) {
			log.warn("Update test failed, but continuing with deletion test");
		}

		// 5. Test deleting the record
		await testDelete(context, recordId);
	} catch (error) {
		log.error(
			`Test suite failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		console.error(error);
	}
}

// Run the test suite
runCrudTests()
	.then(() => log.info("CRUD test suite completed"))
	.catch((error) => log.error(`CRUD test suite failed: ${error.message}`));
