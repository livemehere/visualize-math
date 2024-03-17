import { InputControl } from "./InputControl";

export interface Dot {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Line {
  from: Dot;
  to: Dot;
}

export interface Circle {
  id: number;
  x: number;
  y: number;
  radius: number;
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
  lines: Line[];
  selectedLines: Line[];
  circles: Circle[];
  selectedCircles: Circle[];
  previewDot?: Dot;
  previewDotColor: string;
  selectBox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  /* from outside of class */
  onSelectDots?: (dots: Dot[]) => void;
  onSelectLines?: (lines: Line[]) => void;
  onSelectCircles?: (circles: Circle[]) => void;

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
    this.selectedLines = [];
    this.circles = [];
    this.selectedCircles = [];
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
    this.drawSelectedLines();
    this.drawLines();
    this.drawDots();
    this.drawSelectBox();
    this.drawSelectedDots();
    this.drawCircle();
    this.drawSelectedCircles();
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
        this.updateSelected();
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

  toGridValue(value: number) {
    return value / this.gridGap;
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
      this.drawText(`${this.toGridValue(realX)}`, x, 14);
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
      this.drawText(`${this.toGridValue(realY)}`, 14, y);
    }
  }

  addDot(x: number, y: number, radius: number, color: string) {
    this.dots.push({ id: this.seq++, x, y, radius, color });
  }

  removeDots(dots: Dot[]) {
    this.dots = this.dots.filter((dot) => !dots.includes(dot));
    this.selectedDots = this.selectedDots.filter((dot) => !dots.includes(dot));
  }

  removeLines(lines: Line[]) {
    this.lines = this.lines.filter(
      (line) => !lines.some((l) => l.from === line.from && l.to === line.to),
    );
    this.selectedLines = this.selectedLines.filter(
      (line) => !lines.some((l) => l.from === line.from && l.to === line.to),
    );
  }

  removeCircles(circles: Circle[]) {
    this.circles = this.circles.filter((circle) => !circles.includes(circle));
    this.selectedCircles = this.selectedCircles.filter(
      (circle) => !circles.includes(circle),
    );
  }

  drawDots() {
    this.ctx.save();
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
    this.ctx.restore();
  }

  drawPreviewDot() {
    this.ctx.save();
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
    this.ctx.restore();
  }

  drawSelectBox() {
    this.ctx.save();
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
    this.ctx.restore();
  }

  drawSelectedDots() {
    this.ctx.save();
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

      this.ctx.font = "14px serif";
      this.ctx.fillStyle = "salmon";
      this.ctx.fillText(
        `(${this.toGridValue(dot.x)},${this.toGridValue(dot.y)})`,
        this.toVirtualX(dot.x) + 10,
        this.toVirtualY(dot.y) - 10,
      );
    });
    this.ctx.restore();
  }

  updateSelected() {
    if (this.selectBox) {
      const x1 = this.toVirtualX(this.selectBox.x1);
      const y1 = this.toVirtualY(this.selectBox.y1);
      const x2 = this.toVirtualX(this.selectBox.x2);
      const y2 = this.toVirtualY(this.selectBox.y2);
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const selectedDots = this.dots.filter((dot) => {
        const x = this.toVirtualX(dot.x);
        const y = this.toVirtualY(dot.y);
        return x > minX && x < maxX && y > minY && y < maxY;
      });
      const selectedLines = this.lines.filter((line) => {
        const x1 = this.toVirtualX(line.from.x);
        const y1 = this.toVirtualY(line.from.y);
        const x2 = this.toVirtualX(line.to.x);
        const y2 = this.toVirtualY(line.to.y);
        return (
          (x1 > minX && x1 < maxX && y1 > minY && y1 < maxY) ||
          (x2 > minX && x2 < maxX && y2 > minY && y2 < maxY)
        );
      });
      const selectedCircles = this.circles.filter((circle) => {
        const x = this.toVirtualX(circle.x);
        const y = this.toVirtualY(circle.y);
        const r = circle.radius * this.gridGap;
        return x - r > minX && x + r < maxX && y - r > minY && y + r < maxY;
      });

      if (this.inputControl.keys["Shift"]) {
        this.selectedDots = this.selectedDots.concat(selectedDots);
        this.selectedLines = this.selectedLines.concat(selectedLines);
        this.selectedCircles = this.selectedCircles.concat(selectedCircles);
      } else {
        this.selectedDots = selectedDots;
        this.selectedLines = selectedLines;
        this.selectedCircles = selectedCircles;
      }
      this.onSelectDots?.(this.selectedDots);
      this.onSelectLines?.(this.selectedLines);
      this.onSelectCircles?.(this.selectedCircles);
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
    this.ctx.save();
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
    this.ctx.restore();
  }

  drawSelectedLines() {
    this.ctx.save();
    this.selectedLines.forEach((line) => {
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.toVirtualX(line.from.x),
        this.toVirtualY(line.from.y),
      );
      this.ctx.lineTo(this.toVirtualX(line.to.x), this.toVirtualY(line.to.y));
      this.ctx.strokeStyle = "red";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = "14px serif";
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "salmon";
      const length = Math.sqrt(
        (line.to.x - line.from.x) ** 2 + (line.to.y - line.from.y) ** 2,
      );
      this.ctx.fillText(
        `${this.toGridValue(length).toFixed(2)}`,
        (this.toVirtualX(line.from.x) + this.toVirtualX(line.to.x)) / 2 + 10,
        (this.toVirtualY(line.from.y) + this.toVirtualY(line.to.y)) / 2 - 10,
      );
    });
    this.ctx.restore();
  }

  addCircle(circle: Omit<Circle, "id">) {
    this.circles.push({
      id: this.seq++,
      x: circle.x,
      y: circle.y,
      radius: circle.radius,
    });
  }

  drawCircle() {
    this.ctx.save();
    this.circles.forEach((circle) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.toVirtualX(circle.x),
        this.toVirtualY(circle.y),
        circle.radius * this.gridGap,
        0,
        Math.PI * 2,
      );
      this.ctx.strokeStyle = "white";
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  drawSelectedCircles() {
    this.ctx.save();
    this.selectedCircles.forEach((circle) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.toVirtualX(circle.x),
        this.toVirtualY(circle.y),
        circle.radius * this.gridGap + 2,
        0,
        Math.PI * 2,
      );
      this.ctx.strokeStyle = "red";

      this.ctx.stroke();
    });
    this.ctx.restore();
  }
}
