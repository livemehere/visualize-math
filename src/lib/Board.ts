interface Props {
  element: HTMLCanvasElement;
}

export class Board {
  private rafId: number;
  private element: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  dpr: number;
  stageWidth: number;
  stageHeight: number;
  width: number;
  height: number;
  backgroundColor: string;
  gridColor: string;
  gridGap: number;
  mouseMode: "move";
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

  constructor(props: Props) {
    this.element = props.element;
    this.dpr = window.devicePixelRatio > 1 ? 2 : 1;
    this.ctx = this.element.getContext("2d")!;
    this.backgroundColor = "rgb(16,16,16)";
    this.gridColor = "rgba(255,255,255,0.09)";
    this.gridGap = 50;
    this.mouseMode = "move";
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
    this.updateUIMap = {};

    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
    this.handleMouse();
    this.rafId = requestAnimationFrame(this.animate.bind(this));
  }

  draw() {
    this.updateUI();
    this.clear();
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.drawGrid();
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
  }

  cleanup() {
    window.removeEventListener("resize", this.resize.bind(this));
    window.cancelAnimationFrame(this.rafId);
  }

  animate() {
    this.rafId = window.requestAnimationFrame(this.animate.bind(this));
    this.draw();
  }

  handleMouse() {
    this.element.addEventListener("pointerdown", (e) => {
      const rect = this.element.getBoundingClientRect();
      this.mouse.isDown = true;
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      if (this.mouseMode === "move") {
        document.body.style.cursor = "grabbing";
      }
    });

    this.element.addEventListener("pointerup", () => {
      this.mouse.isDown = false;
      if (this.mouseMode === "move") {
        document.body.style.cursor = "grab";
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

  toRealX(xVirtual: number) {
    return xVirtual - this.pan.x;
  }

  toRealY(yVirtual: number) {
    return yVirtual - this.pan.y;
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

    /* 세로줄 */
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
      this.drawText(`${realX}`, x, 14);
    }

    /* 가로줄 */
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
      this.drawText(`${realY}`, 14, y);
    }
  }
}
