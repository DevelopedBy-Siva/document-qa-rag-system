import { IoIosClose } from "react-icons/io";

export default function DiffModal({ setShowModal }) {
  const close = () => {
    setShowModal(false);
  };

  return (
    <div className="diff-modal-wrapper">
      <button className="close" onClick={close}>
        <IoIosClose />
      </button>
      <div className="diff-modal">
        <h2>Version Differences</h2>
        <div className="diff-content"></div>
      </div>
    </div>
  );
}
