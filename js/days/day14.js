/**
 * Day 14: Everything fits perfectly
 *
 * Interactive Tangram puzzle with mathematically precise geometry.
 * See /docs/tangram-geometry.md for detailed documentation.
 */

import {
  Game,
  Painter,
  Scene,
  GameObject,
  RightTriangle,
  Square,
  Parallelogram,
  Tweenetik,
  Easing,
  Button,
  applyDraggable,
  StateMachine,
} from "@guinetik/gcanvas";

// ============================================
// Tangram Geometry Constants
// ============================================

const SQRT2 = Math.sqrt(2);

// ============================================
// Configuration
// ============================================

const CONFIG = {
  animDuration: 0.8,
  staggerDelay: 0.1,
  colors: {
    largeTriangle1: "#2196F3", // Blue
    largeTriangle2: "#E91E63", // Magenta/Pink
    mediumTriangle: "#9C27B0", // Purple
    smallTriangle1: "#FFEB3B", // Yellow
    smallTriangle2: "#4CAF50", // Green
    square: "#E53935", // Red
    parallelogram: "#FF9800", // Orange
  },
  strokeColor: "#FFFFFF",
  strokeWidth: 2,
  trailAlpha: 0.12,
  button: {
    width: 140,
    height: 40,
    spacing: 20,
  },
};

const TANGRAM = {
  LARGE_LEG: 1 / SQRT2, // ≈ 0.7071
  MEDIUM_LEG: 0.5,
  SMALL_LEG: 1 / (2 * SQRT2), // ≈ 0.3536
  SQUARE_SIDE: 1 / (2 * SQRT2), // ≈ 0.3536
  PARA_BASE: 0.5, // Parallelogram base
  PARA_HEIGHT: 0.25, // Parallelogram height (area = 1/8 = 0.5 * 0.25)
};

// ============================================
// Square Configurations (s₀ through s₅)
// ============================================

const Ll = TANGRAM.LARGE_LEG; // 0.7071
const Ml = TANGRAM.MEDIUM_LEG; // 0.5
const Sl = TANGRAM.SMALL_LEG; // 0.3536

/**
 * All 6 canonical square tangram configurations.
 * Piece order: [large1, large2, medium, small1, small2, square, parallelogram]
 */
const SQUARE_CONFIGS = [
  // s₀ - Two large triangles share vertex at center, pointing to TL and BL corners
  {
    name: "s₀",
    pieces: [
      trianglePosition(0, 0, Ll, 225), // Large 1 - top, right angle at center
      trianglePosition(0, 0, Ll, 135), // Large 2 - left, right angle at center
      trianglePosition(0.5, 0.5, Ml, 180), // Medium - bottom-right corner
      trianglePosition(0.25, -0.25, Sl, 315), // Small 1 - upper right area
      trianglePosition(0, 0, Sl, 45), // Small 2 - center
      { x: 0.25, y: 0, rotation: 45 }, // Square - center-right
      { x: -0.125, y: 0.375, rotation: 0 }, // Parallelogram - bottom-left
    ],
  },

  // s₁ - s₀ rotated 45° clockwise
  {
    name: "s₁",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 135), // Large 2
      trianglePosition(0.5, -0.5, Ml, 90), // Medium 
      trianglePosition(0, 0, Sl, 315), // Small 1 
      trianglePosition(-0.25, -0.25, Sl, 225), // Small 2
      { x: 0, y: -0.25, rotation: 45 }, // Square
      { x: 0.375, y: 0.125, rotation: 90 }, // Parallelogram 
    ],
  },

  /* // s₂ - s₁ mirrored horizontally
  {
    name: "s₂",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, -0.5, Ml, 0), // Medium 
      trianglePosition(0, 0, Sl, 225), // Small 1 
      trianglePosition(-0.25, 0.25, Sl, 135), // Small 2
      { x: -0.25, y: 0, rotation: 45 }, // Square
      { x: 0.125, y: -0.375, rotation: 0 }, // Parallelogram 
    ],
  },

  // s₃ - continuing rotation: medium at bottom-left
  {
    name: "s₃",
    pieces: [
      trianglePosition(0, 0, Ll, 225), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, 0.5, Ml, 270), // Medium - bottom-left
      trianglePosition(0, 0, Sl, 135), // Small 1
      trianglePosition(0.25, 0.25, Sl, 45), // Small 2
      { x: 0, y: 0.25, rotation: 45 }, // Square - bottom
      { x: -0.375, y: -0.125, rotation: 90 }, // Parallelogram - left side
    ],
  },

  // s₄ - continuing rotation: medium at bottom-right again, different angles
  {
    name: "s₄",
    pieces: [
      trianglePosition(0, 0, Ll, 135), // Large 1
      trianglePosition(0, 0, Ll, 225), // Large 2
      trianglePosition(0.5, 0.5, Ml, 180),
      trianglePosition(0, 0, Sl, 45), // Small 1
      trianglePosition(0.25, -0.25, Sl, 315), // Small 2
      { x: 0.25, y: 0, rotation: 45 }, // Square - right
      { x: -0.125, y: 0.375, rotation: 0 }, // Parallelogram - left side
    ],
  },

  // s₅ - final variation
  {
    name: "s₅",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, -0.5, Ml, 0), // Medium - top-left
      trianglePosition(-0.25, 0.25, Sl, 135), // Small 1
      trianglePosition(0, 0, Sl, 225), // Small 2
      { x: -0.25, y: 0, rotation: 45 }, // Square
      { x: 0.125, y: -0.375, rotation: 0 }, // Parallelogram - top-right
    ],
  }, */
];

