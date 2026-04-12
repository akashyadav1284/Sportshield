/** SportShield AI — Alerts hooks */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AlertListResponse } from '../types';

export function useAlerts(params?: { page?: number; limit?: number; is_read?: boolean }) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: async () => {
      const { data } = await api.get<AlertListResponse>('/alerts/', { params });
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/alerts/unread-count');
      return data.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      await api.patch(`/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/alerts/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
