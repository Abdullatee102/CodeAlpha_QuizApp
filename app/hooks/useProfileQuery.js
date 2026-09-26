import { useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
} from '../store/authStore';

export function useProfileQuery() {
  const token =
    useAuthStore(
      (state) =>
        state.token
    );

  const fetchProfile =
    useAuthStore(
      (state) =>
        state.fetchProfile
    );

  const cachedProfile =
    useAuthStore(
      (state) =>
        state.profile
    );

  return useQuery({
    queryKey: ['profile'],
    enabled: !!token,

    queryFn: async () => {
      const result =
        await fetchProfile();

      if (!result?.success) {
        throw new Error(
          result?.error ||
            'Failed to fetch profile'
        );
      }

      return result.data;
    },

    placeholderData:
      cachedProfile,

    staleTime:
      1000 * 60 * 5,

    refetchOnMount: false,

    refetchOnWindowFocus: false,
  });
}