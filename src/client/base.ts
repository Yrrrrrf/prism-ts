/**
 * Base HTTP client for making requests to prism-py APIs
 */

export class PrismError extends Error {
	constructor(
		message: string,
		public code: string,
		public status?: number,
		public details?: unknown,
	) {
		super(message);
		this.name = "PrismError";
	}
}

export interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
	timeout?: number;
}

export class BaseClient {
	constructor(private baseUrl: string) {
		// Ensure baseUrl ends with a slash
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
	}

	async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		// Basic implementation - will be expanded
		const url = this.buildUrl(endpoint, options.params);
		const response = await fetch(url, {
			...options,
			method: "GET",
		});

		if (!response.ok) {
			throw new PrismError(
				`HTTP error: ${response.status}`,
				"HTTP_ERROR",
				response.status,
			);
		}

		return await response.json();
	}

	private buildUrl(
		endpoint: string,
		params?: Record<string, string | number | boolean>,
	): string {
		const cleanEndpoint = endpoint.startsWith("/")
			? endpoint.slice(1)
			: endpoint;
		const url = new URL(cleanEndpoint, this.baseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		return url.toString();
	}
}
