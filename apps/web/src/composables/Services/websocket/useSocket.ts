import { useCallback, useState } from "react";
import { useSocketContext } from "../../../context/socket-context";

interface UseSocketResult {
  socket: any | null;
  isConnected: boolean;
  error: Error | null;
  loading: boolean;
  emitLoading: boolean;
  emitError: Error | null;
  emit: (event: string, ...args: any[]) => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => () => void;
  off: (event: string, listener: (...args: any[]) => void) => void;
}

export function useSocket(): UseSocketResult {
  const { socket, isConnected } = useSocketContext();
  const [emitLoading, setEmitLoading] = useState(false);
  const [emitError, setEmitError] = useState<Error | null>(null);

  const emit = useCallback(
    (event: string, ...args: any[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        setEmitLoading(true);
        setEmitError(null);
        if (socket && isConnected) {
          socket.emit(event, ...args, (response: any) => {
            if (response && response.error) {
              setEmitError(new Error(response.error.message || "Emit failed"));
              reject(new Error(response.error.message || "Emit failed"));
            } else {
              resolve();
            }
            setEmitLoading(false);
          });
        } else {
          const err = new Error(
            "useSocket: Socket não está conectado. Não foi possível emitir o evento: " +
              event
          );
          console.warn(err.message);
          setEmitError(err);
          setEmitLoading(false);
          reject(err);
        }
      });
    },
    [socket, isConnected]
  );

  const on = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, listener);
      } else {
        console.warn(
          "useSocket: Socket não está conectado. Não foi possível registrar o ouvinte para o evento:",
          event
        );
      }
      return () => {
        if (socket) {
          socket.off(event, listener);
        }
      };
    },
    [socket]
  );

  const off = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      if (socket) {
        socket.off(event, listener);
      }
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    error: null, // Managed globally now
    loading: false, // Managed globally
    emitLoading,
    emitError,
    emit,
    on,
    off,
  };
}
