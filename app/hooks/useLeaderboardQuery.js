import { useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

export function useLeaderboardQuery(
  activeTab = '24h'
) {
  const fetchLeaderboard =
    useAuthStore(
      (state) =>
        state.fetchLeaderboard
    );

  const initialLeaderboard =
    useAuthStore(
      (state) =>
        state.leaderboard
    );

  return useQuery({
    queryKey: [
      'leaderboard',
      activeTab,
    ],

    queryFn: async () => {
      const result =
        await fetchLeaderboard(
          activeTab
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch leaderboard'
        );
      }

      return result.data || [];
    },

    placeholderData:
      initialLeaderboard,

    staleTime:
      1000 * 60 * 5,

    refetchOnMount: true,

    refetchOnWindowFocus: true,
  });
}