import type { ApiErrorResponse } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const TOKEN_STORAGE_KEY = 'auth_token';

type Primitive = string | number | boolean;

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	auth?: boolean;
	headers?: HeadersInit;
	query?: Record<string, Primitive | undefined>;
}

export class ApiClientError extends Error {
	status: number;
	backendError?: ApiErrorResponse;

	constructor(message: string, status: number, backendError?: ApiErrorResponse) {
		super(message);
		this.name = 'ApiClientError';
		this.status = status;
		this.backendError = backendError;
	}
}

const buildUrl = (path: string, query?: RequestOptions['query']) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(`${API_BASE_URL}${normalizedPath}`);

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	return url.toString();
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const candidate = value as Partial<ApiErrorResponse>;
	return (
		typeof candidate.status === 'number' &&
		typeof candidate.error === 'string' &&
		typeof candidate.message === 'string' &&
		typeof candidate.path === 'string'
	);
};

const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const parseResponseBody = async (response: Response): Promise<unknown> => {
	if (response.status === 204) {
		return undefined;
	}

	const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
	if (contentType.includes('application/json')) {
		return response.json();
	}

	return response.text();
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
	const method = options.method ?? 'GET';
	const headers = new Headers(options.headers);

	headers.set('Accept', 'application/json, text/plain, */*');

	const shouldUseAuth = options.auth ?? true;
	if (shouldUseAuth) {
		const token = getAuthToken();
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
	}

	let body: BodyInit | undefined;
	if (options.body !== undefined && options.body !== null) {
		const isFormData = options.body instanceof FormData;
		if (isFormData) {
			body = options.body as FormData;
		} else {
			headers.set('Content-Type', 'application/json');
			body = JSON.stringify(options.body);
		}
	}

	const response = await fetch(buildUrl(path, options.query), {
		method,
		headers,
		body,
	});

	const payload = await parseResponseBody(response);

	if (!response.ok) {
		const backendError = isApiErrorResponse(payload) ? payload : undefined;
		const errorMessage = backendError?.message ?? response.statusText ?? 'Request failed';
		throw new ApiClientError(errorMessage, response.status, backendError);
	}

	return payload as T;
};

export const apiClient = {
	request,
	get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
		request<T>(path, { ...options, method: 'GET' }),
	post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
		request<T>(path, { ...options, method: 'POST', body }),
	put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
		request<T>(path, { ...options, method: 'PUT', body }),
	patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
		request<T>(path, { ...options, method: 'PATCH', body }),
	delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
		request<T>(path, { ...options, method: 'DELETE' }),
};

export const authStorage = {
	tokenKey: TOKEN_STORAGE_KEY,
};

export const appConfig = {
	apiBaseUrl: API_BASE_URL,
};
