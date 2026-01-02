import { FilePenLine, FilePlus, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface DocumentType {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const HomePage = () => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL);
    socketRef.current = s;

    return () => {
      s.disconnect();
    };
  }, []);

  // Cargar documentos cuando se conecta
  useEffect(() => {
    if (!socketRef.current) return;

    // Solicitar todos los documentos
    socketRef.current.emit("get-all-documents");

    // Escuchar la respuesta
    socketRef.current.on("load-all-documents", (docs: DocumentType[]) => {
      setDocuments(docs);
      setLoading(false);
    });

    // Escuchar eliminaciones
    socketRef.current.on("document-deleted", (docId: string) => {
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    });

    return () => {
      socketRef?.current?.off("load-all-documents");
      socketRef?.current?.off("document-deleted");
    };
  }, [socketRef]);

  const handleNewDoc = () => {
    navigate(`/documents/${uuidv4()}`);
  };

  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el documento

    if (window.confirm("¿Estás seguro de eliminar este documento?")) {
      socketRef.current?.emit("delete-document", docId);
      socketRef.current?.emit("get-all-documents");
    }
  };
  const handleEditTitleDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const newTitle = window.prompt("Ingresa el nuevo título del documento:");
    if (newTitle && newTitle.trim()) {
      socketRef.current?.emit("update-title", {
        docId,
        newTitle: newTitle.trim(),
      });

      socketRef.current?.emit("get-all-documents");
    }
  };

  const handleOpenDoc = (docId: string) => {
    navigate(`/documents/${docId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="home-page-container">
        <main>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Cargando documentos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page-container">
      <main>
        <div>
          {/* Titulo de pagina */}
          <h1>Bienvenido a Docs</h1>

          {/* Boton crear documento */}
          <section className="new-doc">
            <button onClick={handleNewDoc}>
              <FilePlus /> <br />
              <strong>Crear documento</strong> <br />
              <span>Empieza un nuevo documento en blanco</span>
            </button>
          </section>

          {/* Lista de documentos */}
          <section className="docs-section">
            <h5>Documentos recientes ({documents.length})</h5>

            {documents.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "2rem", color: "#666" }}
              >
                <p>No hay documentos todavía</p>
                <p>Crea tu primer documento para comenzar</p>
              </div>
            ) : (
              <div className="docs">
                {documents.map((doc) => {
                  return (
                    <article
                      key={doc._id}
                      className="doc-item"
                      onClick={() => handleOpenDoc(doc._id)}
                    >
                      <FileText />
                      <div>
                        <header>{doc.title}</header>
                        <footer>{formatDate(doc.updatedAt)}</footer>
                      </div>
                      <button
                        onClick={(e) => handleEditTitleDoc(doc._id, e)}
                        className="edit-btn"
                        title="Editar titulo de documento"
                      >
                        <FilePenLine size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDoc(doc._id, e)}
                        className="delete-btn"
                        title="Eliminar documento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
