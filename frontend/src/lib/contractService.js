import { request } from './api';

export const contractService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.employeeId) query.set('employeeId', params.employeeId);
    if (params.department) query.set('department', params.department);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString();
    return request(`/contracts${qs ? `?${qs}` : ''}`);
  },

  get(id) {
    return request(`/contracts/${id}`);
  },

  create(data) {
    return request('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/contracts/${id}`, {
      method: 'DELETE',
    });
  },
};
