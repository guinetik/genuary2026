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

import {
  Game,
  Painter,
  Keys,
  Mouse,
  Button,
  ToggleButton,
  Scene,
  GameObject,
  Circle,
  Rectangle,
  Group,
  HorizontalLayout,
  Screen,
} from '@guinetik/gcanvas';

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

  frame: {
    padding: 0.08,
    cornerRadius: 20,
    knobSize: 0.07,
    knobY: 0.84,
  },

  line: {
    width: 2,
    maxPoints: 10000,
    sensitivity: 0.6,   // Higher = cursor moves more per knob rotation
  },

  grid: {
    spacing: 20,
  },

  knob: {
    friction: 0.75,      // Higher friction = stops faster
    maxSpeed: 15,
  },

  autoDraw: {
    speed: 150,
    knobRotationScale: 0.02,
  },
};

// Preset SVG patterns
const PRESET_PATTERNS = {
  logo: `M 0 30.276 L 0 9.358 L 0 0.845 L 17.139 0.845 L 17.139 -5.247 L 5.189 -5.247 L 5.189 -19.273 L 0 -19.273 L 0 -4.975 L 0 0.845 L -8.618 0.845 L -25.071 0.845 L -25.071 9.757 L -7.593 9.757 L -7.593 30.276 L 0 30.276 Z M 50 20.33 L 50 6.031 L 50 0.211 L 75.068 0.211 L 75.068 -8.702 L 57.59 -8.702 L 57.59 -29.22 L 50 -29.22 L 50 -8.303 L 50 0.211 L 32.859 0.211 L 32.859 6.304 L 44.806 6.304 L 44.806 20.33 L 50 20.33 Z`,
  star: `M 0.5 0.1 L 0.6 0.4 L 0.9 0.4 L 0.65 0.6 L 0.75 0.9 L 0.5 0.7 L 0.25 0.9 L 0.35 0.6 L 0.1 0.4 L 0.4 0.4 Z`,
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
  house: `M 0.2 0.7 L 0.2 0.4 L 0.5 0.15 L 0.8 0.4 L 0.8 0.7 L 0.2 0.7 M 0.35 0.7 L 0.35 0.5 L 0.5 0.5 L 0.5 0.7 M 0.6 0.45 L 0.7 0.45 L 0.7 0.55 L 0.6 0.55 L 0.6 0.45`,
};

/**
 * Knob - A rotary control GameObject using Circle shapes
 */
class Knob extends GameObject {
  constructor(game, options = {}) {
    super(game, options);

    this.radius = options.radius || 40;
    this.label = options.label || '';
    this.axis = options.label === 'X' ? 'x' : 'y'; // Which axis this knob controls
    this.angle = 0;
    this.velocity = 0;
    this.dragging = false;
    this.returning = false;
    this.lastAngle = 0;
    this.dragStartAngle = 0;
    
    // Grid mode (digital) state
    this.accumulatedRotation = 0;
    this.gridStepThreshold = Math.PI / 6; // 30° of rotation triggers one grid step
    this.discreteAngle = 0; // Snapped angle for grid mode display

    // Create visual elements
    this.createVisuals();

    // Set up interaction
    this.interactive = true;
    this.setupInteraction();
  }

  createVisuals() {
    const r = this.radius;

    // Outer ring (glows when active)
    this.outerRing = new Circle(r + 4, {
      color: CONFIG.colors.frameBorder,
    });

    // Main knob body
    this.body = new Circle(r, {
      color: CONFIG.colors.knob,
    });

    // Center highlight (centered in knob)
    this.highlight = new Circle(r * 0.2, {
      x: 0,
      y: 0,
      color: CONFIG.colors.knobHighlight,
    });

    // Position indicator dot - start at 12 o'clock (top)
    this.indicator = new Circle(4, {
      x: 0,
      y: -r * 0.7,
      color: CONFIG.colors.knobRing,
    });

    // Grip lines group
    this.gripLines = [];
    const gripCount = 8;
    for (let i = 0; i < gripCount; i++) {
      const angle = (i / gripCount) * Math.PI * 2;
      this.gripLines.push({
        angle,
        innerR: r * 0.5,
        outerR: r * 0.85,
      });
    }
  }