const CAT_CONFIG = {
  name: "cat",
  view: { offsetX: -150, offsetY: -50, scale: 0.7 },
  pieces: [
    // Large 1: hind legs / base
    trianglePosition(0.75, 0.375, Ll, 135),
    // Large 2: tail (angled up/right)
    trianglePosition(0.957, 0.880, Ll, 180),
    // Medium: upper body / chest
    trianglePosition(-0.105, 0.235, Ml, 315),
    // Small 1: left ear
    trianglePosition(0, -0.375, Sl, 135),
    // Small 2: right ear
    trianglePosition(0, -0.375, Sl, 315),
    // Square: body core (diamond)
    { x: 0, y: -0.125, rotation: 45 },
    // Parallelogram: head (slanted), mirrored to better match the reference
    { x: 1.34, y: 0.755, rotation: 0},
  ],
};

const BEAR_CONFIG = {
  name: "bear",
  view: { offsetX: 0, offsetY: -85, scale: 0.9 },
  pieces: [
    // Large 1
    trianglePosition(-1.07, 0.145, Ll, 315),
    // Large 2
    trianglePosition(-0.57, -0.352, Ll, 0),
    // Medium
    trianglePosition(0.140, 0.146, Ml, 180),
    // Small 1
    trianglePosition(0.5, 0, Sl, 270),
    // Small 2
    trianglePosition(-0.57, 0.65, Sl, 135),
    // Square
    { x: 0.32, y: -0.175, rotation: 0 },
    // Parallelogram: 
    { x: 0.14, y: 0.325, rotation: 225},
  ],
};

const SHARK_CONFIG = {
  name: "shark",
  view: { offsetX: -50, offsetY: -55, scale: 0.8 },
  pieces: [
    // Large 1
    trianglePosition(-0.5, 0, Ll, 45),
    // Large 2
    trianglePosition(0.21, 0, Ll, 90),
    // Medium
    trianglePosition(0.921, 0, Ml, 270),
    // Small 1
    trianglePosition(-0.25, 0.75, Sl, 225),
    // Small 2
    trianglePosition(0.3, 0, Sl, 180),
    // Square
    { x: 0.388, y: 0.177, rotation: 0 },
    // Parallelogram: 
    { x: 0.74, y: 0, rotation: 135 },
  ],
};

const CAMEL_CONFIG = {
  name: "camel",
  view: { offsetX: -175, offsetY: -50, scale: 0.75 },
  pieces: [
    // Large 1
    { x: 0.411, y: 0.413, rotation: 135 },
    // Large 2
    { x: 0.963, y: 0.396, rotation: 90 },
    // Medium
    { x: 0.845, y: 0.042, rotation: 45 },
    // Small 1
    { x: 0.160, y: -0.338, rotation: 315 },
    // Small 2
    { x: -0.006, y: -0.504, rotation: 225 },
    // Square
    { x: 0.492, y: -0.089, rotation: 45 },
    // Parallelogram
    { x: 0.117, y: 0.036, rotation: 90 },
  ],
};

const HOUSE_CONFIG = {
  name: "house",
  view: { offsetX: 0, offsetY: 0, scale: 0.90 },
  pieces: [
    // Large 1
    { x: 0.222, y: -0.026, rotation: 45 },
    // Large 2
    { x: -0.024, y: 0.473, rotation: 45 },
    // Medium
    { x: -0.358, y: 0.307, rotation: 0 },
    // Small 1
    { x: 0.392, y: 0.390, rotation: 315 },
    // Small 2
    { x: 0.227, y: 0.225, rotation: 225 },
    // Square
    { x: -0.206, y: -0.287, rotation: 0 },
    // Parallelogram
    { x: -0.398, y: 0.016, rotation: 0 },
  ],
}

const HORSERIDER_CONFIG = {
  name: "horserider",
  view: { offsetX: -50, offsetY: -55, scale: 0.70 },
  pieces: [
    // Large 1
    { x: 0.034, y: 0.617, rotation: 0 },
    // Large 2
    { x: 0.647, y: 0.481, rotation: 180 },
    // Medium
    { x: 0.172, y: 0.214, rotation: 270 },
    // Small 1
    { x: 1.000, y: 0.244, rotation: 270 },
    // Small 2
    { x: 0.765, y: 0.833, rotation: 90 },
    // Square
    { x: 0.006, y: -0.369, rotation: 45 },
    // Parallelogram
    { x: -0.58, y: 0.507, rotation: 0 },
  ],
}

