/**
 * Genuary 2026 - Day 22
 * Prompt: "Pen plotter ready"
 * Credit: Sophia (fractal kitty)
 *
 * ETCH-A-SKETCH
 * Terminal-style drawing toy with two draggable knobs.
 * Left knob controls X, right knob controls Y.
 * Output is a single continuous line - perfect for pen plotters!
 *
 * Controls:
 * - Drag knobs to draw
 * - Arrow keys for precise control
 * - Shake mouse rapidly or press 'C' to clear
 * - Press 'S' to download SVG
 */

import { Game, Painter } from '@guinetik/gcanvas';

const CONFIG = {
  colors: {
    bg: '#0a0a0a',
    frame: '#1a1a1a',
    frameBorder: '#333',
    screen: '#111a11',
    screenBorder: '#0f0',
    line: '#0f0',
    grid: 'rgba(0, 255, 0, 0.08)',
    knob: '#222',
    knobHighlight: '#444',
    knobRing: '#0f0',
    text: '#0f0',
    textDim: 'rgba(0, 255, 0, 0.4)',
  },

  // Frame dimensions (proportions)
  frame: {
    padding: 0.08,        // Padding around screen
    cornerRadius: 20,
    knobSize: 0.07,       // Knob radius relative to min dimension
    knobY: 0.84,          // Knob Y position (proportion of height)
  },

  // Drawing
  line: {
    width: 2,
    maxPoints: 10000,     // Limit for performance
    sensitivity: 0.3,     // How much knob rotation moves cursor
  },

  // Grid
  grid: {
    spacing: 20,          // Grid cell size in pixels
  },

  // Knob physics
  knob: {
    friction: 0.92,
    maxSpeed: 15,
  },

  // Sand physics for clear animation
  sand: {
    gravity: 400,
    maxParticles: 500,
    friction: 0.98,
    bounce: 0.3,
  },
};

/**
 * Etch-a-Sketch Demo
 */
class EtchASketchDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.colors.bg;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Calculate dimensions
    this.updateDimensions();

    // Drawing state
    this.points = [];
    this.cursorX = this.screenCx;
    this.cursorY = this.screenCy;

    // Add initial point
    this.points.push({ x: this.cursorX, y: this.cursorY });

    // Knob state
    this.leftKnob = {
      angle: 0,
      velocity: 0,
      dragging: false,
      lastAngle: 0,
    };
    this.rightKnob = {
      angle: 0,
      velocity: 0,
      dragging: false,
      lastAngle: 0,
    };

    // Shake detection for clear
    this.shakeHistory = [];
    this.lastShakeTime = 0;

    // Sand particles for clear animation
    this.sandParticles = [];
    this.isClearing = false;

    // Mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.dragStartAngle = 0;

    // Set up event listeners
    this.setupEvents();
  }

  /**
   * Calculate screen and knob dimensions based on canvas size
   */
  updateDimensions() {
    const w = this.width;
    const h = this.height;
    const minDim = Math.min(w, h);
    const padding = minDim * CONFIG.frame.padding;

    // Screen area (where drawing happens)
    this.screenX = padding * 2;
    this.screenY = padding * 1.5;
    this.screenW = w - padding * 4;
    this.screenH = h * 0.68;  // Leave room for knobs below
    // Calculate grid-aligned center
    const spacing = CONFIG.grid.spacing;
    const rawCx = this.screenX + this.screenW / 2;
    const rawCy = this.screenY + this.screenH / 2;
    this.screenCx = Math.round((rawCx - this.screenX) / spacing) * spacing + this.screenX;
    this.screenCy = Math.round((rawCy - this.screenY) / spacing) * spacing + this.screenY;

    // Knob dimensions
    this.knobRadius = minDim * CONFIG.frame.knobSize;
    this.knobY = h * CONFIG.frame.knobY;
    this.leftKnobX = w * 0.2;
    this.rightKnobX = w * 0.8;
  }

  /**
   * Set up mouse, touch, and keyboard events
   */
  setupEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onPointerDown(e.touches[0]);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.onPointerMove(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', () => this.onPointerUp());

    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  /**
   * Handle pointer down (mouse or touch)
   */
  onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.mouseX = x;
    this.mouseY = y;

    // Check if clicking on left knob
    const leftDist = Math.sqrt(
      (x - this.leftKnobX) ** 2 + (y - this.knobY) ** 2
    );
    if (leftDist < this.knobRadius * 1.5) {
      this.leftKnob.dragging = true;
      this.dragStartAngle = Math.atan2(y - this.knobY, x - this.leftKnobX);
      this.leftKnob.lastAngle = this.leftKnob.angle;
      return;
    }

    // Check if clicking on right knob
    const rightDist = Math.sqrt(
      (x - this.rightKnobX) ** 2 + (y - this.knobY) ** 2
    );
    if (rightDist < this.knobRadius * 1.5) {
      this.rightKnob.dragging = true;
      this.dragStartAngle = Math.atan2(y - this.knobY, x - this.rightKnobX);
      this.rightKnob.lastAngle = this.rightKnob.angle;
      return;
    }
  }

  /**
   * Handle pointer move
   */
  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track for shake detection
    const now = Date.now();
    this.shakeHistory.push({ x, y, time: now });
    // Keep last 500ms of history
    this.shakeHistory = this.shakeHistory.filter((p) => now - p.time < 500);

    // Check for shake gesture
    if (this.detectShake()) {
      this.clearScreen();
    }

    // Update dragging knob
    if (this.leftKnob.dragging) {
      const angle = Math.atan2(y - this.knobY, x - this.leftKnobX);
      let delta = angle - this.dragStartAngle;

      // Handle angle wraparound
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      this.leftKnob.angle = this.leftKnob.lastAngle + delta;
      this.leftKnob.velocity = delta * 0.5;
    }

    if (this.rightKnob.dragging) {
      const angle = Math.atan2(y - this.knobY, x - this.rightKnobX);
      let delta = angle - this.dragStartAngle;

      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      this.rightKnob.angle = this.rightKnob.lastAngle + delta;
      this.rightKnob.velocity = delta * 0.5;
    }

    this.mouseX = x;
    this.mouseY = y;
  }

  /**
   * Handle pointer up
   */
  onPointerUp() {
    this.leftKnob.dragging = false;
    this.rightKnob.dragging = false;
  }

  /**
   * Handle keyboard input
   */
  onKeyDown(e) {
    const step = 0.15;

    switch (e.key) {
      case 'ArrowLeft':
        this.leftKnob.velocity -= step;
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.leftKnob.velocity += step;
        e.preventDefault();
        break;
      case 'ArrowUp':
        this.rightKnob.velocity -= step;
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.rightKnob.velocity += step;
        e.preventDefault();
        break;
      case 'c':
      case 'C':
        this.clearScreen();
        break;
      case 's':
      case 'S':
        this.exportSVG();
        break;
    }
  }

  /**
   * Detect shake gesture for clearing
   */
  detectShake() {
    if (this.shakeHistory.length < 10) return false;

    // Calculate total movement
    let totalDist = 0;
    let dirChanges = 0;
    let lastDx = 0;

    for (let i = 1; i < this.shakeHistory.length; i++) {
      const dx = this.shakeHistory[i].x - this.shakeHistory[i - 1].x;
      const dy = this.shakeHistory[i].y - this.shakeHistory[i - 1].y;
      totalDist += Math.abs(dx) + Math.abs(dy);

      // Count direction changes (oscillation)
      if (lastDx !== 0 && Math.sign(dx) !== Math.sign(lastDx)) {
        dirChanges++;
      }
      lastDx = dx;
    }

    // Shake = high movement + many direction changes
    const now = Date.now();
    if (totalDist > 500 && dirChanges > 6 && now - this.lastShakeTime > 1000) {
      this.lastShakeTime = now;
      return true;
    }

    return false;
  }

  /**
   * Clear the drawing with sand falling effect
   */
  clearScreen() {
    if (this.isClearing || this.points.length < 2) return;

    this.isClearing = true;

    // Animate shake effect
    this.shakeOffset = 20;
    this.shakeDecay = 0.85;

    // Convert line points to sand particles
    this.sandParticles = [];
    const step = Math.max(1, Math.floor(this.points.length / CONFIG.sand.maxParticles));

    for (let i = 0; i < this.points.length; i += step) {
      const p = this.points[i];
      this.sandParticles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 50,  // Random horizontal drift
        vy: (Math.random() - 0.5) * 20,  // Small initial vertical velocity
        size: CONFIG.line.width + Math.random() * 2,
        alpha: 1,
      });
    }

    // Clear actual drawing points
    this.points = [];
    this.cursorX = this.screenCx;
    this.cursorY = this.screenCy;
    this.points.push({ x: this.cursorX, y: this.cursorY });
  }

  /**
   * Export drawing as SVG (pen plotter ready!)
   */
  exportSVG() {
    if (this.points.length < 2) return;

    // Build SVG path
    let pathD = `M ${this.points[0].x.toFixed(2)} ${this.points[0].y.toFixed(2)}`;
    for (let i = 1; i < this.points.length; i++) {
      pathD += ` L ${this.points[i].x.toFixed(2)} ${this.points[i].y.toFixed(2)}`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${this.screenW}" 
     height="${this.screenH}" 
     viewBox="${this.screenX} ${this.screenY} ${this.screenW} ${this.screenH}">
  <title>Etch-a-Sketch Export - Genuary 2026 Day 22</title>
  <desc>Single continuous line - pen plotter ready</desc>
  <path d="${pathD}" 
        fill="none" 
        stroke="#000" 
        stroke-width="1" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>`;

    // Download
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etch-a-sketch-day22.svg';
    a.click();
    URL.revokeObjectURL(url);

    console.log('[Day22] SVG exported - pen plotter ready!');
  }

  update(dt) {
    super.update(dt);

    // Update shake animation
    if (this.shakeOffset > 0.5) {
      this.shakeOffset *= this.shakeDecay;
    } else {
      this.shakeOffset = 0;
    }

    // Update sand particles
    this.updateSandParticles(dt);

    // Apply knob physics
    const friction = CONFIG.knob.friction;
    const maxSpeed = CONFIG.knob.maxSpeed;

    // Left knob (X movement)
    if (!this.leftKnob.dragging) {
      this.leftKnob.velocity *= friction;
    }
    this.leftKnob.velocity = Math.max(-maxSpeed, Math.min(maxSpeed, this.leftKnob.velocity));
    this.leftKnob.angle += this.leftKnob.velocity * dt * 10;

    // Right knob (Y movement)
    if (!this.rightKnob.dragging) {
      this.rightKnob.velocity *= friction;
    }
    this.rightKnob.velocity = Math.max(-maxSpeed, Math.min(maxSpeed, this.rightKnob.velocity));
    this.rightKnob.angle += this.rightKnob.velocity * dt * 10;

    // Move cursor based on knob velocity
    const sensitivity = CONFIG.line.sensitivity * Math.min(this.screenW, this.screenH);
    const moveX = this.leftKnob.velocity * sensitivity * dt;
    const moveY = this.rightKnob.velocity * sensitivity * dt;

    if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
      this.cursorX += moveX;
      this.cursorY += moveY;

      // Clamp to screen bounds
      this.cursorX = Math.max(this.screenX + 5, Math.min(this.screenX + this.screenW - 5, this.cursorX));
      this.cursorY = Math.max(this.screenY + 5, Math.min(this.screenY + this.screenH - 5, this.cursorY));

      // Add point if moved enough
      const lastPoint = this.points[this.points.length - 1];
      const dist = Math.sqrt((this.cursorX - lastPoint.x) ** 2 + (this.cursorY - lastPoint.y) ** 2);

      if (dist > 1) {
        this.points.push({ x: this.cursorX, y: this.cursorY });

        // Limit points for performance
        if (this.points.length > CONFIG.line.maxPoints) {
          this.points.shift();
        }
      }
    }
  }

  /**
   * Update sand particle physics
   * @param {number} dt - Delta time
   */
  updateSandParticles(dt) {
    if (this.sandParticles.length === 0) {
      if (this.isClearing) {
        this.isClearing = false;
      }
      return;
    }

    const gravity = CONFIG.sand.gravity;
    const friction = CONFIG.sand.friction;
    const bounce = CONFIG.sand.bounce;
    const screenBottom = this.screenY + this.screenH;

    for (let i = this.sandParticles.length - 1; i >= 0; i--) {
      const p = this.sandParticles[i];

      // Apply gravity
      p.vy += gravity * dt;

      // Apply friction
      p.vx *= friction;

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Bounce off bottom of screen
      if (p.y > screenBottom - p.size) {
        p.y = screenBottom - p.size;
        p.vy *= -bounce;
        p.vx *= 0.8;  // Lose energy on bounce
      }

      // Fade out once settled at bottom
      if (p.y >= screenBottom - p.size - 5 && Math.abs(p.vy) < 20) {
        p.alpha -= dt * 2;
      }

      // Remove dead particles
      if (p.alpha <= 0 || p.y > this.height) {
        this.sandParticles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Apply shake offset
    ctx.save();
    if (this.shakeOffset > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeOffset * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeOffset * 2;
      ctx.translate(offsetX, offsetY);
    }

    // Draw frame
    this.drawFrame(ctx, w, h);

    // Draw screen
    this.drawScreen(ctx);

    // Draw the line
    this.drawLine(ctx);

    // Draw sand particles
    this.drawSand(ctx);

    // Draw cursor
    this.drawCursor(ctx);

    // Draw knobs
    this.drawKnob(ctx, this.leftKnobX, this.knobY, this.leftKnob, 'X');
    this.drawKnob(ctx, this.rightKnobX, this.knobY, this.rightKnob, 'Y');

    ctx.restore();

    // Draw instructions (outside shake transform)
    this.drawInstructions(ctx, w, h);
  }

  /**
   * Draw the etch-a-sketch frame
   */
  drawFrame(ctx, w, h) {
    const r = CONFIG.frame.cornerRadius;

    // Outer frame
    ctx.fillStyle = CONFIG.colors.frame;
    ctx.strokeStyle = CONFIG.colors.frameBorder;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, r);
    ctx.fill();
    ctx.stroke();

    // Logo text
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 16px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ETCH-A-SKETCH', w / 2, 35);

    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.fillText('GENUARY 2026', w / 2, 50);
  }

  /**
   * Draw the green screen area with grid
   */
  drawScreen(ctx) {
    // Screen background
    ctx.fillStyle = CONFIG.colors.screen;
    ctx.strokeStyle = CONFIG.colors.screenBorder;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(this.screenX, this.screenY, this.screenW, this.screenH, 8);
    ctx.fill();
    ctx.stroke();

    // Draw grid
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.screenX, this.screenY, this.screenW, this.screenH);
    ctx.clip();

    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;

    const spacing = CONFIG.grid.spacing;

    // Vertical lines
    for (let x = this.screenX; x <= this.screenX + this.screenW; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, this.screenY);
      ctx.lineTo(x, this.screenY + this.screenH);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = this.screenY; y <= this.screenY + this.screenH; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(this.screenX, y);
      ctx.lineTo(this.screenX + this.screenW, y);
      ctx.stroke();
    }

    ctx.restore();

    // Inner glow/scanlines effect
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let y = this.screenY; y < this.screenY + this.screenH; y += 3) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.screenX, y, this.screenW, 1);
    }
    ctx.restore();
  }

  /**
   * Draw falling sand particles
   */
  drawSand(ctx) {
    if (this.sandParticles.length === 0) return;

    ctx.save();

    // Clip to screen area
    ctx.beginPath();
    ctx.rect(this.screenX, this.screenY, this.screenW, this.screenH);
    ctx.clip();

    for (const p of this.sandParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = CONFIG.colors.line;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle glow
      ctx.globalAlpha = p.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw the continuous line
   */
  drawLine(ctx) {
    if (this.points.length < 2) return;

    ctx.save();

    // Clip to screen area
    ctx.beginPath();
    ctx.rect(this.screenX, this.screenY, this.screenW, this.screenH);
    ctx.clip();

    // Draw the line
    ctx.strokeStyle = CONFIG.colors.line;
    ctx.lineWidth = CONFIG.line.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = CONFIG.line.width + 4;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw the cursor position
   */
  drawCursor(ctx) {
    const size = 6;

    // Cursor crosshair
    ctx.strokeStyle = CONFIG.colors.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(this.cursorX - size, this.cursorY);
    ctx.lineTo(this.cursorX + size, this.cursorY);
    ctx.moveTo(this.cursorX, this.cursorY - size);
    ctx.lineTo(this.cursorX, this.cursorY + size);
    ctx.stroke();

    // Glowing dot
    ctx.fillStyle = CONFIG.colors.line;
    ctx.beginPath();
    ctx.arc(this.cursorX, this.cursorY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  /**
   * Draw a rotary knob
   */
  drawKnob(ctx, x, y, knobState, label) {
    const r = this.knobRadius;
    const isActive = knobState.dragging;

    // Outer ring (glows when active)
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? CONFIG.colors.knobRing : CONFIG.colors.frameBorder;
    ctx.fill();

    // Knob body
    const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gradient.addColorStop(0, CONFIG.colors.knobHighlight);
    gradient.addColorStop(1, CONFIG.colors.knob);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Knob grip lines
    ctx.strokeStyle = CONFIG.colors.frameBorder;
    ctx.lineWidth = 2;
    const gripCount = 8;
    for (let i = 0; i < gripCount; i++) {
      const angle = knobState.angle + (i / gripCount) * Math.PI * 2;
      const innerR = r * 0.5;
      const outerR = r * 0.85;

      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(angle) * innerR,
        y + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        x + Math.cos(angle) * outerR,
        y + Math.sin(angle) * outerR
      );
      ctx.stroke();
    }

    // Position indicator
    const indicatorAngle = knobState.angle;
    ctx.fillStyle = CONFIG.colors.knobRing;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(indicatorAngle) * r * 0.7,
      y + Math.sin(indicatorAngle) * r * 0.7,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Label
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '12px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + r + 20);
  }

  /**
   * Draw instructions
   */
  drawInstructions(ctx, w, h) {
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Drag knobs or use arrow keys • Shake or [C] to clear • [S] to export SVG', w / 2, h - 15);
  }

  onResize() {
    this.updateDimensions();
  }
}

/**
 * Create Day 22 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day22(canvas) {
  const game = new EtchASketchDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
