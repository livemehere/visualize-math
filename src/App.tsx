import { useEffect, useRef } from "react";
import { Canvas } from "./lib/Canvas";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    new Canvas({ element: canvasRef.current! });
  }, []);
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
export default App;
