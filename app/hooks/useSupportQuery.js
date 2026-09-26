// app/hooks/useSupportQuery.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../data/api';
import formatAxiosError from '../data/formatError';
import { useAuthStore } from '../store/authStore';

export function useSupportRequestsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['supportRequests'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const response = await api.get('/support/requests');
        return response.data?.data || [];
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useSupportDetailsQuery(requestId) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['supportDetails', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      try {
        const response = await api.get(`/support/requests/${requestId}`);
        return response.data?.data || null;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    enabled: !!token && !!requestId,
  });
}

export function useCreateSupportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subject, category, message, priority = 'medium' }) => {
      const response = await api.post('/support/requests', {
        subject,
        category,
        message,
        priority,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supportRequests'],
      });
    },
  });
}

export function useAddSupportMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, message }) => {
      const response = await api.post(`/support/requests/${requestId}/messages`, {
        message,
      });
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supportDetails', variables.requestId],
      });
      queryClient.invalidateQueries({
        queryKey: ['supportRequests'],
      });
    },
  });
}
