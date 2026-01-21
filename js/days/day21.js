/**
 * Genuary 2026 - Day 21
 * Prompt: "Bauhaus Poster"
 *
 * PROCEDURAL BAUHAUS - Farnsworth Edition
 * An homage to the German art school's geometric aesthetic (1919-1933)
 * featuring Mies van der Rohe's Farnsworth House (1951).
 *
 * Features:
 * - Farnsworth House SVG as architectural anchor
 * - Multi-layer parallax mouse tracking using gcanvas shapes
 * - Classic Bauhaus color palette (red, yellow, blue, black, cream)
 * - Tweenetik animations for smooth entrances
 * - Subtle rotation and breathing animations
 * - Click to regenerate composition
 */

import {
  Game,
  Painter,
  GameObject,
  Scene,
  Circle,
  Rectangle,
  Triangle,
  Ring,
  Arc,
  PieSlice,
  SVGShape,
  Tweenetik,
  Easing,
} from '@guinetik/gcanvas';

// Farnsworth House SVG path data
const FARNSWORTH_PATH = "M 155.707 30.955 L 188.99 30.955 L 188.99 38.17 L 155.707 38.17 L 155.707 30.955 Z M 147.561 38.17 L 147.561 30.955 L 151.518 30.955 L 151.518 38.17 L 147.561 38.17 Z M 19.551 34.912 L 60.98 34.912 L 60.98 38.17 L 19.551 38.17 L 19.551 34.912 Z M 62.376 30.955 L 103.572 30.955 L 103.572 32.119 L 62.376 32.119 L 62.376 30.955 Z M 62.376 9.775 L 87.978 9.775 L 87.978 28.395 L 62.376 28.395 L 62.376 9.775 Z M 168.508 9.775 L 188.99 9.775 L 188.99 28.395 L 168.508 28.395 L 168.508 9.775 Z M 125.683 28.395 L 125.683 9.775 L 146.165 9.775 L 146.165 28.395 L 125.683 28.395 Z M 104.736 9.775 L 125.218 9.775 L 125.218 28.395 L 104.736 28.395 L 104.736 9.775 Z M 103.572 9.775 L 103.572 28.395 L 88.211 28.395 L 88.211 9.775 L 103.572 9.775 Z M 103.572 38.17 L 62.376 38.17 L 62.376 34.912 L 103.572 34.912 L 103.572 38.17 Z M 104.736 34.912 L 115.442 34.912 L 115.442 32.352 L 104.736 32.352 L 104.736 30.955 L 146.165 30.955 L 146.165 38.17 L 104.736 38.17 L 104.736 34.912 Z M 147.561 28.395 L 147.561 9.775 L 168.043 9.775 L 168.043 28.395 L 147.561 28.395 Z M 200.86 28.395 L 190.387 28.395 L 190.387 9.775 L 200.86 9.775 L 200.86 28.395 Z M 155.707 38.869 L 209.472 38.869 L 209.472 38.17 L 190.154 38.17 L 190.154 30.955 L 201.093 30.955 L 201.093 28.628 L 201.093 28.395 L 201.093 9.775 L 201.093 7.448 L 201.093 7.215 L 201.093 6.517 L 169.672 6.517 L 169.672 4.655 L 155.707 4.655 L 155.707 0 L 151.751 0 L 151.751 4.655 L 137.786 4.655 L 137.786 6.517 L 50.041 6.517 L 50.041 7.215 L 50.506 7.215 L 50.506 9.775 L 61.213 9.775 L 61.213 28.395 L 50.506 28.395 L 50.506 30.955 L 61.213 30.955 L 61.213 32.119 L 7.681 32.119 L 7.681 34.679 L 18.387 34.679 L 18.387 37.938 L 0 37.938 L 0 38.636 L 151.518 38.636";

const CONFIG = {
  // Classic Bauhaus palette
  colors: {
    red: '#E53935',
    yellow: '#FFCA28',
    blue: '#1E88E5',
    black: '#1A1A1A',
    cream: '#F5F0E6',
    darkCream: '#E8E0D0',
    // Farnsworth accents
    gold: '#C9A227',
    warmBlue: '#4A6B8A',
  },

  // Parallax depth layers (0 = far/slow, 1 = near/fast)
  layers: {
    background: 0.05,
    far: 0.15,
    mid: 0.35,
    near: 0.6,
    front: 0.85,
  },

  // Animation
  parallaxSmoothing: 0.08,
  entranceDuration: 0.6,

  // Composition bounds (normalized 0-1)
  margin: 0.08,
  houseReserve: 0.25, // Reserve bottom 25% for house
  textReserve: 0.12, // Reserve bottom 12% for text (within house area)
  maxParallaxOffset: 0.04, // Max parallax movement to account for
  
  // House settings
  houseWidth: 0.65, // Width as fraction of canvas
  houseOpacity: 1,
};