const BOAT_CONFIG = {
  name: "boat",
  view: { offsetX: 0, offsetY: 0, scale: 0.8 },
  pieces: [
    // Large 1
    { x: -0.222, y: 0.228, rotation: 45 },
    // Large 2
    { x: -0.555, y: -0.104, rotation: 135 },
    // Medium
    { x: -0.431, y: 0.511, rotation: 225 },
    // Small 1
    { x: -0.194, y: 0.629, rotation: 180 },
    // Small 2
    { x: 0.513, y: 0.631, rotation: 180 },
    // Square
    { x: 0.100, y: 0.571, rotation: 0 },
    // Parallelogram
    { x: 0.455, y: 0.395, rotation: 315 },
  ],
}

const GOOSE_CONFIG = {
  name: "goose",
  view: { offsetX: 0, offsetY: -70, scale: 0.72 },
  pieces: [
    // Large 1
    { x: 0.403, y: 0.447, rotation: 225 },
    // Large 2
    { x: 0.138, y: 0.751, rotation: 270 },
    // Medium
    { x: -0.214, y: 0.633, rotation: 315 },
    // Small 1
    { x: -0.317, y: -0.385, rotation: 180 },
    // Small 2
    { x: -0.367, y: 0.383, rotation: 135 },
    // Square
    { x: -0.200, y: 0.132, rotation: 45 },
    // Parallelogram
    { x: -0.074, y: -0.244, rotation: 90 },
  ],
};

const RABBIT_CONFIG = {
  name: "rabbit",
  view: { offsetX: 0, offsetY: -100, scale: 0.60 },
  pieces: [
    // Large 1
    { x: -0.306, y: 0.483, rotation: 315 },
    // Large 2
    { x: 0.094, y: 0.954, rotation: 270 },
    // Medium
    { x: 0.026, y: 0.315, rotation: 270 },
    // Small 1
    { x: 0.595, y: -0.136, rotation: 180 },
    // Small 2
    { x: 0.242, y: 0.599, rotation: 90 },
    // Square
    { x: 0.110, y: -0.018, rotation: 45 },
    // Parallelogram
    { x: -0.242, y: -0.445, rotation: 45 },
  ],
}

const ALL_CONFIGS = [
  ...SQUARE_CONFIGS,
  RABBIT_CONFIG,
  GOOSE_CONFIG,
  BOAT_CONFIG,
  HORSERIDER_CONFIG,
  HOUSE_CONFIG,
  CAMEL_CONFIG,
  CAT_CONFIG,
  BEAR_CONFIG,
  SHARK_CONFIG,
];

/**
 * Starting configuration for design mode.
 * Set to null to scatter pieces, or paste a config to start from it.
 */
const DESIGN_START_CONFIG = null; // Set to a config like HOUSE_CONFIG to start from it

/**
 * Default framing for configurations (centered, no scaling).
 * @type {{offsetX:number, offsetY:number, scale:number}}
 */
const DEFAULT_VIEW = { offsetX: 0, offsetY: 0, scale: 1 };

// ============================================
// Geometry Utilities
// ============================================

/**
 * Rotate a point around the origin.
 * @param {number} x Local x coordinate
 * @param {number} y Local y coordinate
 * @param {number} angleDeg Rotation angle in degrees (clockwise)
 * @returns {{x:number,y:number}} Rotated point
 */
function rotatePoint(x, y, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  };
}

/**
 * Calculate position for a RightTriangle given where its right angle should be.
 * Assumes the `RightTriangle` shape is defined with its right angle at local (0,0)
 * and legs extending along +X and +Y; the `GameObject` origin is treated as the
 * centroid, so we offset by `(-leg/3, -leg/3)` before rotating.
 *
 * @param {number} cornerX Normalized x where the right angle should land
 * @param {number} cornerY Normalized y where the right angle should land
 * @param {number} leg Normalized leg length for the triangle
 * @param {number} rotationDeg Rotation angle in degrees (clockwise)
 * @returns {{x:number,y:number,rotation:number}} Transform for the piece
 */
function trianglePosition(cornerX, cornerY, leg, rotationDeg) {
  const localCorner = { x: -leg / 3, y: -leg / 3 };
  const rotated = rotatePoint(localCorner.x, localCorner.y, rotationDeg);
  return {
    x: cornerX - rotated.x,
    y: cornerY - rotated.y,
    rotation: rotationDeg,
  };
}

/**
 * Resolve the desired Scene framing for a given configuration.
 * @param {{name:string, view?:{offsetX:number, offsetY:number, scale:number}}} config
 * @returns {{offsetX:number, offsetY:number, scale:number}}
 */
function getViewForConfig(config) {
  return config.view ?? DEFAULT_VIEW;
}

/**
 * Snap an angle to the nearest increment (default 45°).
 * @param {number} angleDeg
 * @param {number} stepDeg
 * @returns {number}
 */
function snapAngle(angleDeg, stepDeg = 45) {
  const snapped = Math.round(angleDeg / stepDeg) * stepDeg;
  // Normalize to [0, 360)
  return ((snapped % 360) + 360) % 360;
}

// ============================================
// TangramPiece
// ============================================

class TangramPiece extends GameObject {
  constructor(game, shape, options = {}) {
    super(game, options);
    this.shape = shape;
    this.baseSize = options.baseSize || 100;
    this.scaleX = 1;
    this.scaleY = 1;
    this.interactive = true;

    // Calculate hit box size and local vertices
    this._calculateHitSize();
    this._calculateLocalVertices();
  }

