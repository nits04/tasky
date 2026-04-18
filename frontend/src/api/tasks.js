import api from './client';

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (updates) => api.post('/tasks/reorder', { updates }),
  archive: (id) => api.patch(`/tasks/${id}/archive`),
  getStats: () => api.get('/tasks/stats'),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  toggleSubtask: (taskId, subtaskId, completed) =>
    api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, { completed }),
  getNotifications: () => api.get('/tasks/user/notifications'),
  markNotificationsRead: () => api.patch('/tasks/user/notifications/read'),
};
