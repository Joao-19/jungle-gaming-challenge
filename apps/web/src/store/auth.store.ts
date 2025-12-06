import { useState, useCallback } from "react";
import type { User } from "../Domain/User";

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export function useAuthStore(): AuthStore {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });

  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => {
    return localStorage.getItem("refresh_token");
  });

  const [user, setUserState] = useState<User | null>(() => {
    const data = localStorage.getItem("user");
    if (!data) return null;
    try {
      return JSON.parse(data, (_, value) => {
        // Basic transformation if needed, but usually storage matches structure
        return value;
      });
    } catch {
      return null;
    }
  });

  const setTokens = useCallback(
    (newToken: string | null, newRefreshToken: string | null) => {
      setTokenState(newToken);
      setRefreshTokenState(newRefreshToken);

      if (newToken) {
        localStorage.setItem("auth_token", newToken);
      } else {
        localStorage.removeItem("auth_token");
      }

      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      } else {
        localStorage.removeItem("refresh_token");
      }
    },
    []
  );

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  const logout = useCallback(() => {
    setTokens(null, null);
    setUser(null);
    localStorage.removeItem("user_id"); // Legacy cleanup if needed
  }, [setTokens, setUser]);

  return {
    token,
    refreshToken,
    setTokens,
    user,
    setUser,
    logout,
  };
}
