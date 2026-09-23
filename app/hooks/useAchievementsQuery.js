import { useQuery } from '@tanstack/react-query';

import { useQuizStore } from '../store/quizStore';

export function useAchievementsQuery() {
  const fetchAchievements = useQuizStore(
    (state) => state.fetchAchievements
  );

  return useQuery({
    queryKey: ['achievements'],

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

    refetchOnMount: true,

    refetchOnWindowFocus: true,
  });
}