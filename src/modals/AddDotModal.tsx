import { ModalProps } from "async-modal-react/dist/types/modal";
import { useState } from "react";

export interface Props extends ModalProps {}
export interface DotModalResult {
  x: number;
  y: number;
}

const AddDotModal = ({ close, resolve }: Props) => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  return (
    <div className={"common-modal"}>
      <h2>Add Dot</h2>
      <label>
        <span>X</span>
        <input
          type="number"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
        />
      </label>
      <label>
        <span>Y</span>
        <input
          type="number"
          value={y}
          onChange={(e) => setY(Number(e.target.value))}
        />
      </label>

      <button
        onClick={() => {
          resolve({ x, y });
          close();
        }}
      >
        Done
      </button>
    </div>
  );
};

export default AddDotModal;
