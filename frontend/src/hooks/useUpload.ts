/** SportShield AI — Upload hook with progress tracking */
import { useState, useCallback } from 'react';
import api from '../lib/api';
import type { MediaAsset } from '../types';

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({ progress: 0, status: 'idle', error: null });

  const upload = useCallback(async (files: File[], metadata?: { names?: string; tags?: string; description?: string }) => {
    setState({ progress: 0, status: 'uploading', error: null });

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (metadata?.names) formData.append('names', metadata.names);
    if (metadata?.tags) formData.append('tags', metadata.tags);
    if (metadata?.description) formData.append('description', metadata.description);

    try {
      const { data } = await api.post<MediaAsset[]>('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          setState(s => ({ ...s, progress: pct }));
        },
      });

      setState({ progress: 100, status: 'done', error: null });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Upload failed';
      setState({ progress: 0, status: 'error', error: msg });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, status: 'idle', error: null });
  }, []);

  return { ...state, upload, reset };
}
