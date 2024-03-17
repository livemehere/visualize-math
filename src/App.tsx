import { useEffect, useRef, useState } from "react";
import { Board, Dot } from "./lib/Board";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>();
  const [selectedDots, setSelectedDots] = useState<Dot[]>([]);

  useEffect(() => {
    const board = new Board({ element: canvasRef.current! });
    boardRef.current = board;

    board.onSelectDots = setSelectedDots;

    return () => {
      board.cleanup();
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <div
        id="status"
        className={"absolute top-0 left-0 p-4 text-white text-2xl"}
      >
        <p data-board-zoom></p>
        <p data-board-pan></p>
        <p data-board-mode></p>
      </div>
      <div
        id="tools"
        className={"absolute bottom-10 left-10 p-4 text-white flex gap-4"}
      >
        <button
          onClick={() => {
            boardRef.current!.zoom += 0.1;
          }}
        >
          ZOOM +10%
        </button>
        <button
          onClick={() => {
            boardRef.current!.zoom -= 0.1;
          }}
        >
          ZOOM -10%
        </button>
        <button
          onClick={() => {
            boardRef.current!.mouseMode = "select";
          }}
        >
          Select Mode
        </button>{" "}
        <button
          onClick={() => {
            boardRef.current!.mouseMode = "draw";
          }}
        >
          Draw Mode
        </button>
      </div>
      {!!selectedDots.length && (
        <div
          id="select-tools"
          className={
            "absolute top-10 right-10 p-4 bg-neutral-900 text-white rounded w-[300px]"
          }
        >
          <h2 className={"text-2xl font-bold mb-4"}>Select actions</h2>
          <button
            onClick={() => {
              boardRef.current!.connectDots(selectedDots);
            }}
          >
            연결하기
          </button>
        </div>
      )}
    </div>
  );
}
export default App;
