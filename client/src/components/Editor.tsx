import Quill, { Delta, type EmitterSource } from "quill";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router";
import { MoveLeft } from "lucide-react";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export const Editor = () => {
  const socketRef = useRef<Socket | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const navigate = useNavigate();
  const { id: documentId } = useParams();

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL);
    socketRef.current = s;

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    const toolbars = document.getElementsByClassName("ql-toolbar");
    if (toolbars.length > 0) return;

    const q = new Quill("#text-editor-container", {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    quillRef.current = q;

    return () => {
      quillRef.current = null;

      toolbars[0]?.remove();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current == null || quillRef.current == null) return;

    const handler = (delta : Delta, _oldDelta : Delta, src : EmitterSource) => {
      if (src !== "user") return;
      socketRef.current?.emit("send-changes", delta);
    };
    quillRef.current?.on("text-change", handler);

    return () => {
      quillRef.current?.off("text-change", handler);
    };
  }, []);

  useEffect(() => {
    if (socketRef.current == null || quillRef.current == null) return;

    const handler = (delta: Delta) => {
      quillRef.current?.updateContents(delta);
    };

    socketRef.current?.on("receive-changes", handler);

    return () => {
      socketRef.current?.off("receive-changes", handler);
    };
  }, []);

  useEffect(() => {
    if (socketRef.current == null || quillRef == null) return;

    socketRef.current.once("load-document", ({ data, title }) => {
      setDocTitle(title);

      quillRef.current?.setContents(data);
      quillRef.current?.enable();
    });

    socketRef.current.emit("get-document", documentId);
  }, [socketRef, quillRef, documentId]);

  useEffect(() => {
    if (socketRef.current == null || quillRef == null) return;

    const interval = setInterval(() => {
      socketRef.current?.emit("save-document", quillRef.current?.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socketRef, quillRef]);

  return (
    <>
      <header className="doc-header">
        <button title="Back to home" onClick={() => {navigate('/home')}}><MoveLeft size={15} /> <div>Back to home</div></button>
        <h1 className="doc-title" title="Puede cambiar el titulo de este documento en el inicio">{docTitle}</h1>
        <button style={{visibility: "hidden"}}><MoveLeft size={15} /> Back to home</button>
      </header>
      <main id="text-editor-container"></main>
    </>
  );
};
