import mongoose from "mongoose";
import { Server } from "socket.io";
import { Document } from "./Document.js";

mongoose
  .connect("mongodb://127.0.0.1/docs")
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error:", err));

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:5173",
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
    title: "Documento sin título",
    data: defaultValue,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};
