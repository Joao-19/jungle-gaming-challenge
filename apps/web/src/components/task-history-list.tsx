import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface TaskHistoryListProps {
    taskId: string;
}

interface HistoryItem {
    id: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string;
    userId: string;
    user?: {
        username: string;
    };
}

async function fetchHistory({ pageParam = 1, queryKey }: any) {
    const [_key, taskId] = queryKey;
    const response = await api.get(`/tasks/${taskId}/history`, {
        params: {
            page: pageParam,
            limit: 5,
        },
    });
    return response.data;
}

export function TaskHistoryList({ taskId }: TaskHistoryListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["task-history", taskId],
        queryFn: fetchHistory,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.page < lastPage.meta.totalPages) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        },
    });

    useEffect(() => {
        if (scrollRef.current && !isFetchingNextPage) {
        }
    }, [data]);

    if (isLoading) {
        return <div className="text-sm text-muted-foreground p-4">Carregando histórico...</div>;
    }

    const historyItems = data?.pages.flatMap((page) => page.data) || [];
    const reversedItems = [...historyItems].reverse();

    return (
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="space-y-4 flex flex-col justify-end min-h-full">
                {hasNextPage && (
                    <div className="flex justify-center py-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-xs text-muted-foreground"
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : null}
                            Carregar anteriores
                        </Button>
                    </div>
                )}

                {reversedItems.map((item: HistoryItem) => (
                    <div key={item.id} className="flex flex-col space-y-1 text-sm pb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs">
                                {item.user?.username || "Usuário desconhecido"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.createdAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                })}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-xs bg-muted/30 p-2 rounded-md w-fit">
                            {formatMessage(item)}
                        </p>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

const statusTranslation: Record<string, string> = {
    TODO: "A Fazer",
    IN_PROGRESS: "Em Progresso",
    DONE: "Concluído",
};

const priorityTranslation: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
};

function formatMessage(item: HistoryItem) {
    switch (item.action) {
        case "CREATED":
            return "Tarefa criada.";
        case "UPDATED":
            if (item.field === "STATUS") {
                const oldVal = statusTranslation[item.oldValue || ""] || item.oldValue;
                const newVal = statusTranslation[item.newValue || ""] || item.newValue;
                return `Status alterado de "${oldVal}" para "${newVal}".`;
            }
            if (item.field === "PRIORITY") {
                const oldVal = priorityTranslation[item.oldValue || ""] || item.oldValue;
                const newVal = priorityTranslation[item.newValue || ""] || item.newValue;
                return `Prioridade alterada de "${oldVal}" para "${newVal}".`;
            }
            if (item.field === "ASSIGNEES") {
                return "Atribuições atualizadas.";
            }
            if (item.field === "TITLE") {
                return `Título alterado para "${item.newValue}".`;
            }
            if (item.field === "DESCRIPTION") {
                return "Descrição atualizada.";
            }
            return "Tarefa atualizada.";
        default:
            return "Ação desconhecida.";
    }
}
