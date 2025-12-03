import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface TaskHistoryListProps {
    taskId: string;
}

interface User {
    username: string;
}

interface HistoryItem {
    id: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string;
    userId: string;
    user?: User;
    type: 'HISTORY';
}

interface CommentItem {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user?: User;
    type: 'COMMENT';
}

type ActivityItem = HistoryItem | CommentItem;

async function fetchHistory({ pageParam = 1, queryKey }: any) {
    const [_key, taskId] = queryKey;
    const response = await api.get(`/tasks/${taskId}/history`, {
        params: {
            page: pageParam,
            limit: 10, // Fetch more history to fill the feed
        },
    });
    return response.data;
}

async function fetchComments(taskId: string) {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
}

export function TaskHistoryList({ taskId }: TaskHistoryListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [commentText, setCommentText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const queryClient = useQueryClient();

    // Fetch History (Infinite)
    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingHistory,
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

    // Fetch Comments (All)
    const { data: commentsData, isLoading: isLoadingComments } = useQuery({
        queryKey: ["task-comments", taskId],
        queryFn: () => fetchComments(taskId),
    });

    // WebSocket Connection
    useEffect(() => {
        const socket = io("http://localhost:3004"); // Notifications Service URL

        socket.on("connect", () => {
            console.log("Connected to WebSocket");
        });

        socket.on("notification", (data: any) => {
            console.log("Notification received:", data);

            // Handle Comment Notification
            if (data.type === 'COMMENT') {
                if (data.taskId === taskId) {
                    queryClient.invalidateQueries({ queryKey: ["task-history", taskId] });
                    queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
                }
            }
            // Handle Task Update Notification (Status/Priority/Assignees)
            else if (data.type === 'TASK_UPDATED' || data.type === 'TASK_CREATED') {
                if (data.taskId === taskId) {
                    // If we are viewing the task that was updated, refresh history
                    queryClient.invalidateQueries({ queryKey: ["task-history", taskId] });
                    // Also invalidate task details to show new status/priority
                    queryClient.invalidateQueries({ queryKey: ["tasks"] }); // This might be too broad, but ensures list updates too
                    // Ideally we invalidate ["task", taskId] if we had a specific query for details
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [taskId, queryClient]);


    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSending(true);
        try {
            await api.post(`/tasks/${taskId}/comments`, { content: commentText });
            setCommentText("");
            queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
        } catch (error) {
            console.error("Failed to send comment", error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingHistory || isLoadingComments) {
        return <div className="text-sm text-muted-foreground p-4">Carregando atividade...</div>;
    }

    // Merge and Sort
    const historyItems = historyData?.pages.flatMap((page) => page.data.map((item: any) => ({ ...item, type: 'HISTORY' }))) || [];
    const commentItems = commentsData?.map((item: any) => ({ ...item, type: 'COMMENT' })) || [];

    const allActivity = [...historyItems, ...commentItems].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const reversedActivity = [...allActivity].reverse(); // Oldest at top, Newest at bottom

    return (
        <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-4 flex flex-col justify-end min-h-full pb-4">
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

                    {reversedActivity.map((item: ActivityItem) => (
                        <div key={item.id} className="flex flex-col space-y-1 text-sm">
                            {item.type === 'HISTORY' ? (
                                <div className="flex flex-col pb-2 opacity-70">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs">
                                            {item.user?.username || "Sistema"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs bg-muted/30 p-2 rounded-md w-fit italic">
                                        {formatMessage(item as HistoryItem)}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-primary">
                                            {item.user?.username || "Usuário"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-sm bg-secondary/20 p-2 rounded-md w-fit text-foreground">
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="pt-2 flex gap-2">
                <Input
                    placeholder="Escreva um comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment();
                        }
                    }}
                    className="flex-1"
                />
                <Button size="icon" onClick={handleSendComment} disabled={isSending || !commentText.trim()}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
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
