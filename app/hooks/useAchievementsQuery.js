import { useQuery } from '@tanstack/react-query';

import { useQuizStore } from '../store/quizStore';
import { useAuthStore } from '../store/authStore';

export function useAchievementsQuery() {
  const token = useAuthStore((state) => state.token);
  const fetchAchievements = useQuizStore(
    (state) => state.fetchAchievements
  );

  return useQuery({
    queryKey: ['achievements'],
    enabled: !!token,

    queryFn: async () => {
      const result =
        await fetchAchievements();

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch achievements'
        );
      }

      return result.data || [];
    },

    staleTime: 1000 * 60 * 5,

    refetchOnMount: false,

    refetchOnWindowFocus: false,
  });
}