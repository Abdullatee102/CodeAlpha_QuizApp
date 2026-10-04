import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../data/api';
import formatAxiosError from '../data/formatError';
import { useAuthStore } from '../store/authStore';

export function useAcademicChannelsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['academicChannels'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const response = await api.get('/messages/academic-channels');

        return (
          response.data?.data || {
            faculties: [],
            departments: [],
            levels: [],
          }
        );
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecentConversationsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['recentConversations'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const response = await api.get('/messages/conversations');

        return response.data?.data || [];
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    staleTime: 5 * 1000,
    refetchInterval: token ? 10 * 1000 : false,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });
}

export function useConversationMessagesQuery(conversationId) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      try {
        const response = await api.get(
          `/messages/conversations/${conversationId}/messages`
        );

        return response.data?.data || [];
      } catch (err) {
        const formatted = formatAxiosError(err);
        throw new Error(formatted.message);
      }
    },
    enabled: !!token && !!conversationId,
    refetchInterval:
      token && conversationId ? 25 * 1000 : false,
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, text }) => {
      const response = await api.post(
        `/messages/conversations/${conversationId}/messages`,
        {
          text,
        }
      );

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

export function useMarkConversationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId) => {
      if (!conversationId) return null;

      const response = await api.post(
        `/messages/conversations/${conversationId}/read`
      );

      return response.data?.data;
    },

    onSuccess: async (_, conversationId) => {
      queryClient.setQueryData(
        ['recentConversations'],
        (currentConversations) => {
          if (!Array.isArray(currentConversations)) {
            return currentConversations;
          }

          return currentConversations.map((conversation) => {
            if (
              String(conversation.id) !==
              String(conversationId)
            ) {
              return conversation;
            }

            return {
              ...conversation,
              unreadCount: 0,
              mentionCount: 0,
              hasUnread: false,
            };
          });
        }
      );

      await queryClient.invalidateQueries({
        queryKey: ['recentConversations'],
        exact: true,
      });
    },
  });
}

export function useJoinAcademicChannelMutation() {
  return useMutation({
    mutationFn: async ({
      type,
      targetId,
      level,
      title,
      code,
    }) => {
      const response = await api.post(
        '/messages/academic-channels/join',
        {
          type,
          targetId,
          level,
          title,
          code,
        }
      );

      return response.data?.data;
    },
  });
}