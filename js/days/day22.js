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
 * - A/D for X axis, W/S or J/L for Y axis
 * - Shake mouse rapidly or press 'C' to clear
 * - Press 'G' to download SVG
 * - Press 'P' to load an SVG file for auto-draw
 * - Press '1' for logo, '2' for star, '3' for spiral, '4' for house
 * - Press 'ESC' to stop auto-drawing
 */

import { Game, Painter, Keys, Mouse, Button, Scene } from '@guinetik/gcanvas';

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

  // Auto-draw settings
  autoDraw: {
    speed: 150,           // Pixels per second
    knobRotationScale: 0.02, // How much knobs rotate per pixel moved
  },
};

// Preset SVG patterns for demo
const PRESET_PATTERNS = {
  // Guinetik logo (two interlocking shapes)
  logo: `M 0 30.276 L 0 9.358 L 0 0.845 L 17.139 0.845 L 17.139 -5.247 L 5.189 -5.247 L 5.189 -19.273 L 0 -19.273 L 0 -4.975 L 0 0.845 L -8.618 0.845 L -25.071 0.845 L -25.071 9.757 L -7.593 9.757 L -7.593 30.276 L 0 30.276 Z M 50 20.33 L 50 6.031 L 50 0.211 L 75.068 0.211 L 75.068 -8.702 L 57.59 -8.702 L 57.59 -29.22 L 50 -29.22 L 50 -8.303 L 50 0.211 L 32.859 0.211 L 32.859 6.304 L 44.806 6.304 L 44.806 20.33 L 50 20.33 Z`,
  
  // Simple star
  star: `M 0.5 0.1 L 0.6 0.4 L 0.9 0.4 L 0.65 0.6 L 0.75 0.9 L 0.5 0.7 L 0.25 0.9 L 0.35 0.6 L 0.1 0.4 L 0.4 0.4 Z`,
  
  // Spiral
  spiral: (() => {
    let path = 'M 0.5 0.5';
    for (let i = 0; i < 720; i += 5) {
      const angle = (i * Math.PI) / 180;
      const r = 0.02 + (i / 720) * 0.4;
      const x = 0.5 + Math.cos(angle) * r;
      const y = 0.5 + Math.sin(angle) * r;
      path += ` L ${x.toFixed(3)} ${y.toFixed(3)}`;
    }
    return path;
  })(),
  
  // House
  house: `M 0.2 0.7 L 0.2 0.4 L 0.5 0.15 L 0.8 0.4 L 0.8 0.7 L 0.2 0.7 M 0.35 0.7 L 0.35 0.5 L 0.5 0.5 L 0.5 0.7 M 0.6 0.45 L 0.7 0.45 L 0.7 0.55 L 0.6 0.55 L 0.6 0.45`,
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

    // Initialize input systems
    Keys.init(this);
    Mouse.init(this);

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
    this.dragStartAngle = 0;

    // Auto-draw state
    this.autoDrawing = false;
    this.autoDrawPath = [];      // Array of {x, y} normalized points
    this.autoDrawIndex = 0;      // Current point index
    this.autoDrawProgress = 0;   // Progress to next point (0-1)

    // Set up event listeners
    this.setupEvents();

    // Create hidden file input for SVG loading
    this.createFileInput();

    // Create mobile UI buttons
    this.createMobileUI();
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
   * Set up mouse, touch, and keyboard events using engine's event system
   */
  setupEvents() {
    // Mouse events via engine
    this.events.on('mousedown', (e) => this.onPointerDown(e));
    this.events.on('mousemove', (e) => this.onPointerMove(e));
    this.events.on('mouseup', () => this.onPointerUp());

    // Touch events (still need raw for now)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onPointerDown(e.touches[0]);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.onPointerMove(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', () => this.onPointerUp());

    // Keyboard events via Keys
    const step = 0.15;

    // Arrow keys
    this.events.on(Keys.LEFT, () => { this.leftKnob.velocity -= step; });
    this.events.on(Keys.RIGHT, () => { this.leftKnob.velocity += step; });
    this.events.on(Keys.UP, () => { this.rightKnob.velocity -= step; });
    this.events.on(Keys.DOWN, () => { this.rightKnob.velocity += step; });

    // A/D for X axis
    this.events.on(Keys.A, () => { this.leftKnob.velocity -= step; });
    this.events.on(Keys.D, () => { this.leftKnob.velocity += step; });

    // W/S for Y axis
    this.events.on(Keys.W, () => { this.rightKnob.velocity -= step; });
    this.events.on(Keys.S, () => { this.rightKnob.velocity += step; });

    // J/L for Y axis (alternative)
    this.events.on(Keys.J, () => { this.rightKnob.velocity -= step; });
    this.events.on(Keys.L, () => { this.rightKnob.velocity += step; });

    // Actions
    this.events.on(Keys.C, () => this.clearScreen());
    this.events.on(Keys.G, () => this.exportSVG());

    // Auto-draw controls
    this.events.on('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.fileInput.click(); // Open file picker
      }
      if (e.key === '1') this.startPresetDraw('logo');
      if (e.key === '2') this.startPresetDraw('star');
      if (e.key === '3') this.startPresetDraw('spiral');
      if (e.key === '4') this.startPresetDraw('house');
      if (e.key === 'Escape' && this.autoDrawing) {
        this.stopAutoDraw();
      }
    });
  }

  /**
   * Create hidden file input for SVG loading
   */
  createFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.svg';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadSVGFile(file);
      }
      this.fileInput.value = ''; // Reset for next use
    });
  }

  /**
   * Create mobile-friendly UI buttons
   */
  createMobileUI() {
    // Create UI scene for buttons
    this.uiScene = new Scene(this);
    this.pipeline.add(this.uiScene);

    const btnHeight = 35;
    const btnWidth = 55;
    const spacing = 8;
    const bottomPadding = 40;

    // Button definitions
    const buttons = [
      { text: '1', action: () => this.startPresetDraw('logo') },
      { text: '2', action: () => this.startPresetDraw('star') },
      { text: '3', action: () => this.startPresetDraw('spiral') },
      { text: '4', action: () => this.startPresetDraw('house') },
      { text: 'CLR', action: () => this.clearScreen() },
      { text: 'SVG', action: () => this.exportSVG() },
    ];

    // Calculate total width and starting X position
    const totalWidth = buttons.length * btnWidth + (buttons.length - 1) * spacing;
    const startX = (this.width - totalWidth) / 2 + btnWidth / 2;
    const btnY = this.height - bottomPadding;

    this.mobileButtons = [];

    buttons.forEach((btnConfig, i) => {
      const btn = new Button(this, {
        x: startX + i * (btnWidth + spacing),
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        text: btnConfig.text,
        font: '12px "Fira Code", monospace',
        onClick: btnConfig.action,
        colorDefaultBg: 'rgba(0, 0, 0, 0.8)',
        colorDefaultStroke: 'rgba(0, 255, 0, 0.5)',
        colorDefaultText: '#0f0',
        colorHoverBg: '#0f0',
        colorHoverStroke: '#0f0',
        colorHoverText: '#000',
        colorPressedBg: '#0a0',
        colorPressedStroke: '#0f0',
        colorPressedText: '#000',
      });
      this.uiScene.add(btn);
      this.mobileButtons.push(btn);
    });
  }

  /**
   * Update button positions on resize
   */
  updateMobileUI() {
    if (!this.mobileButtons || this.mobileButtons.length === 0) return;

    const btnWidth = 55;
    const spacing = 8;
    const bottomPadding = 40;

    const totalWidth = this.mobileButtons.length * btnWidth + (this.mobileButtons.length - 1) * spacing;
    const startX = (this.width - totalWidth) / 2 + btnWidth / 2;
    const btnY = this.height - bottomPadding;

    this.mobileButtons.forEach((btn, i) => {
      btn.x = startX + i * (btnWidth + spacing);
      btn.y = btnY;
    });
  }

  /**
   * Load and parse an SVG file
   */
  loadSVGFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target.result;
      const pathData = this.extractPathFromSVG(svgText);
      if (pathData) {
        this.startAutoDraw(pathData);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Extract path data from SVG string
   */
  extractPathFromSVG(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const paths = doc.querySelectorAll('path');
    
    if (paths.length === 0) {
      console.warn('[Day22] No paths found in SVG');
      return null;
    }

    // Get the d attribute from the first path
    return paths[0].getAttribute('d');
  }

  /**
   * Start auto-drawing a preset pattern
   */
  startPresetDraw(presetName) {
    const pathData = PRESET_PATTERNS[presetName];
    if (pathData) {
      this.clearScreen();
      setTimeout(() => this.startAutoDraw(pathData, true), 500);
    }
  }

  /**
   * Parse SVG path data and start auto-drawing
   * @param {string} pathData - SVG path d attribute
   * @param {boolean} isNormalized - If true, coordinates are 0-1 normalized
   */
  startAutoDraw(pathData, isNormalized = false) {
    const points = this.parseSVGPathToPoints(pathData, isNormalized);
    
    if (points.length < 2) {
      console.warn('[Day22] Not enough points to draw');
      return;
    }

    console.log(`[Day22] Starting auto-draw with ${points.length} points`);

    // Clear and start fresh
    this.clearScreen();
    
    // Wait for clear animation
    setTimeout(() => {
      this.autoDrawPath = points;
      this.autoDrawIndex = 0;
      this.autoDrawProgress = 0;
      this.autoDrawing = true;

      // Move cursor to start point
      const start = points[0];
      this.cursorX = start.x;
      this.cursorY = start.y;
      this.points = [{ x: this.cursorX, y: this.cursorY }];
    }, 100);
  }

  /**
   * Parse SVG path data into screen-space points
   */
  parseSVGPathToPoints(pathData, isNormalized) {
    const points = [];
    let currentX = 0;
    let currentY = 0;

    // Parse SVG path commands
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let match;

    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const argsStr = match[2].trim();
      const args = argsStr.length > 0
        ? argsStr.split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
        : [];

      switch (command) {
        case 'M': // Absolute moveto
          for (let i = 0; i < args.length; i += 2) {
            currentX = args[i];
            currentY = args[i + 1];
            points.push({ x: currentX, y: currentY, move: i === 0 });
          }
          break;
        case 'm': // Relative moveto
          for (let i = 0; i < args.length; i += 2) {
            currentX += args[i];
            currentY += args[i + 1];
            points.push({ x: currentX, y: currentY, move: i === 0 });
          }
          break;
        case 'L': // Absolute lineto
          for (let i = 0; i < args.length; i += 2) {
            currentX = args[i];
            currentY = args[i + 1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'l': // Relative lineto
          for (let i = 0; i < args.length; i += 2) {
            currentX += args[i];
            currentY += args[i + 1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'H': // Absolute horizontal
          for (const x of args) {
            currentX = x;
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'h': // Relative horizontal
          for (const dx of args) {
            currentX += dx;
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'V': // Absolute vertical
          for (const y of args) {
            currentY = y;
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'v': // Relative vertical
          for (const dy of args) {
            currentY += dy;
            points.push({ x: currentX, y: currentY });
          }
          break;
        case 'Z':
        case 'z':
          // Close path - return to first point
          if (points.length > 0) {
            const first = points[0];
            points.push({ x: first.x, y: first.y });
            currentX = first.x;
            currentY = first.y;
          }
          break;
        // TODO: Add curve support (C, S, Q, T, A)
      }
    }

    // Convert to screen coordinates
    if (isNormalized) {
      // Normalized 0-1 coordinates
      return points.map(p => ({
        x: this.screenX + p.x * this.screenW,
        y: this.screenY + p.y * this.screenH,
        move: p.move
      }));
    } else {
      // Find bounds and scale to fit screen
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      const svgW = maxX - minX || 1;
      const svgH = maxY - minY || 1;
      const scale = Math.min(
        (this.screenW * 0.8) / svgW,
        (this.screenH * 0.8) / svgH
      );
      const offsetX = this.screenX + (this.screenW - svgW * scale) / 2;
      const offsetY = this.screenY + (this.screenH - svgH * scale) / 2;

      return points.map(p => ({
        x: offsetX + (p.x - minX) * scale,
        y: offsetY + (p.y - minY) * scale,
        move: p.move
      }));
    }
  }

  /**
   * Stop auto-drawing
   */
  stopAutoDraw() {
    this.autoDrawing = false;
    this.autoDrawPath = [];
    console.log('[Day22] Auto-draw stopped');
  }

  /**
   * Update auto-draw animation
   */
  updateAutoDraw(dt) {
    if (!this.autoDrawing || this.autoDrawPath.length < 2) return;

    const speed = CONFIG.autoDraw.speed;
    const currentPoint = this.autoDrawPath[this.autoDrawIndex];
    const nextIndex = this.autoDrawIndex + 1;

    if (nextIndex >= this.autoDrawPath.length) {
      // Finished drawing
      this.autoDrawing = false;
      console.log('[Day22] Auto-draw complete!');
      return;
    }

    const nextPoint = this.autoDrawPath[nextIndex];
    const dx = nextPoint.x - currentPoint.x;
    const dy = nextPoint.y - currentPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      // Skip to next point
      this.autoDrawIndex = nextIndex;
      return;
    }

    // Calculate movement this frame
    const moveAmount = speed * dt;
    this.autoDrawProgress += moveAmount / dist;

    if (this.autoDrawProgress >= 1) {
      // Reached next point
      this.autoDrawProgress = 0;
      this.autoDrawIndex = nextIndex;
      this.cursorX = nextPoint.x;
      this.cursorY = nextPoint.y;
    } else {
      // Interpolate position
      this.cursorX = currentPoint.x + dx * this.autoDrawProgress;
      this.cursorY = currentPoint.y + dy * this.autoDrawProgress;
    }

    // Animate knobs based on movement direction
    const knobScale = CONFIG.autoDraw.knobRotationScale;
    this.leftKnob.angle += dx * knobScale;
    this.rightKnob.angle += dy * knobScale;

    // Add point to drawing (skip if it's a move command)
    if (!nextPoint.move) {
      const lastPoint = this.points[this.points.length - 1];
      const pointDist = Math.sqrt(
        (this.cursorX - lastPoint.x) ** 2 + (this.cursorY - lastPoint.y) ** 2
      );
      if (pointDist > 1) {
        this.points.push({ x: this.cursorX, y: this.cursorY });
      }
    } else {
      // Move command - jump without drawing
      this.points.push({ x: this.cursorX, y: this.cursorY });
    }
  }

  /**
   * Handle pointer down (mouse or touch)
   */
  onPointerDown(e) {
    // Use Mouse coordinates from engine (already canvas-relative)
    const x = Mouse.x;
    const y = Mouse.y;

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
    // Use Mouse coordinates from engine
    const x = Mouse.x;
    const y = Mouse.y;

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
  }

  /**
   * Handle pointer up
   */
  onPointerUp() {
    this.leftKnob.dragging = false;
    this.rightKnob.dragging = false;
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

    // Update auto-draw if active
    if (this.autoDrawing) {
      this.updateAutoDraw(dt);
      return; // Skip manual input while auto-drawing
    }

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
    super.render();
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
    
    if (this.autoDrawing) {
      ctx.fillStyle = CONFIG.colors.text;
      ctx.fillText('AUTO-DRAWING... [ESC] to stop', w / 2, h - 15);
    } else {
      ctx.fillText('[A/D] X • [W/S] Y • [C] clear • [G] export • [P] load SVG • [1-4] presets', w / 2, h - 15);
    }
  }

  onResize() {
    this.updateDimensions();
    this.updateMobileUI();
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
