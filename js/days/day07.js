/**
 * Genuary 2026 - Day 7
 * Prompt: "Boolean algebra"
 * 
 * @fileoverview BITWISE FRACTALS - Boolean operations create fractal patterns
 * 
 * Sierpinski triangles and other fractal patterns emerge from simple
 * bitwise boolean operations on pixel coordinates.
 * 
 * The formula (x & y) creates a Sierpinski triangle.
 * (x ^ y) creates XOR patterns. Combining them creates infinite complexity.
 * 
 * Interaction:
 * - Click: cycle through different bitwise formulas
 * - Mouse: distort the pattern
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Painter, Screen } from "@guinetik/gcanvas";

const CONFIG = {
  // Render settings - adjusted dynamically in init() for mobile
  render: {
    scaleFactor: 2,        // Will be overridden: mobile=4, tablet=3, desktop=2
    dithering: 0.6,        // Will be overridden: mobile=0
  },

  // Animation
  animation: {
    zoomSpeed: 0.08,
    zoomMin: 0.5,
    zoomMax: 4.0,
    rotationSpeed: 0.05,
    colorCycleSpeed: 15,
    pulseSpeed: 0.5,
  },

  // Mouse interaction
  mouse: {
    radius: 0.2,
    warpStrength: 30,
  },

  // Colors (terminal green theme)
  colors: {
    bg: [0, 0, 0],
    primary: [0, 255, 0],
    secondary: [0, 180, 60],
  },
};

// Bitwise fractal formulas - each creates unique patterns
const FORMULAS = [
  {
    name: "SIERPINSKI MIRROR",
    desc: "(x & y) interlocked",
    fn: (x, y, t) => {
      // Two Sierpinski patterns interlocking like teeth/zipper
      const offset = Math.floor(t * 15);
      const tileSize = 128;

      // Tile the space
      const tx = (x + offset) % tileSize;
      const ty = (y + offset) % tileSize;

      // Normal Sierpinski (pointing one way)
      const up = (tx & ty) === 0;

      // Inverted Sierpinski (mirrored to point opposite)
      const mx = tileSize - 1 - tx;
      const my = tileSize - 1 - ty;
      const down = (mx & my) === 0;

      return up || down;
    },
  },
  {
    name: "XOR PULSE",
    desc: "(x ^ y) + pulse",
    fn: (x, y, t) => {
      const pulse = Math.sin(t * 3) * 40;
      const threshold = 100 + Math.sin(t * 1.5) * 50;
      return (((x ^ y) + pulse) & 0xFF) < threshold;
    },
  },
  {
    name: "NESTED BREATHING",
    desc: "(x^y) & ((x>>s)^(y>>s))",
    fn: (x, y, t) => {
      const shift = 1 + Math.floor((Math.sin(t * 0.8) + 1) * 2); // 1-5
      return ((x ^ y) & ((x >> shift) ^ (y >> shift))) === 0;
    },
  },
  {
    name: "RULE 90 FLOW",
    desc: "(x^y) & ((x>>2)^(y>>2)) + drift",
    fn: (x, y, t) => {
      const drift = Math.floor(t * 30);
      const x1 = x + drift, y1 = y + drift;
      return ((x1 ^ y1) & ((x1 >> 2) ^ (y1 >> 2))) === 0;
    },
  },
  {
    name: "BOOLEAN WEAVE",
    desc: "(x&y) ^ (x|y) + wave",
    fn: (x, y, t) => {
      const wave = Math.sin(t * 2 + (x + y) * 0.01) * 30;
      return ((((x & y) ^ (x | y)) + wave) & 0xFF) < 128;
    },
  },
  {
    name: "MODULAR DANCE",
    desc: "(x^y) % n, n varies",
    fn: (x, y, t) => {
      const mod = 11 + Math.floor(Math.sin(t * 0.5) * 6); // 5-17
      const threshold = mod / 2 + Math.sin(t * 2) * 2;
      return ((x ^ y) % mod) < threshold;
    },
  },
  {
    name: "NAND LATTICE",
    desc: "~(x&y) & ~(x|y)",
    fn: (x, y, t) => {
      const offset = Math.floor(t * 20);
      const x1 = x + offset;
      const y1 = y + offset;
      // NAND and NOR combined create interesting lattice
      const nand = ~(x1 & y1);
      const nor = ~(x1 | y1);
      return ((nand ^ nor) & 0x3F) < 32;
    },
  },
  {
    name: "FRACTAL MORPH",
    desc: "(x|y) & (x^y) blend",
    fn: (x, y, t) => {
      const blend = (Math.sin(t) + 1) / 2; // 0-1
      const pattern1 = ((x | y) & (x ^ y)) & 0xFF;
      const pattern2 = ((x & y) | (x ^ y)) & 0xFF;
      const mixed = pattern1 * blend + pattern2 * (1 - blend);
      return mixed < 100;
    },
  },
  {
    name: "QUAD SIERPINSKI",
    desc: "4-way tiled",
    fn: (x, y, t) => {
      const offset = Math.floor(t * 20);
      const tileSize = 128;

      // Tile and get position within tile
      const tx = ((x + offset) % tileSize + tileSize) % tileSize;
      const ty = ((y + offset) % tileSize + tileSize) % tileSize;

      // 4 quadrants with mirrored Sierpinski
      const halfTile = tileSize / 2;
      const mx = tx < halfTile ? tx : tileSize - 1 - tx;
      const my = ty < halfTile ? ty : tileSize - 1 - ty;

      return (mx & my) === 0;
    },
  },
  {
    name: "WAVE XOR",
    desc: "(x^y) + sin(x) + cos(y)",
    fn: (x, y, t) => {
      const waveX = Math.sin(t * 2 + x * 0.02) * 30;
      const waveY = Math.cos(t * 1.5 + y * 0.02) * 30;
      return (((x ^ y) + waveX + waveY) & 0xFF) < 128;
    },
  },
];

/**
 * Bitwise Fractals Demo
 * 
 * Main game class for Day 7, creating fractal patterns using bitwise
 * boolean operations on pixel coordinates. Features multiple formulas
 * and mouse distortion effects.
 * 
 * @class BitwiseFractalsDemo
 * @extends {Game}
 */
class BitwiseFractalsDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
  }

  init() {
    super.init();
    Screen.init(this);  // Initialize screen detection
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    this.time = 0;
    this.formulaIndex = 0;
    this.zoom = 1.0;
    this.zoomDir = 1;
    this.rotation = 0;
    this.hueOffset = 0;

    // Mouse state
    this.mouseX = -1;
    this.mouseY = -1;
    this.mouseActive = false;

    // Mobile optimizations: higher scale factor = fewer pixels to render
    // Mobile: 4 (1/16 pixels), Tablet: 3 (1/9), Desktop: 2 (1/4)
    this.scaleFactor = Screen.responsive(4, 3, 2);
    // Disable dithering on mobile (Math.random is expensive)
    this.ditherAmount = Screen.responsive(0, 0.3, 0.6);

    // Auto-rotate formula timer
    this.formulaTimer = 0;
    this.formulaInterval = 20; // seconds

    // Render buffer
    this.handleResize();

    // Click/tap to change formula (also resets timer)
    this.canvas.addEventListener("click", () => {
      this.formulaIndex = (this.formulaIndex + 1) % FORMULAS.length;
      this.formulaTimer = 0; // Reset timer on manual change
    });

    // Mouse tracking (desktop only - skip on touch devices for performance)
    if (!Screen.isTouchPrimary()) {
      this.canvas.addEventListener("mousemove", (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / rect.width;
        this.mouseY = (e.clientY - rect.top) / rect.height;
        this.mouseActive = true;
      });

      this.canvas.addEventListener("mouseleave", () => {
        this.mouseActive = false;
      });
    }
  }

  handleResize() {
    this._lastCanvasW = this.width;
    this._lastCanvasH = this.height;

    // Recalculate scale factor on resize (handles orientation changes)
    this.scaleFactor = Screen.responsive(4, 3, 2);
    this.ditherAmount = Screen.responsive(0, 0.3, 0.6);

    this.renderWidth = Math.max(1, Math.floor(this.width / this.scaleFactor));
    this.renderHeight = Math.max(1, Math.floor(this.height / this.scaleFactor));

    this.imageData = Painter.img.createImageData(this.renderWidth, this.renderHeight);
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Auto-rotate formula every 20 seconds
    this.formulaTimer += dt;
    if (this.formulaTimer >= this.formulaInterval) {
      this.formulaIndex = (this.formulaIndex + 1) % FORMULAS.length;
      this.formulaTimer = 0;
    }

    // Check for resize
    if (this.width !== this._lastCanvasW || this.height !== this._lastCanvasH) {
      this.handleResize();
    }

    // Animate zoom (breathing effect)
    this.zoom += CONFIG.animation.zoomSpeed * this.zoomDir * dt;
    if (this.zoom > CONFIG.animation.zoomMax) {
      this.zoomDir = -1;
    } else if (this.zoom < CONFIG.animation.zoomMin) {
      this.zoomDir = 1;
    }

    // Slow rotation
    this.rotation += CONFIG.animation.rotationSpeed * dt;

    // Color cycling
    this.hueOffset += CONFIG.animation.colorCycleSpeed * dt;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Render the fractal to buffer
    this.renderFractal();

    // Draw buffer to canvas (scaled up)
    ctx.putImageData(this.imageData, 0, 0);

    // Scale up with nearest neighbor for crisp pixels
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      ctx.canvas,
      0, 0, this.renderWidth, this.renderHeight,
      0, 0, w, h
    );

    // Draw formula name overlay
    this.drawOverlay(ctx, w, h);
  }

  renderFractal() {
    const data = this.imageData.data;
    const rw = this.renderWidth;
    const rh = this.renderHeight;
    const formula = FORMULAS[this.formulaIndex];
    const t = this.time;

    const cx = rw / 2;
    const cy = rh / 2;
    const scale = Math.min(rw, rh) * this.zoom;

    // Rotation
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    // Pulse effect
    const pulse = Math.sin(t * CONFIG.animation.pulseSpeed * Math.PI * 2) * 0.5 + 0.5;

    // Mouse warp center (in render coordinates)
    const mouseRX = this.mouseX * rw;
    const mouseRY = this.mouseY * rh;
    const mouseRadius = Math.min(rw, rh) * CONFIG.mouse.radius;

    const ditherAmount = this.ditherAmount;
    const useDither = ditherAmount > 0;

    // Pre-compute mouse radius squared for faster distance check (avoid sqrt)
    const mouseRadiusSq = mouseRadius * mouseRadius;
    const skipMouseWarp = !this.mouseActive || Screen.isTouchPrimary();

    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const idx = (py * rw + px) * 4;

        // Center and scale coordinates
        let nx = (px - cx) / scale;
        let ny = (py - cy) / scale;

        // Apply rotation
        const rx = nx * cos - ny * sin;
        const ry = nx * sin + ny * cos;

        // Mouse warp distortion (skip on touch devices for performance)
        if (!skipMouseWarp) {
          const mdx = px - mouseRX;
          const mdy = py - mouseRY;
          const mdistSq = mdx * mdx + mdy * mdy;

          if (mdistSq < mouseRadiusSq && mdistSq > 0) {
            const mdist = Math.sqrt(mdistSq);
            const warpFactor = (1 - mdist / mouseRadius) * CONFIG.mouse.warpStrength;
            nx += (mdx / mdist) * warpFactor / scale;
            ny += (mdy / mdist) * warpFactor / scale;
          }
        }

        // Convert to integer coordinates for bitwise ops
        // The scale determines the "resolution" of the fractal
        const bitScale = 256;
        const ix = Math.floor((rx + 2) * bitScale) & 0xFFFF;
        const iy = Math.floor((ry + 2) * bitScale) & 0xFFFF;

        // Apply the boolean formula
        const filled = formula.fn(ix, iy, t);

        // Color based on fill state
        if (filled) {
          // Vary brightness based on position for depth effect
          const depth = ((ix ^ iy) & 0xFF) / 255;
          const brightness = 0.5 + depth * 0.5 * pulse;

          // Terminal green with slight variation
          const hue = (120 + this.hueOffset + depth * 30) % 360;
          const [r, g, b] = this.hslToRgb(hue / 360, 0.9, 0.3 + brightness * 0.4);

          // Add dithering only if enabled (skip Math.random on mobile)
          if (useDither) {
            const dither = (Math.random() - 0.5) * ditherAmount;
            data[idx] = Math.max(0, Math.min(255, r + dither));
            data[idx + 1] = Math.max(0, Math.min(255, g + dither));
            data[idx + 2] = Math.max(0, Math.min(255, b + dither));
          } else {
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        } else {
          // Background - very dark with subtle pattern
          const bgPattern = ((ix + iy) & 0xF) / 15;
          const bgBright = 5 + bgPattern * 10;
          if (useDither) {
            const dither = (Math.random() - 0.5) * ditherAmount;
            data[idx] = Math.max(0, Math.min(255, bgBright * 0.2 + dither));
            data[idx + 1] = Math.max(0, Math.min(255, bgBright * 0.5 + dither));
            data[idx + 2] = Math.max(0, Math.min(255, bgBright * 0.3 + dither));
          } else {
            data[idx] = bgBright * 0.2;
            data[idx + 1] = bgBright * 0.5;
            data[idx + 2] = bgBright * 0.3;
          }
        }
        data[idx + 3] = 255;
      }
    }
  }

  drawOverlay(ctx, w, h) {
    const formula = FORMULAS[this.formulaIndex];

    // Semi-transparent background for text
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, 10, 220, 50);

    ctx.font = '16px "Fira Code", monospace';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(formula.name, 20, 18);

    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(formula.desc, 20, 40);

    // Click hint
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "right";
    ctx.fillText("click to change formula", w - 15, h - 15);
  }

  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}

/**
 * Create Day 7 visualization
 * 
 * Factory function that creates and starts the Bitwise Fractals demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {BitwiseFractalsDemo} returns.game - The game instance
 */
export default function day07(canvas) {
  const game = new BitwiseFractalsDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
