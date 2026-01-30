import { useEffect, useState } from "react";
import Diff from "./components/diff";
import Nav from "./components/nav";
import Query from "./components/query";
import Upload from "./components/upload";
import ReactFocusLock from "react-focus-lock";
import { IoIosClose } from "react-icons/io";
import { FaFolderOpen } from "react-icons/fa6";
import axios from "axios";

function App() {
  const [documents, setDocuments] = useState(["work_policy"]);
  const [docFiles, setDocFiles] = useState([]);
  const [docFilesLoading, setDocFilesLoading] = useState(true);

  const [selected, setSelected] = useState(0);
  const [createModal, setCreateModal] = useState(
    documents.length === 0 ? true : false,
  );
  const [selectedDocFile, setSeletedDocFile] = useState(null);

  const selectedDocId = documents?.[selected];
  useEffect(() => {
    if (!selectedDocId) {
      setDocFiles([]);
      return;
    }
    setDocFiles([]);
    setDocFilesLoading(true);
    axios
      .get(`http://localhost:8000/api/documents/${selectedDocId}/versions`)
      .then(({ data }) => {
        setDocFiles(data);
      })
      .catch(() => {
        setSeletedDocFile(null);
      })
      .finally(() => setDocFilesLoading(false));
  }, [selectedDocId]);

  const addDocumentFolder = (name) => {
    const docs = [...documents];
    if (docs.indexOf(name) === -1) {
      docs.push(name);
      setDocuments(docs);
      return 1;
    }
    return 0;
  };

  useEffect(() => {
    setSeletedDocFile(docFiles.length > 0 ? docFiles.length : null);
  }, [docFiles]);

  return (
    <div className="App">
      <Nav
        documents={documents}
        selected={selected}
        setSelected={setSelected}
        setCreateModal={setCreateModal}
      />
      <div className="wrapper">
        <Upload
          docFiles={docFiles}
          setDocFiles={setDocFiles}
          documents={documents}
          selected={selected}
          docFilesLoading={docFilesLoading}
        />
        <Query
          docFiles={docFiles}
          setSeletedDocFile={setSeletedDocFile}
          selectedDocFile={selectedDocFile}
        />
        <Diff />
      </div>
      {createModal && (
        <DocumentSelectModal
          addDocumentFolder={addDocumentFolder}
          setCreateModal={setCreateModal}
          documents={documents}
        />
      )}
    </div>
  );
}

export default App;

function DocumentSelectModal({ addDocumentFolder, setCreateModal, documents }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const create = () => {
    const value = name.trim().toLowerCase();
    if (value.length === 0) {
      setError("Folder name cannot be empty");
      return;
    }
    const response = addDocumentFolder(value);
    if (response === 0) {
      setError("Folder already exist");
      return;
    }

    setCreateModal(false);
    setError("");
  };

  const close = () => {
    setCreateModal(false);
  };

  return (
    <ReactFocusLock>
      <div className="create-doc-modal-wrapper">
        {documents.length !== 0 && (
          <button className="close" onClick={close}>
            <IoIosClose />
          </button>
        )}
        <div className="create-doc-modal">
          <h2>
            <FaFolderOpen /> Create Document Folder
          </h2>
          <div className="create-doc-content">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document folder name"
            />
            <p>{error}</p>
            <button className="create-doc-btn" onClick={create}>
              Create
            </button>
          </div>
        </div>
      </div>
    </ReactFocusLock>
  );
}
