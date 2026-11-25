import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import {
  Report,
  Repair,
  Team,
  User,
  NotificationItem,
  AnalyticsSummary,
  MonthlyTrend,
  Hotspot,
  TeamPerformance,
  ReportStatus,
  Priority
} from '../types';

export interface ReportFilterParams {
  status?: ReportStatus | '';
  priority?: Priority | '';
  area?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useReports(params?: ReportFilterParams) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/reports', { params });
      return data;
    }
  });
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/reports/${id}`);
      return data.data as Report;
    },
    enabled: Boolean(id)
  });
}

export function useNearbyReports(lat?: number, lng?: number, radiusKm: number = 5) {
  return useQuery({
    queryKey: ['nearbyReports', lat, lng, radiusKm],
    queryFn: async () => {
      if (lat === undefined || lng === undefined) return [];
      const { data } = await apiClient.get('/api/reports/nearby', {
        params: { lat, lng, radius: radiusKm }
      });
      return (data.data || []) as Report[];
    },
    enabled: lat !== undefined && lng !== undefined
  });
}

export function useMyComplaints() {
  return useQuery({
    queryKey: ['myComplaints'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/reports/my');
      return (data.data || []) as Report[];
    }
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/tasks');
      return (data.data || []) as Report[];
    }
  });
}

export function useTaskHistory() {
  return useQuery({
    queryKey: ['taskHistory'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/tasks/history');
      return (data.data || []) as Repair[];
    }
  });
}

export function usePendingVerifications() {
  return useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/repairs/pending');
      return (data.data || []) as Repair[];
    }
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analytics/summary');
      return data.data as AnalyticsSummary;
    }
  });
}

export function useMonthlyTrends(months: number = 12) {
  return useQuery({
    queryKey: ['analytics', 'trends', months],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analytics/trends', { params: { months } });
      return (data.data || []) as MonthlyTrend[];
    }
  });
}

export function useHotspots() {
  return useQuery({
    queryKey: ['analytics', 'hotspots'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analytics/hotspots');
      return (data.data || []) as Hotspot[];
    }
  });
}

export function useTeamPerformance() {
  return useQuery({
    queryKey: ['analytics', 'teamPerformance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analytics/team-performance');
      return (data.data || []) as TeamPerformance[];
    }
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/teams');
      return (data.data || []) as Team[];
    }
  });
}

export function useMaintenanceUsers() {
  return useQuery({
    queryKey: ['maintenanceUsers'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/auth/maintenance-users');
      return (data.data || []) as User[];
    }
  });
}

export function useNotifications(unreadOnly: boolean = false, limit: number = 20) {
  return useQuery({
    queryKey: ['notifications', unreadOnly, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/notifications', {
        params: { unreadOnly, limit }
      });
      return {
        notifications: (data.data || []) as NotificationItem[],
        unreadCount: data.unreadCount as number
      };
    }
  });
}
