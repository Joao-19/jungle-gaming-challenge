import { useSocket } from "@/composables/Services/websocket/useSocket";
import { useToast } from "@/composables/UI/use-toast";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/composables/Services/Http";
import { useAuth } from "@/context/auth-context";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content?: string;
  type: string;
  metadata?: any;
  readAt?: string;
  createdAt: string;
}

export function useNotifications() {
  const Events = {
    NOTIFICATION: "notification",
  };
  const { toast } = useToast();
  const { on, off, isConnected } = useSocket();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch History (Pull)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await axios.get("/notifications", {
        params: { userId },
      });
      return data;
    },
    enabled: !!userId,
  });

  // 2. Real-time Updates (Push)
  function handleNotification(data: Notification) {
    console.log(data, "NOTIFICACAO RECEBIDA");

    // Optimistic Update
    queryClient.setQueryData(
      ["notifications", userId],
      (old: Notification[] = []) => {
        if (old.some((n) => n.id === data.id)) return old;
        return [data, ...old];
      }
    );

    toast({
      variant: "default",
      title: "Nova Atualização",
      description: data.title,
      duration: 5000,
    });
  }

  useEffect(() => {
    if (!isConnected) return;

    on(Events.NOTIFICATION, handleNotification);

    return () => {
      off(Events.NOTIFICATION, handleNotification);
    };
  }, [isConnected, on, toast, queryClient, userId]);

  return { isConnected, notifications };
}
