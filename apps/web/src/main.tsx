import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Importa a árvore de rotas gerada automaticamente
import { routeTree } from './routeTree.gen';

import { AuthProvider, useAuth } from './context/auth-context';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

// 1. Configuração do TanStack Query (Cache de dados)
const queryClient = new QueryClient();

// 2. Configuração do TanStack Router
const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // Faz pré-load da página ao passar o mouse no link
  context: {
    // Definimos como undefined inicial, mas será injetado no InnerApp
    auth: undefined!,
  },
});

// Tipagem global para o Router (Safety first!)
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 3. Componente Interno para conectar Auth -> Router
function InnerApp() {
  const auth = useAuth();

  // Aqui injetamos o contexto real de auth no roteador
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <InnerApp />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);