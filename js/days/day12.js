/**
 * Day 12: Boxes Only
 * Prompt: "Boxes only"
 *
 * Isometric Mondrian - recursive grid subdivision rendered as 3D boxes.
 * Classic Mondrian primary colors on black background.
 *
 * Controls:
 * - Click: Regenerate composition
 * - Q/E: Rotate camera
 */

import {
  Game,
  GameObject,
  IsometricScene,
  IsometricCamera,
  Painter,
  Keys,
  Motion,
  Easing,
} from '@guinetik/gcanvas';

const CONFIG = {
  background: '#000',

  // Mondrian palette
  colors: {
    primary: ['#D40920', '#1356A2', '#F7D842'],  // Red, Blue, Yellow
    neutral: '#F2F5F1',  // Off-white
    line: '#111',        // Near-black for box edges
  },

  // Isometric settings (tile size computed dynamically based on screen)
  iso: {
    gridSize: 10,       // Grid units in each direction (larger = more fragments possible)
    elevationScale: 1.0,
    // Tile width as ratio of screen size (will be computed in init)
    tileRatio: 0.052,   // Larger tiles to fill more screen space
  },

  // Subdivision settings
  subdivision: {
    step: 1,             // Grid step for split points
    splitProbability: 0.72,  // Higher = more splits = more fragments
    minSize: 1,          // Minimum box size in grid units
  },

  // Box heights as ratio of tile width
  height: {
    colored: { min: 1.0, max: 3.0 },   // Colored boxes are taller
    neutral: { min: 0.5, max: 0.5 },   // White boxes form a single flat layer
  },

  // Animation
  animation: {
    staggerDelay: 0.02,
    riseDuration: 1.2,  // Duration for boxes to rise
  },

  // Camera
  camera: {
    rotationStep: Math.PI / 2,  // 90 degrees
    animationDuration: 0.4,
  },
};

/**
 * Isometric box with Mondrian-style shading.
 * Simpler than the game version - no collision, just rendering.
 */
class MondrianBox extends GameObject {
  constructor(game, isoScene, options) {
    super(game);
    this.isoScene = isoScene;
    this.gridX = options.x;
    this.gridY = options.y;
    this.gridW = options.w;
    this.gridD = options.d;
    this.targetHeight = options.h;
    this.targetBaseZ = options.baseZ || 0;  // Target base elevation (for stacking)
    this.baseColor = options.color;

    // Animation state
    this.currentBaseZ = this.targetBaseZ;  // Always at final position
    this.currentHeight = 0;
    this.totalTime = 0;        // Total elapsed time
    this.animDelay = options.delay || 0;
    this.animProgress = 0;     // 0 to 1 animation progress
    this.animCompleted = false;

    // Pre-compute shaded colors
    this.topColor = options.color;
    this.leftColor = this.shadeColor(options.color, -25);
    this.rightColor = this.shadeColor(options.color, -45);
  }

  /**
   * Depth for sorting - uses back corner position + height.
   * Back corner determines when box starts being visible.
   * Height ensures stacked boxes sort correctly.
   */
  get isoDepth() {
    const scene = this.isoScene;
    const angle = scene.camera ? scene.camera.angle : 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Find both back corner (min) and front corner (max)
    const corners = [
      { x: this.gridX, y: this.gridY },
      { x: this.gridX + this.gridW, y: this.gridY },
      { x: this.gridX, y: this.gridY + this.gridD },
      { x: this.gridX + this.gridW, y: this.gridY + this.gridD },
    ];

    let minSum = Infinity;
    let maxSum = -Infinity;
    for (const c of corners) {
      const rotatedX = c.x * cos - c.y * sin;
      const rotatedY = c.x * sin + c.y * cos;
      const sum = rotatedX + rotatedY;
      if (sum < minSum) minSum = sum;
      if (sum > maxSum) maxSum = sum;
    }

    // Use center position for base depth
    const centerSum = (minSum + maxSum) / 2;

    // Convert Z from pixels to grid units
    const tileWidth = scene.tileWidth || 38;
    const topZ = (this.currentBaseZ + this.currentHeight) / tileWidth;

    // Depth = position + height
    // Scale height strongly to ensure boxes on top always render after boxes below
    return centerSum + topZ * 2;
  }

