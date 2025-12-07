import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from '@/components/ui/toaster';
import type { AuthContextType } from '@/context/auth-context';
import { Button } from '@/components/ui/buttons/button';
import { SocketProvider } from '@/context/socket-context';

interface MyRouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <SocketProvider>
      {/* O router joga as telas aqui */}
      <Outlet />

      {/* O Toaster fica aqui para funcionar em qualquer página, pode colocar um popUp aqui tbm, ai fica a nivel global, por cima de geral*/}
      <Toaster />
      {import.meta.env.VITE_ROUTER_DEVTOOLS === 'true' && (
        <TanStackRouterDevtools initialIsOpen={false} />
      )}
    </SocketProvider>
  ),
  notFoundComponent: () => {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="text-slate-600 text-lg">Ops! Essa página não existe na selva.</p>

        <div className="flex gap-2">

          <Link to="/dashboard">
            <Button>Voltar para o Início</Button>
          </Link>

          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>

        </div>
      </div>
    );
  },
});