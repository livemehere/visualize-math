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
        <p id="zoom"></p>
        <p id="pan"></p>
      </div>
    </div>
  );
}
export default App;