  /**
   * Shade a hex color by percentage
   */
  shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  /**
   * Update animation
   */
  update(dt) {
    if (this.animCompleted) return;

    this.totalTime += dt;

    // Wait for delay
    if (this.totalTime < this.animDelay) return;

    // Calculate animation progress (time since delay ended)
    const animTime = this.totalTime - this.animDelay;
    const duration = CONFIG.animation.riseDuration;
    this.animProgress = Math.min(animTime / duration, 1);

    // Ease the progress
    const eased = Easing.easeOutQuad(this.animProgress);

    // Height grows from 0 to target
    this.currentHeight = eased * this.targetHeight;

    if (this.animProgress >= 1) {
      this.currentHeight = this.targetHeight;
      this.animCompleted = true;
    }
  }

  /**
   * Render the isometric box
   */
  render() {
    // Only render once animation has started (past delay) and has some height
    if (this.totalTime < this.animDelay) return;
    if (this.currentHeight < 0.5) return;

    const scene = this.isoScene;
    const cameraAngle = scene.camera ? scene.camera.angle : 0;
    const h = this.currentHeight;

    // Get corners (use currentBaseZ for bottom, currentBaseZ + height for top)
    const topZ = this.currentBaseZ + h;
    const botZ = this.currentBaseZ;

    const topNW = scene.toIsometric(this.gridX, this.gridY, topZ);
    const topNE = scene.toIsometric(this.gridX + this.gridW, this.gridY, topZ);
    const topSE = scene.toIsometric(this.gridX + this.gridW, this.gridY + this.gridD, topZ);
    const topSW = scene.toIsometric(this.gridX, this.gridY + this.gridD, topZ);

    const botNW = scene.toIsometric(this.gridX, this.gridY, botZ);
    const botNE = scene.toIsometric(this.gridX + this.gridW, this.gridY, botZ);
    const botSE = scene.toIsometric(this.gridX + this.gridW, this.gridY + this.gridD, botZ);
    const botSW = scene.toIsometric(this.gridX, this.gridY + this.gridD, botZ);

    // Define all 4 side faces
    const faces = [
      { verts: [topNW, topNE, botNE, botNW] },  // North
      { verts: [topNE, topSE, botSE, botNE] },  // East
      { verts: [topSE, topSW, botSW, botSE] },  // South
      { verts: [topSW, topNW, botNW, botSW] },  // West
    ];

    // Calculate screen position for each face
    for (const face of faces) {
      const centerY = face.verts.reduce((sum, v) => sum + v.y, 0) / 4;
      const centerX = face.verts.reduce((sum, v) => sum + v.x, 0) / 4;
      face.screenY = centerY;
      face.screenX = centerX;
    }

    // Sort faces by screen Y (lower Y = behind = render first)
    faces.sort((a, b) => a.screenY - b.screenY);

    // Assign colors by screen X position
    const sortedByX = [...faces].sort((a, b) => a.screenX - b.screenX);
    sortedByX[0].color = this.leftColor;
    sortedByX[1].color = this.shadeColor(this.baseColor, -30);
    sortedByX[2].color = this.shadeColor(this.baseColor, -35);
    sortedByX[3].color = this.rightColor;

    Painter.useCtx((ctx) => {
      ctx.strokeStyle = CONFIG.colors.line;
      ctx.lineWidth = 2;

      // Draw all 4 side faces, back to front (back faces naturally occluded)
      for (const face of faces) {
        ctx.beginPath();
        ctx.moveTo(face.verts[0].x, face.verts[0].y);
        for (let i = 1; i < face.verts.length; i++) {
          ctx.lineTo(face.verts[i].x, face.verts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();
        ctx.stroke();
      }

      // Draw top face last (always on top)
      ctx.beginPath();
      ctx.moveTo(topNW.x, topNW.y);
      ctx.lineTo(topNE.x, topNE.y);
      ctx.lineTo(topSE.x, topSE.y);
      ctx.lineTo(topSW.x, topSW.y);
      ctx.closePath();
      ctx.fillStyle = this.topColor;
      ctx.fill();
      ctx.stroke();
    });
  }
}

/**
 * Day 12 Demo - Isometric Mondrian
 */
class Day12Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Compute tile size based on screen dimensions
    const minDim = Math.min(this.width, this.height);
    this.tileWidth = Math.round(minDim * CONFIG.iso.tileRatio);
    this.tileHeight = Math.round(this.tileWidth / 2);

    // Create isometric camera
    this.isoCamera = new IsometricCamera({
      rotationStep: CONFIG.camera.rotationStep,
      animationDuration: CONFIG.camera.animationDuration,
      easing: 'easeOutCubic',
    });

    // Create isometric scene centered on canvas
    this.isoScene = new IsometricScene(this, {
      x: this.width / 2,
      y: this.height / 2,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      gridSize: CONFIG.iso.gridSize,
      elevationScale: CONFIG.iso.elevationScale,
      depthSort: true,
      camera: this.isoCamera,
    });

    this.pipeline.add(this.isoScene);

    // Generate initial composition
    this.generateComposition();

    // Click to regenerate (but not after a swipe/drag)
    this.wasSwipe = false;

    // Keyboard controls for camera
    this.events.on(Keys.Q, () => this.isoCamera.rotateLeft());
    this.events.on(Keys.E, () => this.isoCamera.rotateRight());

    // Touch/swipe controls for mobile
    this.setupTouchControls();
  }

