import { useEffect, useRef } from "react";
import { Board } from "./lib/Board";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>();

  useEffect(() => {
    const board = new Board({ element: canvasRef.current! });
    boardRef.current = board;

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
      </div>
    </div>
  );
}
export default App;
