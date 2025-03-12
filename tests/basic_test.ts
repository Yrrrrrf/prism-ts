/**
 * Basic functionality tests for Prism-TS
 *
 * Tests initialization, schema display, and health checks
 */
import {
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { PrismTs } from "../src/mod.ts";

// Mock fetch for testing
const originalFetch = globalThis.fetch;

function mockFetch(responseData: unknown, status = 200): void {
	globalThis.fetch = async (): Promise<Response> => {
		return {
			ok: status >= 200 && status < 300,
			status,
			statusText: status === 200 ? "OK" : "Error",
			json: async () => responseData,
			text: async () => JSON.stringify(responseData),
			headers: new Headers(),
		} as Response;
	};
}

function mockSchemaResponse(): unknown {
	return [
		{
			name: "public",
			tables: {
				"users": {
					name: "users",
					schema: "public",
					columns: [
						{
							name: "id",
							type: "uuid",
							nullable: false,
							isPrimaryKey: true,
							isEnum: false,
						},
						{
							name: "username",
							type: "varchar",
							nullable: false,
							isPrimaryKey: false,
							isEnum: false,
						},
						{
							name: "email",
							type: "varchar",
							nullable: false,
							isPrimaryKey: false,
							isEnum: false,
						},
					],
				},
			},
			views: {},
			enums: {},
			functions: {},
			procedures: {},
			triggers: {},
		},
	];
}

function mockHealthResponse(): unknown {
	return {
		status: "healthy",
		timestamp: new Date().toISOString(),
		version: "0.1.0",
		uptime: 60.0,
		databaseConnected: true,
	};
}

function restoreFetch(): void {
	globalThis.fetch = originalFetch;
}

Deno.test("PrismTs - initialization and schema loading", async () => {
	mockFetch(mockSchemaResponse());

	try {
		const prism = new PrismTs("http://localhost:8000");
		await prism.initialize();

		const schemas = await prism.getSchemas();
		assertEquals(schemas.length, 1);
		assertEquals(schemas[0].name, "public");

		// Check that we can access tables
		const tables = Object.keys(schemas[0].tables);
		assertEquals(tables.length, 1);
		assertEquals(tables[0], "users");
	} finally {
		restoreFetch();
	}
});

Deno.test("PrismTs - getTable and getSchema", async () => {
	mockFetch(mockSchemaResponse());

	try {
		const prism = new PrismTs("http://localhost:8000");
		await prism.initialize();

		// Test getSchema
		const schema = await prism.getSchema("public");
		assertExists(schema);
		assertEquals(schema.name, "public");

		// Test getTable
		const table = await prism.getTable("public", "users");
		assertExists(table);
		assertEquals(table.name, "users");
		assertEquals(table.columns.length, 3);
	} finally {
		restoreFetch();
	}
});

Deno.test("PrismTs - health check", async () => {
	mockFetch(mockHealthResponse());

	try {
		const prism = new PrismTs("http://localhost:8000");

		const health = await prism.getHealth();
		assertEquals(health.status, "healthy");
		assertEquals(health.databaseConnected, true);
	} finally {
		restoreFetch();
	}
});

// Test the display methods (these don't return values, but shouldn't throw)
Deno.test("PrismTs - display methods", async () => {
	mockFetch(mockSchemaResponse());

	try {
		const prism = new PrismTs("http://localhost:8000");
		await prism.initialize();

		// This should not throw
		await prism.displaySchemaStats();
	} finally {
		restoreFetch();
	}
});
