// app/hooks/useRecommendedCoursesQuery.js
import { useQuery } from '@tanstack/react-query';
import api from '../data/api';
import formatAxiosError from '../data/formatError';
import { useAuthStore } from '../store/authStore';

export function useRecommendedCoursesQuery(semester = null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['recommendedCourses', semester],
    enabled: !!token,
    queryFn: async () => {
      try {
        const params = {};
        if (semester) {
          params.semester = semester;
        }
        const response = await api.get('/auth/recommended-courses', { params });
        return response.data || {
          hasAcademicProfile: false,
          data: [],
          count: 0,
        };
      } catch (err) {
        const formatted = formatAxiosError(err);
        console.warn('[RECOMMENDED COURSES] Error:', formatted.message);
        return {
          hasAcademicProfile: false,
          data: [],
          count: 0,
          error: formatted.message,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