  /**
   * Calculate the hit box size based on the shape dimensions.
   * @private
   */
  _calculateHitSize() {
    const shape = this.shape;
    if (shape.leg !== undefined) {
      // RightTriangle - use leg size
      this.width = shape.leg;
      this.height = shape.leg;
    } else if (shape.side !== undefined) {
      // Square
      this.width = shape.side;
      this.height = shape.side;
    } else if (shape.width !== undefined) {
      // Parallelogram or Rectangle
      this.width = shape.width + (shape.slant || 0);
      this.height = shape.height || shape.width;
    } else {
      // Fallback
      this.width = 50;
      this.height = 50;
    }
  }

  /**
   * Calculate local vertices for snapping (relative to piece center).
   * @private
   */
  _calculateLocalVertices() {
    const shape = this.shape;
    
    if (shape.leg !== undefined) {
      // RightTriangle: right angle at origin, legs along +X and +Y
      // Centroid is at (leg/3, leg/3), so local coords relative to centroid:
      const leg = shape.leg;
      const cx = leg / 3;
      const cy = leg / 3;
      this._localVertices = [
        { x: -cx, y: -cy },           // Right angle vertex
        { x: leg - cx, y: -cy },      // End of X leg
        { x: -cx, y: leg - cy },      // End of Y leg
      ];
    } else if (shape.side !== undefined) {
      // Square: centered
      const half = shape.side / 2;
      this._localVertices = [
        { x: -half, y: -half },
        { x: half, y: -half },
        { x: half, y: half },
        { x: -half, y: half },
      ];
    } else if (shape.width !== undefined) {
      // Parallelogram: slanted shape
      const w = shape.width;
      const h = shape.height;
      const s = shape.slant || 0;
      // Centered parallelogram
      this._localVertices = [
        { x: -w/2, y: h/2 },           // Bottom-left
        { x: w/2, y: h/2 },            // Bottom-right
        { x: w/2 + s, y: -h/2 },       // Top-right
        { x: -w/2 + s, y: -h/2 },      // Top-left
      ];
    } else {
      this._localVertices = [];
    }
  }

  /**
   * Get world-space vertices (transformed by position and rotation).
   * @returns {Array<{x: number, y: number}>}
   */
  getWorldVertices() {
    // Use tracked degrees if available, otherwise rotation is already in radians
    const rad = this._rotationDeg !== undefined 
      ? (this._rotationDeg * Math.PI) / 180 
      : this.rotation; // rotation from engine is in radians
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    return this._localVertices.map(v => {
      // Rotate then translate
      return {
        x: this.x + v.x * cos - v.y * sin,
        y: this.y + v.x * sin + v.y * cos,
      };
    });
  }

  /**
   * Get bounding box for hit testing.
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBounds() {
    const w = this.width * Math.abs(this.scaleX);
    const h = this.height * Math.abs(this.scaleY);
    return {
      x: this.x,
      y: this.y,
      width: w,
      height: h,
    };
  }

  animateTo(target, delay = 0) {
    Tweenetik.killTarget(this);
    Tweenetik.to(
      this,
      {
        x: target.x * this.baseSize,
        y: target.y * this.baseSize,
        rotation: target.rotation,
        scaleX: target.scaleX ?? 1,
        scaleY: target.scaleY ?? 1,
      },
      CONFIG.animDuration,
      Easing.easeOutBack,
      { delay }
    );
  }

  setPosition(target) {
    this.x = target.x * this.baseSize;
    this.y = target.y * this.baseSize;
    this.rotation = target.rotation;
    this.scaleX = target.scaleX ?? 1;
    this.scaleY = target.scaleY ?? 1;
  }

  draw() {
    super.draw();
    this.shape.draw();
  }
}

// ============================================
// Main Demo
// ============================================

class TangramDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.configIndex = 0;
    this.draggingPiece = null;
    this.selectedPiece = null; // Persists after mouse release
    this._onKeyDown = null;
    this._onCanvasClick = null;
    this._dragCleanups = [];
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.baseSize = Math.min(this.width, this.height) * 0.8;

    // Create main scene for tangram pieces
    this.scene = new Scene(this, {
      x: this.width / 2,
      y: this.height / 2,
    });

    this.pieces = this.createPieces();
    for (const piece of this.pieces) {
      this.scene.add(piece);
    }
    this.pipeline.add(this.scene);

    // Create UI buttons first (before state machine, since menu state uses them)
    this.createButtons();

    // Initialize state machine (will enter "menu" state)
    this.initStateMachine();

    // Setup keyboard handler
    this.initKeyboardHandler();

    // Keep focus on the canvas
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = "none";
    this.canvas.addEventListener("pointerdown", () => this.canvas.focus());
    this.canvas.focus();
  }

  /**
   * Initialize the state machine with menu, showcase, and design states.
   */
  initStateMachine() {
    this.fsm = new StateMachine({
      initial: "menu",
      context: this,
      states: {
        menu: {
          enter: () => {
            this.showButtons(true);
            this.removeCanvasClickHandler();
            this.disableDragging();
            // Position pieces in first config
            this.configuration = ALL_CONFIGS[0];
            this.applyConfiguration(false);
          },
          exit: () => {
            this.showButtons(false);
          },
        },
        showcase: {
          enter: () => {
            this.configIndex = 0;
            this.configuration = ALL_CONFIGS[0];
            this.applyConfiguration(false);
            this.assignDistinctColors();
            
            // Click cycles to next shape with new colors
            this.setupCanvasClickHandler(() => this.toggleShowcase());
            this.disableDragging();
          },
          exit: () => {
            this.removeCanvasClickHandler();
          },
        },
        design: {
          enter: () => {
            // Kill any active tweens on pieces
            for (const piece of this.pieces) {
              Tweenetik.killTarget(piece);
            }
            Tweenetik.killTarget(this.scene);
            
            // Reset scene position
            this.scene.x = this.width / 2;
            this.scene.y = this.height / 2;
            
            // Load starting config or scatter pieces
            if (DESIGN_START_CONFIG) {
              this.loadDesignConfig(DESIGN_START_CONFIG);
              console.log(`[Design Mode] Loaded config: ${DESIGN_START_CONFIG.name}`);
            } else {
              this.scene.scaleX = 1;
              this.scene.scaleY = 1;
              this._designScale = 1;
              this.scatterPieces();
            }
            
            this.enableDragging();
            this.enableWheelZoom();
            console.log("[Design Mode] Q/E to rotate, Mouse wheel to zoom, P to print config");
          },
          exit: () => {
            this.disableDragging();
            this.disableWheelZoom();
          },
        },
      },
    });
  }

