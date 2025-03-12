// /**
//  * Integration test for Prism-TS
//  * 
//  * This mimics the workflow from the TS-Forge examples
//  */
// import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
// import { PrismTs, BaseClient } from "../src/mod.ts";

// // Interface for user type
// interface User {
//   id: string;
//   username: string;
//   email: string;
//   is_active: boolean;
// }

// // Mock a comprehensive API
// function setupComplexMock() {
//   const originalFetch = globalThis.fetch;
//   const mockData = {
//     schemas: [
//       {
//         name: "public",
//         tables: {
//           "users": {
//             name: "users",
//             schema: "public",
//             columns: [
//               { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
//               { name: "username", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "email", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "is_active", type: "boolean", nullable: false, isPrimaryKey: false, isEnum: false }
//             ]
//           }
//         },
//         views: {
//           "active_users": {
//             name: "active_users",
//             schema: "public",
//             columns: [
//               { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
//               { name: "username", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "email", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false }
//             ]
//           }
//         },
//         enums: {},
//         functions: {
//           "get_user_count": {
//             name: "get_user_count",
//             schema: "public",
//             type: "scalar",
//             objectType: "function",
//             parameters: [],
//             returnType: "integer",
//             isStrict: false,
//             description: "Get total user count"
//           }
//         },
//         procedures: {},
//         triggers: {}
//       },
//       {
//         name: "account",
//         tables: {
//           "profile": {
//             name: "profile",
//             schema: "account",
//             columns: [
//               { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
//               { name: "username", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "email", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "full_name", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
//               { name: "status", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: true }
//             ]
//           }
//         },
//         views: {},
//         enums: {},
//         functions: {},
//         procedures: {},
//         triggers: {}
//       }
//     ],
//     users: [
//       {
//         id: "123e4567-e89b-12d3-a456-426614174000",
//         username: "johndoe",
//         email: "john@example.com",
//         is_active: true
//       },
//       {
//         id: "223e4567-e89b-12d3-a456-426614174001",
//         username: "janedoe",
//         email: "jane@example.com",
//         is_active: false
//       }
//     ],
//     health: {
//       status: "healthy",
//       timestamp: new Date().toISOString(),
//       version: "0.1.0",
//       uptime: 60.0,
//       databaseConnected: true
//     },
//     userCount: {
//       result: 42
//     }
//   };
  
//   globalThis.fetch = async (input): Promise<Response> => {
//     const url = input instanceof Request ? input.url : input.toString();
//     const method = input instanceof Request ? input.method : "GET";
    
//     // Match specific endpoints
//     if (url.includes("/dt/schemas")) {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => mockData.schemas,
//         headers: new Headers(),
//       } as Response;
//     }
    
//     if (url.includes("/public/users") && method === "GET") {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => mockData.users.filter(u => u.is_active),
//         headers: new Headers(),
//       } as Response;
//     }
    
//     if (url.includes("/public/fn/get_user_count") && method === "POST") {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => mockData.userCount,
//         headers: new Headers(),
//       } as Response;
//     }
    
//     if (url.includes("/health")) {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => mockData.health,
//         headers: new Headers(),
//       } as Response;
//     }
    
//     // Default 404 response
//     return {
//       ok: false,
//       status: 404,
//       json: async () => ({ error: "Not Found" }),
//       headers: new Headers(),
//     } as Response;
//   };
  
//   return {
//     restore: () => {
//       globalThis.fetch = originalFetch;
//     }
//   };
// }

// // Custom test runner to mimic TS-Forge's testCrudOperations
// async function testCrudOperations<T extends { id: string }>(
//   prism: PrismTs,
//   schemaName: string,
//   tableName: string,
//   sampleData: Omit<T, "id">
// ): Promise<{ success: boolean; operations: string[] }> {
//   const operations: string[] = [];
//   let success = true;
  
//   try {
//     // Get table operations
//     const crud = await prism.getTableOperations<T>(schemaName, tableName);
//     operations.push("getTableOperations");
    
//     // Add a unique ID for testing
//     const testId = crypto.randomUUID();
//     const testData = { ...sampleData, id: testId } as T;
    
//     // Create
//     await crud.create(testData);
//     operations.push("create");
    
//     // Read
//     const found = await crud.findOne(testId);
//     operations.push("findOne");
    
//     // Query with filters
//     const filtered = await crud.findMany({ where: { id: testId } });
//     operations.push("findMany");
    
//     // Update
//     await crud.update(testId, { ...sampleData });
//     operations.push("update");
    
//     // Delete
//     await crud.delete(testId);
//     operations.push("delete");
    
//   } catch (error) {
//     console.error(`Test error:`, error);
//     success = false;
//   }
  
//   return { success, operations };
// }

// Deno.test("Integration - Mimic TS-Forge example workflow", async () => {
//   const mock = setupComplexMock();
  
//   try {
//     // Initialize client like in 00-gen-types.ts
//     const prism = new PrismTs("http://localhost:8000");
//     await prism.initialize();
    
//     // Display schemas (mimic display() method from TS-Forge)
//     await prism.displaySchemaStats();
    
//     // Get health status like in TS-Forge
//     const health = await prism.getHealth();
//     assertEquals(health.status, "healthy");
    
//     // Check schema access
//     const schemas = await prism.getSchemas();
//     assertEquals(schemas.length, 2);
    
//     // Get table operations like in 00-test-ex.ts
//     const userOps = await prism.getTableOperations<User>("public", "users");
//     assertExists(userOps);
    
//     // Test filtering like in 04-views.ts
//     const activeUsers = await userOps.findMany({ 
//       where: { is_active: true }
//     });
//     assertEquals(activeUsers.length, 1);
//     assertEquals(activeUsers[0].username, "johndoe");
    
//     // Test function execution
//     const countResult = await prism.executeFunction("public", "get_user_count");
//     assertEquals(countResult.result, 42);
//   } finally {
//     mock.restore();
//   }
// });

// // Test the testing framework from TS-Forge
// Deno.test("Integration - Test framework compatibility", async () => {
//   const mock = setupComplexMock();
  
//   try {
//     const prism = new PrismTs("http://localhost:8000");
//     await prism.initialize();
    
//     // Similar to example in 02.ts
//     const sampleProfile = {
//       username: `test-user-${Date.now()}`,
//       email: `test${Date.now()}@example.com`,
//       full_name: "Test User",
//       status: "active"
//     };
    
//     // Run test operations
//     const result = await testCrudOperations(prism, "account", "profile", sampleProfile);
    
//     // Verify all operations were called
//     assertEquals(result.operations.includes("getTableOperations"), true);
//     assertEquals(result.operations.includes("create"), true);
//     assertEquals(result.operations.includes("findOne"), true);
//     assertEquals(result.operations.includes("findMany"), true);
//     assertEquals(result.operations.includes("update"), true);
//     assertEquals(result.operations.includes("delete"), true);
//   } finally {
//     mock.restore();
//   }
// });