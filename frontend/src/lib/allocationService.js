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

export const allocationService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.set('employeeId', params.employeeId);
    if (params.timeOffTypeId) query.set('timeOffTypeId', params.timeOffTypeId);
    if (params.status) query.set('status', params.status);

    const queryString = query.toString();
    return request(`/allocations${queryString ? `?${queryString}` : ''}`);
  },
  get(id) {
    return request(`/allocations/${id}`);
  },
  create(payload) {
    return request('/allocations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  approve(id) {
    return request(`/allocations/${id}/approve`, {
      method: 'PATCH',
    });
  },
  getBalance(employeeId, timeOffTypeId, date) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(`/allocations/balance/${employeeId}/${timeOffTypeId}${query}`);
  },
  remove(id) {
    return request(`/allocations/${id}`, {
      method: 'DELETE',
    });
  },
};
