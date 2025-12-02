import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TaskPriority, TaskStatus } from '@repo/dtos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
}

interface TaskDetailsDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDetailsDialog({
    task,
    open,
    onOpenChange,
}: TaskDetailsDialogProps) {
    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                    <DialogDescription>Detalhes da tarefa</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Descrição</h3>
                        <p className="text-sm text-muted-foreground">
                            {task.description || 'Sem descrição'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Status</h3>
                            <p className="text-sm">{task.status}</p>
                        </div>
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Prioridade</h3>
                            <p className="text-sm">{task.priority}</p>
                        </div>
                    </div>
                    {task.dueDate && (
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Prazo</h3>
                            <p className="text-sm">
                                {format(new Date(task.dueDate), "dd 'de' MMMM 'de' yyyy", {
                                    locale: ptBR,
                                })}
                            </p>
                        </div>
                    )}
                    {task.assigneeIds && task.assigneeIds.length > 0 && (
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Atribuído a</h3>
                            <p className="text-sm text-muted-foreground">
                                {task.assigneeIds.length} usuário(s)
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
