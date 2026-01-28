export default function Query() {
  return (
    <div className="query">
      <h2 className="block-headings">
        Ask Question: <Dropdown />
      </h2>
      <div className="overflow-wrapper"></div>
    </div>
  );
}

function Dropdown() {
  return (
    <select name="version-dropdown" id="version-dropdown">
      <option selected value="version 1">
        Latest
      </option>
      <option value="version 1">version 1</option>
      <option value="version 2">version 2</option>
    </select>
  );
}
