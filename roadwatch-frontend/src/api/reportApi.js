import client from './client';

export const reportApi = {
  // Create report with multipart image upload
  createReport: (formData) =>
    client.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get nearby reports with $geoNear
  getNearby: (params) => client.get('/reports/nearby', { params }),

  // List reports with filters & pagination
  listReports: (params) => client.get('/reports', { params }),

  // Get single report details
  getById: (id) => client.get(`/reports/${id}`),

  // Admin: Set priority
  setPriority: (id, data) => client.patch(`/reports/${id}/priority`, data),

  // Admin: Update status (reject, duplicate, etc.)
  updateStatus: (id, data) => client.patch(`/reports/${id}/status`, data),

  // Admin: Assign team with dueDate
  assignTeam: (id, data) => client.patch(`/reports/${id}/assign`, data),
};

