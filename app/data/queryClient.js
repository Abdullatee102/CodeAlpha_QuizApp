// app/data/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000,    // 10 minutes cache retention
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