/**
 * ParallaxShape - A GameObject wrapper that adds parallax behavior to any shape
 */
class ParallaxShape extends GameObject {
  constructor(game, shape, options = {}) {
    super(game, options);

    this.shape = shape;
    this.baseX = options.baseX || 0.5;
    this.baseY = options.baseY || 0.5;
    this.depth = options.depth || 0.5;
    this.delay = options.delay || 0;

    // Current normalized position (for smooth interpolation)
    this.normX = this.baseX;
    this.normY = this.baseY;

    // Set initial position
    this.x = this.baseX * game.width;
    this.y = this.baseY * game.height;

    // Animation scale - start at 0 (hidden) until entrance animation
    this.scaleX = 0;
    this.scaleY = 0;
    
    // Subtle animation properties
    this.rotationSpeed = options.rotationSpeed || 0;
    this.breatheSpeed = options.breatheSpeed || 0;
    this.breatheAmount = options.breatheAmount || 0;
    this.baseRotation = shape.rotation || 0;
    this.time = Math.random() * 100; // Random phase offset
  }

  /**
   * Trigger the entrance animation using Tweenetik
   */
  animateEntrance() {
    this.scaleX = 0;
    this.scaleY = 0;
    Tweenetik.to(
      this,
      { scaleX: 1, scaleY: 1 },
      CONFIG.entranceDuration,
      Easing.easeOutBack,
      { delay: this.delay }
    );
  }

  /**
   * Reset for re-entrance animation
   */
  reset() {
    Tweenetik.killTarget(this);
    this.scaleX = 0;
    this.scaleY = 0;
  }

  /**
   * Update position based on mouse parallax
   */
  update(dt) {
    super.update(dt);
    this.time += dt;

    // Get mouse offset from game
    const mouseOffsetX = this.game.mouseOffsetX || 0;
    const mouseOffsetY = this.game.mouseOffsetY || 0;

    // Parallax offset based on depth
    const parallaxX = mouseOffsetX * this.depth * CONFIG.maxParallaxOffset;
    const parallaxY = mouseOffsetY * this.depth * CONFIG.maxParallaxOffset;

    // Target normalized position
    const targetX = this.baseX + parallaxX;
    const targetY = this.baseY + parallaxY;

    // Smooth interpolation
    this.normX += (targetX - this.normX) * CONFIG.parallaxSmoothing;
    this.normY += (targetY - this.normY) * CONFIG.parallaxSmoothing;

    // Convert to actual canvas coordinates
    this.x = this.normX * this.game.width;
    this.y = this.normY * this.game.height;
    
    // Subtle rotation animation
    if (this.rotationSpeed !== 0) {
      this.shape.rotation = this.baseRotation + this.time * this.rotationSpeed;
    }
  }

  /**
   * Draw the shape
   */
  draw() {
    super.draw();

    // Apply position and scale to shape
    this.shape.x = this.x;
    this.shape.y = this.y;
    
    // Breathing effect
    const breathe = this.breatheAmount > 0 
      ? 1 + Math.sin(this.time * this.breatheSpeed) * this.breatheAmount 
      : 1;
    this.shape.scaleX = this.scaleX * breathe;
    this.shape.scaleY = this.scaleY * breathe;

    // Draw the shape
    this.shape.draw();
  }
}

/**
 * Bauhaus Poster Demo
 */
class BauhausPosterDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.colors.cream;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Kill any lingering tweens
    Tweenetik.killAll();

    // Mouse tracking
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.targetMouseX = this.width / 2;
    this.targetMouseY = this.height / 2;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;

    // Create main scene
    this.scene = new Scene(this, { anchor: 'top-left' });
    this.parallaxShapes = [];

    // Text animation state (slide Y offset and opacity)
    this.textSlideY = 30;
    this.textOpacity = 0;
    this.dateSlideY = 20;
    this.dateOpacity = 0;
    
    // House animation state
    this.houseProgress = 0;

    // Create Farnsworth House SVG shape
    this.createHouseShape();

    // Generate composition
    this.generateComposition();

    // Start entrance animations
    this.startEntranceAnimations();

    // Animate text and house after shapes
    this.animateText();

    // Add scene to pipeline
    this.pipeline.add(this.scene);

    // Event listeners
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = e.clientX - rect.left;
      this.targetMouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.targetMouseX = this.width / 2;
      this.targetMouseY = this.height / 2;
    });

    this.canvas.addEventListener('click', () => {
      this.regenerate();
    });

    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetMouseX = touch.clientX - rect.left;
      this.targetMouseY = touch.clientY - rect.top;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.regenerate();
    });
  }

  /**
   * Create the Farnsworth House SVG shape
   */
  createHouseShape() {
    const margin = Math.min(this.width, this.height) * CONFIG.margin;
    const textAreaHeight = this.height * CONFIG.textReserve;
    
    // Calculate scale to fit house width
    const targetWidth = this.width * CONFIG.houseWidth;
    // Original SVG is about 209 units wide, 39 units tall
    const houseScale = targetWidth / 209;
    const houseHeight = 39 * houseScale;
    
    // Calculate position at bottom center (foundation matches border)
    const houseX = this.width / 2;
    const houseY = this.height - houseHeight / 2 - margin;
    
    // Create the SVG shape with position
    this.houseShape = new SVGShape(FARNSWORTH_PATH, {
      x: houseX,
      y: houseY,
      stroke: CONFIG.colors.black,
      lineWidth: 2,
      color: null, // No fill, just stroke
      scale: houseScale,
      centerPath: true,
      animationProgress: 0, // Start at 0 for drawing animation
    });
  }


  /**
   * Generate a Bauhaus-style composition procedurally
   */
  generateComposition() {
    this.parallaxShapes = [];
    const { colors, layers, margin, houseReserve, maxParallaxOffset } = CONFIG;
    const minDim = Math.min(this.width, this.height);

    // Color palettes for different shape types
    const primaryColors = [colors.red, colors.yellow, colors.blue];
    const allColors = [colors.red, colors.yellow, colors.blue, colors.black];
    const neutralColors = [colors.black, colors.darkCream, colors.cream];

    // Helper functions
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));
    
    // Calculate safe bounds (accounting for margin, house area, and parallax)
    // Shapes go in the "sky" area above the house
    const safeLeft = margin + maxParallaxOffset;
    const safeRight = 1 - margin - maxParallaxOffset;
    const safeTop = margin + maxParallaxOffset;
    const safeBottom = 1 - houseReserve - maxParallaxOffset; // Stop above house
    
    /**
     * Get safe position for a shape given its normalized size
     * @param {number} sizeNorm - Shape size as fraction of minDim
     */
    const getSafePos = (sizeNorm) => {
      const halfSize = sizeNorm * 0.5;
      return {
        x: rand(safeLeft + halfSize, safeRight - halfSize),
        y: rand(safeTop + halfSize, safeBottom - halfSize),
      };
    };

    // Layer configs: [depth, count range, size range]
    // All shapes appear together after house is drawn (1.5s)
    const houseDrawTime = 1.5;
    const layerConfigs = [
      { depth: layers.background, count: [2, 3], sizeRange: [0.2, 0.35], delayBase: houseDrawTime },
      { depth: layers.far, count: [2, 4], sizeRange: [0.1, 0.2], delayBase: houseDrawTime },
      { depth: layers.mid, count: [3, 5], sizeRange: [0.05, 0.12], delayBase: houseDrawTime },
      { depth: layers.near, count: [2, 4], sizeRange: [0.03, 0.08], delayBase: houseDrawTime },
      { depth: layers.front, count: [2, 4], sizeRange: [0.02, 0.05], delayBase: houseDrawTime },
    ];

    for (const layer of layerConfigs) {
      const count = randInt(layer.count[0], layer.count[1]);

      for (let i = 0; i < count; i++) {
        const sizeNorm = rand(layer.sizeRange[0], layer.sizeRange[1]);
        const size = sizeNorm * minDim;
        const pos = getSafePos(sizeNorm);
        const delay = layer.delayBase; // All shapes appear together
        const rotation = pick([0, Math.PI / 4, Math.PI / 2, -Math.PI / 4]) + rand(-0.1, 0.1);

        // Pick shape type
        const shapeType = randInt(0, 7);
        let shape;

        // Background prefers neutrals, front prefers primary colors
        const color = layer.depth < 0.2
          ? pick(neutralColors)
          : pick(layer.depth > 0.7 ? allColors : primaryColors);
          
        // Subtle animation params (more for front layers)
        const rotationSpeed = layer.depth > 0.5 && Math.random() < 0.3 ? rand(-0.1, 0.1) : 0;
        const breatheSpeed = layer.depth > 0.3 && Math.random() < 0.4 ? rand(0.5, 1.5) : 0;
        const breatheAmount = breatheSpeed > 0 ? rand(0.02, 0.05) : 0;

        switch (shapeType) {
          case 0: // Circle
            shape = new Circle(size * 0.5, { color });
            break;

          case 1: // Rectangle
            const isLine = Math.random() < 0.25;
            shape = new Rectangle({
              width: isLine ? size * rand(1.5, 2.5) : size,
              height: isLine ? size * 0.08 : size * rand(0.6, 1.4),
              color,
              rotation,
            });
            break;

          case 2: // Triangle
            shape = new Triangle(size * 0.6, { color, rotation });
            break;

          case 3: // Ring
            shape = new Ring(size * 0.5, size * 0.3, { color });
            break;

          case 4: // PieSlice (semicircle)
            const startAngle = pick([0, Math.PI / 2, Math.PI, Math.PI * 1.5]);
            shape = new PieSlice(size * 0.5, startAngle, startAngle + Math.PI, {
              color,
              rotation,
            });
            break;

          case 5: // Arc (stroke only)
            shape = new Arc(size * 0.5, 0, Math.PI * rand(0.5, 1.5), {
              stroke: pick(primaryColors),
              lineWidth: rand(2, 5),
            });
            break;

          case 6: // Square (rotated 45°)
            shape = new Rectangle({
              width: size * 0.7,
              height: size * 0.7,
              color,
              rotation: Math.PI / 4,
            });
            break;

          default: // Small circle
            shape = new Circle(size * 0.3, { color });
        }

        this.addShapeWithAnimation(shape, pos.x, pos.y, layer.depth, delay, {
          rotationSpeed,
          breatheSpeed,
          breatheAmount,
        });
      }
    }

    // Always add 2-3 prominent lines for Bauhaus feel (constrained to safe area)
    const lineCount = randInt(2, 3);
    for (let i = 0; i < lineCount; i++) {
      const isVertical = Math.random() < 0.5;
      const lineLength = rand(0.25, 0.4);
      const pos = getSafePos(lineLength);
      
      this.addShapeWithAnimation(
        new Rectangle({
          width: isVertical ? minDim * 0.01 : minDim * lineLength,
          height: isVertical ? minDim * lineLength : minDim * 0.01,
          color: colors.black,
        }),
        pos.x,
        pos.y,
        layers.mid,
        rand(0.3, 0.4),
        {}
      );
    }

    // Always add one large primary color shape as anchor
    const anchorColor = pick(primaryColors);
    const anchorType = randInt(0, 2);
    const anchorSizeNorm = rand(0.12, 0.18);
    const anchorSize = minDim * anchorSizeNorm;
    const anchorPos = getSafePos(anchorSizeNorm);
    let anchorShape;

    if (anchorType === 0) {
      anchorShape = new Circle(anchorSize, { color: anchorColor });
    } else if (anchorType === 1) {
      anchorShape = new Rectangle({
        width: anchorSize * 1.1,
        height: anchorSize * rand(0.9, 1.3),
        color: anchorColor,
      });
    } else {
      anchorShape = new Triangle(anchorSize, { color: anchorColor });
    }

    this.addShapeWithAnimation(anchorShape, anchorPos.x, anchorPos.y, layers.far, 0.15, {
      breatheSpeed: 0.8,
      breatheAmount: 0.02,
    });
  }
  
  /**
   * Add a shape with parallax and optional animation
   */
  addShapeWithAnimation(shape, x, y, depth, delay, animOptions = {}) {
    const parallaxShape = new ParallaxShape(this, shape, {
      baseX: x,
      baseY: y,
      depth: depth,
      delay: delay,
      rotationSpeed: animOptions.rotationSpeed || 0,
      breatheSpeed: animOptions.breatheSpeed || 0,
      breatheAmount: animOptions.breatheAmount || 0,
    });

    this.parallaxShapes.push(parallaxShape);
    this.scene.add(parallaxShape);
  }

  /**
   * Start entrance animations for all shapes
   */
  startEntranceAnimations() {
    for (const ps of this.parallaxShapes) {
      ps.animateEntrance();
    }
  }

  /**
   * Animate the text elements and house
   */
  animateText() {
    // Reset text state
    this.textSlideY = 30;
    this.textOpacity = 0;
    this.dateSlideY = 20;
    this.dateOpacity = 0;
    this.houseProgress = 0;

    // Animate house drawing - path traces itself
    Tweenetik.to(
      this,
      { houseProgress: 1 },
      1.5, // 1.5 seconds to draw the house
      Easing.easeInOutQuad
    );

    // Animate "BAUHAUS" text - slide up and fade in (after shapes start appearing)
    Tweenetik.to(
      this,
      { textSlideY: 0, textOpacity: 1 },
      0.8,
      Easing.easeOutCubic,
      { delay: 2.0 }
    );

    // Animate date - slide up and fade in
    Tweenetik.to(
      this,
      { dateSlideY: 0, dateOpacity: 1 },
      0.6,
      Easing.easeOutCubic,
      { delay: 2.3 }
    );
  }

  /**
   * Regenerate composition with completely new shapes
   */
  regenerate() {
    // Kill existing tweens
    Tweenetik.killAll();

    // Recreate house shape
    this.createHouseShape();

    // Clear scene and regenerate
    this.scene.clear();
    this.generateComposition();
    this.startEntranceAnimations();
    this.animateText();
  }

  update(dt) {
    super.update(dt);

    // Smooth mouse tracking
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

    // Calculate normalized mouse offset from center (-1 to 1)
    this.mouseOffsetX = (this.mouseX - this.width / 2) / (this.width / 2);
    this.mouseOffsetY = (this.mouseY - this.height / 2) / (this.height / 2);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear with background (super.render() handles pipeline)
    super.render();

    // Draw Farnsworth House
    this.renderFarnsworthHouse(ctx, w, h);

    // Draw poster border ON TOP of shapes
    const margin = Math.min(w, h) * CONFIG.margin;
    ctx.strokeStyle = CONFIG.colors.black;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

    // Draw "BAUHAUS" text at bottom
    this.renderBauhausText(ctx, w, h);
  }

  /**
   * Render the Farnsworth House SVG
   */
  renderFarnsworthHouse(ctx, w, h) {
    if (!this.houseShape || this.houseProgress <= 0) return;

    // Update animation progress
    this.houseShape.setAnimationProgress(this.houseProgress);
    
    // Draw the house path (SVGShape handles its own positioning)
    this.houseShape.render();
  }

  renderBauhausText(ctx, w, h) {
    const { colors } = CONFIG;
    const baseTextY = h * 0.95;
    const letterSize = Math.min(w, h) * 0.022;
    const centerX = w * 0.5;

    // Draw "BAUHAUS" main title with slide animation
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;

      const textY = baseTextY + this.textSlideY;
      ctx.fillStyle = colors.black;
      ctx.font = `bold ${letterSize * 2.2}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BAUHAUS', centerX, textY);
      ctx.restore();
    }

    // Draw date with slide animation
    if (this.dateOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.dateOpacity * 0.6;

      const dateY = baseTextY + letterSize * 1.6 + this.dateSlideY;
      ctx.fillStyle = colors.black;
      ctx.font = `300 ${letterSize * 0.65}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1919 — 1933', centerX, dateY);
      ctx.restore();
    }
  }

  onResize() {
    this.targetMouseX = this.width / 2;
    this.targetMouseY = this.height / 2;
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;

    // Recreate house shape with new dimensions
    this.createHouseShape();

    // Clear and regenerate
    Tweenetik.killAll();
    this.scene.clear();
    this.generateComposition();
    this.startEntranceAnimations();
    this.animateText();
  }

  destroy() {
    Tweenetik.killAll();
    this.houseShape = null;
    super.destroy?.();
  }
}

/**
 * Create Day 21 visualization
 */
export default function day21(canvas) {
  const game = new BauhausPosterDemo(canvas);
  game.start();

  return {
    stop: () => {
      Tweenetik.killAll();
      game.stop();
    },
    game,
  };
}