  setupInteraction() {
    this.on('inputdown', (e) => {
      this.dragging = true;
      this.lastAngle = this.angle;
      this.accumulatedRotation = 0; // Reset for grid mode
      this.outerRing.color = CONFIG.colors.knobRing;
    });

    this.game.events.on('mouseup', () => {
      if (this.dragging) {
        this.dragging = false;
        this.returning = true; // Start returning to 0
        this.accumulatedRotation = 0;
        this.discreteAngle = 0;
        this.outerRing.color = CONFIG.colors.frameBorder;
      }
    });

    this.game.events.on('mousemove', () => {
      if (this.dragging) {
        // Convert knob position to canvas coordinates (scene is centered)
        const knobCanvasX = this.game.width / 2 + this.x;
        const knobCanvasY = this.game.height / 2 + this.y;
        
        // Angle from knob center to mouse, offset so 12 o'clock = 0
        const mouseAngle = Math.atan2(
          Mouse.y - knobCanvasY,
          Mouse.x - knobCanvasX
        ) + Math.PI / 2;
        
        // Calculate delta for velocity (handle wrap-around)
        let delta = mouseAngle - this.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        
        if (this.game.gridMode) {
          // DIGITAL MODE: Accumulate rotation and trigger discrete steps
          this.accumulatedRotation += delta;
          
          // Check if we've rotated enough for a grid step
          while (Math.abs(this.accumulatedRotation) >= this.gridStepThreshold) {
            const direction = this.accumulatedRotation > 0 ? 1 : -1;
            const gridSize = CONFIG.grid.spacing;
            
            // Move cursor one grid cell
            if (this.axis === 'x') {
              this.game.screen.moveCursor(gridSize * direction, 0);
            } else {
              this.game.screen.moveCursor(0, gridSize * direction);
            }
            
            // Snap knob to discrete angle (visual "click")
            this.discreteAngle += direction * (Math.PI / 4); // 45° visual snap
            
            // Consume the accumulated rotation
            this.accumulatedRotation -= direction * this.gridStepThreshold;
          }
          
          // In grid mode, display the discrete snapped angle
          this.angle = this.discreteAngle;
        } else {
          // ANALOG MODE: Continuous rotation
          this.angle = mouseAngle;
          this.velocity = delta * 3;
        }
        
        this.lastAngle = mouseAngle;
      }
    });
  }

  update(dt) {
    super.update(dt);

    if (this.dragging) {
      // While dragging, angle is set directly in mousemove
      // Don't apply friction or velocity
    } else if (this.returning) {
      // Return to 0 after mouse release
      const returnSpeed = 8;
      this.angle *= Math.exp(-returnSpeed * dt);
      this.discreteAngle *= Math.exp(-returnSpeed * dt); // Also return discrete angle
      
      // Snap to 0 when close
      if (Math.abs(this.angle) < 0.01) {
        this.angle = 0;
        this.discreteAngle = 0;
        this.returning = false;
      }
      this.velocity = 0;
    } else {
      // Keyboard input mode - apply velocity to angle and friction
      this.angle += this.velocity * dt * 2;
      this.velocity *= CONFIG.knob.friction;
      
      // Stop if very slow
      if (Math.abs(this.velocity) < 0.01) {
        this.velocity = 0;
      }
    }

    // Update indicator position (offset by -PI/2 so it starts at 12 o'clock)
    const displayAngle = this.angle - Math.PI / 2;
    this.indicator.x = Math.cos(displayAngle) * this.radius * 0.7;
    this.indicator.y = Math.sin(displayAngle) * this.radius * 0.7;
    
    // Indicator color: cyan in grid mode, green in analog mode
    this.indicator.color = this.game.gridMode ? '#0ff' : CONFIG.colors.knobRing;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  draw() {
    super.draw();
    const ctx = Painter.ctx;

    // Draw outer ring
    this.outerRing.render();

    // Draw body
    this.body.render();

    // Draw grip lines
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.frameBorder;
    ctx.lineWidth = 2;

    for (const grip of this.gripLines) {
      const angle = this.angle + grip.angle;
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * grip.innerR,
        Math.sin(angle) * grip.innerR
      );
      ctx.lineTo(
        Math.cos(angle) * grip.outerR,
        Math.sin(angle) * grip.outerR
      );
      ctx.stroke();
    }
    ctx.restore();

    // Draw highlight and indicator
    this.highlight.render();
    this.indicator.render();

    // Draw label below
    if (this.label) {
      ctx.save();
      ctx.fillStyle = CONFIG.colors.textDim;
      ctx.font = '12px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, 0, this.radius + 20);
      ctx.restore();
    }
  }
}

/**
 * DrawingScreen - The green screen area where drawing happens
 */
