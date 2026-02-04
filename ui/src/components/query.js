import axios from "axios";
import { useState } from "react";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { TypeAnimation } from "react-type-animation";
import { FaArrowRight } from "react-icons/fa6";
import { TiTick } from "react-icons/ti";
import { IoIosClose } from "react-icons/io";
import FocusLock from "react-focus-lock";
import { API_URL } from "../config";

export default function Query({
  docFiles,
  selectedDocFile,
  setSeletedDocFile,
}) {
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [typingDone, setTypingDone] = useState(false);

  function search() {
    if (selectedDocFile === null) {
      setQueryError("Upload a document");
      return;
    }

    const value = query.trim().toLowerCase();
    if (value.length === 0) return;

    setQueryError(null);
    setQueryLoading(true);

    axios
      .post(`${API_URL}/api/query/generate`, {
        question: query,
        version_id: selectedDocFile,
        k: 5,
      })
      .then(({ data }) => {
        setQuery("");
        setTypingDone(false);
        setQueryResult(data);
      })
      .catch(() => {
        setQueryError("Something went wrong. Try again.");
      })
      .finally(() => setQueryLoading(false));
  }

  const getSuggested = (data) => {
    if (data.topics && data.topics.length > 0)
      return `No direct match for your question. Try asking about specific topics such as: ${data.topics.join(", ")}`;

    return "I couldn’t find an answer in the selected document/version.";
  };

  return (
    <div className="query">
      <h2 className="block-headings query-header">
        <MdOutlineQuestionAnswer /> Ask Question
        {docFiles.length > 0 && (
          <>
            :{" "}
            <Dropdown
              docFiles={docFiles}
              setSeletedDocFile={setSeletedDocFile}
            />
          </>
        )}
      </h2>
      <div className="input-container">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="search"
          placeholder="Ask a question about the selected snapshot..."
        />
        <div className="error-container">
          <p>{queryError}</p>
        </div>
        <button onClick={search} disabled={queryLoading} className="search-btn">
          {queryLoading ? <span className="loader"></span> : "Search"}
        </button>
        <div className="block" />
      </div>
      <div className="overflow-wrapper">
        {queryResult && (
          <div className="query-response">
            <h3 className="question">
              <FaArrowRight /> {queryResult.question}
            </h3>
            <div className="block" />
            <div className="query-response-wrapper">
              {queryResult.not_found ? (
                queryResult.error ? (
                  <TypeEffect value={queryResult.error} />
                ) : (
                  <TypeEffect value={getSuggested(queryResult)} />
                )
              ) : (
                <div className="answer">
                  <TypeEffect
                    value={queryResult.answer}
                    onDone={() => setTimeout(() => setTypingDone(true), 500)}
                  />
                  {typingDone && queryResult.sources && (
                    <>
                      <div className="block" />
                      <div className="source">
                        <h4>
                          <FaArrowRight /> Evidence
                        </h4>
                        <div className="source-wrapper">
                          {queryResult.sources.map((item, idx) => (
                            <SourceResult item={item} key={idx} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Dropdown({ docFiles, setSeletedDocFile }) {
  return (
    <select
      onChange={(e) => setSeletedDocFile(e.target.value)}
      name="version-dropdown"
      id="version-dropdown"
    >
      <option value={docFiles.length}>Latest</option>
      {docFiles.map((item, idx) => {
        const versionId = item.version_number;
        const version = `v${versionId}`;
        return (
          <option key={idx} value={versionId}>
            {version}
          </option>
        );
      })}
    </select>
  );
}

function TypeEffect({ value, onDone }) {
  return (
    <span className="query-answer-txt">
      <TypeAnimation
        key={value}
        sequence={[
          value,
          () => {
            onDone?.();
          },
        ]}
        wrapper="span"
        speed={70}
        repeat={0}
      />
    </span>
  );
}

function ShowModal({ setShowModal, item }) {
  const close = () => {
    setShowModal(false);
  };

  return (
    <FocusLock>
      <div className="show-modal-wrapper">
        <button className="close" onClick={close}>
          <IoIosClose />
        </button>

        <div className="show-modal">
          <h2>
            <div className="metadata">
              <span>
                <TiTick />
              </span>
              <span>{item.document_name}</span>
              <span>-</span>
              <span>v{item.version}</span>
              <span>({Math.round(item.similarity_score * 100)}%)</span>
            </div>
          </h2>
          <div className="show-content">
            <p>{item.content}</p>
          </div>
        </div>
      </div>
    </FocusLock>
  );
}

function SourceResult({ item }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="source-conatiner">
        <div className="metadata">
          <span>
            <TiTick />
          </span>
          <span>{item.document_name}</span>
          <span>-</span>
          <span>v{item.version}</span>
          <span>({Math.round(item.similarity_score * 100)}%)</span>
          <div className="source-btn">
            <button onClick={() => setShowModal(true)}>View Excerpt</button>
          </div>
        </div>
        <div className="source-content">
          <p>{item.content}</p>
        </div>
      </div>
      {showModal && <ShowModal setShowModal={setShowModal} item={item} />}
    </>
  );
}
