/**
 * Day 14: Everything fits perfectly
 *
 * Interactive Tangram puzzle - the classic 7-piece Chinese dissection puzzle.
 * Click to cycle through configurations: cat, swan, rabbit, house, boat, runner.
 * Pieces slide smoothly into place with satisfying precision.
 */

import { Game, Painter, Easing } from "@guinetik/gcanvas";

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Tangram sizing
  baseSize: 280,          // Base size of the square configuration
  pieceGap: 2,            // Small gap between pieces for visibility

  // Animation - smooth slide, no spring wobble (pieces "fit perfectly")
  animDuration: 0.6,
  staggerDelay: 0.05,     // Delay between each piece starting to move

  // Colors - green terminal aesthetic with piece variety
  colors: {
    piece1: 'hsl(135, 70%, 45%)',   // Large triangle 1
    piece2: 'hsl(145, 70%, 40%)',   // Large triangle 2
    piece3: 'hsl(125, 70%, 50%)',   // Medium triangle
    piece4: 'hsl(155, 70%, 35%)',   // Small triangle 1
    piece5: 'hsl(115, 70%, 55%)',   // Small triangle 2
    piece6: 'hsl(140, 80%, 45%)',   // Square
    piece7: 'hsl(130, 60%, 42%)',   // Parallelogram
  },
  strokeColor: '#0f0',
  strokeWidth: 2,
  glowColor: 'rgba(0, 255, 100, 0.3)',

  // Visual
  trailAlpha: 0.12,
};

// ============================================
// Tangram Piece & Configuration Definitions
// ============================================

/**
 * CORRECT tangram geometry with proper proportions.
 *
 * In a classic tangram:
 * - 2 large triangles: each 1/4 of the square (legs = side/√2)
 * - 1 medium triangle: 1/8 of the square (legs = side/2)
 * - 2 small triangles: each 1/16 of the square (legs = side/(2√2))
 * - 1 square: 1/8 of the square (side = side/(2√2))
 * - 1 parallelogram: 1/8 of the square
 *
 * All pieces are defined as centered at origin with correct proportions.
 */

// Base unit: when assembled, the tangram square has side = 1
const SQRT2 = Math.sqrt(2);

// Piece dimensions (relative to assembled square side = 1)
const LARGE_LEG = 1 / SQRT2;           // ≈ 0.707, hypotenuse = 1
const MEDIUM_LEG = 0.5;                 // hypotenuse = 0.5 * √2 ≈ 0.707
const SMALL_LEG = 1 / (2 * SQRT2);     // ≈ 0.354, hypotenuse = 0.5
const SQUARE_SIDE = 1 / (2 * SQRT2);   // ≈ 0.354, diagonal = 0.5

/**
 * Right isoceles triangle centered at origin
 * Right angle at bottom-left corner before centering
 */
function makeTriangle(leg) {
  // Original: right angle at origin, legs along +x and +y
  // (0,0), (leg,0), (0,leg)
  // Centroid at (leg/3, leg/3)
  const c = leg / 3;
  return [
    { x: -c, y: -c },           // was (0,0)
    { x: leg - c, y: -c },      // was (leg, 0)
    { x: -c, y: leg - c },      // was (0, leg)
  ];
}

/**
 * Square centered at origin (axis-aligned)
 */
function makeSquare(side) {
  const h = side / 2;
  return [
    { x: -h, y: -h },
    { x: h, y: -h },
    { x: h, y: h },
    { x: -h, y: h },
  ];
}

/**
 * Parallelogram centered at origin
 * The tangram parallelogram has same area as medium triangle (1/8)
 * It's formed like a slanted rectangle: base = SMALL_LEG * √2, height = SMALL_LEG
 */
function makeParallelogram() {
  // Width along x: SMALL_LEG * √2 ≈ 0.5
  // Height: SMALL_LEG ≈ 0.354
  // Slant: offset by SMALL_LEG in x as we go up in y
  const w = SMALL_LEG * SQRT2;  // ≈ 0.5
  const h = SMALL_LEG;          // ≈ 0.354
  const slant = h;              // 45° slant

  // Centered at origin
  return [
    { x: -w/2, y: -h/2 },
    { x: w/2, y: -h/2 },
    { x: w/2 + slant, y: h/2 },
    { x: -w/2 + slant, y: h/2 },
  ];
}

