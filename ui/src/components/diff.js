import { useEffect, useState } from "react";
import { TbArrowsDiff } from "react-icons/tb";

import DiffModal from "./diff_modal";
import axios from "axios";

export default function Diff() {
  const [showModal, setShowModal] = useState(false);

  async function compareVersions({ versionId1, versionId2 }) {
    const response = await axios.post("http://localhost:8000/api/compare", {
      version_id_1: versionId1,
      version_id_2: versionId2,
    });

    return response.data;
  }

  const handleCompare = async () => {
    try {
      const data = await compareVersions({
        versionId1: Number("1"),
        versionId2: Number("2"),
        k: 3,
      });

      console.log(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Comparison failed");
    }
  };

  useEffect(() => {
    handleCompare();
  }, []);

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
