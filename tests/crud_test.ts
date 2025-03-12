/**
 * CRUD operations tests for Prism-TS
 *
 * Tests the table operations functionality from TS-Forge
 */
import {
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { BaseClient, createCrudOperations, PrismTs } from "../src/mod.ts";

// Helper to mock fetch for specific endpoints
function setupMockFetch() {
	const originalFetch = globalThis.fetch;
	const mockResponses = new Map<string, { status: number; data: unknown }>();

	globalThis.fetch = async (input): Promise<Response> => {
		const url = input instanceof Request ? input.url : input.toString();
		const method = input instanceof Request ? input.method : "GET";

		// Extract endpoint from URL for matching
		const urlObj = new URL(url);
		const endpoint = urlObj.pathname;
		const key = `${method}:${endpoint}`;

		const mockResponse = mockResponses.get(key);

		if (mockResponse) {
			return {
				ok: mockResponse.status >= 200 && mockResponse.status < 300,
				status: mockResponse.status,
				statusText: mockResponse.status === 200 ? "OK" : "Error",
				json: async () => mockResponse.data,
				text: async () => JSON.stringify(mockResponse.data),
				headers: new Headers(),
			} as Response;
		}

		console.warn(`No mock response for: ${key}`);
		return {
			ok: false,
			status: 404,
			statusText: "Not Found",
			json: async () => ({ error: "Not Found" }),
			text: async () => "Not Found",
			headers: new Headers(),
		} as Response;
	};

	return {
		addMock: (
			method: string,
			endpoint: string,
			data: unknown,
			status = 200,
		) => {
			mockResponses.set(`${method}:${endpoint}`, { status, data });
		},
		restore: () => {
			globalThis.fetch = originalFetch;
		},
	};
}

// User interface for testing
interface User {
	id: string;
	username: string;
	email: string;
	is_active: boolean;
}

Deno.test("TableOperations - getTableOperations functionality", async () => {
	const mock = setupMockFetch();

	// Mock responses for schemas and CRUD operations
	mock.addMock("GET", "/dt/schemas", [
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
						{
							name: "is_active",
							type: "boolean",
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
	]);

	try {
		const prism = new PrismTs("http://localhost:8000");
		await prism.initialize();

		// Test getting table operations
		const userOps = await prism.getTableOperations<User>("public", "users");
		assertExists(userOps);
		assertExists(userOps.findAll);
		assertExists(userOps.findOne);
		assertExists(userOps.create);
		assertExists(userOps.update);
		assertExists(userOps.delete);
		assertExists(userOps.findMany);
		assertExists(userOps.count);
	} finally {
		mock.restore();
	}
});

Deno.test("TableOperations - CRUD methods", async () => {
	const mock = setupMockFetch();
	const userId = "123e4567-e89b-12d3-a456-426614174000";

	// Sample user data
	const sampleUser: User = {
		id: userId,
		username: "testuser",
		email: "test@example.com",
		is_active: true,
	};

	// Mock CRUD endpoints
	mock.addMock("GET", "/public/users", [sampleUser]);
	mock.addMock("POST", "/public/users", sampleUser);
	mock.addMock("PUT", "/public/users", {
		updated_count: 1,
		updated_data: [sampleUser],
	});
	mock.addMock("DELETE", "/public/users", {
		message: "1 resource(s) deleted successfully",
		deleted_resources: [sampleUser],
	});
	mock.addMock("GET", "/public/users/count", { count: 1 });

	try {
		// Direct use of createCrudOperations (like in TS-Forge example 04-views.ts)
		const client = new BaseClient("http://localhost:8000");
		const userOps = createCrudOperations<User>(client, "public", "users");

		// Test create
		const createdUser = await userOps.create(sampleUser);
		assertEquals(createdUser.id, userId);
		assertEquals(createdUser.username, "testuser");

		// Test findAll
		const users = await userOps.findAll();
		assertEquals(users.length, 1);
		assertEquals(users[0].id, userId);

		// Test findMany with filtering
		const filteredUsers = await userOps.findMany({
			where: { is_active: true },
		});
		assertEquals(filteredUsers.length, 1);
		assertEquals(filteredUsers[0].email, "test@example.com");

		// Test update
		const updatedUser = await userOps.update(userId, {
			email: "updated@example.com",
		});
		assertEquals(updatedUser.id, userId);

		// Test count
		const count = await userOps.count({ where: { is_active: true } });
		assertEquals(count, 1);

		// Test delete
		await userOps.delete(userId);
	} finally {
		mock.restore();
	}
});

Deno.test("TableOperations - Error handling", async () => {
	const mock = setupMockFetch();

	// Mock error response
	mock.addMock("GET", "/public/users", [], 404);

	try {
		const client = new BaseClient("http://localhost:8000");
		const userOps = createCrudOperations<User>(client, "public", "users");

		// Test error handling in findOne
		await assertRejects(
			async () => await userOps.findOne("nonexistent-id"),
			Error,
			"No record found with ID",
		);
	} finally {
		mock.restore();
	}
});
