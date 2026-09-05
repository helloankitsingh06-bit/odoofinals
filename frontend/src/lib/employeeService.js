import { request } from './api';

export const employeeService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.department) query.set('department', params.department);
    if (params.managerId) query.set('managerId', params.managerId);
    if (params.status) query.set('status', params.status);
    if (params.jobPosition) query.set('jobPosition', params.jobPosition);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString();
    return request(`/employees${qs ? `?${qs}` : ''}`);
  },

  get(id) {
    return request(`/employees/${id}`);
  },

  create(data) {
    return request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};
