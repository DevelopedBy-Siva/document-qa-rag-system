import { MdOutlineQuestionAnswer } from "react-icons/md";

export default function Query() {
  return (
    <div className="query">
      <h2 className="block-headings">
        <MdOutlineQuestionAnswer /> Ask Question: <Dropdown />
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

function Dropdown() {
  return (
    <select name="version-dropdown" id="version-dropdown">
      <option value="v1">Latest</option>
      <option value="v1">version 1</option>
      <option value="v2">version 2</option>
    </select>
  );
}
