import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

import { socketService } from '../services/socket';

export {
  useNotificationMutations,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from './useNotificationMutations';

export function useNotificationsQuery(
  limit = 50
) {
  const token =
    useAuthStore(
      (state) =>
        state.token
    );

  const fetchNotifications =
    useAuthStore(
      (state) =>
        state.fetchNotifications
    );

  const queryClient = useQueryClient();

  // Real-time: invalidate the query whenever the backend emits 'notification:new'
  useEffect(() => {
    if (!token) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [token, queryClient]);

  return useQuery({
    queryKey: [
      'notifications',
      limit,
    ],
    enabled: !!token,

    queryFn: async () => {
      const result =
        await fetchNotifications(
          limit
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch notifications'
        );
      }

      return result.data || [];
    },

    // Shorter stale time so notification badge refreshes quickly on mount
    staleTime: 1000 * 30,

    refetchOnMount: true,

    refetchOnWindowFocus: false,
  });
}