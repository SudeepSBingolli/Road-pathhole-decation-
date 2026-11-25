import client from './client';

export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials),
  register: (userData) => client.post('/auth/register', userData),
  getMe: () => client.get('/auth/me'),
  createMaintenance: (data) => client.post('/auth/maintenance', data),
  createAdmin: (data) => client.post('/auth/admin', data),
};

