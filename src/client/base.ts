/**
 * Base HTTP client for making requests to Prism-PY APIs
 */

export interface RequestOptions {
	params?: Record<string, string | number | boolean>;
	headers?: Record<string, string>;
	timeout?: number;
}

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

export class BaseClient {
	constructor(private baseUrl: string) {
		// Ensure baseUrl ends with a slash
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
	}

	async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		return this.request<T>({ ...options, method: "GET", endpoint });
	}

	async post<T>(
		endpoint: string,
		data?: unknown,
		options: RequestOptions = {},
	): Promise<T> {
		return this.request<T>({ ...options, method: "POST", endpoint, data });
	}

	async put<T>(
		endpoint: string,
		data?: unknown,
		options: RequestOptions = {},
	): Promise<T> {
		return this.request<T>({ ...options, method: "PUT", endpoint, data });
	}

	async delete<T>(
		endpoint: string,
		options: RequestOptions = {},
	): Promise<T> {
		return this.request<T>({ ...options, method: "DELETE", endpoint });
	}

	private async request<T>(
		{ endpoint, method, data, params, headers, timeout = 10000 }: {
			endpoint: string;
			method: string;
			data?: unknown;
			params?: Record<string, string | number | boolean>;
			headers?: Record<string, string>;
			timeout?: number;
		},
	): Promise<T> {
		const url = this.buildUrl(endpoint, params);
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					...headers,
				},
				body: data ? JSON.stringify(data) : undefined,
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new PrismError(
					`HTTP error ${response.status}: ${response.statusText}`,
					"HTTP_ERROR",
					response.status,
					await response.json().catch(() => null),
				);
			}

			return await response.json();
		} finally {
			clearTimeout(timeoutId);
		}
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
				if (value !== null && value !== undefined) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		return url.toString();
	}
}