// Create the 7 piece shapes (centered at origin)
const PIECE_SHAPES = {
  largeTriangle1: { vertices: makeTriangle(LARGE_LEG) },
  largeTriangle2: { vertices: makeTriangle(LARGE_LEG) },
  mediumTriangle: { vertices: makeTriangle(MEDIUM_LEG) },
  smallTriangle1: { vertices: makeTriangle(SMALL_LEG) },
  smallTriangle2: { vertices: makeTriangle(SMALL_LEG) },
  square: { vertices: makeSquare(SQUARE_SIDE) },
  parallelogram: { vertices: makeParallelogram() },
};

// ============================================
// Tangram Configurations
// ============================================

/**
 * Configurations place each piece's CENTER at specific coordinates.
 * Pieces are rotated in 45° increments (standard tangram rotations).
 *
 * Coordinate system: centered at (0,0), range roughly -0.5 to 0.5
 * The assembled tangram square has side = 1, so it spans -0.5 to 0.5
 */

const PI = Math.PI;
const R0 = 0;
const R45 = PI / 4;
const R90 = PI / 2;
const R135 = 3 * PI / 4;
const R180 = PI;
const R225 = 5 * PI / 4;
const R270 = 3 * PI / 2;
const R315 = 7 * PI / 4;

/**
 * SQUARE configuration - the classic tangram arrangement
 *
 * Layout in unit square (0,0) to (1,1):
 * - Large Triangle 1: fills bottom half, right angle at center
 * - Large Triangle 2: fills left half, right angle at center
 * - Medium Triangle: top-right corner
 * - Small Triangle 1: small piece near center
 * - Small Triangle 2: another small piece
 * - Square: rotated 45°, in the middle area
 * - Parallelogram: fills remaining gap
 *
 * Piece positions are centroids, adjusted to center the whole at origin.
 */

/**
 * SQUARE configuration - mathematically derived from classic tangram.
 *
 * Classic tangram dissection (unit square centered at origin, -0.5 to 0.5):
 *
 * Large Triangle 1: vertices (-0.5,-0.5), (0.5,-0.5), (0,0)
 *   - Bottom half, right angle at center (0,0)
 *   - Centroid: (0, -1/3)
 *
 * Large Triangle 2: vertices (-0.5,-0.5), (-0.5,0.5), (0,0)
 *   - Left half, right angle at center (0,0)
 *   - Centroid: (-1/3, 0)
 *
 * Medium Triangle: vertices (0,0.5), (0.5,0.5), (0.5,0)
 *   - Top-right corner, right angle at (0.5,0.5)
 *   - Centroid: (1/3, 1/3)
 *
 * Remaining pieces fill the center-right area...
 */

// The key insight: my makeTriangle() creates a triangle with right angle
// at the centroid-adjusted position, legs along +x and +y before rotation.
//
// For each piece placement, I need:
// 1. The centroid position in the assembled square
// 2. The rotation to orient the right angle correctly

