import { useInfiniteQuery } from "@tanstack/react-query";
import { axiosInstance as api } from "@/composables/Services/Http/use-http";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/form/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useComments, { type CommentItem } from "@/composables/UseCases/Task/useComments";
import { useAuth } from "@/context/auth-context";


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

type ActivityItem = HistoryItem | CommentItem;

async function fetchHistory({ pageParam = 1, queryKey }: any) {
    const [_key, taskId] = queryKey;
    const response = await api.get(`/tasks/${taskId}/history`, {
        params: {
            page: pageParam,
            limit: 5, // Limit to 5 as requested
        },
    });
    return response.data;
}

export function TaskHistoryList({ taskId }: TaskHistoryListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [commentText, setCommentText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { userId: currentUserId } = useAuth();


    // Fetch History (Infinite)
    const {
        data: historyData,
        fetchNextPage: fetchNextHistory,
        hasNextPage: hasNextHistory,
        isFetchingNextPage: isFetchingNextHistory,
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

    // Use Comments Hook (Infinite)
    const {
        commentsData,
        isLoading: isLoadingComments,
        addComment,
        fetchNextPage: fetchNextComments,
        hasNextPage: hasNextComments,
        isFetchingNextPage: isFetchingNextComments,
    } = useComments({ taskId, limit: 5 });


    // Merge and Sort
    const reversedActivity = useMemo(() => {
        const historyItems = historyData?.pages.flatMap((page) => page.data.map((item: any) => ({ ...item, type: 'HISTORY' }))) || [];
        const commentItems = commentsData?.pages.flatMap((page) => page.data.map((item) => ({ ...item, type: 'COMMENT' as const }))) || [];

        const allActivity = [...historyItems, ...commentItems].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return [...allActivity].reverse(); // Oldest at top, Newest at bottom
    }, [historyData, commentsData]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const lastItemId = reversedActivity[reversedActivity.length - 1]?.id;

    // Auto-scroll to bottom on initial load or new message
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [lastItemId]);

    const handleLoadMore = () => {
        if (hasNextHistory) fetchNextHistory();
        if (hasNextComments) fetchNextComments();
    };

    const isFetchingNextPage = isFetchingNextHistory || isFetchingNextComments;
    const hasNextPage = hasNextHistory || hasNextComments;

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSending(true);
        try {
            await addComment({ content: commentText });
            setCommentText("");
        } catch (error) {
            console.error("Failed to send comment", error);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingHistory || isLoadingComments) {
        return (
            <div className="flex flex-col h-[400px] p-4 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-8 w-3/4 rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-4 flex flex-col justify-end min-h-full pb-4">
                    {hasNextPage && (
                        <div className="flex justify-center py-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLoadMore}
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
                                            {item.userId === currentUserId ? "Você" : (item.user?.username || "Sistema")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })} {item.createdAt}
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
                                            {item.userId === currentUserId ? "Você" : (item.user?.username || "Usuário")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })} {item.createdAt}
                                        </span>
                                    </div>
                                    <div className="text-sm bg-secondary/20 p-2 rounded-md w-fit text-foreground">
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
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
