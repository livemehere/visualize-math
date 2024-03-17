import { useEffect, useRef, useState } from "react";
import { Board, Circle, Dot, Line } from "./lib/Board";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>();
  const [selectedDots, setSelectedDots] = useState<Dot[]>([]);
  const [selectedLines, setSelectedLines] = useState<Line[]>([]);
  const [selectedCircles, setSelectedCircles] = useState<Circle[]>([]);

  useEffect(() => {
    const board = new Board({ element: canvasRef.current! });
    boardRef.current = board;

    board.onSelectDots = setSelectedDots;
    board.onSelectLines = setSelectedLines;
    board.onSelectCircles = setSelectedCircles;

    board.addCircle({
      x: 0,
      y: 0,
      radius: 5,
    });

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
        </button>
        <button
          onClick={() => {
            boardRef.current!.mouseMode = "draw";
          }}
        >
          Draw Mode
        </button>
      </div>
      <div className={"absolute top-10 right-10 flex flex-col gap-4"}>
        <AnimatePresence>
          {!!selectedDots.length && (
            <motion.div
              animate={{
                x: ["10%", "0%"],
                opacity: [0, 1],
              }}
              exit={{
                x: ["0%", "10%"],
                opacity: [1, 0],
              }}
              id="select-tools"
              className={"p-4 bg-neutral-900 text-white rounded w-[300px]"}
            >
              <h2 className={"text-2xl font-bold mb-4"}>
                Dots({selectedDots.length})
              </h2>
              <div className={"flex flex-col gap-4"}>
                <button
                  onClick={() => {
                    boardRef.current!.connectDots(selectedDots);
                  }}
                >
                  Connect
                </button>
                <button
                  onClick={() => {
                    boardRef.current!.removeDots(selectedDots);
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!!selectedLines.length && (
            <motion.div
              animate={{
                x: ["10%", "0%"],
                opacity: [0, 1],
              }}
              exit={{
                x: ["0%", "10%"],
                opacity: [1, 0],
              }}
              id="select-tools"
              className={"p-4 bg-neutral-900 text-white rounded w-[300px]"}
            >
              <h2 className={"text-2xl font-bold mb-4"}>
                Lines({selectedLines.length})
              </h2>
              <div className={"flex flex-col gap-4"}>
                <button
                  onClick={() => {
                    boardRef.current!.removeLines(selectedLines);
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!!selectedCircles.length && (
            <motion.div
              animate={{
                x: ["10%", "0%"],
                opacity: [0, 1],
              }}
              exit={{
                x: ["0%", "10%"],
                opacity: [1, 0],
              }}
              id="select-tools"
              className={"p-4 bg-neutral-900 text-white rounded w-[300px]"}
            >
              <h2 className={"text-2xl font-bold mb-4"}>
                Circles({selectedCircles.length})
              </h2>
              <div className={"flex flex-col gap-4"}>
                <button
                  onClick={() => {
                    boardRef.current!.removeCircles(selectedCircles);
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default App;
