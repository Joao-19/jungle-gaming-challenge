import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Route } from '../route'; // Import from dashboard route
import { TaskDetailsDialog } from './task-details-dialog';
import { axiosInstance as api } from '@/composables/Services/Http/use-http';
import { useAuth } from '@/context/auth-context';

async function fetchTaskById(id: string) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
}

export function TaskDetailsGlobalManager() {
    const { taskId } = Route.useSearch();
    const navigate = Route.useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const { userId } = useAuth();

    // Sync URL state with Dialog Open state
    useEffect(() => {
        if (taskId) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [taskId]);


    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => fetchTaskById(taskId!),
        enabled: !!taskId,
    });

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Remove taskId from URL when closing
            navigate({
                search: (prev) => ({ ...prev, taskId: undefined }),
            });
        }
    };

    const handleUpdate = () => {
        // Invalidate both lists and detail
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        if (userId) {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
    };

    if (!taskId) return null;

    if (isLoading || !task) return null;

    return (
        <TaskDetailsDialog
            task={task}
            open={isOpen}
            onOpenChange={handleOpenChange}
            onUpdate={handleUpdate}
        />
    );
}