class DrawingScreen extends GameObject {
  constructor(game, options = {}) {
    super(game, options);

    this.screenWidth = options.screenWidth || 400;
    this.screenHeight = options.screenHeight || 300;
    this.points = [];
    this.cursorX = this.screenWidth / 2;
    this.cursorY = this.screenHeight / 2;

    // Sand particles for clear animation
    this.sandParticles = [];
    this.isClearing = false;
    this.shakeOffset = 0;
    this.shakeDecay = 0.85;
    
    // Touch drawing state
    this.touchDrawing = false;

    // Add initial point
    this.points.push({ x: this.cursorX, y: this.cursorY });

    // Create background rectangle
    this.background = new Rectangle({
      width: this.screenWidth,
      height: this.screenHeight,
      color: CONFIG.colors.screen,
      stroke: CONFIG.colors.screenBorder,
      lineWidth: 2,
    });
    
    // Set up touch drawing for mobile
    this.setupTouchDrawing();
  }
  
  /**
   * Set up direct touch drawing on the screen (mobile-friendly)
   */
  setupTouchDrawing() {
    const canvas = this.game.canvas;
    
    canvas.addEventListener('touchstart', (e) => {
      if (this.game.autoDrawing) return;
      
      const touch = e.touches[0];
      const pos = this.screenPositionFromTouch(touch);
      
      if (pos) {
        e.preventDefault();
        this.touchDrawing = true;
        // Move cursor to touch position
        this.cursorX = pos.x;
        this.cursorY = pos.y;
        this.points.push({ x: this.cursorX, y: this.cursorY });
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (!this.touchDrawing || this.game.autoDrawing) return;
      
      const touch = e.touches[0];
      const pos = this.screenPositionFromTouch(touch);
      
      if (pos) {
        e.preventDefault();
        // Draw to new position
        const dx = pos.x - this.cursorX;
        const dy = pos.y - this.cursorY;
        this.moveCursor(dx, dy);
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
      this.touchDrawing = false;
    });
  }
  
  /**
   * Convert touch coordinates to screen drawing coordinates
   * Returns null if touch is outside the screen area
   */
  screenPositionFromTouch(touch) {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    
    // Get touch position relative to canvas
    const canvasX = touch.clientX - rect.left;
    const canvasY = touch.clientY - rect.top;
    
    // Screen is centered in the scene, offset upward
    const screenCenterX = this.game.width / 2;
    const screenCenterY = this.game.height / 2 + this.y; // this.y is negative offset
    
    // Convert to screen-local coordinates
    const localX = canvasX - (screenCenterX - this.screenWidth / 2);
    const localY = canvasY - (screenCenterY - this.screenHeight / 2);
    
    // Check if within screen bounds (with padding)
    const padding = 10;
    if (localX >= -padding && localX <= this.screenWidth + padding &&
        localY >= -padding && localY <= this.screenHeight + padding) {
      return {
        x: Math.max(5, Math.min(this.screenWidth - 5, localX)),
        y: Math.max(5, Math.min(this.screenHeight - 5, localY))
      };
    }
    
    return null;
  }

  /**
   * Move cursor and add point to the line
   */
  moveCursor(dx, dy) {
    this.cursorX += dx;
    this.cursorY += dy;

    // Clamp to screen bounds
    const padding = 5;
    this.cursorX = Math.max(padding, Math.min(this.screenWidth - padding, this.cursorX));
    this.cursorY = Math.max(padding, Math.min(this.screenHeight - padding, this.cursorY));

    // Add point if moved enough
    const lastPoint = this.points[this.points.length - 1];
    const dist = Math.sqrt(
      (this.cursorX - lastPoint.x) ** 2 + (this.cursorY - lastPoint.y) ** 2
    );

    if (dist > 1) {
      this.points.push({ x: this.cursorX, y: this.cursorY });

      if (this.points.length > CONFIG.line.maxPoints) {
        this.points.shift();
      }
    }
  }

  /**
   * Clear the screen with sand effect
   */
  clear() {
    if (this.isClearing || this.points.length < 2) return;

    this.isClearing = true;
    this.shakeOffset = 20;

    // Convert points to sand particles
    this.sandParticles = [];
    const maxParticles = 500;
    const step = Math.max(1, Math.floor(this.points.length / maxParticles));

    for (let i = 0; i < this.points.length; i += step) {
      const p = this.points[i];
      this.sandParticles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 20,
        size: CONFIG.line.width + Math.random() * 2,
        alpha: 1,
      });
    }

    // Reset drawing
    this.points = [];
    this.cursorX = this.screenWidth / 2;
    this.cursorY = this.screenHeight / 2;
    this.points.push({ x: this.cursorX, y: this.cursorY });
  }

