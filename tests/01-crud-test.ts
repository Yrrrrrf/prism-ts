// tests/01-crud-test.ts
import {
	assert,
	assertEquals,
	assertExists,
	assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BaseClient, Prism } from "../src/mod.ts";
import { ColumnMetadata } from "../src/client/types.ts";
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
	TestContext,
	TestTableRecord,
} from "./test-utils.ts";

log.setLevel(LogLevel.INFO);
const API_URL = "http://localhost:8000";

let testContext: TestContext | null = null;
// let createdRecord: TestTableRecord | null = null; // Removed - use local variables in steps
let recordIdToTest: string | number | undefined;

Deno.test("CRUD Operations Suite", async (t) => {
	await t.step("Initialize Test Environment and Select Table", async () => {
		log.section("SETUP: Initializing Test Environment");
		const context: Partial<TestContext> = {
			client: new BaseClient(API_URL),
		};

		context.prism = new Prism(context.client as BaseClient);
		await context.prism.initialize();
		log.info("Prism client initialized successfully");

		const schemas = await context.prism.getSchemas();
		assert(schemas.length > 0, "No schemas available to test");

		let foundTable = false;
		for (const s of schemas) {
			const tables = Object.keys(s.tables || {});
			if (tables.length > 0) {
				context.schemaName = s.name;
				context.tableName = tables[0];
				context.tableMetadata = s.tables[context.tableName];
				foundTable = true;
				break;
			}
		}
		assert(foundTable, "No tables found to test CRUD operations");
		assertExists(
			context.tableMetadata,
			"Table metadata is missing after schema scan",
		);

		log.info(
			`Selected table for testing: ${cyan(context.schemaName!)}.${
				green(context.tableName!)
			}`,
		);

		log.info("Table structure:");
		context.tableMetadata.columns.forEach((column: ColumnMetadata) => {
			const isPK = column.is_pk ? yellow("PK") : "";
			const isNullable = column.nullable ? "" : red("*");
			log.simple(
				`  ${column.name.padEnd(20)} ${
					column.type.padEnd(15)
				} ${isPK} ${isNullable}`,
			);
		});

		context.tableOps = await context.prism.getTableOperations<
			TestTableRecord
		>(
			context.schemaName!,
			context.tableName!,
		);

		testContext = context as TestContext;
		assertExists(testContext, "Test context setup failed");
		assertExists(
			testContext.tableMetadata,
			"tableMetadata is missing in fully cast testContext",
		);
	});

	await t.step("CREATE: Create a new record", async () => {
		assertExists(
			testContext?.tableMetadata,
			"Table metadata missing in context for CREATE step",
		);
		log.info("\n=== TEST: CREATE OPERATION ===");

		const initialData = generateTestData(testContext.tableMetadata);
		testContext.testData = initialData;
		// FIX: log.info with single argument
		log.info(
			`Generated data for creation: ${
				JSON.stringify(initialData, null, 2)
			}`,
		);

		const apiCreatedRecord = await testContext.tableOps.create(initialData);
		// FIX: log.info with single argument
		log.info(
			`Successfully created record: ${
				JSON.stringify(apiCreatedRecord, null, 2)
			}`,
		);

		assertExists(apiCreatedRecord, "Failed to create record");
		assertExists(apiCreatedRecord.id, "Created record has no ID");
		recordIdToTest = apiCreatedRecord.id;

		for (const key in initialData) {
			if (
				initialData[key] !== undefined &&
				apiCreatedRecord[key] !== undefined
			) {
				if (
					initialData[key] instanceof Date &&
					typeof apiCreatedRecord[key] === "string"
				) {
					assertEquals(
						new Date(apiCreatedRecord[key] as string).toISOString(),
						(initialData[key] as Date).toISOString(),
					);
				} else if (
					typeof initialData[key] === "number" &&
					typeof apiCreatedRecord[key] === "string"
				) {
					assertEquals(
						String(initialData[key]),
						String(apiCreatedRecord[key]),
					);
				} else {
					assertEquals(
						apiCreatedRecord[key],
						initialData[key],
						`Field ${key} mismatch`,
					);
				}
			}
		}
		log.info(`✅ CREATE operation successful (ID: ${recordIdToTest})`);
	});

	await t.step("READ: Fetch the created record by ID", async () => {
		assertExists(
			testContext,
			"Test context not initialized for READ (FindOne) step",
		);
		assertExists(
			recordIdToTest,
			"Record ID not available for READ (FindOne) step",
		);
		log.info("\n=== TEST: READ BY ID OPERATION ===");

		const fetchedRecord = await testContext.tableOps.findOne(
			recordIdToTest,
		);
		// FIX: log.info with single argument
		log.info(
			`Fetched record by ID: ${JSON.stringify(fetchedRecord, null, 2)}`,
		);

		assertExists(
			fetchedRecord,
			`Failed to fetch record with ID: ${recordIdToTest}`,
		);
		assertEquals(
			fetchedRecord.id,
			recordIdToTest,
			"Fetched record ID does not match created ID",
		);
		testContext.fetchedRecord = fetchedRecord;
		log.info("✅ READ BY ID operation successful");
	});

	await t.step("READ: List records (including the created one)", async () => {
		assertExists(
			testContext,
			"Test context not initialized for READ (FindAll) step",
		);
		log.info("\n=== TEST: READ (FindAll) OPERATION ===");

		const records: TestTableRecord[] = await testContext.tableOps.findAll({
			limit: 10,
		});
		log.info(`Found ${records.length} records`);
		assert(records.length > 0, "Expected to find at least one record");

		const foundCreatedRecord = records.find((r: TestTableRecord) =>
			r.id === recordIdToTest
		);
		assertExists(
			foundCreatedRecord,
			"Created record not found in findAll list",
		);
		log.info("✅ READ (FindAll) operation successful");
	});

	await t.step("UPDATE: Modify the created record", async () => {
		assertExists(
			testContext?.tableMetadata,
			"Table metadata missing in context for UPDATE step",
		);
		assertExists(recordIdToTest, "Record ID not available for UPDATE step");
		assertExists(
			testContext.fetchedRecord,
			"Fetched record (to be updated) not available",
		);
		assertExists(
			testContext.testData,
			"Original testData (for finding a field to change) not available",
		);
		log.info("\n=== TEST: UPDATE OPERATION ===");

		// Start with a copy of the fetched record to ensure all required fields are present
		// This is crucial if the PUT endpoint expects all fields for validation,
		// even if only some are being changed.
		const basePayload = { ...testContext.fetchedRecord };

		let fieldToUpdate: keyof TestTableRecord | undefined;
		let originalValueInFetchedRecord: unknown; // Value from the record we fetched (before update)
		let newValue: unknown;

		// Find a suitable field to update.
		// Prefer a field that was part of the initial generated data for clearer test logic.
		const potentialFieldsToUpdate = Object.keys(testContext.fetchedRecord)
			.filter(
				(key) =>
					key !== "id" && key !== "created_at" &&
					key !== "updated_at" &&
					testContext!.testData &&
					Object.hasOwn(testContext!.testData, key) && // Ensure it was in original generated data
					testContext!.fetchedRecord &&
					Object.hasOwn(testContext!.fetchedRecord, key), // And in fetched record
			) as Array<keyof TestTableRecord>;

		for (const key of potentialFieldsToUpdate) {
			const fetchedVal = testContext.fetchedRecord[key];
			if (typeof fetchedVal === "string") {
				fieldToUpdate = key;
				originalValueInFetchedRecord = fetchedVal; // This is the value we're changing FROM
				newValue = `Updated_${fetchedVal}_${
					Math.random().toString(36).substring(2, 7)
				}`;
				break;
			} else if (typeof fetchedVal === "number") {
				fieldToUpdate = key;
				originalValueInFetchedRecord = fetchedVal;
				newValue = fetchedVal + Math.floor(Math.random() * 100) + 50;
				break;
			} else if (typeof fetchedVal === "boolean") {
				fieldToUpdate = key;
				originalValueInFetchedRecord = fetchedVal;
				newValue = !fetchedVal;
				break;
			}
		}

		assertExists(
			fieldToUpdate,
			"No suitable, non-PK, non-timestamp field found to update",
		);

		// Construct the final payload.
		// Pydantic_profile requires 'id', 'username', 'email'.
		// Our basePayload (from fetchedRecord) already has these.
		// We only modify the fieldToUpdate.
		const updatePayload: Partial<TestTableRecord> = {
			...basePayload, // Send all fields from the fetched record
			[fieldToUpdate!]: newValue, // Override the field to be updated
		};
		// Ensure the ID in the payload matches the ID in the query param, as required by Pydantic_profile
		// If your Pydantic model *doesn't* require 'id' in the body for PUT, you could delete it here.
		// updatePayload.id = recordIdToTest; // Explicitly set if there's any doubt or if it's not in basePayload somehow

		log.info(
			`Attempting to update field "${fieldToUpdate}" from "${originalValueInFetchedRecord}" to "${newValue}"`,
		);
		log.info(
			`Full update payload being sent: ${
				JSON.stringify(updatePayload, null, 2)
			}`,
		);

		// tableOps.update is expected to return the updated record directly (T)
		// because src/client/crud.ts does: return response.updated_data[0];
		const finalUpdatedRecord: TestTableRecord = await testContext.tableOps
			.update(recordIdToTest, updatePayload);
		log.info(
			`Received updated record from tableOps.update: ${
				JSON.stringify(finalUpdatedRecord, null, 2)
			}`,
		);

		assertExists(
			finalUpdatedRecord,
			"Update operation did not return a record.",
		);

		// Verify the ID remains the same
		assertEquals(
			finalUpdatedRecord.id,
			recordIdToTest,
			"Updated record ID mismatch. Expected original ID.",
		);

		// Verify the specific field was updated
		assertNotEquals(
			finalUpdatedRecord[fieldToUpdate!],
			originalValueInFetchedRecord,
			`Field "${fieldToUpdate}" was not updated. Expected it to change from "${originalValueInFetchedRecord}".`,
		);
		assertEquals(
			finalUpdatedRecord[fieldToUpdate!],
			newValue,
			`Field "${fieldToUpdate}" not updated to the expected new value. Expected: "${newValue}", Got: "${
				finalUpdatedRecord[fieldToUpdate!]
			}"`,
		);

		// Verify other fields (that were not part of updatePayload's direct changes) remain the same as in basePayload (fetchedRecord)
		// This ensures the PUT operation didn't unintentionally nullify or alter other fields.
		for (const key in basePayload) {
			if (
				Object.hasOwn(basePayload, key) && key !== fieldToUpdate &&
				key !== "updated_at"
			) { // Exclude updated_at as it WILL change
				const k = key as keyof TestTableRecord;
				assertEquals(
					finalUpdatedRecord[k],
					basePayload[k],
					`Field "${k}" was unexpectedly changed during update.`,
				);
			}
		}

		// Check 'updated_at' - it should have changed or been updated
		if (
			finalUpdatedRecord.updated_at &&
			testContext.fetchedRecord.updated_at
		) {
			assertNotEquals(
				finalUpdatedRecord.updated_at,
				testContext.fetchedRecord.updated_at,
				"'updated_at' field should have been modified by the update operation.",
			);
		}

		log.info("✅ UPDATE operation successful");
	});

	await t.step("DELETE: Remove the created record", async () => {
		assertExists(
			testContext,
			"Test context not initialized for DELETE step",
		);
		assertExists(recordIdToTest, "Record ID not available for DELETE step");
		log.info("\n=== TEST: DELETE OPERATION ===");

		await testContext.tableOps.delete(recordIdToTest);
		log.info(`Delete request sent for record ID: ${recordIdToTest}`);

		try {
			const fetchedAfterDelete = await testContext.tableOps.findOne(
				recordIdToTest,
			);
			assertEquals(
				fetchedAfterDelete,
				undefined,
				"Record found after deletion, or findOne returning unexpected value.",
			);
		} catch (e) {
			// FIX: Handle 'e' being unknown
			if (e instanceof Error) {
				log.info(`Fetch after delete failed as expected: ${e.message}`);
				assert(
					e.message.includes("No record found") ||
						e.message.includes("not found") ||
						e.message.includes("ID: " + recordIdToTest),
					"Error message did not indicate record not found.",
				);
			} else {
				log.error(
					`Fetch after delete failed with non-Error type: ${
						String(e)
					}`,
				);
				assert(false, "Fetch after delete failed with non-Error type.");
			}
		}
		log.info(
			"✅ DELETE operation successful (verified by failed/empty fetch)",
		);
	});

	await t.step("Teardown: Test suite finished", () => {
		log.section("TEARDOWN: CRUD Test suite finished");
	});
});
