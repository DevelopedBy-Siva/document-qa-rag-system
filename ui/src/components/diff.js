import { useState } from "react";
import DiffModal from "./diff_modal";

export default function Diff() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="diff">
      <div className="overflow-wrapper">
        <button onClick={() => setShowModal(true)}>Hello</button>
      </div>
      {showModal && <DiffModal setShowModal={setShowModal} />}
    </div>
  );
}