  /**
   * Get points for SVG export
   */
  getPoints() {
    return this.points;
  }

  update(dt) {
    super.update(dt);

    // Update shake
    if (this.shakeOffset > 0.5) {
      this.shakeOffset *= this.shakeDecay;
    } else {
      this.shakeOffset = 0;
    }

    // Update sand particles
    if (this.sandParticles.length > 0) {
      const gravity = 400;
      const friction = 0.98;
      const bounce = 0.3;

      for (let i = this.sandParticles.length - 1; i >= 0; i--) {
        const p = this.sandParticles[i];

        p.vy += gravity * dt;
        p.vx *= friction;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Bounce off bottom
        if (p.y > this.screenHeight - p.size) {
          p.y = this.screenHeight - p.size;
          p.vy *= -bounce;
          p.vx *= 0.8;
        }

        // Fade out when settled
        if (p.y >= this.screenHeight - p.size - 5 && Math.abs(p.vy) < 20) {
          p.alpha -= dt * 2;
        }

        // Remove dead particles
        if (p.alpha <= 0 || p.y > this.screenHeight + 10) {
          this.sandParticles.splice(i, 1);
        }
      }

      if (this.sandParticles.length === 0) {
        this.isClearing = false;
      }
    }
  }

  draw() {
    super.draw();
    const ctx = Painter.ctx;

    ctx.save();

    // Apply shake offset
    if (this.shakeOffset > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeOffset * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeOffset * 2;
      ctx.translate(offsetX, offsetY);
    }

    // Draw background
    ctx.save();
    ctx.translate(-this.screenWidth / 2, -this.screenHeight / 2);

    // Background
    ctx.fillStyle = CONFIG.colors.screen;
    ctx.strokeStyle = CONFIG.colors.screenBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.screenWidth, this.screenHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Grid
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;
    const spacing = CONFIG.grid.spacing;

    for (let x = 0; x <= this.screenWidth; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.screenHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= this.screenHeight; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.screenWidth, y);
      ctx.stroke();
    }

    // Scanlines
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#0f0';
    for (let y = 0; y < this.screenHeight; y += 3) {
      ctx.fillRect(0, y, this.screenWidth, 1);
    }
    ctx.globalAlpha = 1;

