import { IoDocumentsOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { FileUploader } from "react-drag-drop-files";
import { useState } from "react";
import { MdOutlineUploadFile } from "react-icons/md";
import ReactFocusLock from "react-focus-lock";
import { FaFolder } from "react-icons/fa";

const fileTypes = ["PDF", "TXT"];

export default function Upload({ documents, selected }) {
  return (
    <div className="upload">
      <h2 className="block-headings">
        <IoDocumentsOutline /> Documents & Versions
      </h2>
      <div className="overflow-wrapper">
        <DragDrop documents={documents} selected={selected} />
        <div className="block" />
        {documents.length > 0 && (
          <div className="folder">
            <h4 className="block-sub-headings">
              <FaFolder /> {documents[selected]}
            </h4>
            <p>No snapshots found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DragDrop({ documents, selected }) {
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
          <span>Browse or Drag & Drop</span>
          <span> ( .pdf or .txt )</span>
        </div>
      </FileUploader>
      {showModal && (
        <UploadModal
          documents={documents}
          selected={selected}
          setShowModal={setShowModal}
          file={file}
        />
      )}
    </>
  );
}

function UploadModal({ setShowModal, file, documents, selected }) {
  const close = () => {
    setShowModal(false);
  };

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
              File Selected: <span>{file.name}</span>
            </p>
            <p className="selected">
              This will update the document folder{" "}
              <span style={{ textTransform: "capitalize" }}>
                {documents[selected]}
              </span>
            </p>
            <button className="upload-btn">Upload</button>
          </div>
        </div>
      </div>
    </ReactFocusLock>
  );
}
