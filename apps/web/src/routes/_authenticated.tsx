import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { io } from 'socket.io-client'; // Importe o cliente
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast'; // Importe o hook de toast do Shadcn

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { userId } = useAuth(); // Precisamos do ID para conectar
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // 1. Conecta no Serviço de Notificações (Porta 3004)
    const socket = io('http://localhost:3004', {
      query: { userId }, // Manda o ID no "aperto de mão"
      transports: ['websocket'], // Força websocket para ser mais rápido
    });

    // 2. Log de depuração (abra o console do navegador pra ver)
    socket.on('connect', () => {
      console.log('🟢 Conectado ao WebSocket!', socket.id);
    });

    // 3. Ouve o evento que definimos no Backend
    socket.on('notification', (data: any) => {
      console.log('🔔 Notificação recebida:', data);

      // 4. Mostra o Toast bonitão do Shadcn
      toast({
        title: "Nova Atualização",
        description: data.title, // "Nova tarefa criada: X"
        duration: 5000,
        className: "bg-green-50 border-green-200", // Um charminho visual
      });
    });

    // 5. Limpeza: Desconecta se o usuário sair da página (evita duplicar conexões)
    return () => {
      socket.disconnect();
      console.log('🔴 Desconectado do WebSocket');
    };
  }, [userId, toast]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
        <h1 className="font-bold text-lg text-primary">Task Manager</h1>
        <div className="ml-auto text-sm text-slate-500">
          ID: {userId?.slice(0, 8)}...
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}