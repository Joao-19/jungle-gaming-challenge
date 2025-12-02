import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { TaskDetailsDialog } from '@/components/task-details-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Calendar } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    data: tasks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    },
  });

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="p-10">Carregando tarefas...</div>;
  if (isError)
    return <div className="p-10 text-red-500">Erro ao carregar tarefas.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <CreateTaskDialog>
          <Button>+ Nova Tarefa</Button>
        </CreateTaskDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.length === 0 && (
          <p className="text-muted-foreground col-span-3 text-center py-10">
            Nenhuma tarefa encontrada. Crie a primeira!
          </p>
        )}

        {tasks?.map((task: any) => (
          <Card
            key={task.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleTaskClick(task)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium line-clamp-1">
                {task.title}
              </CardTitle>
              <div
                className={`w-3 h-3 rounded-full ${task.priority === 'HIGH'
                    ? 'bg-red-500'
                    : task.priority === 'MEDIUM'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                {task.status}
              </div>
              <p className="text-xs text-slate-500 truncate mb-4">
                {task.description || 'Sem descrição'}
              </p>

              <div className="flex items-center justify-between mt-4">
                {/* Avatars */}
                <div className="flex -space-x-2 overflow-hidden">
                  {task.assigneeIds && task.assigneeIds.length > 0 ? (
                    task.assigneeIds.slice(0, 3).map((id: string) => (
                      <div
                        key={id}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center"
                        title="Usuário atribuído"
                      >
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                    ))
                  ) : (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                  {task.assigneeIds && task.assigneeIds.length > 3 && (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-500">
                      +{task.assigneeIds.length - 3}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      Prazo -{' '}
                      {format(new Date(task.dueDate), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}