  /**
   * Create mode selection buttons.
   */
  createButtons() {
    const { width, height, spacing } = CONFIG.button;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.showcaseBtn = new Button(this, {
      x: centerX - width / 2 - spacing / 2,
      y: centerY,
      width,
      height,
      text: "Showcase",
      onClick: () => this.fsm.setState("showcase"),
    });

    this.designBtn = new Button(this, {
      x: centerX + width / 2 + spacing / 2,
      y: centerY,
      width,
      height,
      text: "Design",
      onClick: () => this.fsm.setState("design"),
    });

    this.backBtn = new Button(this, {
      x: 80,
      y: 30,
      width: 100,
      height: 30,
      text: "← Back",
      onClick: () => this.fsm.setState("menu"),
    });

    this.pipeline.add(this.showcaseBtn);
    this.pipeline.add(this.designBtn);
    this.pipeline.add(this.backBtn);
  }

  /**
   * Show or hide buttons based on current mode.
   * @param {boolean} showMenu - If true, show menu buttons; otherwise show back button
   */
  showButtons(showMenu) {
    if (!this.showcaseBtn) return; // Guard against early calls
    this.showcaseBtn.visible = showMenu;
    this.designBtn.visible = showMenu;
    this.backBtn.visible = !showMenu;
    this.showcaseBtn.interactive = showMenu;
    this.designBtn.interactive = showMenu;
    this.backBtn.interactive = !showMenu;
  }

  /**
   * Setup keyboard handler for Q/E rotation and P to print.
   */
  initKeyboardHandler() {
    const STEP_DEG = 45; // Degrees per step

    this._onKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Q/E work in design mode on selected piece (persists after release)
      if (this.fsm.is("design") && this.selectedPiece) {
        if (key === "q" || key === "e") {
          e.preventDefault();
          e.stopPropagation();
          
          // Track rotation in degrees on our own property
          if (this.selectedPiece._rotationDeg === undefined) {
            this.selectedPiece._rotationDeg = 0;
          }
          
          const delta = key === "q" ? -STEP_DEG : STEP_DEG;
          this.selectedPiece._rotationDeg += delta;
          
          // Engine takes degrees directly (converts to radians internally)
          console.log(`[Rotate] ${key.toUpperCase()}: ${this.selectedPiece._rotationDeg - delta}° -> ${this.selectedPiece._rotationDeg}°`);
          this.selectedPiece.rotation = this.selectedPiece._rotationDeg;
          return;
        }
      }

      // P to print config (design mode only)
      if (key === "p" && this.fsm.is("design")) {
        e.preventDefault();
        e.stopPropagation();
        this.printConfiguration();
        return;
      }

      // ESC to go back to menu
      if (key === "escape" && !this.fsm.is("menu")) {
        e.preventDefault();
        this.fsm.setState("menu");
      }
    };

