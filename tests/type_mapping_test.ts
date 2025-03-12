// tests/type_mapping_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { TypeGenerator } from "../src/tools/type-generator.ts";

// Create an instance of TypeGenerator to use its methods
const typeGenerator = new TypeGenerator();

Deno.test("SQL Type Mapping - Basic Types", () => {
	// Test basic SQL types
	assertEquals(typeGenerator.mapSqlTypeToTs("integer"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("boolean"), "boolean");
	assertEquals(typeGenerator.mapSqlTypeToTs("timestamp"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("uuid"), "string");
});

Deno.test("SQL Type Mapping - Types with Length Specifiers", () => {
	// Test SQL types with length/precision
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar(255)"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("numeric(10,2)"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("decimal(16,4)"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("char(1)"), "string");
});

Deno.test("SQL Type Mapping - Array Types", () => {
	// Test array type handling
	assertEquals(typeGenerator.mapSqlTypeToTs("integer[]"), "number[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar[]"), "string[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("text[]"), "string[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("uuid[]"), "string[]");
});

Deno.test("SQL Type Mapping - Special Types", () => {
	// Test special types
	assertEquals(
		typeGenerator.mapSqlTypeToTs("jsonb"),
		"Record<string, unknown>",
	);
	assertEquals(
		typeGenerator.mapSqlTypeToTs("json"),
		"Record<string, unknown>",
	);
	assertEquals(typeGenerator.mapSqlTypeToTs("bytea"), "string");
});

Deno.test("SQL Type Mapping - Time/Date Types", () => {
	// Test time and date types
	assertEquals(
		typeGenerator.mapSqlTypeToTs("timestamp without time zone"),
		"string",
	);
	assertEquals(
		typeGenerator.mapSqlTypeToTs("timestamp with time zone"),
		"string",
	);
	assertEquals(typeGenerator.mapSqlTypeToTs("time"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("date"), "string");
});

Deno.test("SQL Type Mapping - Unusual/Edge Cases", () => {
	// Test unusual types and edge cases
	assertEquals(typeGenerator.mapSqlTypeToTs("unknown_type"), "unknown");
	assertEquals(typeGenerator.mapSqlTypeToTs(""), "unknown");
	assertEquals(typeGenerator.mapSqlTypeToTs("cidr"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("point"), "string");
});

Deno.test("TypeGenerator - Generate Table Interface", () => {
	// Create mock table data
	const mockTable = {
		name: "users",
		schema: "public",
		columns: [
			{
				name: "id",
				type: "uuid",
				nullable: false,
				isPrimaryKey: true,
				isEnum: false,
				references: undefined,
			},
			{
				name: "username",
				type: "varchar",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
			{
				name: "email",
				type: "varchar",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
			{
				name: "is_active",
				type: "boolean",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
			{
				name: "created_at",
				type: "timestamp",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
			{
				name: "profile",
				type: "jsonb",
				nullable: true,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
		],
	};

	// Generate interface
	const result = typeGenerator.generateTableInterface(mockTable);

	// Check interface structure using string contains instead of assertStringIncludes
	assertEquals(result.includes("export interface Users {"), true);
	assertEquals(result.includes("id: string;"), true);
	assertEquals(result.includes("username: string;"), true);
	assertEquals(result.includes("email: string;"), true);
	assertEquals(result.includes("is_active: boolean;"), true);
	assertEquals(result.includes("created_at: string;"), true);
	assertEquals(result.includes("profile?: Record<string, unknown>;"), true);
});

Deno.test("TypeGenerator - Generate Enum", () => {
	// Create mock enum data
	const mockEnum = {
		name: "user_status",
		schema: "public",
		values: ["active", "inactive", "pending"],
	};

	// Generate enum
	const result = typeGenerator.generateEnum(mockEnum);

	// Check enum structure
	assertEquals(result.includes("export enum UserStatus {"), true);
	assertEquals(result.includes('active = "active",'), true);
	assertEquals(result.includes('inactive = "inactive",'), true);
	assertEquals(result.includes('pending = "pending",'), true);
});

Deno.test("TypeGenerator - Generate Query Interface", () => {
	// Create mock table data
	const mockTable = {
		name: "products",
		schema: "public",
		columns: [
			{
				name: "id",
				type: "uuid",
				nullable: false,
				isPrimaryKey: true,
				isEnum: false,
				references: undefined,
			},
			{
				name: "name",
				type: "varchar",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
			{
				name: "price",
				type: "numeric",
				nullable: false,
				isPrimaryKey: false,
				isEnum: false,
				references: undefined,
			},
		],
	};

	// Generate query interface
	const result = typeGenerator.generateQueryInterface(mockTable);

	// Check interface structure
	assertEquals(
		result.includes("export interface ProductsQueryParams {"),
		true,
	);
	assertEquals(result.includes("limit?: number;"), true);
	assertEquals(result.includes("offset?: number;"), true);
	assertEquals(result.includes("order_by?: string;"), true);
	assertEquals(result.includes('order_dir?: "asc" | "desc";'), true);
	assertEquals(result.includes("id?: string;"), true);
	assertEquals(result.includes("name?: string;"), true);
	assertEquals(result.includes("price?: number;"), true);
});

Deno.test("TypeGenerator - PascalCase Conversion", () => {
	// Test various names
	assertEquals(typeGenerator.toPascalCase("user_profiles"), "UserProfiles");
	assertEquals(typeGenerator.toPascalCase("api-keys"), "ApiKeys");
	assertEquals(typeGenerator.toPascalCase("simple"), "Simple");
	assertEquals(
		typeGenerator.toPascalCase("CamelCaseAlready"),
		"Camelcasealready",
	);
	assertEquals(
		typeGenerator.toPascalCase("snake_case_name"),
		"SnakeCaseName",
	);
});

Deno.test("TypeGenerator - Generate Function Types", () => {
	// Create mock function data
	const mockFunction = {
		name: "get_user_by_id",
		schema: "public",
		returnType: "json",
		parameters: [
			{
				name: "user_id",
				type: "uuid",
				mode: "IN",
				hasDefault: false,
				defaultValue: null,
			},
		],
	};

	// Generate function types
	const result = typeGenerator.generateFunctionTypes(mockFunction);

	// Check result structure
	assertEquals(result.includes("export interface GetUserByIdParams {"), true);
	assertEquals(result.includes("user_id: string;"), true);
	assertEquals(
		result.includes(
			"export type GetUserByIdResult = Record<string, unknown>;",
		),
		true,
	);
});

Deno.test("TypeGenerator - Generate Table Function Result", () => {
	// Create mock function with TABLE return type
	const mockFunction = {
		name: "get_users",
		schema: "public",
		returnType: "TABLE(id uuid, username varchar, email varchar)",
		parameters: [],
	};

	// Generate function types
	const result = typeGenerator.generateFunctionTypes(mockFunction);

	// Check result structure
	assertEquals(result.includes("export interface GetUsersResult {"), true);
	assertEquals(result.includes("id: string;"), true);
	assertEquals(result.includes("username: string;"), true);
	assertEquals(result.includes("email: string;"), true);
});
