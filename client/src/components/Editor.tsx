import Quill, { Delta, type QuillOptions } from "quill";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import "quill/dist/quill.snow.css";
import { useParams } from "react-router";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS: QuillOptions = [
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
  const { id: documentId } = useParams();

  useEffect(() => {
    const s = io("http://localhost:3001");
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

    const handler = (delta, oldDelta, src) => {
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

    socketRef.current.once("load-document", (document) => {
      quillRef.current?.setContents(document);
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
      <h1 className="doc-title">Nota 1</h1>

      <main id="text-editor-container"></main>
    </>
  );
};
