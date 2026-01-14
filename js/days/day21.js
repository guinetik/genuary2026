/**
 * Genuary 2026 - Day 21
 * Prompt: "Bauhaus Poster"
 *
 * BAUHAUS INTERACTIVE POSTER
 * An homage to the German art school's geometric aesthetic (1919-1933).
 * Classic Bauhaus elements: primary colors, geometric shapes, asymmetric composition.
 *
 * Features:
 * - Multi-layer parallax mouse tracking using gcanvas shapes
 * - Classic Bauhaus color palette (red, yellow, blue, black, cream)
 * - Tweenetik animations for smooth entrances
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
  Tweenetik,
  Easing,
} from '@guinetik/gcanvas';

const CONFIG = {
  // Classic Bauhaus palette
  colors: {
    red: '#E53935',
    yellow: '#FFCA28',
    blue: '#1E88E5',
    black: '#1A1A1A',
    cream: '#F5F0E6',
    darkCream: '#E8E0D0',
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

  // Composition
  margin: 0.08,
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

    // Animation scale
    this.scaleX = 1;
    this.scaleY = 1;
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

    // Get mouse offset from game
    const mouseOffsetX = this.game.mouseOffsetX || 0;
    const mouseOffsetY = this.game.mouseOffsetY || 0;

    // Parallax offset based on depth
    const parallaxX = mouseOffsetX * this.depth * 0.08;
    const parallaxY = mouseOffsetY * this.depth * 0.08;

    // Target normalized position
    const targetX = this.baseX + parallaxX;
    const targetY = this.baseY + parallaxY;

    // Smooth interpolation
    this.normX += (targetX - this.normX) * CONFIG.parallaxSmoothing;
    this.normY += (targetY - this.normY) * CONFIG.parallaxSmoothing;

    // Convert to actual canvas coordinates
    this.x = this.normX * this.game.width;
    this.y = this.normY * this.game.height;
  }

  /**
   * Draw the shape
   */
  draw() {
    super.draw();

    // Apply position and scale to shape
    this.shape.x = this.x;
    this.shape.y = this.y;
    this.shape.scaleX = this.scaleX;
    this.shape.scaleY = this.scaleY;

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

    // Generate composition
    this.generateComposition();

    // Start entrance animations
    this.startEntranceAnimations();

    // Animate text after shapes
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
   * Add a shape with parallax wrapper to the scene
   */
  addShape(shape, x, y, depth, delay) {
    const parallaxShape = new ParallaxShape(this, shape, {
      baseX: x,
      baseY: y,
      depth: depth,
      delay: delay,
    });

    this.parallaxShapes.push(parallaxShape);
    this.scene.add(parallaxShape);
  }

  /**
   * Generate a Bauhaus-style composition procedurally
   */
  generateComposition() {
    this.parallaxShapes = [];
    const { colors, layers } = CONFIG;
    const minDim = Math.min(this.width, this.height);

    // Color palettes for different shape types
    const primaryColors = [colors.red, colors.yellow, colors.blue];
    const allColors = [colors.red, colors.yellow, colors.blue, colors.black];
    const neutralColors = [colors.black, colors.darkCream, colors.cream];

    // Helper functions
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));

    // Layer configs: [depth, count range, size range]
    const layerConfigs = [
      { depth: layers.background, count: [2, 4], sizeRange: [0.25, 0.5], delayBase: 0 },
      { depth: layers.far, count: [3, 5], sizeRange: [0.12, 0.25], delayBase: 0.1 },
      { depth: layers.mid, count: [4, 7], sizeRange: [0.06, 0.15], delayBase: 0.25 },
      { depth: layers.near, count: [3, 6], sizeRange: [0.04, 0.12], delayBase: 0.4 },
      { depth: layers.front, count: [3, 5], sizeRange: [0.02, 0.08], delayBase: 0.5 },
    ];

    let shapeIndex = 0;

    for (const layer of layerConfigs) {
      const count = randInt(layer.count[0], layer.count[1]);

      for (let i = 0; i < count; i++) {
        const size = rand(layer.sizeRange[0], layer.sizeRange[1]) * minDim;
        const x = rand(0.1, 0.9);
        const y = rand(0.1, 0.85);
        const delay = layer.delayBase + rand(0, 0.15);
        const rotation = pick([0, Math.PI / 4, Math.PI / 2, -Math.PI / 4]) + rand(-0.2, 0.2);

        // Pick shape type based on layer
        const shapeType = randInt(0, 7);
        let shape;

        // Background prefers rectangles, front prefers small shapes
        const color = layer.depth < 0.2
          ? pick(neutralColors)
          : pick(layer.depth > 0.7 ? allColors : primaryColors);

        switch (shapeType) {
          case 0: // Circle
            shape = new Circle(size * 0.5, { color });
            break;

          case 1: // Rectangle
            const isLine = Math.random() < 0.3;
            shape = new Rectangle({
              width: isLine ? size * rand(2, 4) : size,
              height: isLine ? size * 0.08 : size * rand(0.6, 1.5),
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
              lineWidth: rand(2, 6),
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

        this.addShape(shape, x, y, layer.depth, delay);
        shapeIndex++;
      }
    }

    // Always add 2-3 prominent lines for Bauhaus feel
    const lineCount = randInt(2, 3);
    for (let i = 0; i < lineCount; i++) {
      const isVertical = Math.random() < 0.5;
      this.addShape(
        new Rectangle({
          width: isVertical ? minDim * 0.012 : minDim * rand(0.4, 0.7),
          height: isVertical ? minDim * rand(0.4, 0.7) : minDim * 0.012,
          color: colors.black,
        }),
        rand(0.2, 0.8),
        rand(0.2, 0.7),
        layers.mid,
        rand(0.3, 0.4)
      );
    }

    // Always add one large primary color shape as anchor
    const anchorColor = pick(primaryColors);
    const anchorType = randInt(0, 2);
    const anchorSize = minDim * rand(0.15, 0.22);
    let anchorShape;

    if (anchorType === 0) {
      anchorShape = new Circle(anchorSize, { color: anchorColor });
    } else if (anchorType === 1) {
      anchorShape = new Rectangle({
        width: anchorSize * 1.2,
        height: anchorSize * rand(1, 1.5),
        color: anchorColor,
      });
    } else {
      anchorShape = new Triangle(anchorSize, { color: anchorColor });
    }

    this.addShape(anchorShape, rand(0.25, 0.75), rand(0.3, 0.6), layers.far, 0.15);
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
   * Animate the text elements
   */
  animateText() {
    // Reset text state
    this.textSlideY = 30;
    this.textOpacity = 0;
    this.dateSlideY = 20;
    this.dateOpacity = 0;

    // Animate "BAUHAUS" text - slide up and fade in
    Tweenetik.to(
      this,
      { textSlideY: 0, textOpacity: 1 },
      0.8,
      Easing.easeOutCubic,
      { delay: 0.6 }
    );

    // Animate date - slide up and fade in
    Tweenetik.to(
      this,
      { dateSlideY: 0, dateOpacity: 1 },
      0.6,
      Easing.easeOutCubic,
      { delay: 0.9 }
    );
  }

  /**
   * Regenerate composition with completely new shapes
   */
  regenerate() {
    // Kill existing tweens
    Tweenetik.killAll();

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

    // Draw poster border ON TOP of shapes
    const margin = Math.min(w, h) * CONFIG.margin;
    ctx.strokeStyle = CONFIG.colors.black;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

    // Draw "BAUHAUS" text at bottom
    this.renderBauhausText(ctx, w, h);
  }

  renderBauhausText(ctx, w, h) {
    const { colors } = CONFIG;
    const baseTextY = h * 0.96; // Moved down for more space above
    const letterSize = Math.min(w, h) * 0.025;
    const spacing = letterSize * 1.8;
    const centerX = w * 0.5;

    // Draw "BAUHAUS" with slide animation
    if (this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;

      const textY = baseTextY + this.textSlideY;
      ctx.fillStyle = colors.black;
      ctx.font = `bold ${letterSize * 1.5}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const letters = 'BAUHAUS';
      const startX = centerX - spacing * 3.5;
      for (let i = 0; i < letters.length; i++) {
        ctx.fillText(letters[i], startX + i * spacing, textY);
      }
      ctx.restore();
    }

    // Draw date with slide animation
    if (this.dateOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.dateOpacity;

      const dateY = baseTextY + letterSize * 0.9 + this.dateSlideY;
      ctx.fillStyle = colors.black;
      ctx.font = `${letterSize * 0.7}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1919-1933', centerX, dateY);
      ctx.restore();
    }
  }

  onResize() {
    this.targetMouseX = this.width / 2;
    this.targetMouseY = this.height / 2;
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;

    // Clear and regenerate
    Tweenetik.killAll();
    this.scene.clear();
    this.generateComposition();
    this.startEntranceAnimations();
    this.animateText();
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
