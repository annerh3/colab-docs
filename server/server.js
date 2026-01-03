import mongoose from "mongoose";
import { Server } from "socket.io";
import { Document } from "./Document.js";
import { createServer } from "http";
import 'dotenv/config';

const origin = process.env.CORS;
const dbUrl = process.env.MONGODB_URI;
const PORT = process.env.PORT;

mongoose
  .connect(dbUrl)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error:", err));

// Crear servidor HTTP
const httpServer = createServer((req, res) => {
  // Ruta básica para health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Socket.IO server running' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Adjuntar Socket.IO al servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: origin,
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // ===== EVENTOS PARA LA HOMEPAGE =====

  // Obtener todos los documentos
  socket.on("get-all-documents", async () => {
    try {
      const documents = await Document.find()
        .select("_id title updatedAt createdAt")
        .sort({ updatedAt: -1 });
      socket.emit("load-all-documents", documents);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    }
  });

  // Eliminar documento
  socket.on("delete-document", async (documentId) => {
    try {
      await Document.findByIdAndDelete(documentId);
      // Notificar a TODOS los clientes conectados
      io.emit("document-deleted", documentId);
      console.log("Documento eliminado:", documentId);
    } catch (error) {
      console.error("Error al eliminar documento:", error);
    }
  });

  // Actualizar título
  socket.on("update-title", async ({ docId, newTitle }) => {
    try {
      await Document.findByIdAndUpdate(docId, {
        title: newTitle,
      });

      socket.broadcast.to(docId).emit("title-updated", newTitle);
      console.log("Título actualizado:", newTitle);
    } catch (error) {
      console.error("Error al actualizar título:", error);
    }
  });

  // ===== EVENTOS PARA EL EDITOR =====

  socket.on("get-document", async (documentId) => {
    console.log("Cargando documento:", documentId);

    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);

    // Enviar data Y title
    socket.emit("load-document", {
      data: document.data,
      title: document.title,
    });

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
      console.log("Documento guardado:", documentId);
    });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const findOrCreateDocument = async (id) => {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({
    _id: id,
    title: "Untitled document",
    data: defaultValue,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

// Iniciar el servidor en 0.0.0.0
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Socket.IO escuchando en puerto ${PORT}`);
});
