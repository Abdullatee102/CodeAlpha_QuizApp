import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

export function useSubmitQuizMutation() {
  const queryClient =
    useQueryClient();

  const submitQuizHistory =
    useAuthStore(
      (state) =>
        state.submitQuizHistory
    );

  return useMutation({
    mutationFn: async (
      quizData
    ) => {
      const result =
        await submitQuizHistory(
          quizData
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to submit quiz'
        );
      }

      return result.data;
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['profile'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['leaderboard'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['quizHistory'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['achievements'],
        }),
      ]);
    },
  });
}