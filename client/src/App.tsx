import { Navigate, Route, Routes } from "react-router";
import { Editor } from "./components/Editor";
import { v4 as uuidv4 } from "uuid";
import { HomePage } from "./components/HomePage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={`/documents/${uuidv4()}`} replace />}
      />
      <Route path="/home" element={<HomePage />} />
      <Route path="/documents/:id" element={<Editor />} />
    </Routes>
  );
}

export default App;
