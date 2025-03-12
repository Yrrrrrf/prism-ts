<h1 align="center">
  <img src="https://raw.githubusercontent.com/Yrrrrrf/prism-ts/main/resources/img/prism.png" alt="Prism Icon" width="128" height="128" description="A prism that can take one light source and split it into multiple colors!">
  <div align="center">prism-ts</div>
</h1>

<div align="center">

<!-- [![JSR](https://jsr.io/badges/prism-ts)](https://jsr.io/prism-ts) -->
[![GitHub: Prism-TS](https://img.shields.io/badge/GitHub-pristm--ts-181717?logo=github)](https://github.com/Yrrrrrf/prism-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)
<!-- [![Downloads](https://img.shields.io/npm/dt/@jsr/prism-ts)](https://www.npmjs.com/package/@jsr/prism-ts) -->

</div>

## Overview

prism-ts is a TypeScript library designed to create a seamless bridge between
[prism-py](https://github.com/Yrrrrrf/prism-py) generated APIs and frontend
applications. It provides full type safety, automatic type generation, and a
comprehensive set of utilities for interacting with your database-driven API.

This library is part of the Prism ecosystem:

- **prism-py**: Python library that generates APIs from database schemas
- **prism-ts**: TypeScript client that consumes prism-py APIs with full type
  safety

## Features

- **🔒 Type-Safe API Client**: Fully typed requests and responses
- **🔄 Code Generation**: Generate TypeScript interfaces from database schemas
- **📚 Metadata Explorer**: Explore your API structure programmatically
- **🔧 CRUD Operations**: Standardized operations for all database tables
- **🔍 Type Inference**: Leverages TypeScript's type system for excellent IDE
  support
- **📝 Query Builder**: Type-safe filter construction for API requests
- **🧩 Zero Configuration**: Works out of the box with prism-py APIs

## Installation

```bash
# Using Deno
deno add @jsr/prism-ts

# Using npm via deno2node
npm install @jsr/prism-ts
```

## Quick Start

```typescript
import { BaseClient, PrismTs } from "@jsr/prism-ts";

// Initialize the client pointing to your prism-py API
const client = new BaseClient("http://localhost:8000");
const prism = new PrismTs(client);

// Initialize and load schema metadata
await prism.initialize();

// Generate TypeScript types (during development)
await prism.generateTypes();

// Get type-safe operations for a specific table
const userOperations = await prism.getTableOperations("public", "users");

// Fetch with filtering, sorting, and pagination
const activeUsers = await userOperations.findMany({
	where: { status: "active" },
	orderBy: { created_at: "desc" },
	limit: 10,
	offset: 0,
});

// Create a new record
const newUser = await userOperations.create({
	username: "johndoe",
	email: "john@example.com",
	status: "active",
});

// Update a record
await userOperations.update(newUser.id, {
	status: "inactive",
});

// Delete a record
await userOperations.delete(newUser.id);
```

## Type Generation

prism-ts can automatically generate TypeScript interfaces from your prism-py
API:

```typescript
import { BaseClient, PrismTs } from "@jsr/prism-ts";

const client = new BaseClient("http://localhost:8000");
const prism = new PrismTs(client);

// Generate all types to a directory
await prism.generateTypes("./src/types");

// Now you can import these generated types
import { Product, User } from "./src/types";
```

## API Operations

### Table Operations

```typescript
// Get operations for a specific table
const productOps = await prism.getTableOperations("store", "products");

// Create
const product = await productOps.create({
	name: "New Product",
	price: 29.99,
	category_id: 5,
});

// Read with complex filtering
const featuredProducts = await productOps.findMany({
	where: {
		is_featured: true,
		category_id: 5,
	},
	orderBy: {
		price: "asc",
	},
	limit: 20,
});

// Update
await productOps.update(product.id, {
	price: 24.99,
	is_featured: false,
});

// Delete
await productOps.delete(product.id);
```

### Metadata Operations

```typescript
// Get all database schemas
const schemas = await prism.getSchemas();

// Explore a specific schema
const publicSchema = await prism.getSchema("public");

// Get all tables in a schema
const tables = await prism.getTables("public");

// Get information about a specific table
const userTable = await prism.getTable("public", "users");
```

## Why prism-ts?

- **End-to-End Type Safety**: From database to frontend
- **Zero Boilerplate**: No manual typing of API responses
- **Automatic Updates**: Types stay in sync with database changes
- **Developer Experience**: Great IDE integration with auto-completion
- **Database-First Development**: Build your API around your data model

## Integration with prism-py

prism-ts is designed to work seamlessly with
[prism-py](https://github.com/Yrrrrrf/prism-py), a Python library that generates
APIs from database schemas. Together, they provide a complete solution for
rapid, type-safe application development:

1. Define your database schema
2. Generate an API with prism-py
3. Connect to the API with prism-ts
4. Build your frontend with full type safety

## Requirements

- Deno ≥ 1.36.0 (for Deno projects)
- Node.js ≥ 18.0.0 (when using with npm via deno2node)
- A prism-py API to connect to

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
