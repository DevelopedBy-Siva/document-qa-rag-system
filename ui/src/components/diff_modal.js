import { IoIosClose } from "react-icons/io";
import { TbArrowsDiff } from "react-icons/tb";
import FocusLock from "react-focus-lock";

export default function DiffModal({ setShowModal }) {
  const close = () => {
    setShowModal(false);
  };

  return (
    <FocusLock>
      <div className="diff-modal-wrapper">
        <button className="close" onClick={close}>
          <IoIosClose />
        </button>

        <div className="diff-modal">
          <h2>
            <TbArrowsDiff /> Version Differences
          </h2>
          <div className="diff-content"></div>
        </div>
      </div>
    </FocusLock>
  );
}