const CONFIGURATIONS = {
  // SQUARE - classic tangram square arrangement
  //
  // After LT1 + LT2: remaining region is quadrilateral (0,0)-(0.5,-0.5)-(0.5,0.5)-(-0.5,0.5)
  // After MT: remaining is pentagon that needs: 2 small tris, 1 square, 1 parallelogram
  //
  // Key dimensions:
  // - Small triangle leg ≈ 0.354, hypotenuse = 0.5
  // - Square side ≈ 0.354, diagonal = 0.5
  // - Parallelogram: base ≈ 0.5, height ≈ 0.354
  //
  square: {
    name: 'Square',
    pieces: [
      // Large Triangle 1: bottom-left to bottom-right to center
      // Centroid: (0, -0.333), right angle UP (90°) → R225
      { x: 0, y: -0.333, rotation: R225 },

      // Large Triangle 2: bottom-left to top-left to center
      // Centroid: (-0.333, 0), right angle RIGHT (0°) → R135
      { x: -0.333, y: 0, rotation: R135 },

      // Medium Triangle: top-right corner
      // Centroid: (0.333, 0.333), right angle at 45° → R180
      { x: 0.333, y: 0.333, rotation: R180 },

      // Small Triangle 1: fits between center and top-left area
      // Right angle should point toward bottom-right (315°) → R315+135 = R450 = R90
      { x: -0.167, y: 0.333, rotation: R90 },

      // Small Triangle 2: fits in bottom-right area
      // Right angle should point toward top-left (135°) → R135+135 = R270
      { x: 0.333, y: -0.167, rotation: R270 },

      // Square: center of remaining region, diamond orientation
      // Fits between the triangles
      { x: 0.125, y: 0.125, rotation: R45 },

      // Parallelogram: along the diagonal from center toward right
      { x: 0.25, y: 0, rotation: R45 },
    ],
  },

  // CAT - classic tangram cat figure
  cat: {
    name: 'Cat',
    pieces: [
      // Large triangles form the body
      { x: -0.15, y: 0.15, rotation: R225 },
      { x: 0.15, y: 0.15, rotation: R315 },
      // Medium triangle is the head
      { x: 0, y: -0.2, rotation: R180 },
      // Small triangles are ears
      { x: -0.15, y: -0.35, rotation: R135 },
      { x: 0.15, y: -0.35, rotation: R225 },
      // Square is neck
      { x: 0, y: 0, rotation: R45 },
      // Parallelogram is tail
      { x: 0.35, y: 0.25, rotation: R45 },
    ],
  },

  // HOUSE - classic tangram house
  house: {
    name: 'House',
    pieces: [
      // Large triangle is the roof
      { x: 0, y: -0.3, rotation: R180 },
      // Large triangle is left wall
      { x: -0.2, y: 0.15, rotation: R90 },
      // Medium triangle fills right side
      { x: 0.15, y: 0.15, rotation: R270 },
      // Small triangles at base
      { x: -0.1, y: 0.35, rotation: R0 },
      { x: 0.1, y: 0.35, rotation: R180 },
      // Square is window/door
      { x: 0, y: 0.1, rotation: R0 },
      // Parallelogram at foundation
      { x: 0, y: 0.45, rotation: R0 },
    ],
  },

  // BOAT / SAILBOAT
  boat: {
    name: 'Boat',
    pieces: [
      // Large triangles form hull and sail
      { x: 0, y: 0.2, rotation: R180 },
      { x: -0.1, y: -0.15, rotation: R90 },
      // Medium triangle is jib sail
      { x: 0.15, y: -0.2, rotation: R270 },
      // Small triangles at bow and stern
      { x: -0.3, y: 0.25, rotation: R45 },
      { x: 0.3, y: 0.25, rotation: R135 },
      // Square in center
      { x: 0, y: 0.05, rotation: R45 },
      // Parallelogram as deck
      { x: 0, y: 0.35, rotation: R0 },
    ],
  },

  // SWAN / BIRD
  swan: {
    name: 'Swan',
    pieces: [
      // Large triangles form body
      { x: 0.1, y: 0.1, rotation: R225 },
      { x: -0.15, y: 0.2, rotation: R135 },
      // Medium triangle is tail
      { x: -0.35, y: 0.15, rotation: R90 },
      // Small triangles
      { x: 0.2, y: -0.15, rotation: R270 },
      { x: 0.35, y: -0.05, rotation: R225 },
      // Square
      { x: 0, y: -0.1, rotation: R45 },
      // Parallelogram is neck
      { x: 0.15, y: -0.35, rotation: R90 },
    ],
  },

  // RABBIT
  rabbit: {
    name: 'Rabbit',
    pieces: [
      // Large triangles form body
      { x: 0, y: 0.15, rotation: R180 },
      { x: -0.2, y: 0, rotation: R90 },
      // Medium triangle
      { x: 0.2, y: 0.1, rotation: R270 },
      // Small triangles are ears
      { x: -0.1, y: -0.35, rotation: R0 },
      { x: 0.1, y: -0.35, rotation: R180 },
      // Square is head
      { x: 0, y: -0.15, rotation: R0 },
      // Parallelogram
      { x: 0.15, y: 0.35, rotation: R45 },
    ],
  },
};

