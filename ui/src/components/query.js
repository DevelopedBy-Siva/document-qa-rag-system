import { MdOutlineQuestionAnswer } from "react-icons/md";

export default function Query({ docFiles, setSeletedDocFile }) {
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
          id="search"
          placeholder="Ask a question about the selected snapshot..."
        />
        <button className="search-btn">Search</button>
        <div className="block" />
      </div>
      <div className="overflow-wrapper">
        <div className="query-response"></div>
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
      <option value={docFiles.length - 1}>Latest</option>
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
