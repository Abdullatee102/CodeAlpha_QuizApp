// app/hooks/useMessagesQuery.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../data/api';
import formatAxiosError from '../data/formatError';

export function useAcademicChannelsQuery() {
  return useQuery({
    queryKey: ['academicChannels'],
    queryFn: async () => {
      try {
        const response = await api.get('/messages/academic-channels');
        return response.data?.data || { faculties: [], departments: [], levels: [] };
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecentConversationsQuery() {
  return useQuery({
    queryKey: ['recentConversations'],
    queryFn: async () => {
      try {
        const response = await api.get('/messages/conversations');
        return response.data?.data || [];
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useConversationMessagesQuery(conversationId) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      try {
        const response = await api.get(`/messages/conversations/${conversationId}/messages`);
        return response.data?.data || [];
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    enabled: !!conversationId,
    refetchInterval: 5 * 1000, // Light polling for active conversation
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, text }) => {
      const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
        text,
      });
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recentConversations'],
      });
    },
  });
}

export function useJoinAcademicChannelMutation() {
  return useMutation({
    mutationFn: async ({ type, targetId, level, title, code }) => {
      const response = await api.post('/messages/academic-channels/join', {
        type,
        targetId,
        level,
        title,
        code,
      });
      return response.data?.data;
    },
  });
}

