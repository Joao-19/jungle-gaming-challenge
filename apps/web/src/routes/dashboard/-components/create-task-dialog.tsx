import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TaskPriority } from '@repo/dtos';
import { axiosInstance as api } from '@/composables/Services/Http/use-http';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/composables/UI/use-toast';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

const createTaskSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority),
    dueDate: z.string().optional(),
    assigneeIds: z.array(z.string()).optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

export function CreateTaskDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateTaskForm>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            priority: TaskPriority.LOW,
            assigneeIds: [],
        },
    });

    const priority = watch('priority');
    const assigneeIds = watch('assigneeIds') || [];

    const onSubmit = async (data: CreateTaskForm) => {
        try {
            await api.post('/tasks', data);

            toast({
                variant: 'default',
                title: 'Tarefa criada!',
                description: 'Sua tarefa foi adicionada com sucesso.',
            });

            // Invalida o cache para recarregar a lista
            queryClient.invalidateQueries({ queryKey: ['tasks'] });

            setOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar tarefa',
                description: 'Tente novamente mais tarde.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                    <DialogDescription>
                        Crie uma nova tarefa para acompanhar seu progresso.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Implementar Login"
                            {...register('title')}
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
                            placeholder="Detalhes da tarefa..."
                            {...register('description')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioridade</Label>
                            <Select
                                value={priority}
                                onValueChange={(val) =>
                                    setValue('priority', val as TaskPriority)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TaskPriority.LOW}>Baixa</SelectItem>
                                    <SelectItem value={TaskPriority.MEDIUM}>Média</SelectItem>
                                    <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                                    <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Prazo</Label>
                            <Input id="dueDate" type="date" {...register('dueDate')} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Atribuir a:</Label>
                        <UserMultiSelect
                            selectedUserIds={assigneeIds}
                            onChange={(ids) => setValue('assigneeIds', ids)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
