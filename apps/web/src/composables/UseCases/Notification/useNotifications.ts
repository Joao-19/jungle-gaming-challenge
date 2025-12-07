import { useSocket } from "@/composables/Services/websocket/useSocket";
import { useToast } from "@/composables/UI/use-toast";
import { useEffect } from "react";

export function useNotifications() {
  const Events = {
    NOTIFICATION: "notification",
  };
  const { toast } = useToast();
  const { on, off, isConnected } = useSocket();

  function handleNotification(data: any) {
    console.log(data, "NOTIFICACAO RECEBIDA");
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
  }, [isConnected, on, toast]);

  return { isConnected };
}
