/** SportShield AI — WebSocket hook for real-time events */
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Violation } from '../types';

export function useWebSocket() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn) return;

    const socket = connectSocket();

    socket.on('new_violation', (data: Partial<Violation>) => {
      // Invalidate violations and alerts queries
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      // Spawn in-app Toaster
      if (data.severity === 'high') {
        toast.error(`Critical Match: ${data.platform}`, {
          description: `Confidence: ${data.confidence_score?.toFixed(0)}%. Asset: ${data.asset_name}`,
          duration: 10000,
        });
      } else if (data.severity === 'medium') {
        toast.warning(`Medium Threat: ${data.platform}`, {
          description: `Confidence: ${data.confidence_score?.toFixed(0)}%. Asset: ${data.asset_name}`,
          duration: 5000,
        });
      } else {
        toast.info(`Low Match: ${data.platform}`, {
          description: `Confidence: ${data.confidence_score?.toFixed(0)}%`,
          duration: 5000,
        });
      }

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('🛡️ SportShield AI — New Violation', {
          body: `${data.severity?.toUpperCase()} severity match on ${data.platform} (${data.confidence_score?.toFixed(0)}% confidence)`,
        });
      }
    });

    socket.on('scan_completed', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Deep Scan Concluded', {
        description: `Found ${data?.candidates_found || 0} candidates, logged ${data?.violations_created || 0} violations.`,
      });
    });

    socket.on('fingerprint_ready', () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset Indexing Complete', {
        description: 'Perceptual fingerprint successfully generated.',
      });
    });

    return () => {
      disconnectSocket();
    };
  }, [isLoggedIn, queryClient]);
}
