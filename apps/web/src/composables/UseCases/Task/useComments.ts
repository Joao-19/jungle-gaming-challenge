import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { axiosInstance as api } from "@/composables/Services/Http/use-http";
import { io } from "socket.io-client";
import { useEffect } from "react";

interface User {
  username: string;
}

interface UseCommentsProps {
  taskId: string;
  limit?: number;
  userId: string | null;
}

export interface CommentItem {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: User;
  type: "COMMENT";
}

interface CreateCommentDto {
  content: string;
}

interface CommentsResponse {
  data: CommentItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function useComments({ taskId, limit = 5, userId }: UseCommentsProps) {
  const Events = {
    COMMENT: "notification",
  };

  const queryClient = useQueryClient();

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ["task-comments", taskId],
    queryFn: ({ pageParam = 1 }) => fetchComments(taskId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });

  const { mutate: addComment } = useMutation({
    mutationFn: (data: CreateCommentDto) => createComment(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  async function fetchComments(taskId: string, page: number, limit: number) {
    const response = await api.get<CommentsResponse>(
      `/tasks/${taskId}/comments`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  }

  async function createComment(taskId: string, data: CreateCommentDto) {
    const response = await api.post<CommentItem>(
      `/tasks/${taskId}/comments`,
      data
    );
    return response.data;
  }

  function handleReceiveComment(data: CommentItem) {
    // Handle Comment Notification
    if (data.type === "COMMENT" && data.taskId === taskId) {
      queryClient.setQueryData<InfiniteData<CommentsResponse>>(
        ["task-comments", taskId],
        (oldData) => {
          if (!oldData) return undefined;

          const newPages = [...oldData.pages];
          // Add to the first page
          if (newPages.length > 0) {
            const firstPage = { ...newPages[0] };
            // Check for duplicates
            if (firstPage.data.some((c) => c.id === data.id)) return oldData;

            firstPage.data = [data, ...firstPage.data];
            newPages[0] = firstPage;
          }

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    }
  }

  // WebSocket Connection
  useEffect(() => {
    if (!userId) return;
    const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:3004", {
      query: { userId },
      transports: ["websocket"],
    });

    socket.on(Events.COMMENT, handleReceiveComment);

    return () => {
      socket.off(Events.COMMENT, handleReceiveComment);
      socket.disconnect();
    };
  }, [taskId, queryClient]);

  return {
    commentsData,
    isLoading: isLoadingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetchComments,
    addComment,
    deleteComment: () => {},
  };
}

export default useComments;
