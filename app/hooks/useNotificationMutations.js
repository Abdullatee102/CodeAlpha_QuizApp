import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

export function useMarkNotificationAsReadMutation() {
  const queryClient =
    useQueryClient();

  const markNotificationAsRead =
    useAuthStore(
      (state) =>
        state.markNotificationAsRead
    );

  return useMutation({
    mutationFn: async (
      notificationId
    ) => {
      const result =
        await markNotificationAsRead(
          notificationId
        );

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to mark notification as read'
        );
      }

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'notifications',
        ],
      });
    },
  });
}

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient =
    useQueryClient();

  const markAllNotificationsAsRead =
    useAuthStore(
      (state) =>
        state.markAllNotificationsAsRead
    );

  return useMutation({
    mutationFn: async () => {
      const result =
        await markAllNotificationsAsRead();

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to mark notifications as read'
        );
      }

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'notifications',
        ],
      });
    },
  });
}

// =====================================================
// COMBINED NOTIFICATION MUTATIONS
//
// Used by the Notifications screen:
//
// const {
//   markAsRead,
//   markAllAsRead,
// } = useNotificationMutations();
// =====================================================

export function useNotificationMutations() {
  const markAsRead =
    useMarkNotificationAsReadMutation();

  const markAllAsRead =
    useMarkAllNotificationsAsReadMutation();

  return {
    markAsRead,
    markAllAsRead,
  };
}