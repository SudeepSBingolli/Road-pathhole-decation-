import client from './client';

export const teamApi = {
  listTeams: () => client.get('/teams'),
  getTeamById: (id) => client.get(`/teams/${id}`),
  createTeam: (data) => client.post('/teams', data),
  addMember: (teamId, data) => client.post(`/teams/${teamId}/members`, data),
};

