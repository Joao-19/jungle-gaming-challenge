import { createContext, useContext, useState } from 'react';
import axios from 'axios';

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  login: (token: string, refreshToken: string, userId: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa lendo do localStorage para manter logado ao recarregar a página
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));

  const isAuthenticated = !!token;

  const login = (newToken: string, newRefreshToken: string, newUserId: string) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('refresh_token', newRefreshToken); // <--- Salva aqui
    localStorage.setItem('user_id', newUserId);
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = async () => {
    try {
      // Chama o backend para invalidar o token
      if (userId) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await axios.post(`${apiUrl}/auth/logout`, { userId });
      }
    } catch (error) {
      // Se falhar, ainda assim fazemos logout local
      console.error('Erro ao fazer logout no backend:', error);
    } finally {
      // Limpa TUDO do localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      setToken(null);
      setUserId(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};