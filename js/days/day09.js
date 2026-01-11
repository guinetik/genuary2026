/**
 * Day 9: Crazy Automaton
 *
 * Cellular automata with crazy rules.
 *
 * TODO: Implement CA
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  // Grid
  cellSize: 4,

  // Colors
  colors: {
    dead: "#000",
    alive: "#0f0",
  },
};

class Day09Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Calculate grid dimensions
    this.cols = Math.floor(this.width / CONFIG.cellSize);
    this.rows = Math.floor(this.height / CONFIG.cellSize);

    // Initialize grid (double buffer)
    this.grid = this.createGrid();
    this.nextGrid = this.createGrid();

    // TODO: Seed initial state
  }

  createGrid() {
    return new Uint8Array(this.cols * this.rows);
  }

  getCell(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 0;
    return this.grid[y * this.cols + x];
  }

  setCell(grid, x, y, value) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      grid[y * this.cols + x] = value;
    }
  }

  update(dt) {
    super.update(dt);
    // TODO: Apply CA rules
  }

  render() {
    Painter.useCtx((ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);

      // TODO: Render grid
    });
  }
}

export default function day09(canvas) {
  const game = new Day09Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
