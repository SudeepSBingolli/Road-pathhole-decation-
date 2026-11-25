import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { toast } from 'sonner';
import { Report, Priority, ReportStatus } from '../types';

export function useCreateReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post('/api/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyReports'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (data.isDuplicate) {
        toast.info('Pothole Already Reported', {
          description: `A report (${data.data.complaintId}) within 25m already exists. Your voice has been added to escalate priority!`
        });
      } else {
        toast.success('Pothole Reported Successfully', {
          description: `Tracking Complaint ID: ${data.data.complaintId}`
        });
      }
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to submit report. Please try again.';
      toast.error('Submission Failed', { description: message });
    }
  });
}

export function useUpvoteReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await apiClient.post(`/api/reports/${reportId}/upvote`);
      return data;
    },
    onMutate: async (reportId: string) => {
      // Optimistic update for nearby reports
      await queryClient.cancelQueries({ queryKey: ['nearbyReports'] });
      await queryClient.cancelQueries({ queryKey: ['reports'] });

      const previousNearby = queryClient.getQueryData(['nearbyReports']);

      queryClient.setQueriesData({ queryKey: ['nearbyReports'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((r: Report) =>
          r._id === reportId
            ? { ...r, complaintCount: (r.complaintCount || 1) + 1 }
            : r
        );
      });

      return { previousNearby };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyReports'] });
      toast.success('Upvote Registered', {
        description: 'Thank you! More citizen reports escalate maintenance urgency.'
      });
    },
    onError: (err: any, _vars, context: any) => {
      if (context?.previousNearby) {
        queryClient.setQueriesData({ queryKey: ['nearbyReports'] }, context.previousNearby);
      }
      const msg = err.response?.data?.message || 'Failed to upvote report';
      toast.error('Action Failed', { description: msg });
    }
  });
}

export function useAssignReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      teamId,
      dueDate
    }: {
      reportId: string;
      teamId: string;
      dueDate: string;
    }) => {
      const { data } = await apiClient.patch(`/api/reports/${reportId}/assign`, {
        teamId,
        dueDate
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task Dispatched', {
        description: 'Assigned to maintenance team with scheduled due date.'
      });
    },
    onError: (err: any) => {
      toast.error('Assignment Failed', {
        description: err.response?.data?.message || 'Could not assign task to team'
      });
    }
  });
}

export function useUpdateReportStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      priority,
      note
    }: {
      reportId: string;
      status?: ReportStatus;
      priority?: Priority;
      note?: string;
    }) => {
      const { data } = await apiClient.patch(`/api/reports/${reportId}/status`, {
        status,
        priority,
        note
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Status Updated Successfully');
    },
    onError: (err: any) => {
      toast.error('Update Failed', {
        description: err.response?.data?.message || 'Failed to update report'
      });
    }
  });
}

export function useStartTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.patch(`/api/tasks/${taskId}/status`, {
        status: 'in-progress'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      toast.success('Task In-Progress', {
        description: 'You have begun remediation work on this site.'
      });
    },
    onError: (err: any) => {
      toast.error('Action Failed', {
        description: err.response?.data?.message || 'Failed to update task state'
      });
    }
  });
}

export function useSubmitRepairMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, formData }: { taskId: string; formData: FormData }) => {
      const { data } = await apiClient.post(`/api/tasks/${taskId}/repair`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskHistory'] });
      toast.success('Repair Log Submitted', {
        description: 'Before & after photos sent to admin for quality verification.'
      });
    },
    onError: (err: any) => {
      toast.error('Submission Failed', {
        description: err.response?.data?.message || 'Could not submit repair completion'
      });
    }
  });
}

export function useVerifyRepairMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repairId,
      status,
      remarks
    }: {
      repairId: string;
      status: 'approved' | 'rejected';
      remarks?: string;
    }) => {
      const { data } = await apiClient.post(`/api/repairs/${repairId}/verify`, {
        status,
        remarks
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (variables.status === 'approved') {
        toast.success('Repair Approved', {
          description: 'Report marked as verified & closed. Citizen notified.'
        });
      } else {
        toast.warning('Repair Rejected for Rework', {
          description: 'Ticket returned to maintenance queue with engineering remarks.'
        });
      }
    },
    onError: (err: any) => {
      toast.error('Verification Failed', {
        description: err.response?.data?.message || 'Could not process verification'
      });
    }
  });
}

export function useCreateMaintenanceUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      teamId?: string;
    }) => {
      const { data } = await apiClient.post('/api/auth/maintenance-users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceUsers'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Maintenance Account Created');
    },
    onError: (err: any) => {
      toast.error('Creation Failed', {
        description: err.response?.data?.message || 'Failed to create user'
      });
    }
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId?: string) => {
      if (notificationId) {
        await apiClient.patch(`/api/notifications/${notificationId}/read`);
      } else {
        await apiClient.patch('/api/notifications/read-all');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}
