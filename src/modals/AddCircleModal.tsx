import { ModalProps } from "async-modal-react/dist/types/modal";
import { useState } from "react";

export interface Props extends ModalProps {}
export interface CircleModalResult {
  x: number;
  y: number;
  radius: number;
}

const AddCircleModal = ({ close, resolve }: Props) => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [radius, setRadius] = useState(1);
  return (
    <div className={"common-modal"}>
      <h2>Add Circle</h2>
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
      <label>
        <span>Radius</span>
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </label>
      <button
        onClick={() => {
          resolve({ x, y, radius });
          close();
        }}
      >
        Done
      </button>
    </div>
  );
};

export default AddCircleModal;
