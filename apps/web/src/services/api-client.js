const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'presisso_token';
class ApiClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    }
    async request(method, path, body) {
        const headers = {};
        const token = this.getToken();
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        if (body)
            headers['Content-Type'] = 'application/json';
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (res.status === 401) {
            this.clearToken();
            window.location.href = '/login';
            throw new Error('Session expired');
        }
        let data;
        const text = await res.text();
        try {
            data = text ? JSON.parse(text) : {};
        }
        catch {
            throw new ApiError(`El servidor respondió con contenido no válido (status ${res.status})`, res.status);
        }
        if (!res.ok) {
            const msg = data?.error ||
                data?.message ||
                'Error desconocido';
            throw new ApiError(msg, res.status, data);
        }
        return data;
    }
    get(path) {
        return this.request('GET', path);
    }
    post(path, body) {
        return this.request('POST', path, body);
    }
    put(path, body) {
        return this.request('PUT', path, body);
    }
    delete(path) {
        return this.request('DELETE', path);
    }
}
export class ApiError extends Error {
    status;
    data;
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}
export const api = new ApiClient(API_BASE);
