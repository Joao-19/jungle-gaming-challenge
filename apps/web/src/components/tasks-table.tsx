import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TaskStatus, TaskPriority } from "@repo/dtos";
import { TaskDetailsDialog } from "./task-details-dialog";

import { api } from "@/lib/api";

async function fetchTasks(filters: any) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
    });

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
}

export function TasksTable() {
    const [filters, setFilters] = useState({
        title: "",
        status: "",
        priority: "",
        page: 1,
        limit: 10,
    });

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["tasks", filters],
        queryFn: () => fetchTasks(filters),
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleEditClick = (task: any) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const tasks = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
                <Input
                    placeholder="Filtrar por título..."
                    value={filters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                    className="max-w-xs"
                />
                <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value === "ALL" ? "" : value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {Object.values(TaskStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.priority}
                    onValueChange={(value) => handleFilterChange("priority", value === "ALL" ? "" : value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas</SelectItem>
                        {Object.values(TaskPriority).map((priority) => (
                            <SelectItem key={priority} value={priority}>
                                {priority}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Nenhuma tarefa encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task: any) => (
                                <TableRow
                                    key={task.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleEditClick(task)}
                                >
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{task.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                task.priority === TaskPriority.URGENT
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate
                                            ? format(new Date(task.dueDate), "dd/MM/yyyy")
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(task);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                    }
                    disabled={filters.page === 1}
                >
                    Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                    Página {meta.page} de {meta.totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setFilters((prev) => ({
                            ...prev,
                            page: Math.min(meta.totalPages, prev.page + 1),
                        }))
                    }
                    disabled={filters.page === meta.totalPages}
                >
                    Próxima
                </Button>
            </div>

            <TaskDetailsDialog
                task={selectedTask}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onUpdate={() => {
                    refetch();
                    setIsDialogOpen(false);
                }}
            />
        </div>
    );
}
