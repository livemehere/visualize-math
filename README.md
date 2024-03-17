# Board

## Dev Docs

### Sync Board value to DOM Element

Declare `updateUI` method in the board class to sync board properties to DOM elements.   
Board properties can be synced to DOM elements by adding a `data-board-` attribute to the element.

```ts
// Board.ts
updateUI() {
    this.syncTextToUI("zoom", `Zoom: ${(this.zoom * 100).toFixed(0)}%`);
    this.syncTextToUI(
      "pan",
      `Pan: ${this.pan.x.toFixed(0)}px, ${this.pan.y.toFixed(0)}px`,
    );
}
```

```tsx
const board = new Board({ element: canvasRef.current! });

<p>{board.zoom}</p> // X

// ...

<p data-board-zoom></p> // O
```
