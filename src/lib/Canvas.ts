interface Props {
  element: HTMLCanvasElement;
}

export class Canvas {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  stageWidth: number;
  stageHeight: number;
  width: number;
  height: number;
  backgroundColor: string;

  constructor(props: Props) {
    this.element = props.element;
    this.ctx = this.element.getContext("2d")!;

    const dpr = window.devicePixelRatio > 1 ? 2 : 1;
    this.width = innerWidth;
    this.height = innerHeight;
    this.stageWidth = this.width * dpr;
    this.stageHeight = this.height * dpr;
    this.element.width = this.stageWidth;
    this.element.height = this.stageHeight;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    this.backgroundColor = "rgb(16,16,16)";

    requestAnimationFrame(this.animate.bind(this));
  }

  draw() {
    this.clear();
  }

  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.stageWidth, this.stageHeight);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.draw();
  }
}
