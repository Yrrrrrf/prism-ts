/**
 * TypeScript type generator for Prism-TS
 * Maps database schemas to TypeScript interfaces and types
 */

import { log } from "../tools/logging.ts";
import { SchemaMetadata } from "../client/types.ts";

/**
 * Maps SQL types to TypeScript types
 */
export function mapSqlTypeToTs(sqlType: string): string {
	// Normalize and lowercase the SQL type
	const normalizedType = sqlType.toLowerCase().replace(/\(.*\)/, "").trim();

	// Handle array types
	if (normalizedType.endsWith("[]")) {
		const baseType = normalizedType.slice(0, -2);
		return `${mapSqlTypeToTs(baseType)}[]`;
	}

	// Map types based on SQL type
	switch (normalizedType) {
		// Numeric types
		case "smallint":
		case "integer":
		case "bigint":
		case "decimal":
		case "numeric":
		case "real":
		case "double precision":
		case "serial":
		case "bigserial":
			return "number";

		// String types
		case "varchar":
		case "character varying":
		case "char":
		case "character":
		case "text":
		case "uuid":
		case "inet":
		case "cidr":
		case "macaddr":
			return "string";

		// Boolean type
		case "boolean":
		case "bool":
			return "boolean";

		// Date/Time types (represented as strings in TS)
		case "timestamp":
		case "timestamp with time zone":
		case "timestamp without time zone":
		case "date":
		case "time":
		case "time with time zone":
		case "time without time zone":
			return "string";

		// JSON types
		case "json":
		case "jsonb":
			return "Record<string, unknown>";

		// Unknown or unhandled types
		default:
			return "unknown";
	}
}

/**
 * Converts a string to PascalCase
 */
export function toPascalCase(str: string): string {
	return str
		.split(/[^a-zA-Z0-9]+/)
		.map((word) =>
			word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join("");
}

/**
 * Generates TypeScript interface for a table
 */
export function generateTableInterface(
	tableName: string,
	columns: Array<{ name: string; type: string; nullable: boolean }>,
): string {
	const interfaceName = toPascalCase(tableName);

	let code = `export interface ${interfaceName} {\n`;

	for (const column of columns) {
		const tsType = mapSqlTypeToTs(column.type);
		const nullable = column.nullable ? "?" : "";
		code += `  ${column.name}${nullable}: ${tsType};\n`;
	}

	code += "}\n";
	return code;
}

/**
 * Generates TypeScript enum
 */
export function generateEnum(enumName: string, values: string[]): string {
	const typeName = toPascalCase(enumName);

	let code = `export enum ${typeName} {\n`;

	for (const value of values) {
		// Clean up the value to be a valid TypeScript identifier
		const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, "_");
		code += `  ${cleanValue} = "${value}",\n`;
	}

	code += "}\n";
	return code;
}

/**
 * Main TypeGenerator class
 */
export class TypeGenerator {
	/**
	 * Generate TypeScript types from schema metadata
	 */
	async generateTypes(
		schemas: SchemaMetadata[],
		outputDir: string = "./src/gen",
	): Promise<void> {
		log.info(`Generating TypeScript types in ${outputDir}`);

		try {
			// Ensure output directory exists
			try {
				await Deno.mkdir(outputDir, { recursive: true });
			} catch (err) {
				if (!(err instanceof Deno.errors.AlreadyExists)) {
					throw err;
				}
			}

			// Process each schema
			for (const schema of schemas) {
				const content = this.generateSchemaTypes(schema);

				// Write file for this schema
				const filename = `${outputDir}/types-${schema.name}.ts`;
				await Deno.writeTextFile(filename, content);
				log.debug(`Generated types for schema: ${schema.name}`);
			}

			// Generate index file
			await this.generateIndexFile(schemas, outputDir);

			log.info(
				`Successfully generated types for ${schemas.length} schemas`,
			);
		} catch (error) {
			log.error(`Error generating types: ${error}`);
			throw error;
		}
	}

	/**
	 * Generate types for a single schema
	 */
	generateSchemaTypes(schema: SchemaMetadata): string {
		let content = `/**
 * Generated TypeScript types for the "${schema.name}" schema
 * Generated on: ${new Date().toISOString()}
 */

`;

		// Generate table interfaces
		if (Object.keys(schema.tables).length > 0) {
			content += "// Table interfaces\n";
			for (const [tableName, table] of Object.entries(schema.tables)) {
				const columns = table.columns.map((col) => ({
					name: col.name,
					type: col.type,
					nullable: col.nullable,
				}));

				content += generateTableInterface(tableName, columns);
				content += "\n";
			}
		}

		// Generate view interfaces
		if (Object.keys(schema.views).length > 0) {
			content += "// View interfaces\n";
			for (const [viewName, view] of Object.entries(schema.views)) {
				const columns = view.columns.map((col) => ({
					name: col.name,
					type: col.type,
					nullable: col.nullable,
				}));

				content += generateTableInterface(`${viewName}View`, columns);
				content += "\n";
			}
		}

		// Generate enum types
		if (Object.keys(schema.enums).length > 0) {
			content += "// Enum types\n";
			for (const [enumName, enumInfo] of Object.entries(schema.enums)) {
				content += generateEnum(enumInfo.name, enumInfo.values);
				content += "\n";
			}
		}

		return content;
	}

	/**
	 * Generate index file that exports all types
	 */
	async generateIndexFile(
		schemas: SchemaMetadata[],
		outputDir: string,
	): Promise<void> {
		let content = `/**
 * Index file for generated TypeScript types
 * Generated on: ${new Date().toISOString()}
 */

`;

		// Add exports for each schema
		for (const schema of schemas) {
			content += `export * from './types-${schema.name}';\n`;
		}

		// Write the index file
		const filename = `${outputDir}/index.ts`;
		await Deno.writeTextFile(filename, content);
		log.debug(`Generated index file: ${filename}`);
	}
}
