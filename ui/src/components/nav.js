import { VscHubot } from "react-icons/vsc";
import { IoMdArrowDropdown } from "react-icons/io";
import { useState } from "react";
import { TiTick } from "react-icons/ti";
import { FaPlus } from "react-icons/fa6";

export default function Nav({
  documents,
  selected,
  setSelected,
  setCreateModal,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const hideDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav>
      <h1>
        <VscHubot /> Document Q&A
        <button className="drop-btn" onClick={hideDropdown}>
          <IoMdArrowDropdown
            style={{ rotate: showDropdown ? "180deg" : "0deg" }}
          />
        </button>
        {showDropdown && (
          <Dropdown
            documents={documents}
            selected={selected}
            setSelected={setSelected}
            setShowDropdown={setShowDropdown}
          />
        )}
      </h1>
      <button className="add-btn" onClick={() => setCreateModal(true)}>
        <FaPlus />
      </button>
    </nav>
  );
}

function Dropdown({ documents, selected, setSelected, setShowDropdown }) {
  const onSelect = (idx) => {
    setSelected(idx);
    setShowDropdown(false);
  };

  return (
    <ul className="doc-dropdown">
      {documents.map((item, idx) => (
        <li onClick={() => onSelect(idx)} key={idx}>
          <TiTick style={{ opacity: idx === selected ? 1 : 0 }} />
          {item.replaceAll("_", " ")}
        </li>
      ))}
    </ul>
  );
}
