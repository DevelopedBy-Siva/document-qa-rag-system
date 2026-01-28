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
        <div className="diff-content"></div>
      </div>
    </div>
  );
}
