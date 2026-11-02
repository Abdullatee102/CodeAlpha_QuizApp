import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../data/api';
import formatAxiosError from '../data/formatError';
import { useAuthStore } from '../store/authStore';

export function useFeedbackEligibilityQuery(version = '1.0') {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['feedbackEligibility', version],
    enabled: !!token,
    queryFn: async () => {
      try {
        const response = await api.get(`/feedback/eligibility?version=${encodeURIComponent(version)}`);
        return response.data?.data || null;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message || 'Failed to check feedback eligibility.');
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useSubmitFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await api.post('/feedback', payload);
        return response.data;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message || 'Failed to submit feedback.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackEligibility'] });
    },
  });
}

