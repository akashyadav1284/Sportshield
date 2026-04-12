/** SportShield AI — Violations hooks using TanStack Query */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ViolationListResponse, Violation } from '../types';

interface ViolationFilters {
  page?: number;
  limit?: number;
  asset_id?: string;
  severity?: string;
  status?: string;
  platform?: string;
  search?: string;
}

export function useViolations(filters?: ViolationFilters) {
  return useQuery({
    queryKey: ['violations', filters],
    queryFn: async () => {
      const { data } = await api.get<ViolationListResponse>('/violations/', { params: filters });
      return data;
    },
  });
}

export function useViolation(id: string) {
  return useQuery({
    queryKey: ['violation', id],
    queryFn: async () => {
      const { data } = await api.get<Violation>(`/violations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<Violation>(`/violations/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useBulkUpdateViolationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ violation_ids, status }: { violation_ids: string[]; status: string }) => {
      const { data } = await api.patch<{ message: string }>(`/violations/bulk-status`, { violation_ids, status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDownloadEvidence() {
  return useMutation({
    mutationFn: async (violationId: string) => {
      const response = await api.get(`/violations/${violationId}/evidence`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `evidence_${violationId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
