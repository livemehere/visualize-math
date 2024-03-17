import { InputControl } from "./InputControl";

export interface Dot {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

type MouseMode = "move" | "draw" | "select";

interface Props {
  element: HTMLCanvasElement;
  onSelectDots?: (dots: Dot[]) => void;
}

export class Board {
  private rafId: number;
  private element: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private seq: number;
  inputControl: InputControl;
  dpr: number;
  stageWidth: number;
  stageHeight: number;
  width: number;
  height: number;
  backgroundColor: string;
  gridColor: string;
  gridGap: number;
  mouseMode: MouseMode;
  mouse: {
    x: number;
    y: number;
    isDown: boolean;
  };
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
  updateUIMap: { [key: string]: HTMLElement | undefined };
  dots: Dot[];
  selectedDots: Dot[];
  lines: {
    from: Dot;
    to: Dot;
  }[];
  previewDot?: Dot;
  previewDotColor: string;
  selectBox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  onSelectDots?: (dots: Dot[]) => void;

  constructor(props: Props) {
    this.inputControl = new InputControl();
    this.element = props.element;
    this.dpr = window.devicePixelRatio > 1 ? 2 : 1;
    this.ctx = this.element.getContext("2d")!;
    this.backgroundColor = "rgb(16,16,16)";
    this.gridColor = "rgba(255,255,255,0.09)";
    this.previewDotColor = "rgba(255,255,255,0.2)";
    this.gridGap = 50;
    this.mouseMode = "draw";
    this.mouse = {
      x: 0,
      y: 0,
      isDown: false,
    };
    this.zoom = 1;
    this.pan = {
      x: 0,
      y: 0,
    };
    this.seq = 0;
    this.updateUIMap = {};
    this.dots = [];
    this.lines = [];
    this.selectedDots = [];
    this.onSelectDots = props.onSelectDots;

    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
    this.rafId = requestAnimationFrame(this.animate.bind(this));

    this.handleMouse();
    this.handleKeyboard();
  }

