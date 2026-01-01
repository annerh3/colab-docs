import { FilePlus, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";

const recentDocuments = [
  { id: 1, title: "Propuesta de proyecto", updatedAt: "Hace 2 horas" },
  { id: 2, title: "Notas de reunión", updatedAt: "Ayer" },
  { id: 3, title: "Plan de marketing", updatedAt: "Hace 3 días" },
];

export const HomePage = () => {
  const navigate = useNavigate();

  const handleNewDoc = () => {
    navigate(`/documents/${uuidv4()}`);
  };
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
            <h5>Documentos recientes</h5>

            <div className="docs">
              {recentDocuments.map((doc) => {
                return (
                  <article key={doc.id} className="doc-item">
                    <FileText />
                    <div>
                      <header> {doc.title}</header>
                      <footer>{doc.updatedAt}</footer>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          
        </div>
      </main>
    </div>
  );
};
