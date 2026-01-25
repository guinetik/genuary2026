/**
 * Genuary 2026 - Day 14
 * Prompt: "Everything fits perfectly"
 * 
 * @fileoverview Interactive Tangram Puzzle
 * 
 * Interactive Tangram puzzle with mathematically precise geometry.
 * See /docs/tangram-geometry.md for detailed documentation.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
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

import {
  CONFIG,
  TANGRAM,
  ALL_CONFIGS,
  DESIGN_START_CONFIG,
  DEFAULT_VIEW,
  rotatePoint,
} from "./day14.config.js";

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
        { x: -cx, y: -cy }, // Right angle vertex
        { x: leg - cx, y: -cy }, // End of X leg
        { x: -cx, y: leg - cy }, // End of Y leg
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
        { x: -w / 2, y: h / 2 }, // Bottom-left
        { x: w / 2, y: h / 2 }, // Bottom-right
        { x: w / 2 + s, y: -h / 2 }, // Top-right
        { x: -w / 2 + s, y: -h / 2 }, // Top-left
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
    const rad =
      this._rotationDeg !== undefined
        ? (this._rotationDeg * Math.PI) / 180
        : this.rotation; // rotation from engine is in radians
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return this._localVertices.map((v) => {
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

/**
 * Tangram Demo
 * 
 * Main game class for Day 14, creating an interactive Tangram puzzle
 * with mathematically precise geometry and draggable pieces.
 * 
 * @class TangramDemo
 * @extends {Game}
 */
class TangramDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.configIndex = 0;
    this.draggingPiece = null;
    this.selectedPiece = null; // Persists after mouse release
    this._onKeyDown = null;
    this._onCanvasClick = null;
    this._dragCleanups = [];

    // Shuffle bag for showcase - ensures all configs shown before repeating
    this.shuffledIndices = [];
    this.shufflePosition = 0;
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
            // Initialize shuffle bag and show first config
            this.shuffleConfigs();
            this.configIndex = this.shuffledIndices[0];
            this.shufflePosition = 0;
            this.configuration = ALL_CONFIGS[this.configIndex];
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
              console.log(
                `[Design Mode] Loaded config: ${DESIGN_START_CONFIG.name}`
              );
            } else {
              this.scene.scaleX = 1;
              this.scene.scaleY = 1;
              this._designScale = 1;
              this.scatterPieces();
            }

            this.enableDragging();
            this.enableWheelZoom();
            console.log(
              "[Design Mode] Q/E rotate, W/S flip, Wheel zoom, Drag canvas, P print, SHIFT = no snap"
            );
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
          console.log(
            `[Rotate] ${key.toUpperCase()}: ${
              this.selectedPiece._rotationDeg - delta
            }° -> ${this.selectedPiece._rotationDeg}°`
          );
          this.selectedPiece.rotation = this.selectedPiece._rotationDeg;
          return;
        }

        // W/S to flip piece (mirror) - useful for parallelogram chirality
        if (key === "w" || key === "s") {
          e.preventDefault();
          e.stopPropagation();

          if (key === "w") {
            // Flip horizontally (mirror X)
            this.selectedPiece.scaleX *= -1;
            console.log(
              `[Flip] Horizontal: scaleX = ${this.selectedPiece.scaleX}`
            );
          } else {
            // Flip vertically (mirror Y)
            this.selectedPiece.scaleY *= -1;
            console.log(
              `[Flip] Vertical: scaleY = ${this.selectedPiece.scaleY}`
            );
          }
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
      
      // Track shift key for snap disable
      if (e.shiftKey) {
        this._shiftHeld = true;
      }
    };
    
    // Track shift release
    this._onKeyUp = (e) => {
      if (e.key === 'Shift') {
        this._shiftHeld = false;
      }
    };

    window.addEventListener("keydown", this._onKeyDown, { capture: true });
    window.addEventListener("keyup", this._onKeyUp, { capture: true });
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

    // Add canvas dragging to pan the scene (when not clicking a piece)
    this._clickedPiece = false;
    this._isDraggingCanvas = false;
    this._canvasDragStart = { x: 0, y: 0 };
    this._sceneDragStart = { x: 0, y: 0 };

    this._onDesignCanvasDown = (e) => {
      // Will be set to true by piece inputdown if a piece is clicked
      this._clickedPiece = false;

      // Delay check to see if a piece was clicked
      setTimeout(() => {
        if (!this._clickedPiece && !this.draggingPiece) {
          // Start canvas drag for panning
          this._isDraggingCanvas = true;
          this._canvasDragStart.x = e.x;
          this._canvasDragStart.y = e.y;
          this._sceneDragStart.x = this.scene.x;
          this._sceneDragStart.y = this.scene.y;
        }
      }, 0);
    };

    this._onDesignCanvasMove = (e) => {
      if (this._isDraggingCanvas) {
        // Pan the scene
        const dx = e.x - this._canvasDragStart.x;
        const dy = e.y - this._canvasDragStart.y;
        this.scene.x = this._sceneDragStart.x + dx;
        this.scene.y = this._sceneDragStart.y + dy;
      }
    };

    this._onDesignCanvasUp = () => {
      // If no piece was clicked and we weren't dragging canvas, deselect
      if (
        !this._clickedPiece &&
        !this.draggingPiece &&
        !this._isDraggingCanvas
      ) {
        this.deselectPiece();
      }
      this._isDraggingCanvas = false;
    };

    // Mark that a piece was clicked (called before canvas handler)
    for (const piece of this.pieces) {
      const markClicked = () => {
        this._clickedPiece = true;
      };
      piece.on("inputdown", markClicked);
      this._dragCleanups.push(() => piece.off("inputdown", markClicked));
    }

    this.events.on("inputdown", this._onDesignCanvasDown);
    this.events.on("inputmove", this._onDesignCanvasMove);
    this.events.on("inputup", this._onDesignCanvasUp);

    this._dragCleanups.push(() => {
      this.events.off("inputdown", this._onDesignCanvasDown);
      this.events.off("inputmove", this._onDesignCanvasMove);
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
      this._designScale = Math.max(
        0.3,
        Math.min(1.0, this._designScale + delta)
      );

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
   * Find closest point on a line segment to a point.
   * @param {Object} p - Point {x, y}
   * @param {Object} a - Segment start {x, y}
   * @param {Object} b - Segment end {x, y}
   * @returns {{x: number, y: number, dist: number}}
   */
  _closestPointOnSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) {
      // Degenerate segment (a == b)
      const dist = Math.sqrt(apx * apx + apy * apy);
      return { x: a.x, y: a.y, dist };
    }
    
    // Project p onto ab, clamped to [0,1]
    let t = (apx * abx + apy * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    
    const closestX = a.x + t * abx;
    const closestY = a.y + t * aby;
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return { x: closestX, y: closestY, dist, t };
  }

  /**
   * Snap a piece to nearby pieces if close enough.
   * Hold SHIFT to disable snapping.
   * Supports both vertex-to-vertex and vertex-to-edge snapping.
   * @param {TangramPiece} piece - The piece to snap
   */
  snapPieceToNearby(piece) {
    // Check if SHIFT is held to disable snapping
    if (this._shiftHeld) {
      console.log('[Snap] Disabled (SHIFT held)');
      return;
    }
    
    const VERTEX_SNAP_THRESHOLD = 20; // Pixels for vertex-to-vertex
    const EDGE_SNAP_THRESHOLD = 15;   // Pixels for vertex-to-edge (tighter)

    const pieceVerts = piece.getWorldVertices();
    if (pieceVerts.length === 0) return;

    let bestSnap = null;
    let bestDist = Math.max(VERTEX_SNAP_THRESHOLD, EDGE_SNAP_THRESHOLD);
    let snapType = '';

    // Check all other pieces
    for (const other of this.pieces) {
      if (other === piece) continue;

      const otherVerts = other.getWorldVertices();
      const numOtherVerts = otherVerts.length;

      // 1. Vertex-to-vertex snapping (corners)
      for (const pv of pieceVerts) {
        for (const ov of otherVerts) {
          const dx = ov.x - pv.x;
          const dy = ov.y - pv.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < bestDist && dist < VERTEX_SNAP_THRESHOLD) {
            bestDist = dist;
            bestSnap = { dx, dy };
            snapType = 'vertex';
          }
        }
      }

      // 2. Vertex-to-edge snapping (for edges like hypotenuse)
      // Only check if we haven't found a very close vertex snap
      if (bestDist > EDGE_SNAP_THRESHOLD * 0.5) {
        for (const pv of pieceVerts) {
          for (let i = 0; i < numOtherVerts; i++) {
            const a = otherVerts[i];
            const b = otherVerts[(i + 1) % numOtherVerts];
            
            const closest = this._closestPointOnSegment(pv, a, b);
            
            // Skip if closest point is at a vertex (t near 0 or 1)
            // This prevents double-snapping and prioritizes vertex snaps
            if (closest.t < 0.05 || closest.t > 0.95) continue;
            
            if (closest.dist < bestDist && closest.dist < EDGE_SNAP_THRESHOLD) {
              bestDist = closest.dist;
              bestSnap = { dx: closest.x - pv.x, dy: closest.y - pv.y };
              snapType = 'edge';
            }
          }
        }
      }
    }

    // Apply snap if found
    if (bestSnap) {
      piece.x += bestSnap.dx;
      piece.y += bestSnap.dy;
      console.log(
        `[Snap] ${snapType} snap by (${bestSnap.dx.toFixed(1)}, ${bestSnap.dy.toFixed(1)})`
      );
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
    const rotDeg =
      p._rotationDeg !== undefined
        ? p._rotationDeg
        : (p.rotation * 180) / Math.PI;
    const rot = snapAngle(rotDeg, 45);

    // Include scaleX/scaleY if flipped (not default 1)
    const sx = p.scaleX ?? 1;
    const sy = p.scaleY ?? 1;
    let extras = "";
    if (sx !== 1) extras += `, scaleX: ${sx}`;
    if (sy !== 1) extras += `, scaleY: ${sy}`;

    // Output raw position (don't use trianglePosition - it expects corner, not centroid)
    return `    // ${pieceNames[i]}\n    { x: ${x}, y: ${y}, rotation: ${rot}${extras} },`;
  })
  .join("\n")}
  ],
}`;

    console.log(configStr);
    console.log("\n=============================\n");
  }

  /**
   * Apply scene framing (position + scale) for the current configuration.
   * Offsets scale proportionally with the tangram size (baseSize).
   * @param {boolean} animate Whether to tween into the framing
   */
  applySceneView(animate = true) {
    const view = getViewForConfig(this.configuration);
    
    // Scale offsets relative to baseSize so figures stay centered at any screen size
    // baseSize = minDim * 0.8, so a 100px offset at 800px canvas = 0.125 * baseSize
    // This approach works regardless of aspect ratio
    const referenceBase = 640; // baseSize at 800px canvas (800 * 0.8)
    const offsetScale = this.baseSize / referenceBase;
    
    const target = {
      x: this.width / 2 + view.offsetX * offsetScale,
      y: this.height / 2 + view.offsetY * offsetScale,
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
   * Randomly generates hues ensuring minimum separation, with varied saturation/lightness.
   */
  assignDistinctColors() {
    const numPieces = this.pieces.length;
    const minHueSeparation = 30; // Minimum degrees between hues
    const hues = [];
    
    // Generate random starting hue
    let currentHue = Math.random() * 360;
    
    // Generate 7 distinct hues with random spacing (but at least minHueSeparation apart)
    for (let i = 0; i < numPieces; i++) {
      hues.push(currentHue % 360);
      // Random jump between 40-70 degrees ensures variety while staying distinct
      currentHue += minHueSeparation + Math.random() * 40;
    }
    
    // Shuffle the hues so adjacent pieces don't always have adjacent colors
    for (let i = hues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hues[i], hues[j]] = [hues[j], hues[i]];
    }

    // Apply to pieces with varied saturation and lightness
    for (let i = 0; i < numPieces; i++) {
      const hue = Math.round(hues[i]);
      const saturation = 70 + Math.random() * 25; // 70-95%
      const lightness = 45 + Math.random() * 20;  // 45-65%
      const colorValue = `hsl(${hue}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`;
      this.pieces[i].shape.color = colorValue;
      this.pieces[i].shape.fill = colorValue;
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
      const randomColor = Painter.colors.randomColorHSL();
      piece.shape.color = randomColor;
      piece.shape.fill = randomColor;

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
        piece.shape.fill = piece._originalColor;
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
   * Shuffle the config indices (Fisher-Yates shuffle).
   * Ensures all configs are shown before any repeat.
   */
  shuffleConfigs() {
    const count = ALL_CONFIGS.length;
    this.shuffledIndices = Array.from({ length: count }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledIndices[i], this.shuffledIndices[j]] = [
        this.shuffledIndices[j],
        this.shuffledIndices[i],
      ];
    }

    console.log(
      `[Showcase] Shuffled ${count} configs: ${this.shuffledIndices
        .map((i) => ALL_CONFIGS[i].name)
        .join(", ")}`
    );
  }

  /**
   * Advance to next configuration in the shuffle bag (showcase mode).
   */
  nextConfiguration() {
    const count = ALL_CONFIGS.length;
    if (count === 0) return;

    // Move to next position in shuffled array
    this.shufflePosition++;

    // If we've seen all configs, reshuffle
    if (this.shufflePosition >= count) {
      this.shuffleConfigs();
      this.shufflePosition = 0;
    }

    this.configIndex = this.shuffledIndices[this.shufflePosition];
    this.configuration = ALL_CONFIGS[this.configIndex];
    console.log(
      `Assembling: ${this.configuration.name} (${this.shufflePosition + 1}/${count})`
    );
    this.applyConfiguration(true);
  }

  update(dt) {
    super.update(dt);
    Tweenetik.updateAll(dt);
    this.fsm.update(dt);
  }

  render() {
    super.render();
    
    // Draw figure name in showcase mode
    if (this.fsm?.state === 'showcase' && this.configuration?.name) {
      const ctx = this.ctx;
      const name = this.configuration.name;
      
      ctx.save();
      ctx.font = '14px "Fira Code", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(name, 16, this.height - 16);
      ctx.restore();
    }
  }

  stop() {
    // Cleanup
    if (this._onKeyDown) {
      window.removeEventListener("keydown", this._onKeyDown, { capture: true });
    }
    if (this._onKeyUp) {
      window.removeEventListener("keyup", this._onKeyUp, { capture: true });
    }
    this.removeCanvasClickHandler();
    this.disableDragging();
    super.stop();
  }
}

// ============================================
// Export
// ============================================

/**
 * Create Day 14 visualization
 * 
 * Factory function that creates and starts the Tangram demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {TangramDemo} returns.game - The game instance
 */
export default function day14(canvas) {
  const game = new TangramDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
