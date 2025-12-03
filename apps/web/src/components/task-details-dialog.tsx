import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TaskPriority, TaskStatus } from '@repo/dtos';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserMultiSelect } from './user-multi-select';
import { TaskHistoryList } from './task-history-list';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    userId: string;
}

interface TaskDetailsDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

const updateTaskSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority),
    status: z.nativeEnum(TaskStatus),
    dueDate: z.string().optional(),
    assigneeIds: z.array(z.string()).optional(),
});

type UpdateTaskForm = z.infer<typeof updateTaskSchema>;

export function TaskDetailsDialog({
    task,
    open,
    onOpenChange,
    onUpdate,
}: TaskDetailsDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { userId } = useAuth();

    const isOwner = task?.userId === userId;
    const isAssignee = (task?.assigneeIds || []).includes(userId || '');
    const canEdit = isOwner || isAssignee;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UpdateTaskForm>({
        resolver: zodResolver(updateTaskSchema),
    });

    const priority = watch('priority');
    const status = watch('status');
    const assigneeIds = watch('assigneeIds') || [];

    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                assigneeIds: task.assigneeIds || [],
            });
        }
    }, [task, reset]);

    const onSubmit = async (data: UpdateTaskForm) => {
        if (!task) return;

        try {
            await api.patch(`/tasks/${task.id}`, data);

            toast({
                title: 'Tarefa atualizada!',
                description: 'As alterações foram salvas com sucesso.',
                className: 'bg-green-50 border-green-200',
            });

            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar tarefa',
                description: 'Tente novamente mais tarde.',
            });
        }
    };

    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalhes da Tarefa</DialogTitle>
                    <DialogDescription>
                        Visualize e edite as informações da tarefa.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna Esquerda: Formulário */}
                    <div className="space-y-4">
                        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    {...register('title')}
                                    disabled={!canEdit}
                                />
                                {errors.title && (
                                    <span className="text-xs text-red-500">
                                        {errors.title.message}
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    className="min-h-[100px]"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(val) => setValue('status', val as TaskStatus)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskStatus.TODO}>A Fazer</SelectItem>
                                            <SelectItem value={TaskStatus.IN_PROGRESS}>Em Progresso</SelectItem>
                                            <SelectItem value={TaskStatus.DONE}>Concluída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Prioridade</Label>
                                    <Select
                                        value={priority}
                                        onValueChange={(val) => setValue('priority', val as TaskPriority)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskPriority.LOW}>Baixa</SelectItem>
                                            <SelectItem value={TaskPriority.MEDIUM}>Média</SelectItem>
                                            <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                                            <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dueDate">Prazo</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    {...register('dueDate')}
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Atribuir a:</Label>
                                {canEdit ? (
                                    <UserMultiSelect
                                        selectedUserIds={assigneeIds}
                                        onChange={(ids) => setValue('assigneeIds', ids)}
                                    />
                                ) : (
                                    <div className="p-2 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                                        {assigneeIds.length > 0
                                            ? `${assigneeIds.length} usuário(s) atribuído(s)`
                                            : 'Nenhum usuário atribuído'}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                {canEdit && (
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                )}
                                {!canEdit && (
                                    <p className="text-sm text-muted-foreground italic">
                                        Somente o dono ou atribuídos podem editar esta tarefa.
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Coluna Direita: Comentários e Histórico */}
                    <div className="border-l pl-6 space-y-4">
                        <h3 className="font-semibold text-lg">Histórico de Alterações</h3>
                        <TaskHistoryList taskId={task.id} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
