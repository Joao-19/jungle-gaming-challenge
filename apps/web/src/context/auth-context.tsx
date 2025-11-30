import { createContext, useContext, useState, useEffect } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  login: (token: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa lendo do localStorage para manter logado ao recarregar a página
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));
  
  const isAuthenticated = !!token;

  const login = (newToken: string, newUserId: string) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_id', newUserId); // Guardamos o ID para usar no WebSocket depois
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    setToken(null);
    setUserId(null);
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