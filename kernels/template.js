/**
 * Day 9: Crazy Automaton
 *
 * [Placeholder - awaiting instructions]
 */
import { Game, GameObject, Scene, Rectangle, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  colors: {
    bg: "#000",
    primary: "#0f0",
  },
};

/**
 * Simple placeholder GameObject with a rectangle
 */
class PlaceholderBox extends GameObject {
  constructor(game) {
    // ✅ Pass width and height to GameObject constructor
    super(game, { width: 100, height: 100 });

    // Create the shape
    this.shape = new Rectangle({
      width: 100,
      height: 100,
      color: CONFIG.colors.primary,
      stroke: "#fff",
      lineWidth: 2,
      debug: true,
    });

    // Enable interactivity
    this.interactive = true;
    
    // Use event emitter pattern
    this.on('inputdown', (e) => {
      console.log("Box clicked!", e.x, e.y);
    });
  }

  /**
   * Update called every frame
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    super.update(dt);
  }

  /**
   * Render the shape
   */
  render() {
    super.render();
    this.shape.render();
  }
}


/**
 * Main game class
 */
class Day09Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.colors.bg;
  }

  init() {
    super.init();
    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    // Create scene and add to pipeline
    this.scene = new Scene(this);
    
    this.scene.add(new PlaceholderBox(this));
    this.pipeline.add(this.scene);
  }

  update(dt) {
    super.update(dt);
    this.scene.x = this.width / 2;
    this.scene.y = this.height / 2;
  }
}


/**
 * Mount Day 09 into the provided canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ stop: () => void, game: Day09Demo }}
 */
export default function day09(canvas) {
  const game = new Day09Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
