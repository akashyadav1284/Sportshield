/** SportShield AI — Assets hooks using TanStack Query */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AssetListResponse, MediaAsset } from '../types';

export function useAssets(params?: { page?: number; limit?: number; search?: string; file_type?: string; sort_by?: string }) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const { data } = await api.get<AssetListResponse>('/assets/', { params });
      return data;
    },
    refetchInterval: 5000,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const { data } = await api.get<MediaAsset>(`/assets/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUploadAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<MediaAsset[]>('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useTriggerScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data } = await api.post(`/assets/${assetId}/scan`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; tags?: string[]; description?: string }) => {
      const { data } = await api.patch<MediaAsset>(`/assets/${id}`, body);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', vars.id] });
    },
  });
}
