import { auth } from './firebase';

/**
 * The one API-client pattern for this template.
 *
 * Copy this file per domain entity (e.g. `taskService.js`), rename the paths
 * and functions, and you have a typed-ish client that:
 *   - reads the API base URL from an env var
 *   - attaches a Bearer token on every request
 *   - throws a real Error (with .status / .payload) on non-2xx responses
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function getAuthToken() {
  // Real Firebase session takes precedence.
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to get Firebase ID token, falling back to mock:', err);
    }
  }
  // Dev fallback: mock-<Role> token the backend understands when mock auth is on.
  const role = localStorage.getItem('lastSelectedRole') || 'Employee';
  return `mock-${role}`;
}

async function request(path, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const itemService = {
  list() {
    return request('/items');
  },
  get(id) {
    return request(`/items/${id}`);
  },
  create({ name, description = '', status = 'active' }) {
    return request('/items', {
      method: 'POST',
      body: JSON.stringify({ name, description, status }),
    });
  },
  update(id, updates) {
    return request(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  remove(id) {
    return request(`/items/${id}`, { method: 'DELETE' });
  },
};