const CONFIG_ORDER = ['square', 'cat', 'house', 'boat', 'swan', 'rabbit'];

// ============================================
// TangramPiece Class
// ============================================

class TangramPiece {
  constructor(shapeKey, colorKey, index) {
    this.shapeKey = shapeKey;
    this.shape = PIECE_SHAPES[shapeKey];
    this.color = CONFIG.colors[colorKey];
    this.index = index;

    // Current state
    this.x = 0;
    this.y = 0;
    this.rotation = 0;

    // Animation state
    this.startX = 0;
    this.startY = 0;
    this.startRotation = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.targetRotation = 0;
    this.animTime = 0;
    this.animating = false;
    this.delay = 0;
  }

  /**
   * Start animating to a new position
   */
  animateTo(target, delay = 0) {
    this.startX = this.x;
    this.startY = this.y;
    this.startRotation = this.rotation;

    this.targetX = target.x;
    this.targetY = target.y;
    this.targetRotation = target.rotation;

    this.delay = delay;
    this.animTime = 0;
    this.animating = true;
  }

  /**
   * Update animation - smooth easing, no wobble
   */
  update(dt) {
    if (!this.animating) return;

    this.animTime += dt;

    // Wait for delay
    if (this.animTime < this.delay) return;

    const elapsed = this.animTime - this.delay;
    const duration = CONFIG.animDuration;

    // Calculate progress with smooth easing
    const rawT = Math.min(1, elapsed / duration);
    const t = Easing.easeInOutCubic(rawT);

    // Interpolate position
    this.x = this.startX + (this.targetX - this.startX) * t;
    this.y = this.startY + (this.targetY - this.startY) * t;

    // Interpolate rotation (shortest path)
    let rotDiff = this.targetRotation - this.startRotation;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.rotation = this.startRotation + rotDiff * t;

    // Check if animation is complete
    if (rawT >= 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.rotation = this.targetRotation;
      this.animating = false;
    }
  }

  /**
   * Draw the piece
   */
  draw(ctx, baseSize, centerX, centerY) {
    ctx.save();

    // Transform to piece position (positions are in unit coords, scale by baseSize)
    const px = centerX + this.x * baseSize;
    const py = centerY + this.y * baseSize;

    ctx.translate(px, py);
    ctx.rotate(this.rotation);

    // Build path from vertices (vertices are already centered at origin)
    ctx.beginPath();
    const vertices = this.shape.vertices;

    ctx.moveTo(vertices[0].x * baseSize, vertices[0].y * baseSize);

    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x * baseSize, vertices[i].y * baseSize);
    }

    ctx.closePath();

    // Fill
    ctx.fillStyle = this.color;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = CONFIG.strokeColor;
    ctx.lineWidth = CONFIG.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw glow effect
   */
  drawGlow(ctx, baseSize, centerX, centerY) {
    ctx.save();

    const px = centerX + this.x * baseSize;
    const py = centerY + this.y * baseSize;

    ctx.translate(px, py);
    ctx.rotate(this.rotation);

    // Build path
    ctx.beginPath();
    const vertices = this.shape.vertices;

    ctx.moveTo(vertices[0].x * baseSize, vertices[0].y * baseSize);

    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x * baseSize, vertices[i].y * baseSize);
    }

    ctx.closePath();

    // Glow
    ctx.shadowColor = CONFIG.glowColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = CONFIG.strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}

// ============================================
// Main Demo Class
// ============================================

class TangramDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Create the 7 tangram pieces
    this.pieces = [
      new TangramPiece('largeTriangle1', 'piece1', 0),
      new TangramPiece('largeTriangle2', 'piece2', 1),
      new TangramPiece('mediumTriangle', 'piece3', 2),
      new TangramPiece('smallTriangle1', 'piece4', 3),
      new TangramPiece('smallTriangle2', 'piece5', 4),
      new TangramPiece('square', 'piece6', 5),
      new TangramPiece('parallelogram', 'piece7', 6),
    ];

    // Current configuration
    this.currentConfigIndex = 0;
    this.configName = CONFIG_ORDER[0];

    // Apply initial configuration
    this.applyConfiguration(CONFIG_ORDER[0], false);

    // UI hint
    this.showHint = true;
    this.hintOpacity = 1;

    // Click to change configuration
    this.canvas.addEventListener('click', () => this.nextConfiguration());

    // Touch support
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.nextConfiguration();
    });
  }

  /**
   * Apply a configuration to all pieces
   */
  applyConfiguration(configKey, animate = true) {
    const config = CONFIGURATIONS[configKey];
    if (!config) return;

    this.configName = config.name;

    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const target = config.pieces[i];

      if (animate) {
        // Stagger the animation start
        const delay = i * CONFIG.staggerDelay;
        piece.animateTo(target, delay);
      } else {
        // Instant apply
        piece.x = target.x;
        piece.y = target.y;
        piece.rotation = target.rotation;
      }
    }

  }

  /**
   * Switch to next configuration
   */
  nextConfiguration() {
    // Hide hint after first click
    this.showHint = false;

    this.currentConfigIndex = (this.currentConfigIndex + 1) % CONFIG_ORDER.length;
    this.applyConfiguration(CONFIG_ORDER[this.currentConfigIndex], true);
  }

  update(dt) {
    super.update(dt);

    // Update all pieces
    for (const piece of this.pieces) {
      piece.update(dt);
    }

    // Fade out hint
    if (!this.showHint && this.hintOpacity > 0) {
      this.hintOpacity = Math.max(0, this.hintOpacity - dt * 2);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Motion blur trail
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // Calculate center and size - use 60% of smaller dimension for good coverage
    const centerX = w / 2;
    const centerY = h / 2;
    const baseSize = Math.min(w, h) * 0.6;

    // DEBUG: Draw target square outline (the assembled tangram should fill this)
    if (this.configName === 'Square') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const half = baseSize * 0.5;
      ctx.strokeRect(centerX - half, centerY - half, baseSize, baseSize);
      // Draw crosshairs at center
      ctx.beginPath();
      ctx.moveTo(centerX - 20, centerY);
      ctx.lineTo(centerX + 20, centerY);
      ctx.moveTo(centerX, centerY - 20);
      ctx.lineTo(centerX, centerY + 20);
      ctx.stroke();
      ctx.restore();
    }

    // Draw glow layer first (behind pieces)
    ctx.globalCompositeOperation = 'lighter';
    for (const piece of this.pieces) {
      piece.drawGlow(ctx, baseSize, centerX, centerY);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Draw all pieces
    for (const piece of this.pieces) {
      piece.draw(ctx, baseSize, centerX, centerY);
    }

    // Configuration name
    ctx.save();
    ctx.font = 'bold 24px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#0f0';
    ctx.globalAlpha = 0.8;
    ctx.fillText(this.configName, centerX, 30);
    ctx.restore();

    // Click hint
    if (this.hintOpacity > 0) {
      ctx.save();
      ctx.font = '14px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#0f0';
      ctx.globalAlpha = this.hintOpacity * 0.6;
      ctx.fillText('[ click to transform ]', centerX, h - 30);
      ctx.restore();
    }

    // Piece count indicator
    ctx.save();
    ctx.font = '12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#0f0';
    ctx.globalAlpha = 0.4;
    ctx.fillText(`${this.currentConfigIndex + 1}/${CONFIG_ORDER.length}`, 20, h - 20);
    ctx.restore();
  }
}

// ============================================
// Export
// ============================================

export default function day14(canvas) {
  const game = new TangramDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
