import { useEffect, useRef, useState } from "react";
import { Board, Circle, Dot, Line } from "./lib/Board";
import { AnimatePresence, motion } from "framer-motion";
import { useModal } from "async-modal-react";
import AddCircleModal, { CircleModalResult } from "./modals/AddCircleModal";
import AddDotModal, { DotModalResult } from "./modals/AddDotModal";

function App() {
  const { pushModal } = useModal();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>();
  const [gridGap, setGridGap] = useState(50);
  const [selectedDots, setSelectedDots] = useState<Dot[]>([]);
  const [selectedLines, setSelectedLines] = useState<Line[]>([]);
  const [selectedCircles, setSelectedCircles] = useState<Circle[]>([]);

  useEffect(() => {
    const board = new Board({ element: canvasRef.current! });
    boardRef.current = board;

    board.onSelectDots = setSelectedDots;
    board.onSelectLines = setSelectedLines;
    board.onSelectCircles = setSelectedCircles;

    return () => {
      board.cleanup();
    };
  }, []);

  useEffect(() => {
    boardRef.current!.gridGap = gridGap;
  }, [gridGap]);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <div
        id="status"
        className={"absolute left-0 top-0 p-4 text-2xl text-white"}
      >
        <p data-board-zoom></p>
        <p data-board-pan></p>
        <p data-board-mode></p>
      </div>
      <div
        id="tools"
        className={"absolute bottom-10 left-10 flex gap-4 p-4 text-white"}
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
            boardRef.current!.zoom = Math.max(
              0.5,
              boardRef.current!.zoom - 0.1,
            );
          }}
        >
          ZOOM -10%
        </button>
        <button>Grid size 👉</button>
        <input
          type="number"
          value={gridGap}
          min={15}
          onChange={(e) => setGridGap(Number(e.target.value))}
        />
        <button
          onClick={() => {
            boardRef.current!.mouseMode = "select";
          }}
        >
          Select Mode (s)
        </button>
        <button
          onClick={() => {
            boardRef.current!.mouseMode = "draw";
          }}
        >
          Draw Mode (d)
        </button>
        <button>Wheel to zoom</button>
      </div>
      <div className={"absolute right-10 top-10 flex flex-col gap-4"}>
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
              className={"w-[300px] rounded bg-neutral-900 p-4 text-white"}
            >
              <h2 className={"mb-4 text-2xl font-bold"}>
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
              className={"w-[300px] rounded bg-neutral-900 p-4 text-white"}
            >
              <h2 className={"mb-4 text-2xl font-bold"}>
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
              className={"w-[300px] rounded bg-neutral-900 p-4 text-white"}
            >
              <h2 className={"mb-4 text-2xl font-bold"}>
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
      <div
        id="create-tools"
        className={
          "absolute bottom-10 right-10 w-[300px] rounded bg-neutral-900 p-4 text-white"
        }
      >
        <div className={"flex flex-col gap-4"}>
          <button
            onClick={async () => {
              try {
                const res = await pushModal<CircleModalResult>(AddCircleModal);
                if (res) {
                  boardRef.current!.addCircle(res, true);
                }
              } catch (e) {
                console.error(e);
              }
            }}
          >
            Add Circle
          </button>
          <button
            onClick={async () => {
              try {
                const res = await pushModal<DotModalResult>(AddDotModal);
                if (res) {
                  boardRef.current!.addDot(res, true);
                }
              } catch (e) {
                console.error(e);
              }
            }}
          >
            Add Dot
          </button>
        </div>
      </div>
    </div>
  );
}
export default App;
