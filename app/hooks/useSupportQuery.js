// app/hooks/useSupportQuery.js
import { Platform } from 'react-native';
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
      try {
        const response = await api.post('/support/requests', {
          subject,
          category,
          message,
          priority,
        });
        return response.data?.data;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
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
      try {
        const response = await api.post(`/support/requests/${requestId}/messages`, {
          message,
        });
        return response.data?.data;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
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

export function useUploadSupportAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, uri, fileName, mimeType, messageId }) => {
      try {
        const formData = new FormData();
        const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
        const normalizedName = fileName || `attachment_${Date.now()}.jpg`;
        const normalizedType = mimeType || 'image/jpeg';

        formData.append('file', {
          uri: fileUri,
          name: normalizedName,
          type: normalizedType,
        });

        if (messageId) {
          formData.append('messageId', messageId);
        }

        const response = await api.post(
          `/support/requests/${requestId}/attachments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        return response.data?.data?.attachment;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
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

export function useUpdateSupportStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }) => {
      try {
        const response = await api.patch(`/support/requests/${requestId}/status`, {
          status,
        });
        return response.data?.data;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
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

export function useAskAIAssistantMutation() {
  return useMutation({
    mutationFn: async ({ message }) => {
      try {
        const response = await api.post('/support/ai-assistant', { message });
        return response.data?.data;
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
  });
}
