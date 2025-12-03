import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ModeToggle } from '@/components/mode-toggle';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { userId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3004', {
      query: { userId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🟢 Conectado ao WebSocket!', socket.id);
    });

    socket.on('notification', (data: any) => {
      toast({
        title: "Nova Atualização",
        description: data.title,
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
      console.log('🔴 Desconectado do WebSocket');
    };
  }, [userId, toast]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <h1 className="font-bold text-lg text-primary">Task Manager</h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            ID: {userId?.slice(0, 8)}...
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}