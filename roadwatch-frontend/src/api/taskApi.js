import client from './client';

export const taskApi = {
  // Get tasks assigned to maintenance user's team
  getMyTasks: (params) => client.get('/tasks', { params }),

  // Change task status to 'in-progress'
  updateStatus: (id, data) => client.patch(`/tasks/${id}/status`, data),

  // Submit repair with before/after photos (multipart)
  submitRepair: (id, formData) =>
    client.post(`/tasks/${id}/repair`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

