// tests/type_gen_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  generateEnum,
  generateTableInterface,
  mapSqlTypeToTs,
  toPascalCase,
  TypeGenerator,
} from "../src/tools/type-generator.ts";
import type { SchemaMetadata } from "../src/client/types.ts";

// Test SQL to TS type mapping
Deno.test("mapSqlTypeToTs - basic types", () => {
  assertEquals(mapSqlTypeToTs("integer"), "number");
  assertEquals(mapSqlTypeToTs("varchar(255)"), "string");
  assertEquals(mapSqlTypeToTs("boolean"), "boolean");
  assertEquals(mapSqlTypeToTs("timestamp"), "string");
  assertEquals(mapSqlTypeToTs("jsonb"), "Record<string, unknown>");
});

// Test PascalCase conversion
Deno.test("toPascalCase function", () => {
  assertEquals(toPascalCase("user_profiles"), "UserProfiles");
  assertEquals(toPascalCase("api-tokens"), "ApiTokens");
  assertEquals(toPascalCase("CamelCaseAlready"), "Camelcasealready");
});

// Test interface generation
Deno.test("generateTableInterface function", () => {
  const columns = [
    { name: "id", type: "uuid", nullable: false },
    { name: "username", type: "varchar", nullable: false },
    { name: "email", type: "varchar", nullable: true },
  ];

  const expected =
    `export interface Users {\n  id: string;\n  username: string;\n  email?: string;\n}\n`;
  assertEquals(generateTableInterface("users", columns), expected);
});

// Test enum generation
Deno.test("generateEnum function", () => {
  const values = ["active", "inactive", "pending"];
  const expected =
    `export enum UserStatus {\n  active = "active",\n  inactive = "inactive",\n  pending = "pending",\n}\n`;
  assertEquals(generateEnum("user_status", values), expected);
});

// Test complete type generator with mock schema
Deno.test("TypeGenerator - generateSchemaTypes", () => {
  const generator = new TypeGenerator();

  // Mock schema with all required properties
  const mockSchema: SchemaMetadata = {
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
        ],
      },
    },
    views: {},
    enums: {
      "user_status": {
        name: "user_status",
        schema: "public",
        values: ["active", "inactive"],
      },
    },
    functions: {},
    procedures: {},
    triggers: {},
  };

  const result = generator.generateSchemaTypes(mockSchema);

  // Check if output contains expected type definitions
  assertEquals(result.includes("export interface Users"), true);
  assertEquals(result.includes("export enum UserStatus"), true);
});