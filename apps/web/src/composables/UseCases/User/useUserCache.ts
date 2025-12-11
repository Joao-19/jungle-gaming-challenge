import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { axiosInstance as api } from "@/composables/Services/Http/use-http";

export interface CachedUser {
  id: string;
  username: string;
  email?: string;
}

/**
 * Hook to manage a global user cache
 * Reuses data already fetched by the app (e.g., from user selects)
 * and provides methods to fetch/retrieve user data
 */
export function useUserCache() {
  const queryClient = useQueryClient();

  /**
   * Get user from cache by ID
   * Searches through all 'users' queries to find cached user data
   */
  const getUserFromCache = useCallback(
    (userId: string): CachedUser | undefined => {
      // Search through all 'users' query data
      const queriesData = queryClient.getQueriesData<{
        pages: Array<{ data: CachedUser[] }>;
      }>({ queryKey: ["users"] });

      for (const [_, data] of queriesData) {
        if (data?.pages) {
          for (const page of data.pages) {
            const user = page.data.find((u) => u.id === userId);
            if (user) return user;
          }
        }
      }

      return undefined;
    },
    [queryClient]
  );

  /**
   * Fetch a user by ID and cache it
   * Falls back to API if not in cache
   */
  const fetchUser = useCallback(
    async (userId: string): Promise<CachedUser | null> => {
      // First try to get from cache
      const cached = getUserFromCache(userId);
      if (cached) return cached;

      // Fetch from API
      try {
        const response = await api.get<CachedUser>(`/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        return null;
      }
    },
    [getUserFromCache]
  );

  /**
   * Fetch multiple users and return a map of userId -> user
   */
  const fetchUsers = useCallback(
    async (userIds: string[]): Promise<Map<string, CachedUser>> => {
      const userMap = new Map<string, CachedUser>();

      // Try cache first
      const uncachedIds: string[] = [];
      for (const userId of userIds) {
        const cached = getUserFromCache(userId);
        if (cached) {
          userMap.set(userId, cached);
        } else {
          uncachedIds.push(userId);
        }
      }

      // Fetch uncached users
      if (uncachedIds.length > 0) {
        const results = await Promise.allSettled(
          uncachedIds.map((id) => fetchUser(id))
        );

        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            userMap.set(uncachedIds[index], result.value);
          }
        });
      }

      return userMap;
    },
    [getUserFromCache, fetchUser]
  );

  return {
    getUserFromCache,
    fetchUser,
    fetchUsers,
  };
}
