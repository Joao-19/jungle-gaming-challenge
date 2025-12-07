import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token, logout } = useAuthStore();

    useEffect(() => {
        // Only connect if we have a token
        if (!token) return;

        const socketInstance = io(import.meta.env.VITE_WS_URL || "http://localhost:3004", {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
            console.log("Socket Global Connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket Global Disconnected");
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (err) => {
            if (err.message === "Authentication error") {
                logout();
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token, logout]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocketContext must be used within a SocketProvider");
    }
    return context;
}
