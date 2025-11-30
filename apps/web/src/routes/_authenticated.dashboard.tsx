import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  // Busca as tarefas do Backend
  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    },
  });

  if (isLoading) return <div className="p-10">Carregando tarefas...</div>;
  if (isError) return <div className="p-10 text-red-500">Erro ao carregar tarefas.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button>+ Nova Tarefa</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks?.length === 0 && (
           <p className="text-muted-foreground col-span-3 text-center py-10">
             Nenhuma tarefa encontrada. Crie a primeira!
           </p>
        )}

        {tasks?.map((task: any) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {task.title}
              </CardTitle>
              <div className={`w-3 h-3 rounded-full ${
                task.priority === 'HIGH' ? 'bg-red-500' : 
                task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">{task.status}</div>
              <p className="text-xs text-slate-500 truncate">
                {task.description || "Sem descrição"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}