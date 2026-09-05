import { auth } from './firebase';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export async function getAuthToken() {
  if (auth && auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to get Firebase ID token, falling back to mock:', err);
    }
  }
  const role = localStorage.getItem('lastSelectedRole') || 'Admin';
  return `mock-${role}`;
}

export async function request(path, options = {}) {
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
    error.conflictingContractId = data.conflictingContractId;
    error.conflictingDates = data.conflictingDates;
    throw error;
  }
  return data;
}
