import { request } from './api';

export const userService = {
  getMe() {
    return request('/users/me');
  },

  sync(data = {}) {
    return request('/users/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list() {
    return request('/users');
  },

  get(id) {
    return request(`/users/${id}`);
  },

  updateRole(id, role) {
    return request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};
