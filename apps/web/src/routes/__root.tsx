import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';
import type { AuthContextType } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

interface MyRouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      {/* O router joga as telas aqui */}
      <Outlet />

      {/* O Toaster fica aqui para funcionar em qualquer página, pode colocar um popUp aqui tbm, ai fica a nivel global, por cima de geral*/}
      <Toaster />
    </>
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