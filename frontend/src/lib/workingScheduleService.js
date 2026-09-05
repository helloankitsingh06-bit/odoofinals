import { request } from './api';

export const workingScheduleService = {
  list() {
    return request('/schedules');
  },

  get(id) {
    return request(`/schedules/${id}`);
  },

  create(data) {
    return request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },
};
