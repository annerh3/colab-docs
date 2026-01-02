import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// Singleton: una sola conexión compartida
let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Si ya existe una conexión, reutilizarla
    if (!socket) {
      socket = io(SERVER_URL);
      
      socket.on("connect", () => {
        console.log("✅ Conectado al servidor");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("❌ Desconectado del servidor");
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("⚠️ Error de conexión:", err);
      });
    }

    // NO desconectar al desmontar, mantener la conexión viva
    return () => {
      // Solo limpiar listeners específicos si es necesario
    };
  }, []);

  return { socket, isConnected };
};

// Función para desconectar manualmente si es necesario
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};