  /**
   * Setup touch/mouse swipe detection for camera rotation
   */
  setupTouchControls() {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let hasMoved = false;

    // Minimum distance to count as a drag (not a click/tap)
    const DRAG_THRESHOLD = 10;

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      hasMoved = false;
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const dist = Math.abs(deltaX);

      if (dist > DRAG_THRESHOLD) {
        // It was a drag - rotate camera
        if (deltaX > 0) {
          this.isoCamera.rotateRight();
        } else {
          this.isoCamera.rotateLeft();
        }
        hasMoved = true;
      } else {
        // It was a tap - regenerate
        this.regenerate();
      }
    }, { passive: true });

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      hasMoved = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
          hasMoved = true;
        }
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startX;

        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
          // It was a drag - rotate camera
          if (deltaX > 0) {
            this.isoCamera.rotateRight();
          } else {
            this.isoCamera.rotateLeft();
          }
          hasMoved = true;
        }
        isDragging = false;
      }
    });

    // Click handler - regenerate only if it wasn't a drag
    this.canvas.addEventListener('click', (e) => {
      // Only regenerate if the mouse didn't move much
      if (!hasMoved) {
        this.regenerate();
      }
      hasMoved = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });
  }

  /**
   * Recursive subdivision algorithm (ported from mondrian.js)
   * Returns array of { x, y, w, d } in grid coordinates
   */
  subdivide() {
    const gridSize = CONFIG.iso.gridSize;
    const { step, splitProbability, minSize } = CONFIG.subdivision;

    // Start with one rectangle covering the grid
    // Grid goes from -gridSize to +gridSize
    let squares = [{
      x: -gridSize,
      y: -gridSize,
      w: gridSize * 2,
      d: gridSize * 2,
    }];

    // Generate split points
    const splitPoints = [];
    for (let i = -gridSize; i <= gridSize; i += step) {
      splitPoints.push(i);
    }

    // Split function
    const splitAt = (coord) => {
      const { splitX, splitY } = coord;

      for (let i = squares.length - 1; i >= 0; i--) {
        const sq = squares[i];

        // Split on X
        if (splitX !== undefined &&
            splitX > sq.x + minSize &&
            splitX < sq.x + sq.w - minSize &&
            Math.random() < splitProbability) {
          squares.splice(i, 1);
          squares.push(
            { x: sq.x, y: sq.y, w: splitX - sq.x, d: sq.d },
            { x: splitX, y: sq.y, w: sq.w - (splitX - sq.x), d: sq.d }
          );
        }

        // Split on Y
        if (splitY !== undefined &&
            splitY > sq.y + minSize &&
            splitY < sq.y + sq.d - minSize &&
            Math.random() < splitProbability) {
          squares.splice(i, 1);
          squares.push(
            { x: sq.x, y: sq.y, w: sq.w, d: splitY - sq.y },
            { x: sq.x, y: splitY, w: sq.w, d: sq.d - (splitY - sq.y) }
          );
        }
      }
    };

    // Apply splits at each point
    for (const point of splitPoints) {
      splitAt({ splitY: point });
      splitAt({ splitX: point });
    }

    return squares;
  }

  /**
   * Generate the Mondrian composition
   */
  generateComposition() {
    const squares = this.subdivide();
    const { colors, height } = CONFIG;

    // Timing constants
    const maxDist = CONFIG.iso.gridSize * Math.SQRT2;
    const whiteAnimDuration = 0.5;  // Time for all white boxes to start
    const coloredBaseDelay = whiteAnimDuration + 0.3;  // Colored boxes start shortly after white begins

    // White layer height (fixed)
    const whiteHeight = height.neutral.min * this.tileWidth;

    // LAYER 1: Create white boxes for ALL squares (full canvas coverage)
    squares.forEach((sq) => {
      const centerX = sq.x + sq.w / 2;
      const centerY = sq.y + sq.d / 2;
      const dist = Math.sqrt(centerX * centerX + centerY * centerY);
      const distFactor = dist / maxDist;
      const delay = distFactor * whiteAnimDuration + Math.random() * 0.1;

      const whiteBox = new MondrianBox(this, this.isoScene, {
        x: sq.x,
        y: sq.y,
        w: sq.w,
        d: sq.d,
        h: whiteHeight,
        baseZ: 0,
        color: colors.neutral,
        delay: delay,
      });

      this.isoScene.add(whiteBox);
    });

    // LAYER 2: Create colored boxes on TOP of white layer for ~40% of squares
    const coloredIndices = new Set();
    const numColored = Math.floor(squares.length * 0.4);

    while (coloredIndices.size < numColored && coloredIndices.size < squares.length) {
      coloredIndices.add(Math.floor(Math.random() * squares.length));
    }

    squares.forEach((sq, i) => {
      if (!coloredIndices.has(i)) return;

      const centerX = sq.x + sq.w / 2;
      const centerY = sq.y + sq.d / 2;
      const dist = Math.sqrt(centerX * centerX + centerY * centerY);
      const distFactor = dist / maxDist;
      const delay = coloredBaseDelay + distFactor * 0.5 + Math.random() * 0.1;

      // Random primary color and height
      const color = colors.primary[Math.floor(Math.random() * colors.primary.length)];
      const hRatio = height.colored.min + Math.random() * (height.colored.max - height.colored.min);
      const h = hRatio * this.tileWidth;

      const coloredBox = new MondrianBox(this, this.isoScene, {
        x: sq.x,
        y: sq.y,
        w: sq.w,
        d: sq.d,
        h: h,
        baseZ: whiteHeight,  // Stack on top of white layer
        color: color,
        delay: delay,
      });

      this.isoScene.add(coloredBox);
    });
  }

  /**
   * Regenerate with new composition
   */
  regenerate() {
    this.isoScene.clear();
    this.generateComposition();
  }

  /**
   * Handle resize
   */
  onResize() {
    if (this.isoScene) {
      this.isoScene.x = this.width / 2;
      this.isoScene.y = this.height / 2;
    }
  }

  update(dt) {
    super.update(dt);
    this.isoCamera.update(dt);
  }
}

export default function day12(canvas) {
  const game = new Day12Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
