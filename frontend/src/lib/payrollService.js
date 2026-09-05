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
  const role = localStorage.getItem('lastSelectedRole') || 'HRPayrollManager';
  return `mock-${role}`;
}

async function request(path, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const currentRole = localStorage.getItem('lastSelectedRole') || 'HRPayrollManager';
  headers['x-mock-role'] = currentRole;

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

export const payrollService = {
  // Salary Rules
  rules: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/salary-rules${query ? `?${query}` : ''}`);
    },
    get(id) {
      return request(`/salary-rules/${id}`);
    },
    create(data) {
      return request('/salary-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return request(`/salary-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    remove(id) {
      return request(`/salary-rules/${id}`, { method: 'DELETE' });
    },
  },

  // Salary Structures
  structures: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/salary-structures${query ? `?${query}` : ''}`);
    },
    get(id, populate = true) {
      return request(`/salary-structures/${id}?populate=${populate}`);
    },
    create(data) {
      return request('/salary-structures', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return request(`/salary-structures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    remove(id) {
      return request(`/salary-structures/${id}`, { method: 'DELETE' });
    },
  },

  // Payruns
  payruns: {
    list(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/payruns${query ? `?${query}` : ''}`);
    },
    get(id) {
      return request(`/payruns/${id}`);
    },
    getPayslips(id) {
      return request(`/payruns/${id}/payslips`);
    },
    getEligibleEmployees({ salaryStructureId, startDate, endDate }) {
      const query = new URLSearchParams({
        salaryStructureId,
        startDate,
        endDate,
      }).toString();
      return request(`/payruns/eligible-employees?${query}`);
    },
    create(data) {
      return request('/payruns', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    compute(id) {
      return request(`/payruns/${id}/compute`, { method: 'POST' });
    },
    validate(id) {
      return request(`/payruns/${id}/validate`, { method: 'POST' });
    },
    markPaid(id) {
      return request(`/payruns/${id}/mark-paid`, { method: 'POST' });
    },
    reopen(id) {
      return request(`/payruns/${id}/reopen`, { method: 'POST' });
    },
    remove(id) {
      return request(`/payruns/${id}`, { method: 'DELETE' });
    },
  },

  // Payslips
  payslips: {
    get(id) {
      return request(`/payslips/${id}`);
    },
    send(id) {
      return request(`/payslips/${id}/send`, { method: 'POST' });
    },
  },

  // Dashboard Analytics
  dashboard: {
    getMetrics(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/dashboard${query ? `?${query}` : ''}`);
    },
  },
};
