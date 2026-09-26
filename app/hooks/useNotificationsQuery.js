import { useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

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

    staleTime:
      1000 * 60 * 2,

    refetchOnMount: false,

    refetchOnWindowFocus: false,
  });
}