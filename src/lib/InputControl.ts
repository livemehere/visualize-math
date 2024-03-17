type Callback = (isDown: boolean) => void;

export class InputControl {
  keys: { [key: string]: boolean } = {};
  cb: { [key: string]: Callback } = {};

  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      if (this.cb[e.key]) {
        this.cb[e.key](true);
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
      if (this.cb[e.key]) {
        this.cb[e.key](false);
      }
    });
  }

  onChange(key: string, cb: Callback) {
    this.cb[key] = cb;
  }
}
