import client from './client';

export const repairApi = {
  // Admin verifies a repair (approve or reject with remarks)
  verifyRepair: (id, data) => client.patch(`/repairs/${id}/verify`, data),

  // Get details of a single repair
  getById: (id) => client.get(`/repairs/${id}`),

  // List repairs
  listRepairs: (params) => client.get('/repairs', { params }),
};

