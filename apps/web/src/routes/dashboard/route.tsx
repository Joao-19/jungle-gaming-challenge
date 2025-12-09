import { createFileRoute, redirect, Outlet, useNavigate } from '@tanstack/react-router';
import { useNotifications } from '@/composables/UseCases/Notification/useNotifications';
import { useAuth } from '@/context/auth-context';
import { ModeToggle } from '@/components/mode-toggle';
import { FiLogOut } from 'react-icons/fi';
import { Button } from '@/components/ui/buttons/button';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { TaskDetailsGlobalManager } from './-components/task-details-global-manager';

import { z } from 'zod';

const dashboardSearchSchema = z.object({
  taskId: z.string().optional(),
});

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { userId, logout } = useAuth();

  const navigate = useNavigate();

  useNotifications();

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
          <NotificationDropdown />
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
        <TaskDetailsGlobalManager />
      </main>
    </div>
  );
}