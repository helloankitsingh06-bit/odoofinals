import { auth } from './firebase';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function getAuthToken() {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to get Firebase ID token, falling back to mock:', err);
    }
  }
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

export const timeOffTypeService = {
  list() {
    return request('/time-off-types');
  },
  get(id) {
    return request(`/time-off-types/${id}`);
  },
  create(payload) {
    return request('/time-off-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, updates) {
    return request(`/time-off-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  remove(id) {
    return request(`/time-off-types/${id}`, {
      method: 'DELETE',
    });
  },
};
