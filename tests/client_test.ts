/**
 * Basic tests for the Prism-TS client
 */
import {
	assertEquals,
	assertRejects,
} from "https://deno.land/std/testing/asserts.ts";
import { BaseClient, PrismError } from "../src/client/base.ts";

// Store original fetch function
const originalFetch = globalThis.fetch;

// Mock fetch function for testing
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

// Restore original fetch
function restoreFetch(): void {
	globalThis.fetch = originalFetch;
}

// Test BaseClient GET request
Deno.test("BaseClient - GET request", async () => {
	// Mock successful response
	mockFetch({ data: "test value" });

	try {
		const client = new BaseClient("http://example.com");
		const result = await client.get("/test");

		assertEquals(result, { data: "test value" });
	} finally {
		restoreFetch();
	}
});

// Test BaseClient POST request
Deno.test("BaseClient - POST request", async () => {
	// Mock successful response
	mockFetch({ id: 1, name: "Created" });

	try {
		const client = new BaseClient("http://example.com");
		const result = await client.post("/test", { name: "Test" });

		assertEquals(result, { id: 1, name: "Created" });
	} finally {
		restoreFetch();
	}
});

// Test error handling
Deno.test("BaseClient - Error handling", async () => {
	// Mock error response
	mockFetch({ error: "Not found" }, 404);

	try {
		const client = new BaseClient("http://example.com");

		await assertRejects(
			async () => await client.get("/not-found"),
			PrismError,
			"HTTP error 404",
		);
	} finally {
		restoreFetch();
	}
});

// Test URL building with query parameters
Deno.test("BaseClient - URL with query parameters", async () => {
	// Use a spy to capture the URL
	let capturedUrl = "";

	globalThis.fetch = async (
		url: string | URL | Request,
		_init?: RequestInit,
	): Promise<Response> => {
		capturedUrl = url.toString();
		return {
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({}),
			headers: new Headers(),
		} as Response;
	};

	try {
		const client = new BaseClient("http://example.com");
		await client.get("/test", {
			params: {
				name: "value",
				count: 42,
				active: true,
			},
		});

		// Verify URL includes query parameters
		assertEquals(
			capturedUrl,
			"http://example.com/test?name=value&count=42&active=true",
		);
	} finally {
		restoreFetch();
	}
});
