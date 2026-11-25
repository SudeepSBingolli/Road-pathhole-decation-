import client from './client';

export const notificationApi = {
  getMyNotifications: (params) => client.get('/notifications', { params }),
  markAsRead: (id) => client.patch(`/notifications/${id}/read`),
};

