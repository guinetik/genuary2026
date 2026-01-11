/**
 * Day 11: Quine - Matrix Code Rain
 *
 * A quine outputs its own source code.
 * This file fetches itself and displays its own source as falling Matrix rain.
 * Each column shows a random line of code falling - readable syntax.
 *
 * Mouse interaction: hover repels nearby drops
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  cell: { w: 11, h: 18 },
  tick: 70,
  tail: { min: 25, max: 50 },
  mouse: { radius: 100, force: 5 },
  glow: { blur: 10, color: "#0f0" },
};

class QuineDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
    this.source = "";
    this.lines = [];
    this.ready = false;
  }

  async init() {
    super.init();
    Painter.init(this.ctx);

    // THE QUINE: Fetch our own source code
    try {
      const response = await fetch(import.meta.url);
      this.source = await response.text();
    } catch (e) {
      this.source = `// Could not fetch source
// Run via HTTP server: npm run dev
import { Game, Painter } from "@guinetik/gcanvas";
const CONFIG = { cell: { w: 11, h: 18 } };
class QuineDemo extends Game {
  async init() {
    const response = await fetch(import.meta.url);
    this.source = await response.text();
  }
}`;
    }

    // Parse into lines, filter out empty ones
    this.lines = this.source
      .split('\n')
      .map(line => line.trimEnd())
      .filter(line => line.length > 0);

    this.columns = [];
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.tickAccum = 0;

    const numCols = Math.ceil(this.width / CONFIG.cell.w);
    this.numRows = Math.ceil(this.height / CONFIG.cell.h);

    // Initialize drops - each column gets a random line
    for (let i = 0; i < numCols; i++) {
      this.columns.push(this.createDrop());
    }

    // Mouse tracking
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });

    this.ready = true;
  }

  createDrop() {
    const line = this.lines[Math.floor(Math.random() * this.lines.length)];
    return {
      y: -Math.floor(Math.random() * 30),
      line: line,
      charIndex: 0,  // Current character in the line
      tailLen: CONFIG.tail.min + Math.floor(Math.random() * (CONFIG.tail.max - CONFIG.tail.min)),
      chars: [],  // Trail of {row, char, age}
    };
  }

  update(dt) {
    super.update(dt);
    if (!this.ready) return;

    this.tickAccum += dt * 1000;
    if (this.tickAccum < CONFIG.tick) return;
    this.tickAccum = 0;

    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      const x = i * CONFIG.cell.w + CONFIG.cell.w / 2;

      // Mouse repulsion
      const py = col.y * CONFIG.cell.h;
      const dx = x - this.mouseX;
      const dy = py - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.mouse.radius && dist > 0) {
        col.y -= CONFIG.mouse.force * (1 - dist / CONFIG.mouse.radius);
      }

      // Move drop down
      col.y++;

      // Add current character to trail
      if (col.charIndex < col.line.length) {
        const char = col.line[col.charIndex];
        col.chars.unshift({ row: Math.floor(col.y), char: char, age: 0 });
        col.charIndex++;
      }

      // Age trail characters
      for (const c of col.chars) {
        c.age++;
      }

      // Remove old trail chars
      col.chars = col.chars.filter(c => c.age < col.tailLen);

      // Reset when line is done typing (don't wait for trail to fade)
      const lineDone = col.charIndex >= col.line.length;
      const offScreen = col.y > this.numRows + col.tailLen;

      if (lineDone || offScreen || Math.random() > 0.995) {
        // Keep old trail chars, start new drop
        const oldChars = col.chars;
        this.columns[i] = this.createDrop();
        this.columns[i].chars = oldChars; // Inherit fading trail
      }
    }
  }

  render() {
    Painter.useCtx((ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);

      if (!this.ready) {
        ctx.font = "16px 'Fira Code', monospace";
        ctx.fillStyle = "#0f0";
        ctx.textAlign = "center";
        ctx.fillText("Fetching source...", this.width / 2, this.height / 2);
        return;
      }

      ctx.font = `14px 'Fira Code', monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      for (let i = 0; i < this.columns.length; i++) {
        const col = this.columns[i];
        const x = i * CONFIG.cell.w;

        for (const c of col.chars) {
          const y = c.row * CONFIG.cell.h;
          if (y < 0 || y > this.height) continue;

          if (c.age <= 1) {
            // Head - bright white with glow
            ctx.shadowColor = CONFIG.glow.color;
            ctx.shadowBlur = CONFIG.glow.blur;
            ctx.fillStyle = "#fff";
            ctx.fillText(c.char, x, y);
            ctx.shadowBlur = 0;
          } else {
            // Tail - fading green
            const alpha = 1 - c.age / col.tailLen;
            const green = Math.floor(255 * alpha);
            ctx.fillStyle = `rgba(0, ${green}, 50, ${alpha})`;
            ctx.fillText(c.char, x, y);
          }
        }
      }

      // Random flicker - show random chars from source
      ctx.fillStyle = "rgba(0, 255, 50, 0.08)";
      for (let i = 0; i < 15; i++) {
        const rx = Math.floor(Math.random() * this.columns.length) * CONFIG.cell.w;
        const ry = Math.floor(Math.random() * this.numRows) * CONFIG.cell.h;
        const rc = this.source[Math.floor(Math.random() * this.source.length)];
        if (rc !== '\n' && rc !== '\r') {
          ctx.fillText(rc, rx, ry);
        }
      }

      // Mouse repel zone
      if (this.mouseX > 0) {
        const gradient = ctx.createRadialGradient(
          this.mouseX, this.mouseY, 0,
          this.mouseX, this.mouseY, CONFIG.mouse.radius
        );
        gradient.addColorStop(0, "rgba(0, 255, 100, 0.05)");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.mouseX, this.mouseY, CONFIG.mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

export default function day11(canvas) {
  const game = new QuineDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
