import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Route } from '../route'; // Import from dashboard route
import { TaskDetailsDialog } from './task-details-dialog';
import { axiosInstance as api } from '@/composables/Services/Http/use-http';

async function fetchTaskById(id: string) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
}

export function TaskDetailsGlobalManager() {
    const { taskId } = Route.useSearch();
    const navigate = Route.useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

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
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        // Optionally close or keep open? Usually keep open or close.
        // User didn't specify, but often "Save" keeps it open or closes. 
        // Existing dialog handles 'onUpdate' by invalidating 'tasks' list.
    };

    if (!taskId) return null;

    // While loading, we might show nothing or a loading spinner inside a dialog skeleton?
    // For now, let's let the Dialog handle null task if strictly required, 
    // but TaskDetailsDialog requires task object. 
    // We can show the Dialog only when task is loaded.

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
