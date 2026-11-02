import { useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

export function useLeaderboardQuery(
  activeTab = '24h',
  activeScope = 'global'
) {
  const token =
    useAuthStore(
      (state) =>
        state.token
    );

  const fetchLeaderboard =
    useAuthStore(
      (state) =>
        state.fetchLeaderboard
    );

  return useQuery({
    queryKey: [
      'leaderboard',
      activeTab,
      activeScope,
    ],
    enabled: !!token,

    queryFn: async () => {
      const result =
        await fetchLeaderboard(
          activeTab,
          activeScope
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch leaderboard'
        );
      }

      const list = Array.isArray(result.data)
        ? [...result.data]
        : [];
      list.standing = result.standing || null;

      return list;
    },

    staleTime:
      1000 * 60 * 2,

    refetchOnMount: true,

    refetchOnWindowFocus: false,
  });
}
