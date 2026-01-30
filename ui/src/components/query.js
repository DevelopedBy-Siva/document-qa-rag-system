import axios from "axios";
import { useState } from "react";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { TypeAnimation } from "react-type-animation";
import { FaArrowRight } from "react-icons/fa6";

export default function Query({
  docFiles,
  selectedDocFile,
  setSeletedDocFile,
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function search() {
    if (selectedDocFile === null) {
      setError("Upload a document");
      return;
    }

    const value = query.trim().toLowerCase();
    if (value.length === 0) return;

    setError(null);
    setLoading(true);

    axios
      .post("http://localhost:8000/api/query/generate", {
        question: query,
        version_id: selectedDocFile,
        k: 5,
      })
      .then(({ data }) => {
        setQuery("");
        setResult(data);
      })
      .catch(() => {
        setError("Something went wrong. Try again.");
      })
      .finally(() => setLoading(false));
  }

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
          <p>{error}</p>
        </div>
        <button onClick={search} className="search-btn">
          {loading ? <span className="loader"></span> : "Search"}
        </button>
        <div className="block" />
      </div>
      <div className="overflow-wrapper">
        {result && (
          <div className="query-response">
            <h3 className="question">
              <FaArrowRight /> {result.question}
            </h3>
            <div className="block" />
            <div className="query-response-wrapper">
              {result.not_found ? (
                result.error ? (
                  <TypeEffect value={result.error} />
                ) : (
                  <TypeEffect value="I couldn’t find an answer in the selected document/version." />
                )
              ) : (
                <div></div>
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
          <option key={idx} value={idx}>
            {version}
          </option>
        );
      })}
    </select>
  );
}

function TypeEffect({ value }) {
  return (
    <span className="not-found">
      <TypeAnimation
        key={value}
        sequence={[value]}
        wrapper="span"
        speed={70}
        repeat={0}
      />
    </span>
  );
}