    window.addEventListener("keydown", this._onKeyDown, { capture: true });
  }

  /**
   * Setup canvas click handler for showcase mode.
   * @param {Function} handler - Click handler function
   */
  setupCanvasClickHandler(handler) {
    this.removeCanvasClickHandler();
    this._onCanvasClick = handler;
    this.canvas.addEventListener("click", this._onCanvasClick);
  }

  /**
   * Remove canvas click handler.
   */
  removeCanvasClickHandler() {
    if (this._onCanvasClick) {
      this.canvas.removeEventListener("click", this._onCanvasClick);
      this._onCanvasClick = null;
    }
  }

  /**
   * Enable dragging on all pieces.
   * Custom implementation to handle scene-local coordinates.
   */
  enableDragging() {
    this.disableDragging(); // Clean up first

    for (const piece of this.pieces) {
      piece.interactive = true;

      // Store drag state on piece
      piece._dragOffset = { x: 0, y: 0 };
      piece._isDragging = false;

      // Input down handler - start drag and select
      const onInputDown = (e) => {
        piece._isDragging = true;
        this.draggingPiece = piece;
        
        // Select this piece (persists after mouse release)
        this.selectPiece(piece);

        // Calculate offset in scene-local coordinates (accounting for scale)
        const scale = this.scene.scaleX || 1;
        const localX = (e.x - this.scene.x) / scale;
        const localY = (e.y - this.scene.y) / scale;
        piece._dragOffset.x = piece.x - localX;
        piece._dragOffset.y = piece.y - localY;
      };

      // Input move handler - update position
      const onInputMove = (e) => {
        if (!piece._isDragging) return;

        // Convert to scene-local coordinates (accounting for scale)
        const scale = this.scene.scaleX || 1;
        const localX = (e.x - this.scene.x) / scale;
        const localY = (e.y - this.scene.y) / scale;
        piece.x = localX + piece._dragOffset.x;
        piece.y = localY + piece._dragOffset.y;
      };

      // Input up handler - end drag, snap if nearby, keep selected
      const onInputUp = () => {
        if (!piece._isDragging) return;
        piece._isDragging = false;
        this.draggingPiece = null;
        
        // Try to snap to nearby pieces
        this.snapPieceToNearby(piece);
      };

      // Bind handlers
      piece.on("inputdown", onInputDown);
      this.events.on("inputmove", onInputMove);
      this.events.on("inputup", onInputUp);

      // Store cleanup function
      this._dragCleanups.push(() => {
        piece.off("inputdown", onInputDown);
        this.events.off("inputmove", onInputMove);
        this.events.off("inputup", onInputUp);
        delete piece._dragOffset;
        delete piece._isDragging;
      });
    }

    // Add canvas click handler to deselect when clicking empty space
    this._clickedPiece = false;
    
    this._onDesignCanvasDown = () => {
      // Will be set to true by piece inputdown if a piece is clicked
      this._clickedPiece = false;
    };
    
    this._onDesignCanvasUp = () => {
      // If no piece was clicked, deselect
      if (!this._clickedPiece && !this.draggingPiece) {
        this.deselectPiece();
      }
    };
    
    // Mark that a piece was clicked (called before canvas handler)
    for (const piece of this.pieces) {
      const markClicked = () => { this._clickedPiece = true; };
      piece.on("inputdown", markClicked);
      this._dragCleanups.push(() => piece.off("inputdown", markClicked));
    }
    
    this.events.on("inputdown", this._onDesignCanvasDown);
    this.events.on("inputup", this._onDesignCanvasUp);
    
    this._dragCleanups.push(() => {
      this.events.off("inputdown", this._onDesignCanvasDown);
      this.events.off("inputup", this._onDesignCanvasUp);
    });
  }

  /**
   * Select a piece for rotation.
   * @param {TangramPiece} piece - The piece to select
   */
  selectPiece(piece) {
    // Deselect previous
    if (this.selectedPiece && this.selectedPiece !== piece) {
      this.restorePieceStroke(this.selectedPiece);
    }
    
    // Select new piece
    this.selectedPiece = piece;
    this.scene.bringToFront(piece);
    
    // Store original stroke and change to green
    if (!piece._originalStroke) {
      piece._originalStroke = piece.shape.stroke;
      piece._originalLineWidth = piece.shape.lineWidth;
    }
    piece.shape.stroke = "#0f0";
    piece.shape.lineWidth = 4;
  }

  /**
   * Restore a piece's original stroke color.
   * @param {TangramPiece} piece - The piece to restore
   */
  restorePieceStroke(piece) {
    if (piece._originalStroke !== undefined) {
      piece.shape.stroke = piece._originalStroke;
      piece.shape.lineWidth = piece._originalLineWidth;
    }
  }

  /**
   * Deselect the current piece.
   */
  deselectPiece() {
    if (this.selectedPiece) {
      this.restorePieceStroke(this.selectedPiece);
      this.selectedPiece = null;
    }
  }

  /**
   * Disable dragging on all pieces.
   */
  disableDragging() {
    for (const cleanup of this._dragCleanups) {
      if (typeof cleanup === "function") {
        cleanup();
      }
    }
    this._dragCleanups = [];
    this.draggingPiece = null;
    this.deselectPiece();
  }

  /**
   * Enable mouse wheel zoom for the scene.
   */
  enableWheelZoom() {
    this._onWheel = (e) => {
      e.preventDefault();
      
      const zoomSpeed = 0.05;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      
      // Update scale, capping between 0.3 and 1.0
      this._designScale = Math.max(0.3, Math.min(1.0, this._designScale + delta));
      
      this.scene.scaleX = this._designScale;
      this.scene.scaleY = this._designScale;
    };
    
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
  }

  /**
   * Disable mouse wheel zoom.
   */
  disableWheelZoom() {
    if (this._onWheel) {
      this.canvas.removeEventListener("wheel", this._onWheel);
      this._onWheel = null;
    }
  }

  /**
   * Snap a piece to nearby pieces if close enough.
   * @param {TangramPiece} piece - The piece to snap
   */
  snapPieceToNearby(piece) {
    const SNAP_THRESHOLD = 25; // Pixels threshold for snapping
    
    const pieceVerts = piece.getWorldVertices();
    if (pieceVerts.length === 0) return;
    
    let bestSnap = null;
    let bestDist = SNAP_THRESHOLD;
    
    // Check all other pieces
    for (const other of this.pieces) {
      if (other === piece) continue;
      
      const otherVerts = other.getWorldVertices();
      
      // Find closest vertex pair
      for (const pv of pieceVerts) {
        for (const ov of otherVerts) {
          const dx = ov.x - pv.x;
          const dy = ov.y - pv.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestSnap = { dx, dy };
          }
        }
      }
    }
    
    // Apply snap if found
    if (bestSnap) {
      piece.x += bestSnap.dx;
      piece.y += bestSnap.dy;
      console.log(`[Snap] Snapped piece by (${bestSnap.dx.toFixed(1)}, ${bestSnap.dy.toFixed(1)})`);
    }
  }

  /**
   * Scatter pieces randomly for design mode.
   */
  scatterPieces() {
    const spacing = this.baseSize * 0.25;
    const cols = 4;
    const startX = -spacing * 1.5;
    const startY = -spacing;

    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      piece.x = startX + col * spacing;
      piece.y = startY + row * spacing;
      piece.rotation = 0;
      piece._rotationDeg = 0; // Track rotation in degrees
      piece.scaleX = piece.scaleY = 1;
    }
  }

  /**
   * Load a configuration as the starting point for design mode.
   * @param {Object} config - The configuration to load
   */
  loadDesignConfig(config) {
    // Apply view scale
    const view = config.view ?? { offsetX: 0, offsetY: 0, scale: 1 };
    this._designScale = view.scale;
    this.scene.scaleX = view.scale;
    this.scene.scaleY = view.scale;

    // Apply piece positions
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const target = config.pieces[i];
      
      piece.x = target.x * this.baseSize;
      piece.y = target.y * this.baseSize;
      piece.rotation = target.rotation; // Degrees for engine
      piece._rotationDeg = target.rotation; // Track in degrees
      piece.scaleX = target.scaleX ?? 1;
      piece.scaleY = target.scaleY ?? 1;
    }
  }

  /**
   * Print current piece configuration to console (for copy-pasting).
   */
  printConfiguration() {
    const pieceNames = [
      "Large 1",
      "Large 2",
      "Medium",
      "Small 1",
      "Small 2",
      "Square",
      "Parallelogram",
    ];

    console.log("\n=== TANGRAM CONFIGURATION ===");
    console.log("Copy this into ALL_CONFIGS:\n");

    const currentScale = this._designScale ?? 1;
    const configStr = `{
  name: "custom",
  view: { offsetX: 0, offsetY: 0, scale: ${currentScale.toFixed(2)} },
  pieces: [
${this.pieces
  .map((p, i) => {
    const x = (p.x / this.baseSize).toFixed(3);
    const y = (p.y / this.baseSize).toFixed(3);
    // Use our tracked rotation in degrees, or convert from radians
    const rotDeg = p._rotationDeg !== undefined 
      ? p._rotationDeg 
      : (p.rotation * 180 / Math.PI);
    const rot = snapAngle(rotDeg, 45);
    // Output raw position (don't use trianglePosition - it expects corner, not centroid)
    return `    // ${pieceNames[i]}\n    { x: ${x}, y: ${y}, rotation: ${rot} },`;
  })
  .join("\n")}
  ],
}`;

    console.log(configStr);
    console.log("\n=============================\n");
  }

  /**
   * Apply scene framing (position + scale) for the current configuration.
   * @param {boolean} animate Whether to tween into the framing
   */
  applySceneView(animate = true) {
    const view = getViewForConfig(this.configuration);
    const target = {
      x: this.width / 2 + view.offsetX,
      y: this.height / 2 + view.offsetY,
      scaleX: view.scale,
      scaleY: view.scale,
    };

    Tweenetik.killTarget(this.scene);
    if (animate) {
      Tweenetik.to(this.scene, target, CONFIG.animDuration, Easing.easeOutBack);
    } else {
      this.scene.x = target.x;
      this.scene.y = target.y;
      this.scene.scaleX = target.scaleX;
      this.scene.scaleY = target.scaleY;
    }
  }

  /**
   * Cycle to next shape and assign new distinct colors.
   */
  toggleShowcase() {
    this.nextConfiguration();
    this.assignDistinctColors();
  }
  
  /**
   * Generate distinct colors for all 7 pieces (no duplicates).
   * Uses evenly spaced hues around the color wheel.
   */
  assignDistinctColors() {
    // 7 distinct hues evenly spaced (360 / 7 ≈ 51°)
    const baseHues = [0, 30, 60, 120, 180, 240, 300]; // Red, Orange, Yellow, Green, Cyan, Blue, Magenta
    
    // Shuffle the hues
    const hues = [...baseHues];
    for (let i = hues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hues[i], hues[j]] = [hues[j], hues[i]];
    }
    
    // Apply to pieces
    for (let i = 0; i < this.pieces.length; i++) {
      const hue = hues[i];
      this.pieces[i].shape.color = `hsl(${hue}, 85%, 55%)`;
    }
  }

  /**
   * Scatter pieces with animation (for showcase mode).
   * Also randomizes colors.
   */
  scatterPiecesAnimated() {
    // Reset scene view to default
    const defaultView = { offsetX: 0, offsetY: 0, scale: 1 };
    this.configuration = { view: defaultView };
    this.applySceneView(true);

    // Scatter each piece with animation and random colors
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      Tweenetik.killTarget(piece);
      
      // Store original color if not already stored
      if (!piece._originalColor) {
        piece._originalColor = piece.shape.color;
      }
      
      // Random position within the scene bounds
      const targetX = (Math.random() - 0.5) * this.baseSize * 1.2;
      const targetY = (Math.random() - 0.5) * this.baseSize * 1.2;
      const targetRotation = Math.floor(Math.random() * 8) * 45; // Random 45° increments
      
      // Randomize color using Painter.colors
      piece.shape.color = Painter.colors.randomColorHSL();
      
      Tweenetik.to(
        piece,
        { x: targetX, y: targetY, rotation: targetRotation },
        CONFIG.animDuration,
        Easing.easeOutBack,
        { delay: i * CONFIG.staggerDelay }
      );
    }
  }
  
  /**
   * Restore original colors on all pieces.
   */
  restoreOriginalColors() {
    for (const piece of this.pieces) {
      if (piece._originalColor) {
        piece.shape.color = piece._originalColor;
      }
    }
  }

  /**
   * Create all tangram pieces.
   * @returns {TangramPiece[]} Array of tangram pieces
   */
  createPieces() {
    const size = this.baseSize;
    const pieces = [];

    const make = (shape) => new TangramPiece(this, shape, { baseSize: size });
    const opts = (color) => ({
      color,
      stroke: CONFIG.strokeColor,
      lineWidth: CONFIG.strokeWidth,
      lineJoin: "round",
    });

    pieces.push(
      make(
        new RightTriangle(
          TANGRAM.LARGE_LEG * size,
          opts(CONFIG.colors.largeTriangle1)
        )
      )
    );
    pieces.push(
      make(
        new RightTriangle(
          TANGRAM.LARGE_LEG * size,
          opts(CONFIG.colors.largeTriangle2)
        )
      )
    );
    pieces.push(
      make(
        new RightTriangle(
          TANGRAM.MEDIUM_LEG * size,
          opts(CONFIG.colors.mediumTriangle)
        )
      )
    );
    pieces.push(
      make(
        new RightTriangle(
          TANGRAM.SMALL_LEG * size,
          opts(CONFIG.colors.smallTriangle1)
        )
      )
    );
    pieces.push(
      make(
        new RightTriangle(
          TANGRAM.SMALL_LEG * size,
          opts(CONFIG.colors.smallTriangle2)
        )
      )
    );
    pieces.push(
      make(new Square(TANGRAM.SQUARE_SIDE * size, opts(CONFIG.colors.square)))
    );
    pieces.push(
      make(
        new Parallelogram({
          width: TANGRAM.PARA_BASE * size,
          height: TANGRAM.PARA_HEIGHT * size,
          slant: TANGRAM.PARA_HEIGHT * size,
          ...opts(CONFIG.colors.parallelogram),
        })
      )
    );

    return pieces;
  }

  /**
   * Apply a configuration to all pieces.
   * @param {boolean} animate Whether to animate the transition
   */
  applyConfiguration(animate = true) {
    const config = this.configuration;
    for (let i = 0; i < this.pieces.length; i++) {
      const target = config.pieces[i];
      if (animate) {
        this.pieces[i].animateTo(target, i * CONFIG.staggerDelay);
      } else {
        this.pieces[i].setPosition(target);
      }
    }
    this.applySceneView(animate);
  }

  /**
   * Pick a random configuration with animation (showcase mode).
   */
  nextConfiguration() {
    const count = ALL_CONFIGS.length;
    if (count === 0) return;

    let nextIndex;
    if (count === 1) {
      nextIndex = 0;
    } else {
      // Pick a different config than current
      nextIndex = this.configIndex;
      while (nextIndex === this.configIndex) {
        nextIndex = Math.floor(Math.random() * count);
      }
    }

    this.configIndex = nextIndex;
    this.configuration = ALL_CONFIGS[this.configIndex];
    console.log(`Assembling: ${this.configuration.name}`);
    this.applyConfiguration(true);
  }

  update(dt) {
    super.update(dt);
    Tweenetik.updateAll(dt);
    this.fsm.update(dt);
  }

  stop() {
    // Cleanup
    if (this._onKeyDown) {
      window.removeEventListener("keydown", this._onKeyDown, { capture: true });
    }
    this.removeCanvasClickHandler();
    this.disableDragging();
    super.stop();
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
