import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';
import type { AuthContextType } from '@/context/auth-context';
// Certifique-se de exportar essa interface no context

// 1. Definimos o contrato: O Router PRECISA receber o 'auth'
interface MyRouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      {/* O Outlet é onde as páginas (Login, Dashboard) aparecem */}
      <Outlet />
      
      {/* O Toaster fica aqui para funcionar em qualquer página */}
      <Toaster />
      
      {/* (Opcional) Ferramentas de Debug do Router - Apenas em Dev */}
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
});