    // Draw the line (supports pen-up moves for multi-segment paths)
    if (this.points.length >= 2) {
      ctx.strokeStyle = CONFIG.colors.line;
      ctx.lineWidth = CONFIG.line.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        const pt = this.points[i];
        if (pt.move) {
          // Pen up - move without drawing
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      // Glow
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = CONFIG.line.width + 4;
      ctx.stroke();
    }

    // Draw sand particles
    for (const p of this.sandParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = CONFIG.colors.line;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw cursor
    const cursorSize = 6;
    ctx.strokeStyle = CONFIG.colors.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(this.cursorX - cursorSize, this.cursorY);
    ctx.lineTo(this.cursorX + cursorSize, this.cursorY);
    ctx.moveTo(this.cursorX, this.cursorY - cursorSize);
    ctx.lineTo(this.cursorX, this.cursorY + cursorSize);
    ctx.stroke();

    ctx.fillStyle = CONFIG.colors.line;
    ctx.beginPath();
    ctx.arc(this.cursorX, this.cursorY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();
  }
}

/**
 * Etch-a-Sketch Demo - Main game class
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

    // Create main scene
    this.mainScene = new Scene(this, { anchor: 'center' });
    this.pipeline.add(this.mainScene);

    // Create UI scene for buttons

    // Calculate dimensions
    this.updateDimensions();

    // Create drawing screen (positioned higher, closer to top)
    this.screen = new DrawingScreen(this, {
      x: 0,
      y: -this.height * 0.12,
      screenWidth: this.screenW,
      screenHeight: this.screenH,
    });
    this.mainScene.add(this.screen);

    // Create knobs (smaller on mobile, just decorative)
    const isMobile = Screen.isMobile || this.width < 500;
    const knobRadius = Math.min(this.width, this.height) * (isMobile ? 0.05 : CONFIG.frame.knobSize);

    this.leftKnob = new Knob(this, {
      x: -this.width * 0.3,
      y: this.height * (isMobile ? 0.28 : 0.34),
      radius: knobRadius,
      label: 'X',
    });
    this.mainScene.add(this.leftKnob);

    this.rightKnob = new Knob(this, {
      x: this.width * 0.3,
      y: this.height * (isMobile ? 0.28 : 0.34),
      radius: knobRadius,
      label: 'Y',
    });
    this.mainScene.add(this.rightKnob);

    // Auto-draw state
    this.autoDrawing = false;
    this.autoDrawPath = [];
    this.autoDrawIndex = 0;
    this.autoDrawProgress = 0;

    // Grid snap mode
    this.gridMode = false;
    this._lastLeft = false;
    this._lastRight = false;
    this._lastUp = false;
    this._lastDown = false;

    // Shake detection
    this.shakeHistory = [];
    this.lastShakeTime = 0;

    // Set up events
    this.setupEvents();

    // Create file input
    this.createFileInput();

    // Create mobile buttons
    this.createMobileUI();
  }

  updateDimensions() {
    const w = this.width;
    const h = this.height;
    const minDim = Math.min(w, h);
    const padding = minDim * CONFIG.frame.padding;

    // Bigger screen with tighter margins
    this.screenW = w - padding * 2.5;
    this.screenH = h * 0.65;
  }

  setupEvents() {
    // Movement keys are handled in update() via Keys.isDown()

    // Actions
    this.events.on(Keys.C, () => this.screen.clear());
    this.events.on(Keys.G, () => this.exportSVG());

    // Auto-draw controls
    this.events.on('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') this.fileInput.click();
      if (e.key === '1') this.startPresetDraw('logo');
      if (e.key === '2') this.startPresetDraw('star');
      if (e.key === '3') this.startPresetDraw('spiral');
      if (e.key === '4') this.startPresetDraw('house');
      if (e.key === 'Escape') this.stopAutoDraw();
    });

    // Shake detection
    this.events.on('mousemove', () => {
      const now = Date.now();
      this.shakeHistory.push({ x: Mouse.x, y: Mouse.y, time: now });
      this.shakeHistory = this.shakeHistory.filter(p => now - p.time < 500);

      if (this.detectShake()) {
        this.screen.clear();
      }
    });
  }

  detectShake() {
    if (this.shakeHistory.length < 10) return false;

    let totalDist = 0;
    let dirChanges = 0;
    let lastDx = 0;

    for (let i = 1; i < this.shakeHistory.length; i++) {
      const dx = this.shakeHistory[i].x - this.shakeHistory[i - 1].x;
      const dy = this.shakeHistory[i].y - this.shakeHistory[i - 1].y;
      totalDist += Math.abs(dx) + Math.abs(dy);

      if (lastDx !== 0 && Math.sign(dx) !== Math.sign(lastDx)) {
        dirChanges++;
      }
      lastDx = dx;
    }

    const now = Date.now();
    if (totalDist > 500 && dirChanges > 6 && now - this.lastShakeTime > 1000) {
      this.lastShakeTime = now;
      return true;
    }
    return false;
  }

  createFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.svg';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadSVGFile(file);
      this.fileInput.value = '';
    });

    // Drag and drop support (works in fullscreen!)
    this.dragOver = false;
    
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      this.dragOver = true;
    });

    this.canvas.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dragOver = false;
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dragOver = false;
      
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.svg')) {
        this.loadSVGFile(file);
      }
    });
  }

  createMobileUI() {
    const isMobile = Screen.isMobile || this.width < 500;
    const btnHeight = isMobile ? 30 : 35;
    const btnWidth = isMobile ? 40 : 55;
    const spacing = isMobile ? 4 : 8;
    const bottomPadding = isMobile ? 55 : 40;
    const fontSize = isMobile ? '10px' : '12px';

    // Create HorizontalLayout for buttons
    this.buttonLayout = new HorizontalLayout(this, {
      spacing,
      y: this.height - bottomPadding,
      x: this.width / 2,
    });
    this.pipeline.add(this.buttonLayout);

    const buttonConfigs = [
      { text: '1', action: () => this.startPresetDraw('logo') },
      { text: '2', action: () => this.startPresetDraw('star') },
      { text: '3', action: () => this.startPresetDraw('spiral') },
      { text: '4', action: () => this.startPresetDraw('house') },
      { text: 'CLR', action: () => this.screen.clear() },
      { text: 'SVG', action: () => this.exportSVG() },
    ];

    // Create and add buttons to layout
    buttonConfigs.forEach(cfg => {
      const btn = new Button(this, {
        width: btnWidth,
        height: btnHeight,
        text: cfg.text,
        font: `${fontSize} "Fira Code", monospace`,
        onClick: cfg.action,
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
      this.buttonLayout.add(btn);
    });
  }

  loadSVGFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(e.target.result, 'image/svg+xml');
      const path = doc.querySelector('path');
      if (path) {
        this.startAutoDraw(path.getAttribute('d'));
      }
    };
    reader.readAsText(file);
  }

  startPresetDraw(name) {
    const pathData = PRESET_PATTERNS[name];
    if (pathData) {
      // Turn off grid mode when loading a preset
      this.gridMode = false;
      this.screen.clear();
      setTimeout(() => this.startAutoDraw(pathData, name === 'star' || name === 'spiral' || name === 'house'), 500);
    }
  }

  startAutoDraw(pathData, isNormalized = false) {
    const points = this.parseSVGPath(pathData, isNormalized);
    if (points.length < 2) return;

    this.screen.clear();

    setTimeout(() => {
      this.autoDrawPath = points;
      this.autoDrawIndex = 0;
      this.autoDrawProgress = 0;
      this.autoDrawing = true;

      const start = points[0];
      this.screen.cursorX = start.x;
      this.screen.cursorY = start.y;
      this.screen.points = [{ x: start.x, y: start.y }];
    }, 100);
  }

  parseSVGPath(pathData, isNormalized) {
    const points = [];
    let cx = 0, cy = 0;
    let subpathStartX = 0, subpathStartY = 0; // Track start of current subpath for Z command

    const regex = /([MLHVZmlhvz])([^MLHVZmlhvz]*)/g;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const cmd = match[1];
      const args = match[2].trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

      switch (cmd) {
        case 'M':
          for (let i = 0; i < args.length; i += 2) {
            cx = args[i]; cy = args[i + 1];
            if (i === 0) {
              // First point of M is a move, save as subpath start
              subpathStartX = cx;
              subpathStartY = cy;
              points.push({ x: cx, y: cy, move: true });
            } else {
              // Subsequent points in M are implicit lineto
              points.push({ x: cx, y: cy });
            }
          }
          break;
        case 'm':
          for (let i = 0; i < args.length; i += 2) {
            cx += args[i]; cy += args[i + 1];
            if (i === 0) {
              subpathStartX = cx;
              subpathStartY = cy;
              points.push({ x: cx, y: cy, move: true });
            } else {
              points.push({ x: cx, y: cy });
            }
          }
          break;
        case 'L':
          for (let i = 0; i < args.length; i += 2) {
            cx = args[i]; cy = args[i + 1];
            points.push({ x: cx, y: cy });
          }
          break;
        case 'l':
          for (let i = 0; i < args.length; i += 2) {
            cx += args[i]; cy += args[i + 1];
            points.push({ x: cx, y: cy });
          }
          break;
        case 'H':
          for (const x of args) { cx = x; points.push({ x: cx, y: cy }); }
          break;
        case 'h':
          for (const dx of args) { cx += dx; points.push({ x: cx, y: cy }); }
          break;
        case 'V':
          for (const y of args) { cy = y; points.push({ x: cx, y: cy }); }
          break;
        case 'v':
          for (const dy of args) { cy += dy; points.push({ x: cx, y: cy }); }
          break;
        case 'Z':
        case 'z':
          // Close path back to the start of the CURRENT subpath, not the global first point
          points.push({ x: subpathStartX, y: subpathStartY });
          cx = subpathStartX;
          cy = subpathStartY;
          break;
      }
    }

    // Scale to screen
    const sw = this.screen.screenWidth;
    const sh = this.screen.screenHeight;

    if (isNormalized) {
      return points.map(p => ({ x: p.x * sw, y: p.y * sh, move: p.move }));
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }

    const svgW = maxX - minX || 1;
    const svgH = maxY - minY || 1;
    const scale = Math.min((sw * 0.8) / svgW, (sh * 0.8) / svgH);
    const offX = (sw - svgW * scale) / 2;
    const offY = (sh - svgH * scale) / 2;

    return points.map(p => ({
      x: offX + (p.x - minX) * scale,
      y: offY + (p.y - minY) * scale,
      move: p.move,
    }));
  }

  stopAutoDraw() {
    this.autoDrawing = false;
    this.autoDrawPath = [];
    // Return knobs to original position
    this.leftKnob.returning = true;
    this.rightKnob.returning = true;
  }

  updateAutoDraw(dt) {
    if (!this.autoDrawing || this.autoDrawPath.length < 2) return;

    const speed = CONFIG.autoDraw.speed;
    const curr = this.autoDrawPath[this.autoDrawIndex];
    const nextIdx = this.autoDrawIndex + 1;

    if (nextIdx >= this.autoDrawPath.length) {
      this.autoDrawing = false;
      // Return knobs to original position
      this.leftKnob.returning = true;
      this.rightKnob.returning = true;
      return;
    }

    const next = this.autoDrawPath[nextIdx];
    
    // If next point is a "move" command (start of new subpath), 
    // instantly teleport there without drawing a line
    if (next.move) {
      this.autoDrawIndex = nextIdx;
      this.autoDrawProgress = 0;
      this.screen.cursorX = next.x;
      this.screen.cursorY = next.y;
      // Start a new line segment from this position (mark as move for renderer)
      this.screen.points.push({ x: next.x, y: next.y, move: true });
      return;
    }
    
    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      this.autoDrawIndex = nextIdx;
      return;
    }

    this.autoDrawProgress += (speed * dt) / dist;

    if (this.autoDrawProgress >= 1) {
      this.autoDrawProgress = 0;
      this.autoDrawIndex = nextIdx;
      this.screen.cursorX = next.x;
      this.screen.cursorY = next.y;
    } else {
      this.screen.cursorX = curr.x + dx * this.autoDrawProgress;
      this.screen.cursorY = curr.y + dy * this.autoDrawProgress;
    }

    // Animate knobs
    const knobScale = CONFIG.autoDraw.knobRotationScale;
    this.leftKnob.angle += dx * knobScale;
    this.rightKnob.angle += dy * knobScale;

    // Add point to the drawing path
    const last = this.screen.points[this.screen.points.length - 1];
    const d = Math.sqrt((this.screen.cursorX - last.x) ** 2 + (this.screen.cursorY - last.y) ** 2);
    if (d > 1) {
      this.screen.points.push({ x: this.screen.cursorX, y: this.screen.cursorY });
    }
  }

  exportSVG() {
    const points = this.screen.getPoints();
    if (points.length < 2) return;

    // Build path data, using M for move points and L for line points
    let pathD = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      const cmd = pt.move ? 'M' : 'L';
      pathD += ` ${cmd} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }

    const sw = this.screen.screenWidth;
    const sh = this.screen.screenHeight;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}">
  <title>Etch-a-Sketch Export - Genuary 2026 Day 22</title>
  <path d="${pathD}" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etch-a-sketch-day22.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  update(dt) {
    super.update(dt);

    if (this.autoDrawing) {
      this.updateAutoDraw(dt);
      return;
    }

    if (this.gridMode) {
      // Grid mode: move one cell at a time on key press
      const gridSize = CONFIG.grid.spacing;
      
      // Track key states for edge detection
      const leftPressed = Keys.isDown(Keys.A) || Keys.isDown(Keys.LEFT);
      const rightPressed = Keys.isDown(Keys.D) || Keys.isDown(Keys.RIGHT);
      const upPressed = Keys.isDown(Keys.W) || Keys.isDown(Keys.UP) || Keys.isDown(Keys.J);
      const downPressed = Keys.isDown(Keys.S) || Keys.isDown(Keys.DOWN) || Keys.isDown(Keys.L);
      
      // Detect new key presses (edge trigger)
      if (leftPressed && !this._lastLeft) {
        this.screen.moveCursor(-gridSize, 0);
        this.leftKnob.angle -= 0.3;
        this.leftKnob.returning = false;
      }
      if (rightPressed && !this._lastRight) {
        this.screen.moveCursor(gridSize, 0);
        this.leftKnob.angle += 0.3;
        this.leftKnob.returning = false;
      }
      if (upPressed && !this._lastUp) {
        this.screen.moveCursor(0, -gridSize);
        this.rightKnob.angle -= 0.3;
        this.rightKnob.returning = false;
      }
      if (downPressed && !this._lastDown) {
        this.screen.moveCursor(0, gridSize);
        this.rightKnob.angle += 0.3;
        this.rightKnob.returning = false;
      }
      
      // When no keys pressed, start returning knobs to 0
      if (!leftPressed && !rightPressed && !this.leftKnob.dragging) {
        this.leftKnob.returning = true;
      }
      if (!upPressed && !downPressed && !this.rightKnob.dragging) {
        this.rightKnob.returning = true;
      }
      
      // Store last key states
      this._lastLeft = leftPressed;
      this._lastRight = rightPressed;
      this._lastUp = upPressed;
      this._lastDown = downPressed;
    } else {
      // Normal mode: velocity-based movement
      const speed = 1.65;
      
      // X axis (left knob) - A/D and Arrow keys
      const leftPressed = Keys.isDown(Keys.A) || Keys.isDown(Keys.LEFT) || 
                          Keys.isDown(Keys.D) || Keys.isDown(Keys.RIGHT);
      if (Keys.isDown(Keys.A) || Keys.isDown(Keys.LEFT)) {
        this.leftKnob.velocity = -speed;
        this.leftKnob.returning = false;
      } else if (Keys.isDown(Keys.D) || Keys.isDown(Keys.RIGHT)) {
        this.leftKnob.velocity = speed;
        this.leftKnob.returning = false;
      } else if (!this.leftKnob.dragging && Math.abs(this.leftKnob.velocity) < 0.05) {
        // No keys pressed and velocity near 0 - start returning
        this.leftKnob.returning = true;
      }
      
      // Y axis (right knob) - W/S/J/L and Arrow keys
      const rightPressed = Keys.isDown(Keys.W) || Keys.isDown(Keys.UP) || Keys.isDown(Keys.J) ||
                           Keys.isDown(Keys.S) || Keys.isDown(Keys.DOWN) || Keys.isDown(Keys.L);
      if (Keys.isDown(Keys.W) || Keys.isDown(Keys.UP) || Keys.isDown(Keys.J)) {
        this.rightKnob.velocity = -speed;
        this.rightKnob.returning = false;
      } else if (Keys.isDown(Keys.S) || Keys.isDown(Keys.DOWN) || Keys.isDown(Keys.L)) {
        this.rightKnob.velocity = speed;
        this.rightKnob.returning = false;
      } else if (!this.rightKnob.dragging && Math.abs(this.rightKnob.velocity) < 0.05) {
        // No keys pressed and velocity near 0 - start returning
        this.rightKnob.returning = true;
      }

      // Move cursor based on knob velocities
      const sensitivity = CONFIG.line.sensitivity * Math.min(this.screenW, this.screenH);
      const moveX = this.leftKnob.velocity * sensitivity * dt;
      const moveY = this.rightKnob.velocity * sensitivity * dt;

      if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
        this.screen.moveCursor(moveX, moveY);
      }
    }
  }

  render() {
    // Draw frame background
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.colors.frame;
    ctx.strokeStyle = CONFIG.colors.frameBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 10, this.width - 20, this.height - 20, CONFIG.frame.cornerRadius);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 16px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ETCH-A-SKETCH', this.width / 2, 35);
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.fillText('GENUARY 2026', this.width / 2, 50);

    // Instructions
    const isMobile = Screen.isMobile || this.width < 500;
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.font = `${isMobile ? '9px' : '10px'} "Fira Code", monospace`;
    if (this.autoDrawing) {
      ctx.fillStyle = CONFIG.colors.text;
      ctx.fillText(isMobile ? 'AUTO-DRAWING...' : 'AUTO-DRAWING... [ESC] to stop', this.width / 2, this.height - 15);
    } else if (isMobile) {
      ctx.fillText('TOUCH SCREEN TO DRAW', this.width / 2, this.height - 15);
    } else {
      ctx.fillText('[A/D] X • [W/S] Y • [C] clear • [G] export • [1-4] presets • drag SVG', this.width / 2, this.height - 15);
    }

    // Render pipeline (scenes with knobs, screen, buttons)
    super.render();

    // Drag-and-drop overlay
    if (this.dragOver) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(20, 20, this.width - 40, this.height - 40);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 24px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DROP SVG FILE', this.width / 2, this.height / 2);
    }
  }

  onResize() {
    this.updateDimensions();

    // Update screen size
    if (this.screen) {
      this.screen.screenWidth = this.screenW;
      this.screen.screenHeight = this.screenH;
      this.screen.y = -this.height * 0.12;
    }

    // Update knob positions
    const isMobile = Screen.isMobile || this.width < 500;
    const knobRadius = Math.min(this.width, this.height) * (isMobile ? 0.05 : CONFIG.frame.knobSize);
    if (this.leftKnob) {
      this.leftKnob.x = -this.width * 0.3;
      this.leftKnob.y = this.height * (isMobile ? 0.28 : 0.34);
      this.leftKnob.radius = knobRadius;
    }
    if (this.rightKnob) {
      this.rightKnob.x = this.width * 0.3;
      this.rightKnob.y = this.height * (isMobile ? 0.28 : 0.34);
      this.rightKnob.radius = knobRadius;
    }


  }
}

/**
 * Create Day 22 visualization
 */
export default function day22(canvas) {
  const game = new EtchASketchDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
