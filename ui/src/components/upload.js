import { IoDocumentsOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { FileUploader } from "react-drag-drop-files";
import { useState } from "react";
import { MdOutlineUploadFile } from "react-icons/md";
import ReactFocusLock from "react-focus-lock";
import { FaFolder } from "react-icons/fa";
import axios from "axios";
import { GoDotFill } from "react-icons/go";

const fileTypes = ["PDF", "TXT", "DOCX"];

export default function Upload({ documents, selected, docFiles, setDocFiles }) {
  return (
    <div className="upload">
      <h2 className="block-headings">
        <IoDocumentsOutline /> Documents & Versions
      </h2>
      <div className="overflow-wrapper">
        <DragDrop
          setDocFiles={setDocFiles}
          documents={documents}
          selected={selected}
          docFiles={docFiles}
        />
        <div className="block" />
        {documents.length > 0 && (
          <div className="folder">
            <h4 className="block-sub-headings">
              <FaFolder /> {documents[selected].replaceAll("_", " ")}
            </h4>
            <div className="upload-versions-container">
              {docFiles.map((item, idx) => {
                return (
                  <div className="upload-versions" key={idx}>
                    <span>{idx === 0 ? <GoDotFill /> : ""}</span>
                    <p>v{item.version_number}</p>
                  </div>
                );
              })}
            </div>
            {docFiles.length === 0 && (
              <p className="empty">No snapshots found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DragDrop({ documents, selected, setDocFiles, docFiles }) {
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const handleChange = (file) => {
    setFile(file);
    setShowModal(true);
  };
  return (
    <>
      <FileUploader handleChange={handleChange} name="file" types={fileTypes}>
        <div className="dropzone">
          <p>Upload Document</p>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "2px",
              flexDirection: "column",
            }}
          >
            <span>Browse or Drag & Drop</span>
            <span> ( .pdf, .txt, or .docx )</span>
          </div>
        </div>
      </FileUploader>
      {showModal && (
        <UploadModal
          setDocFiles={setDocFiles}
          docFiles={docFiles}
          documents={documents}
          selected={selected}
          setShowModal={setShowModal}
          file={file}
        />
      )}
    </>
  );
}

function UploadModal({
  setShowModal,
  file,
  documents,
  selected,
  setDocFiles,
  docFiles,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setShowModal(false);
  };

  async function uploadDocument() {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_name", documents[selected]);

    setLoading(true);
    setError("");
    await axios
      .post("http://localhost:8000/api/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(({ data: json }) => {
        const { data } = json;
        const files = [...docFiles];
        files.push(data);
        setDocFiles(files);
        close();
      })
      .catch(() => {
        setError("Something went wrong. Try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <ReactFocusLock>
      <div className="upload-modal-wrapper">
        <button className="close" onClick={close}>
          <IoIosClose />
        </button>
        <div className="upload-modal">
          <h2>
            <MdOutlineUploadFile /> Upload Document
          </h2>
          <div className="upload-content">
            <p className="selected">
              File Selected is <span>"{file.name}"</span>
            </p>
            <p className="selected">
              This will update the document folder{" "}
              <span style={{ textTransform: "capitalize" }}>
                "{documents[selected].replaceAll("_", " ")}"
              </span>
            </p>
            <button className="upload-btn" onClick={uploadDocument}>
              {loading ? <span className="loader"></span> : "Upload"}
            </button>
            <p className="upload-error">{error}</p>
          </div>
        </div>
      </div>
    </ReactFocusLock>
  );
}
