import axios from 'axios';

// Conecta no API Gateway (Porta 3001)
export const api = axios.create({
  baseURL: 'http://localhost:3001', 
});

// Interceptor: Antes de enviar, pega o token do localStorage e coloca no Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});