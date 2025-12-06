import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/buttons/button';
import { CreateTaskDialog } from './-components/create-task-dialog';
import { TasksTable } from './-components/tasks-table';
export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <CreateTaskDialog>
          <Button>+ Nova Tarefa</Button>
        </CreateTaskDialog>
      </div>

      <TasksTable />
    </div>
  );
}