  draw() {
    this.updateUI();
    this.clear();
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.drawGrid();
    this.drawPreviewDot();
    this.drawDots();
    this.drawSelectBox();
    this.drawSelectedDotOutline();
    this.drawLines();
    this.ctx.restore();
  }

  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.stageWidth, this.stageHeight);
  }

  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.stageWidth = this.width;
    this.stageHeight = this.height;
    this.element.width = this.stageWidth;
    this.element.height = this.stageHeight;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.element.style.position = "absolute";
    this.element.style.left = "0";
    this.element.style.top = "0";
  }

  syncTextToUI(key: string, text: string) {
    let cacheEl = this.updateUIMap[key];
    if (!cacheEl) {
      const el = document.querySelector(`[data-board-${key}]`);
      if (el) {
        this.updateUIMap[key] = el as HTMLElement;
        cacheEl = el as HTMLElement;
      }
    }
    if (cacheEl && cacheEl.innerHTML !== text) {
      cacheEl.innerHTML = text;
    }
  }

  updateUI() {
    this.syncTextToUI("zoom", `Zoom: ${(this.zoom * 100).toFixed(0)}%`);
    this.syncTextToUI(
      "pan",
      `Pan: ${this.pan.x.toFixed(0)}px, ${this.pan.y.toFixed(0)}px`,
    );
    this.syncTextToUI("mode", `Mode: ${this.mouseMode}`);
  }

  cleanup() {
    window.removeEventListener("resize", this.resize.bind(this));
    window.cancelAnimationFrame(this.rafId);
  }

  animate() {
    this.rafId = window.requestAnimationFrame(this.animate.bind(this));
    this.draw();
  }

  handleKeyboard() {
    let prevMode: MouseMode | undefined;
    this.inputControl.onChange(" ", (isDown) => {
      if (isDown) {
        if (prevMode === undefined) {
          prevMode = this.mouseMode;
        }
        this.previewDot = undefined;
        this.mouseMode = "move";
        document.body.style.cursor = this.mouse.isDown ? "grabbing" : "grab";
      } else {
        this.mouseMode = prevMode!;
        prevMode = undefined;
        document.body.style.cursor = "default";
      }
    });
  }

  handleMouse() {
    this.element.addEventListener("pointerdown", (e) => {
      const rect = this.element.getBoundingClientRect();
      this.mouse.isDown = true;
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      /** handle mouse mode */
      const realX = this.toRealX(this.mouse.x, true);
      const realY = this.toRealY(this.mouse.y, true);
      if (this.mouseMode === "draw") {
        const { x, y } = this.snapToGrid(realX, realY);
        this.addDot(x, y, 5, "white");
      } else if (this.mouseMode === "select") {
        this.selectBox = {
          x1: realX,
          y1: realY,
          x2: realX,
          y2: realY,
        };
      }
    });

    this.element.addEventListener("pointerup", () => {
      this.mouse.isDown = false;
      if (this.mouseMode === "move") {
        document.body.style.cursor = "grab";
      } else if (this.mouseMode === "select") {
        this.updateSelectedDots();
        this.selectBox = undefined;
      }
    });

    this.element.addEventListener("pointermove", (e) => {
      const rect = this.element.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      if (this.mouse.isDown && this.mouseMode === "move") {
        this.pan.x += Math.round(e.movementX / this.zoom);
        this.pan.y += Math.round(e.movementY / this.zoom);
      }

      /** handle mouse mode */
      const realX = this.toRealX(this.mouse.x, true);
      const realY = this.toRealY(this.mouse.y, true);
      if (this.mouseMode === "draw") {
        document.body.style.cursor = "default";
        const { x, y } = this.snapToGrid(realX, realY);
        this.previewDot = {
          id: -1,
          radius: 5,
          x,
          y,
          color: this.previewDotColor,
        };
      } else if (this.mouseMode === "select" && this.selectBox) {
        this.selectBox.x2 = realX;
        this.selectBox.y2 = realY;
      }
    });

    this.element.addEventListener("wheel", (e) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const mount = dir * 0.1;
      this.zoom = Math.max(0.5, this.zoom + mount);
      if (this.zoom > 0.5) {
        this.pan.x -= Math.round(this.mouse.x * mount);
        this.pan.y -= Math.round(this.mouse.y * mount);
      }
    });
  }

  toRealX(xVirtual: number, applyZoom = false) {
    if (applyZoom) return xVirtual / this.zoom - this.pan.x;
    return xVirtual - this.pan.x;
  }

  toRealY(yVirtual: number, applyZoom = false) {
    if (applyZoom) return yVirtual / this.zoom - this.pan.y;
    return yVirtual - this.pan.y;
  }

  toVirtualX(xReal: number, applyZoom = false) {
    if (applyZoom) return xReal * this.zoom + this.pan.x;
    return xReal + this.pan.x;
  }

  toVirtualY(yReal: number, applyZoom = false) {
    if (applyZoom) return yReal * this.zoom + this.pan.y;
    return yReal + this.pan.y;
  }

  snapToGrid(x: number, y: number) {
    return {
      x: Math.round(x / this.gridGap) * this.gridGap,
      y: Math.round(y / this.gridGap) * this.gridGap,
    };
  }

  get virtualWidth() {
    return this.stageWidth / this.zoom;
  }

  get virtualHeight() {
    return this.stageHeight / this.zoom;
  }

  drawText(text: string, x: number, y: number) {
    this.ctx.save();
    this.ctx.font = `${Math.max(10 / this.zoom, 14)}px serif`;
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawGrid() {
    this.ctx.lineWidth = 1;

    /* vertical */
    for (
      let x = this.pan.x % this.gridGap;
      x < this.virtualWidth;
      x += this.gridGap
    ) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.virtualHeight);
      this.ctx.strokeStyle = this.gridColor;

      const realX = this.toRealX(x);
      if (realX === 0) {
        this.ctx.strokeStyle = "red";
      }
      this.ctx.stroke();
      this.drawText(`${realX / this.gridGap}`, x, 14);
    }

    /* horizontal */
    for (
      let y = this.pan.y % this.gridGap;
      y < this.virtualHeight;
      y += this.gridGap
    ) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.virtualWidth, y);
      this.ctx.strokeStyle = this.gridColor;
      const realY = this.toRealY(y);
      if (realY === 0) {
        this.ctx.strokeStyle = "red";
      }
      this.ctx.stroke();
      this.drawText(`${realY / this.gridGap}`, 14, y);
    }
  }

  addDot(x: number, y: number, radius: number, color: string) {
    this.dots.push({ id: this.seq++, x, y, radius, color });
  }

  drawDots() {
    this.dots.forEach((dot) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.toVirtualX(dot.x),
        this.toVirtualY(dot.y),
        dot.radius,
        0,
        Math.PI * 2,
      );
      this.ctx.fillStyle = dot.color;
      this.ctx.fill();
    });
  }

  drawPreviewDot() {
    if (this.previewDot && this.mouseMode === "draw") {
      this.ctx.beginPath();
      this.ctx.arc(
        this.toVirtualX(this.previewDot.x),
        this.toVirtualY(this.previewDot.y),
        this.previewDot.radius,
        0,
        Math.PI * 2,
      );
      this.ctx.fillStyle = this.previewDot.color;
      this.ctx.fill();
    }
  }

  drawSelectBox() {
    if (this.selectBox) {
      const { x1, y1, x2, y2 } = this.selectBox;
      this.ctx.beginPath();
      this.ctx.strokeStyle = "white";
      this.ctx.fillStyle = "rgba(255,255,255,0.1)";
      this.ctx.lineWidth = 1;
      this.ctx.rect(this.toVirtualX(x1), this.toVirtualY(y1), x2 - x1, y2 - y1);
      this.ctx.stroke();
      this.ctx.fill();
    }
  }

  drawSelectedDotOutline() {
    this.selectedDots.forEach((dot) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.toVirtualX(dot.x),
        this.toVirtualY(dot.y),
        dot.radius + 2,
        0,
        Math.PI * 2,
      );
      this.ctx.strokeStyle = "red";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  updateSelectedDots() {
    if (this.selectBox) {
      const x1 = this.toVirtualX(this.selectBox.x1);
      const y1 = this.toVirtualY(this.selectBox.y1);
      const x2 = this.toVirtualX(this.selectBox.x2);
      const y2 = this.toVirtualY(this.selectBox.y2);
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      this.selectedDots = this.dots.filter((dot) => {
        const x = this.toVirtualX(dot.x);
        const y = this.toVirtualY(dot.y);
        return x > minX && x < maxX && y > minY && y < maxY;
      });
      this.onSelectDots?.(this.selectedDots);
    }
  }

  connectDots(dots: Dot[]) {
    if (dots.length < 2) return;
    for (let i = 0; i < dots.length - 1; i++) {
      this.lines.push({
        from: dots[i],
        to: dots[i + 1],
      });
    }
  }

  drawLines() {
    this.lines.forEach((line) => {
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.toVirtualX(line.from.x),
        this.toVirtualY(line.from.y),
      );
      this.ctx.lineTo(this.toVirtualX(line.to.x), this.toVirtualY(line.to.y));
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
  }
}
