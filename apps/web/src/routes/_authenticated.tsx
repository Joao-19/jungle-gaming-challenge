import { createFileRoute, redirect, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ModeToggle } from '@/components/mode-toggle';
import { FiLogOut } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { userId, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3004', {
      query: { userId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected!', socket.id);
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
      console.log('WebSocket disconnected!');
    };
  }, [userId, toast]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <h1 className="font-bold text-lg text-primary">Task Manager</h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            ID: {userId?.slice(0, 8)}...
          </div>
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}