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

export const attendanceService = {
  checkIn(payload = {}) {
    return request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  checkOut(payload = {}) {
    return request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.set('employeeId', params.employeeId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    return request(`/attendance${queryString ? `?${queryString}` : ''}`);
  },
  get(id) {
    return request(`/attendance/${id}`);
  },
  manualCorrect(id, updates) {
    return request(`/attendance/${id}/manual-correct`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  recordAbsent(payload) {
    return request('/attendance/absent', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
