interface Props {
  element: HTMLCanvasElement;
}

export class Board {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
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

    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
    this.handleMouse();
    requestAnimationFrame(this.animate.bind(this));
  }

  draw() {
    this.updateUI();
    this.clear();
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.drawGrid();
    this.drawAxes();
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
    // this.ctx.scale(this.dpr, this.dpr);
  }

  updateUI() {
    document.getElementById("zoom")!.innerHTML = `Zoom: ${this.zoom.toFixed(
      2,
    )}`;
    document.getElementById("pan")!.innerHTML = `Pan: ${this.pan.x.toFixed(
      2,
    )}, ${this.pan.y.toFixed(2)}`;
  }

  cleanup() {
    window.removeEventListener("resize", this.resize.bind(this));
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
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
        this.pan.x += e.movementX;
        this.pan.y += e.movementY;
      }
    });

    this.element.addEventListener("wheel", (e) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const mount = dir * 0.1;
      this.zoom += mount;
    });
  }

  drawAxes() {
    // TODO: Draw axes
  }

  drawGrid() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.lineWidth = 1;

    for (
      let i = this.pan.x % this.gridGap;
      i < this.stageWidth;
      i += this.gridGap
    ) {
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.stageHeight);
    }

    for (
      let i = this.pan.y % this.gridGap;
      i < this.stageHeight;
      i += this.gridGap
    ) {
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.stageWidth, i);
    }

    this.ctx.stroke();
  }
}
