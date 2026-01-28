import { useState } from "react";
import { TbArrowsDiff } from "react-icons/tb";

import DiffModal from "./diff_modal";

export default function Diff() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="diff">
      <h2 className="block-headings">
        <TbArrowsDiff /> Version Differences
      </h2>
      <div className="overflow-wrapper">
        <button className="show-diff-btn" onClick={() => setShowModal(true)}>
          Show diff
        </button>
      </div>
      {showModal && <DiffModal setShowModal={setShowModal} />}
    </div>
  );
}
