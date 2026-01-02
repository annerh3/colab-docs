import { FilePenLine, FilePlus, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Loader } from "./Loader";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("en");

interface DocumentType {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// dayjs.extend(relativeTime)

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

  if (loading) {
    return (
      <div className="home-page-container">
        <main>
          <Loader />
        </main>
      </div>
    );
  }

  return (
    <div className="home-page-container">
      <main>
        <div className="sections-container">
          {/* Titulo de pagina */}
          <h1>Welcome to Docs</h1>

          {/* Boton crear documento */}
          <section className="new-doc">
            <button onClick={handleNewDoc}>
              <FilePlus /> <br />
              <strong>Create document</strong> <br />
              <span>Start a new blank document</span>
            </button>
          </section>

          {/* Lista de documentos */}
          <section className="docs-section">
            <h5>Recent documents ({documents.length})</h5>

            {documents.length === 0 ? (
              <div className="no-data">
                <p>No documents yet</p>

                <p>Create your first document to get started</p>
              </div>
            ) : (
              <div className="docs">
                {documents.map((doc) => {
                  return (
                    <article
                      key={doc._id}
                      className="doc-item"
                      onClick={() => handleOpenDoc(doc._id)}
                      title="Open document"
                    >
                      <FileText />
                      <div>
                        <header>{doc.title}</header>
                        <footer>{dayjs(doc.updatedAt).fromNow()}</footer>
                      </div>
                      <button
                        onClick={(e) => handleEditTitleDoc(doc._id, e)}
                        className="edit-btn"
                        title="Edit document title"
                      >
                        <FilePenLine size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDoc(doc._id, e)}
                        className="delete-btn"
                        title="Delete document"
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
