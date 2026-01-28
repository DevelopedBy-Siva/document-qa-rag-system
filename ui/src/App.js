import { useState } from "react";
import Diff from "./components/diff";
import Nav from "./components/nav";
import Query from "./components/query";
import Upload from "./components/upload";

function App() {
  const [documents, setDocuments] = useState(["Document 1", "Document 2"]);
  const [selected, setSelected] = useState(0);
  return (
    <div className="App">
      <Nav
        documents={documents}
        selected={selected}
        setSelected={setSelected}
      />
      <div className="wrapper">
        <Upload />
        <Query />
        <Diff />
      </div>
    </div>
  );
}

export default App;
