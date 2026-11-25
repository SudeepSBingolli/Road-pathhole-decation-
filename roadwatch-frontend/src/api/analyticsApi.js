import client from './client';

export const analyticsApi = {
  getSummary: () => client.get('/analytics/summary'),
  getTrends: (months = 12) => client.get('/analytics/trends', { params: { months } }),
  getAvgRepairTime: () => client.get('/analytics/avg-repair-time'),
  getTeamPerformance: () => client.get('/analytics/team-performance'),
  getHotspots: () => client.get('/analytics/hotspots'),
};

