import { useQuery } from '@tanstack/react-query';

import {
  useQuizStore,
} from '../store/quizStore';

export function useQuizHistoryQuery() {
  const fetchQuizHistory =
    useQuizStore(
      (state) =>
        state.fetchQuizHistory
    );

  const allTimeHistory =
    useQuizStore(
      (state) =>
        state.allTimeHistory
    );

  return useQuery({
    queryKey: ['quizHistory'],

    queryFn: async () => {
      const result =
        await fetchQuizHistory();

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch quiz history'
        );
      }

      return result.data || [];
    },

    placeholderData:
      allTimeHistory,

    staleTime:
      1000 * 60 * 5,

    refetchOnMount: true,

    refetchOnWindowFocus: true,
  });
}