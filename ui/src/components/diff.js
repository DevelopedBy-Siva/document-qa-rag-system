import { useState } from "react";
import { TbArrowsDiff } from "react-icons/tb";

import DiffModal from "./diff_modal";

export default function Diff({ docFiles }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="diff">
      <h2 className="block-headings">
        <TbArrowsDiff /> Version Differences
      </h2>
      <div className="overflow-wrapper">
        {docFiles.length === 0 ? (
          <p className="snapshot-msg">No snapshots found.</p>
        ) : docFiles.length === 1 ? (
          <p className="snapshot-msg">
            Only one snapshot found. Add more snapshots to generate a diff.
          </p>
        ) : (
          <div></div>
        )}
        {docFiles.length > 1 && (
          <button className="show-diff-btn" onClick={() => setShowModal(true)}>
            Show diff
          </button>
        )}
      </div>
      {showModal && <DiffModal setShowModal={setShowModal} />}
    </div>
  );
}
