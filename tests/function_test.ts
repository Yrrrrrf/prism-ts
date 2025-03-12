// /**
//  * Database function interaction tests for Prism-TS
//  * 
//  * Tests the function and procedure execution capabilities
//  */
// import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
// import { PrismTs } from "../src/mod.ts";

// // Mock fetch for specific function endpoints
// function setupMockFetch() {
//   const originalFetch = globalThis.fetch;
  
//   // Sample function response data
//   const getUserResponse = {
//     id: "123e4567-e89b-12d3-a456-426614174000",
//     username: "testuser",
//     email: "test@example.com",
//     is_active: true
//   };
  
//   // Sample procedure response
//   const updateStatusResponse = {
//     status: "success",
//     message: "Procedure executed successfully"
//   };
  
//   // Mock schemas response with functions and procedures
//   const schemasResponse = [
//     {
//       name: "public",
//       tables: {},
//       views: {},
//       enums: {},
//       functions: {
//         "get_user": {
//           name: "get_user",
//           schema: "public",
//           type: "scalar",
//           objectType: "function",
//           parameters: [
//             { name: "user_id", type: "uuid", mode: "IN", hasDefault: false, defaultValue: null }
//           ],
//           returnType: "json",
//           isStrict: false,
//           description: "Get user by ID"
//         }
//       },
//       procedures: {
//         "update_user_status": {
//           name: "update_user_status",
//           schema: "public",
//           type: "void",
//           objectType: "procedure",
//           parameters: [
//             { name: "user_id", type: "uuid", mode: "IN", hasDefault: false, defaultValue: null },
//             { name: "status", type: "varchar", mode: "IN", hasDefault: false, defaultValue: null }
//           ],
//           returnType: null,
//           isStrict: false,
//           description: "Update user status"
//         }
//       },
//       triggers: {}
//     }
//   ];
  
//   globalThis.fetch = async (input): Promise<Response> => {
//     const url = input instanceof Request ? input.url : input.toString();
//     const method = input instanceof Request ? input.method : "GET";
    
//     // Match schema metadata endpoint
//     if (url.includes("/dt/schemas")) {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => schemasResponse,
//         headers: new Headers(),
//       } as Response;
//     }
    
//     // Match function execution endpoint
//     if (method === "POST" && url.includes("/public/fn/get_user")) {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => getUserResponse,
//         headers: new Headers(),
//       } as Response;
//     }
    
//     // Match procedure execution endpoint
//     if (method === "POST" && url.includes("/public/proc/update_user_status")) {
//       return {
//         ok: true,
//         status: 200,
//         json: async () => updateStatusResponse,
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

// Deno.test("PrismTs - function execution", async () => {
//   const mock = setupMockFetch();
  
//   try {
//     const prism = new PrismTs("http://localhost:8000");
//     await prism.initialize();
    
//     // Test function metadata
//     const func = await prism.getFunction("public", "get_user");
//     assertExists(func);
//     assertEquals(func.name, "get_user");
//     assertEquals(func.parameters.length, 1);
    
//     // Test function execution
//     const userId = "123e4567-e89b-12d3-a456-426614174000";
//     const result = await prism.executeFunction("public", "get_user", {
//       user_id: userId
//     });
    
//     assertEquals(result.id, userId);
//     assertEquals(result.username, "testuser");
//     assertEquals(result.email, "test@example.com");
//   } finally {
//     mock.restore();
//   }
// });

// Deno.test("PrismTs - procedure execution", async () => {
//   const mock = setupMockFetch();
  
//   try {
//     const prism = new PrismTs("http://localhost:8000");
//     await prism.initialize();
    
//     // Test procedure metadata
//     const proc = await prism.getSchema("public")?.procedures.update_user_status;
//     assertExists(proc);
//     assertEquals(proc.name, "update_user_status");
//     assertEquals(proc.parameters.length, 2);
    
//     // Test procedure execution
//     const userId = "123e4567-e89b-12d3-a456-426614174000";
//     await prism.executeProcedure("public", "update_user_status", {
//       user_id: userId,
//       status: "inactive"
//     });
    
//     // Since procedures don't return data, we're just testing that 
//     // the call completes without throwing
//   } finally {
//     mock.restore();
//   }
// });