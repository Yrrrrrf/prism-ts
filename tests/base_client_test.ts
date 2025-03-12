export function add(a: number, b: number): number {
	return a + b;
}

import { assertEquals } from "jsr:@std/assert";

Deno.test("simple test", () => {
	const x = 1 + 2;
	assertEquals(x, 3);
});

import { delay } from "jsr:@std/async";

Deno.test("async test", async () => {
	const x = 1 + 2;
	await delay(100);
	assertEquals(x, 3);
});

Deno.test("BaseClient - should append trailing slash to baseUrl", () => {
	// const client = new BaseClient("http://localhost:8000");
	// @ts-ignore - accessing private property for testing
	// assertEquals(client.baseUrl, "http://localhost:8000/");
});

// Deno.test({
// 	name: "read file test",
// 	permissions: { read: true },
// 	fn: () => {
// 		const data = Deno.readTextFileSync("./somefile.txt");
// 		assertEquals(data, "expected content");
// 	},
// });
