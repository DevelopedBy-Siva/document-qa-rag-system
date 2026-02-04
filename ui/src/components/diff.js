import { useEffect, useState } from "react";
import { TbArrowsDiff } from "react-icons/tb";
import axios from "axios";

import DiffModal from "./diff_modal";
import { API_URL } from "../config";

export default function Diff({ docFiles, selectedDocId, selectedDocFile }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [diffData, setDiffData] = useState(null);

  useEffect(() => {
    if (docFiles.length === 0) {
      setLoading(false);
      setError(false);
      return;
    }
    setError(false);
    setLoading(true);
    axios
      .get(
        `${API_URL}/api/documents/${selectedDocId}/versions/${docFiles.length}/diff`,
      )
      .then(({ data }) => {
        setDiffData(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDocId, docFiles]);

  return (
    <div className="diff">
      <h2 className="block-headings">
        <TbArrowsDiff /> What’s Changed
      </h2>
      <div className="overflow-wrapper">
        {loading ? (
          <p className="snapshot-msg">Loading.</p>
        ) : error ? (
          <p className="snapshot-msg">Something went wrong. Try refreshing.</p>
        ) : docFiles.length === 0 ? (
          <p className="snapshot-msg">No snapshots found.</p>
        ) : (
          <div className="diff-nutshell">
            <h6>
              Latest version: <b>v{docFiles.length}</b>
            </h6>
            {diffData && (
              <div className="diff-nutshell-content">
                {diffData.is_first_version ? (
                  <p>{diffData.message}</p>
                ) : (
                  diffData.analysis &&
                  diffData.analysis.summary && (
                    <p>{diffData.analysis.summary}</p>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {docFiles.length > 1 &&
          diffData &&
          diffData.analysis &&
          diffData.analysis.key_changes &&
          diffData.analysis.key_changes.length > 0 && (
            <>
              <button
                className="show-diff-btn"
                onClick={() => setShowModal(true)}
              >
                Show Details
              </button>

              {showModal && (
                <DiffModal
                  version={docFiles.length}
                  analysis={diffData.analysis.key_changes}
                  setShowModal={setShowModal}
                />
              )}
            </>
          )}
      </div>
    </div>
  );
}
