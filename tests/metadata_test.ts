/**
 * Metadata functionality tests for Prism-TS
 * 
 * Tests interaction with schema metadata endpoints
 */
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { PrismTs, MetadataClient, BaseClient } from "../src/mod.ts";

// Mock responses
const mockSchemas = [
  {
    name: "public",
    tables: {
      "users": {
        name: "users",
        schema: "public",
        columns: [
          { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
          { name: "username", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false }
        ]
      }
    },
    views: {
      "active_users": {
        name: "active_users",
        schema: "public",
        columns: [
          { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
          { name: "username", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false }
        ]
      }
    },
    enums: {
      "user_status": {
        name: "user_status",
        schema: "public",
        values: ["active", "inactive", "suspended"]
      }
    },
    functions: {
      "get_user": {
        name: "get_user",
        schema: "public",
        type: "scalar",
        objectType: "function",
        parameters: [
          { name: "user_id", type: "uuid", mode: "IN", hasDefault: false, defaultValue: null }
        ],
        returnType: "json",
        isStrict: false,
        description: "Get user by ID"
      }
    },
    procedures: {},
    triggers: {}
  },
  {
    name: "account",
    tables: {
      "profile": {
        name: "profile",
        schema: "account",
        columns: [
          { name: "id", type: "uuid", nullable: false, isPrimaryKey: true, isEnum: false },
          { name: "full_name", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
          { name: "email", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: false },
          { name: "status", type: "varchar", nullable: false, isPrimaryKey: false, isEnum: true }
        ]
      }
    },
    views: {},
    enums: {},
    functions: {},
    procedures: {},
    triggers: {}
  }
];

// Helper to set up mock fetch
function setupMock() {
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async (url: URL | Request | string): Promise<Response> => {
    const urlStr = url.toString();
    
    // Match specific endpoints
    if (urlStr.includes("/dt/schemas")) {
      return {
        ok: true,
        status: 200,
        json: async () => mockSchemas,
        headers: new Headers(),
      } as Response;
    }
    
    if (urlStr.includes("/dt/public/tables")) {
      return {
        ok: true,
        status: 200,
        json: async () => [mockSchemas[0].tables.users],
        headers: new Headers(),
      } as Response;
    }
    
    if (urlStr.includes("/dt/public/views")) {
      return {
        ok: true,
        status: 200,
        json: async () => [mockSchemas[0].views.active_users],
        headers: new Headers(),
      } as Response;
    }
    
    if (urlStr.includes("/dt/public/enums")) {
      return {
        ok: true,
        status: 200,
        json: async () => [mockSchemas[0].enums.user_status],
        headers: new Headers(),
      } as Response;
    }
    
    if (urlStr.includes("/dt/public/functions")) {
      return {
        ok: true,
        status: 200,
        json: async () => [mockSchemas[0].functions.get_user],
        headers: new Headers(),
      } as Response;
    }
    
    if (urlStr.includes("/health")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "0.1.0",
          uptime: 60.0,
          databaseConnected: true
        }),
        headers: new Headers(),
      } as Response;
    }
    
    // Default response for unmatched URLs
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: "Not Found" }),
      headers: new Headers(),
    } as Response;
  };
  
  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    }
  };
}

Deno.test("PrismTs - schema metadata access", async () => {
  const mock = setupMock();
  
  try {
    const prism = new PrismTs("http://localhost:8000");
    await prism.initialize();
    
    // Test getSchemas
    const schemas = await prism.getSchemas();
    assertEquals(schemas.length, 2);
    assertEquals(schemas[0].name, "public");
    assertEquals(schemas[1].name, "account");
    
    // Test getSchema
    const publicSchema = await prism.getSchema("public");
    assertExists(publicSchema);
    assertEquals(publicSchema.name, "public");
    
    // Test table access
    assertExists(publicSchema.tables.users);
    assertEquals(publicSchema.tables.users.columns.length, 2);
    
    // Test view access
    assertExists(publicSchema.views.active_users);
    
    // Test enum access
    assertExists(publicSchema.enums.user_status);
    assertEquals(publicSchema.enums.user_status.values.length, 3);
    
    // Test function access
    assertExists(publicSchema.functions.get_user);
    assertEquals(publicSchema.functions.get_user.parameters.length, 1);
  } finally {
    mock.restore();
  }
});

Deno.test("MetadataClient - direct endpoint access", async () => {
  const mock = setupMock();
  
  try {
    const client = new BaseClient("http://localhost:8000");
    const metadataClient = new MetadataClient(client);
    
    // Test direct endpoint access
    const tables = await metadataClient.getTables("public");
    assertEquals(tables.length, 1);
    assertEquals(tables[0].name, "users");
    
    const views = await metadataClient.getViews("public");
    assertEquals(views.length, 1);
    assertEquals(views[0].name, "active_users");
    
    const enums = await metadataClient.getEnums("public");
    assertEquals(enums.length, 1);
    assertEquals(enums[0].name, "user_status");
    
    const functions = await metadataClient.getFunctions("public");
    assertEquals(functions.length, 1);
    assertEquals(functions[0].name, "get_user");
    
    // Test health endpoints
    const health = await metadataClient.getHealth();
    assertEquals(health.status, "healthy");
    assertEquals(health.databaseConnected, true);
  } finally {
    mock.restore();
  }
});