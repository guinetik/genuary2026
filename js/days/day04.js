/**
 * Genuary 2026 - Day 4
 * Prompt: "Lowres"
 *
 * STREET ART WALL
 * An infinite scrolling street scene with pixelated pattern murals.
 * Everything scrolls: wall patterns, lamp posts, sidewalk slabs.
 * Camera returns to default after mouse release.
 */

import { Game, Camera3D, Patterns, Painter, Fractals, SpriteSheet } from '@guinetik/gcanvas';

const CONFIG = {
  // Camera
  perspective: 600,        // Medium perspective
  defaultTiltX: 0.095,      // Positive = look DOWN at ground to see sidewalk
  defaultTiltY: 0,

  // Wall geometry - wall stops before top, leaving sky visible
  wallHeight: 320,         // Short wall - lamp posts rise above it
  wallY: 250,              // Match sidewalkY so wall meets ground
  wallZ: 350,
  wallExtent: 5000,        // Half-width of wall/street (scales for 4K)

  // Building facade details
  buildingExtraHeightMin: 40,
  buildingExtraHeightMax: 160,
  buildingDepth: 16,
  buildingBaseColors: ['#121212', '#161616', '#1b1b1b'],
  buildingTrimColor: '#242424',
  buildingShadowColor: '#0f0f0f',
  buildingEdgeColor: '#2a2a2a',
  buildingCorniceHeight: 16,
  buildingRoofStepMin: 18,
  buildingRoofStepMax: 50,
  buildingRoofInsetMin: 40,
  buildingRoofInsetMax: 120,
  buildingWindowWidth: 46,
  buildingWindowHeight: 30,
  buildingWindowGapX: 26,
  buildingWindowGapY: 24,
  buildingWindowInsetX: 36,
  buildingWindowInsetY: 40,
  buildingWindowLitChance: 0.45,
  buildingWindowDarkColor: 'rgba(8, 8, 8, 0.85)',

  // Sky
  starCount: 80,
  moonSize: 40,

  // Ground level
  sidewalkY: 250,
  curbHeight: 25,
  gutterWidth: 40,

  // Z positions - sidewalk needs LARGE Z range to be visible
  streetNearZ: -100,       // Street extends much closer to camera for 4K
  gutterZ: 120,            // Gutter
  sidewalkZ: 180,          // Sidewalk from 180 to 350 = 170 units (BIG)

  // Pattern sections
  sectionWidth: 500,
  patternScale: 3,
  visibleSections: 16,     // More sections for wider screens

  // Scrolling - tuned to match runner's stride
  scrollSpeed: 140,

  // Lamp posts - spacing between them
  lampSpacing: 1000,
  lampHeight: 450,          // Taller than wall
  lampRange: 2500,          // How far to render lamps

  // Sidewalk slabs
  slabWidth: 150,
  slabDepth: 50,           // Smaller depth for thinner sidewalk
  slabRange: 2500,         // How far to render slabs

  // Runner sprite (120x120 frames, all 50 at 24fps for smooth motion)
  runnerSrc: './spritesheet_small.png',
  runnerFrameWidth: 120,
  runnerFrameHeight: 120,
  runnerColumns: 10,
  runnerRows: 5,
  runnerFrameCount: 50,
  runnerFrameRate: 10,
  runnerScale: 1.1,       // Scaled up from smaller sprite
  runnerBlendMode: 'xor',  // Blend mode: 'source-over', 'multiply', 'screen', 'overlay', 'difference'

  // Colors - MUCH brighter ground for visibility
  wallColor: '#1a1a1a',
  sidewalkColor: '#3a3a3a',    // Visible gray sidewalk
  curbColor: '#555',           // Lighter curb edge
  gutterColor: '#222',         // Dark gutter channel
  streetColor: '#2a2a2a',      // Visible street
  slabLineColor: '#555',       // Visible slab grid
  hue: 135,
};

class StreetArtDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Camera with auto-return
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: CONFIG.defaultTiltX,
      rotationY: CONFIG.defaultTiltY,
      sensitivity: 0.003,
      inertia: false,
      clampX: true,
      minRotationX: 0.0,         // Don't look up past horizon
      maxRotationX: 0.5,         // Allow looking down at ground
    });
    this.camera.enableMouseControl(this.canvas);

    // Track if we need to return camera
    this.cameraReturning = false;
    this._setupCameraReturn();

    // State
    this.time = 0;
    this.scrollOffset = 0;

    // Generate stars (fixed positions)
    this.stars = [];
    for (let i = 0; i < CONFIG.starCount; i++) {
      this.stars.push({
        x: Math.random(),           // 0-1 normalized
        y: Math.random() * 0.3,     // Top 30% of screen
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Procedural section cache (generated on-demand)
    this.sectionCache = new Map();
    this.patternGenerators = this._getPatternGenerators();

    // Load the running girl sprite
    this._loadRunner();
  }

  async _loadRunner() {
    this.runner = new SpriteSheet(this, {
      src: CONFIG.runnerSrc,
      frameWidth: CONFIG.runnerFrameWidth,
      frameHeight: CONFIG.runnerFrameHeight,
      columns: CONFIG.runnerColumns,
      rows: CONFIG.runnerRows,
      frameCount: CONFIG.runnerFrameCount,
      frameRate: CONFIG.runnerFrameRate,
      loop: true,
      autoPlay: true,
      smoothing: false,  // Pixel art - no smoothing
    });

    await this.runner.load();
  }

  // Seeded random for deterministic procedural generation
  _seededRandom(seed) {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Return a deterministic building spec for a wall section.
   * @param {number} sectionIndex
   * @returns {{height: number, baseColor: string, roofStepHeight: number, roofInset: number, windowSeed: number}}
   */
  _getBuildingSpec(sectionIndex) {
    const seed = sectionIndex * 91.73;
    const extra = CONFIG.buildingExtraHeightMin +
      Math.floor(this._seededRandom(seed) * (CONFIG.buildingExtraHeightMax - CONFIG.buildingExtraHeightMin));
    const colorIndex = Math.floor(this._seededRandom(seed * 1.1) * CONFIG.buildingBaseColors.length);
    const roofStepHeight = this._seededRandom(seed * 1.2) > 0.55
      ? CONFIG.buildingRoofStepMin +
        Math.floor(this._seededRandom(seed * 1.3) * (CONFIG.buildingRoofStepMax - CONFIG.buildingRoofStepMin))
      : 0;
    const roofInset = CONFIG.buildingRoofInsetMin +
      Math.floor(this._seededRandom(seed * 1.4) * (CONFIG.buildingRoofInsetMax - CONFIG.buildingRoofInsetMin));

    return {
      height: CONFIG.wallHeight + extra,
      baseColor: CONFIG.buildingBaseColors[colorIndex],
      roofStepHeight,
      roofInset,
      windowSeed: seed * 3.33,
    };
  }

  /**
   * Draw a filled quad from projected corners.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx
   * @param {number} cy
   * @param {{x: number, y: number}} tl
   * @param {{x: number, y: number}} tr
   * @param {{x: number, y: number}} br
   * @param {{x: number, y: number}} bl
   * @param {string} color
   */
  _drawQuad(ctx, cx, cy, tl, tr, br, bl, color) {
    const points = this._orderScreenQuad([
      { x: cx + tl.x, y: cy + tl.y },
      { x: cx + tr.x, y: cy + tr.y },
      { x: cx + br.x, y: cy + br.y },
      { x: cx + bl.x, y: cy + bl.y },
    ]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Order screen-space quad points to avoid self-intersection.
   * @param {{x: number, y: number}[]} points
   * @returns {{x: number, y: number}[]}
   */
  _orderScreenQuad(points) {
    const center = points.reduce((acc, p) => {
      acc.x += p.x;
      acc.y += p.y;
      return acc;
    }, { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;
    return points
      .slice()
      .sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) -
        Math.atan2(b.y - center.y, b.x - center.x));
  }

  /**
   * Fill a quad using screen-space points.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}[]} points
   * @param {string} color
   */
  _fillScreenQuad(ctx, points, color) {
    const ordered = this._orderScreenQuad(points);
    ctx.beginPath();
    ctx.moveTo(ordered[0].x, ordered[0].y);
    ctx.lineTo(ordered[1].x, ordered[1].y);
    ctx.lineTo(ordered[2].x, ordered[2].y);
    ctx.lineTo(ordered[3].x, ordered[3].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Render facade trims and windows for a building section.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx
   * @param {number} cy
   * @param {number} sectionIndex
   * @param {number} worldLeft
   * @param {number} worldRight
   * @param {number} buildingTop
   * @param {number} buildingBottom
   * @param {number} facadeZ
   */
  _renderBuildingDetails(ctx, cx, cy, sectionIndex, worldLeft, worldRight, buildingTop, buildingBottom, facadeZ) {
    const spec = this._getBuildingSpec(sectionIndex);
    const corniceBottom = buildingTop + CONFIG.buildingCorniceHeight;
    const corniceTL = this.camera.project(worldLeft, buildingTop, facadeZ);
    const corniceTR = this.camera.project(worldRight, buildingTop, facadeZ);
    const corniceBR = this.camera.project(worldRight, corniceBottom, facadeZ);
    const corniceBL = this.camera.project(worldLeft, corniceBottom, facadeZ);
    this._drawQuad(ctx, cx, cy, corniceTL, corniceTR, corniceBR, corniceBL, CONFIG.buildingTrimColor);

    if (spec.roofStepHeight > 0) {
      const stepLeft = worldLeft + spec.roofInset;
      const stepRight = worldRight - spec.roofInset;
      const stepTop = buildingTop - spec.roofStepHeight;
      const stepBottom = buildingTop;
      const stepTL = this.camera.project(stepLeft, stepTop, facadeZ);
      const stepTR = this.camera.project(stepRight, stepTop, facadeZ);
      const stepBR = this.camera.project(stepRight, stepBottom, facadeZ);
      const stepBL = this.camera.project(stepLeft, stepBottom, facadeZ);
      this._drawQuad(ctx, cx, cy, stepTL, stepTR, stepBR, stepBL, CONFIG.buildingTrimColor);
    }

    const edgeTop = this.camera.project(worldLeft, buildingTop, facadeZ);
    const edgeBottom = this.camera.project(worldLeft, buildingBottom, facadeZ);
    const edgeRightTop = this.camera.project(worldRight, buildingTop, facadeZ);
    const edgeRightBottom = this.camera.project(worldRight, buildingBottom, facadeZ);
    const edgeWidth = Math.max(1, 2 * ((edgeTop.scale + edgeRightTop.scale) * 0.5));
    ctx.strokeStyle = CONFIG.buildingEdgeColor;
    ctx.lineWidth = edgeWidth;
    ctx.beginPath();
    ctx.moveTo(cx + edgeTop.x, cy + edgeTop.y);
    ctx.lineTo(cx + edgeBottom.x, cy + edgeBottom.y);
    ctx.moveTo(cx + edgeRightTop.x, cy + edgeRightTop.y);
    ctx.lineTo(cx + edgeRightBottom.x, cy + edgeRightBottom.y);
    ctx.stroke();

    const insetX = CONFIG.buildingWindowInsetX;
    const insetY = CONFIG.buildingWindowInsetY + CONFIG.buildingCorniceHeight;
    const availableWidth = (worldRight - worldLeft) - insetX * 2;
    const availableHeight = (buildingBottom - buildingTop) - insetY * 2;
    const windowW = CONFIG.buildingWindowWidth;
    const windowH = CONFIG.buildingWindowHeight;
    const gapX = CONFIG.buildingWindowGapX;
    const gapY = CONFIG.buildingWindowGapY;
    const cols = Math.max(1, Math.floor((availableWidth + gapX) / (windowW + gapX)));
    const rows = Math.max(1, Math.floor((availableHeight + gapY) / (windowH + gapY)));
    const gridWidth = cols * windowW + (cols - 1) * gapX;
    const gridHeight = rows * windowH + (rows - 1) * gapY;
    const startX = worldLeft + insetX + (availableWidth - gridWidth) * 0.5;
    const startY = buildingTop + insetY + (availableHeight - gridHeight) * 0.5;
    const litColor = `hsla(${CONFIG.hue}, 70%, 65%, 0.85)`;

    for (let row = 0; row < rows; row++) {
      const wy1 = startY + row * (windowH + gapY);
      const wy2 = wy1 + windowH;
      for (let col = 0; col < cols; col++) {
        const wx1 = startX + col * (windowW + gapX);
        const wx2 = wx1 + windowW;
        const seed = spec.windowSeed + row * 13.1 + col * 7.7;
        const isLit = this._seededRandom(seed) < CONFIG.buildingWindowLitChance;
        const color = isLit ? litColor : CONFIG.buildingWindowDarkColor;

        const tl = this.camera.project(wx1, wy1, facadeZ);
        const tr = this.camera.project(wx2, wy1, facadeZ);
        const br = this.camera.project(wx2, wy2, facadeZ);
        const bl = this.camera.project(wx1, wy2, facadeZ);
        this._drawQuad(ctx, cx, cy, tl, tr, br, bl, color);
      }
    }
  }

  _getPatternGenerators() {
    // Return functions that generate different pattern types
    return [
      // Checkerboard variants
      (size, fg, bg, seed) => Patterns.checkerboard(size, size, {
        cellSize: 4 + Math.floor(this._seededRandom(seed * 1.1) * 12),
        color1: bg,
        color2: fg,
      }),
      // Grid variants
      (size, fg, bg, seed) => Patterns.solidGrid(size, size, {
        spacing: 4 + Math.floor(this._seededRandom(seed * 1.2) * 10),
        background: bg,
        foreground: fg,
      }),
      // Stripes variants
      (size, fg, bg, seed) => Patterns.stripes(size, size, {
        spacing: 3 + Math.floor(this._seededRandom(seed * 1.3) * 8),
        thickness: 1 + Math.floor(this._seededRandom(seed * 1.4) * 4),
        background: bg,
        foreground: fg,
      }),
      // Mesh variants
      (size, fg, bg, seed) => Patterns.mesh(size, size, {
        spacing: 4 + Math.floor(this._seededRandom(seed * 1.5) * 10),
        lineWidth: 1 + Math.floor(this._seededRandom(seed * 1.6) * 3),
        background: bg,
        foreground: fg,
      }),
      // Dots variants
      (size, fg, bg, seed) => Patterns.dotPattern(size, size, {
        dotSize: 2 + Math.floor(this._seededRandom(seed * 1.7) * 6),
        spacing: 4 + Math.floor(this._seededRandom(seed * 1.8) * 10),
        dotColor: fg,
        background: bg,
      }),
      // Cross variants
      (size, fg, bg, seed) => Patterns.cross(size, size, {
        size: 6 + Math.floor(this._seededRandom(seed * 1.9) * 10),
        thickness: 1 + Math.floor(this._seededRandom(seed * 2.0) * 4),
        spacing: 8 + Math.floor(this._seededRandom(seed * 2.1) * 16),
        background: bg,
        foreground: fg,
      }),
    ];
  }

  _hslToRgba(h, s, l, a = 255) {
    // Convert HSL to RGB
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4)),
      a
    ];
  }

  // Color palettes for variety
  _getColorPalette(seed) {
    const palettes = [
      // Greens (classic)
      { hues: [120, 140, 160], sat: [60, 90], light: [30, 55] },
      // Cyans
      { hues: [170, 190, 200], sat: [70, 100], light: [35, 50] },
      // Magentas/Pinks
      { hues: [300, 320, 340], sat: [60, 85], light: [35, 55] },
      // Blues
      { hues: [200, 220, 240], sat: [65, 95], light: [30, 50] },
      // Oranges/Ambers
      { hues: [20, 35, 50], sat: [80, 100], light: [40, 60] },
      // Purples
      { hues: [260, 280, 300], sat: [55, 85], light: [30, 50] },
      // Teals
      { hues: [160, 175, 190], sat: [70, 95], light: [25, 45] },
      // Lime/Yellow-greens
      { hues: [70, 90, 110], sat: [75, 100], light: [35, 55] },
    ];

    const idx = Math.floor(this._seededRandom(seed) * palettes.length);
    return palettes[idx];
  }

  _pickFromPalette(palette, seed) {
    const hue = palette.hues[Math.floor(this._seededRandom(seed * 1.1) * palette.hues.length)];
    const sat = palette.sat[0] + this._seededRandom(seed * 1.2) * (palette.sat[1] - palette.sat[0]);
    const light = palette.light[0] + this._seededRandom(seed * 1.3) * (palette.light[1] - palette.light[0]);
    return { hue, sat, light };
  }

  async _generateSection(sectionIndex) {
    // Check cache first
    if (this.sectionCache.has(sectionIndex)) {
      return this.sectionCache.get(sectionIndex);
    }

    const seed = sectionIndex * 12345.6789;
    const tileSize = 32;
    const canvasSize = 256;

    // Create collage canvas
    const collage = document.createElement('canvas');
    collage.width = canvasSize;
    collage.height = canvasSize;
    const cctx = collage.getContext('2d');
    cctx.imageSmoothingEnabled = false;

    // Pick a color palette for this section
    const palette = this._getColorPalette(seed * 0.5);

    // Sometimes use contrasting palette for overlays
    const contrastPalette = this._seededRandom(seed * 0.6) > 0.5
      ? this._getColorPalette(seed * 0.7)
      : palette;

    // === BASE LAYER ===
    const baseColor = this._pickFromPalette(palette, seed);
    const baseFg = this._hslToRgba(baseColor.hue, baseColor.sat, baseColor.light);
    const baseBg = this._hslToRgba(baseColor.hue, 20, 8);
    const baseType = Math.floor(this._seededRandom(seed * 1.0) * this.patternGenerators.length);

    const basePattern = this.patternGenerators[baseType](tileSize, baseFg, baseBg, seed);
    const baseBitmap = await Painter.img.createImageBitmapFromPixels(basePattern, tileSize, tileSize);

    for (let y = 0; y < canvasSize; y += tileSize) {
      for (let x = 0; x < canvasSize; x += tileSize) {
        cctx.drawImage(baseBitmap, x, y, tileSize, tileSize);
      }
    }

    // === GRID-BASED OVERLAY (not random positions) ===
    // Divide into a grid of 2x2, 2x3, 3x2, 3x3, or 4x4
    const gridConfigs = [[2, 2], [2, 3], [3, 2], [3, 3], [4, 4], [2, 4], [4, 2]];
    const gridIdx = Math.floor(this._seededRandom(seed * 2.0) * gridConfigs.length);
    const [cols, rows] = gridConfigs[gridIdx];

    const cellW = canvasSize / cols;
    const cellH = canvasSize / rows;

    // Fill some cells (not all - leave gaps for base to show through)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellSeed = seed * (row * 10 + col + 3.0);

        // 60% chance to fill this cell
        if (this._seededRandom(cellSeed) > 0.4) {
          // Pick pattern and color from contrast palette
          const cellColor = this._pickFromPalette(contrastPalette, cellSeed * 2.0);
          const cellFg = this._hslToRgba(cellColor.hue, cellColor.sat, cellColor.light);
          const cellBg = this._hslToRgba(cellColor.hue, 25, 12);
          const cellType = Math.floor(this._seededRandom(cellSeed * 2.1) * this.patternGenerators.length);

          const cellPattern = this.patternGenerators[cellType](tileSize, cellFg, cellBg, cellSeed);
          const cellBitmap = await Painter.img.createImageBitmapFromPixels(cellPattern, tileSize, tileSize);

          // Cell bounds with small margin
          const margin = 2;
          const cx = col * cellW + margin;
          const cy = row * cellH + margin;
          const cw = cellW - margin * 2;
          const ch = cellH - margin * 2;

          // Tile pattern in cell
          for (let y = cy; y < cy + ch; y += tileSize) {
            for (let x = cx; x < cx + cw; x += tileSize) {
              const drawW = Math.min(tileSize, cx + cw - x);
              const drawH = Math.min(tileSize, cy + ch - y);
              cctx.drawImage(cellBitmap, 0, 0, drawW, drawH, x, y, drawW, drawH);
            }
          }
        }
      }
    }

    // === FRACTAL OVERLAYS (50% chance, can have multiple) ===
    const numFractals = this._seededRandom(seed * 4.0) > 0.5
      ? 1 + Math.floor(this._seededRandom(seed * 4.1) * 2)  // 1-2 fractals
      : 0;

    for (let f = 0; f < numFractals; f++) {
      const fracSeed = seed * (f + 5.0);
      const fracType = Math.floor(this._seededRandom(fracSeed * 1.0) * 6);  // More variety
      const fracSize = 48 + Math.floor(this._seededRandom(fracSeed * 1.1) * 80);
      let fracData;

      // More fractal types
      if (fracType === 0) {
        fracData = Fractals.sierpinski(fracSize, fracSize, 5 + Math.floor(this._seededRandom(fracSeed * 1.2) * 3));
      } else if (fracType === 1) {
        fracData = Fractals.sierpinskiCarpet(fracSize, fracSize, 3 + Math.floor(this._seededRandom(fracSeed * 1.3) * 2));
      } else if (fracType === 2) {
        fracData = Fractals.julia(fracSize, fracSize, 30,
          -0.8 + this._seededRandom(fracSeed * 1.4) * 0.6,
          0.1 + this._seededRandom(fracSeed * 1.5) * 0.4
        );
      } else if (fracType === 3) {
        fracData = Fractals.mandelbrot(fracSize, fracSize, 40,
          -2.2 + this._seededRandom(fracSeed * 1.6) * 0.5,
          -1.5 + this._seededRandom(fracSeed * 1.7) * 0.5,
          -1 + this._seededRandom(fracSeed * 1.8) * 0.5,
          1 + this._seededRandom(fracSeed * 1.9) * 0.5
        );
      } else if (fracType === 4) {
        fracData = Fractals.newton(fracSize, fracSize, 30);
      } else {
        fracData = Fractals.koch(fracSize, fracSize, 4);
      }

      // Convert to RGBA with palette color
      const fracColor = this._pickFromPalette(palette, fracSeed * 2.0);
      const fracRgba = new Uint8ClampedArray(fracSize * fracSize * 4);

      for (let i = 0; i < fracData.length; i++) {
        const val = fracData[i];
        const brightness = 20 + (val / 255) * 50;
        const [r, g, b] = this._hslToRgba(fracColor.hue, fracColor.sat, brightness);
        fracRgba[i * 4] = r;
        fracRgba[i * 4 + 1] = g;
        fracRgba[i * 4 + 2] = b;
        fracRgba[i * 4 + 3] = val > 20 ? 180 : 0;
      }

      const fracBitmap = await Painter.img.createImageBitmapFromPixels(fracRgba, fracSize, fracSize);

      // Position fractal in a grid cell or centered
      const fracX = Math.floor(this._seededRandom(fracSeed * 3.0) * (canvasSize - fracSize));
      const fracY = Math.floor(this._seededRandom(fracSeed * 3.1) * (canvasSize - fracSize));
      const fracScale = 1 + this._seededRandom(fracSeed * 3.2) * 1.5;

      cctx.globalAlpha = 0.6 + this._seededRandom(fracSeed * 3.3) * 0.3;
      cctx.drawImage(fracBitmap, fracX, fracY, fracSize * fracScale, fracSize * fracScale);
      cctx.globalAlpha = 1;
    }

    // Cache as image
    this.sectionCache.set(sectionIndex, collage);
    return collage;
  }

  _setupCameraReturn() {
    // Override mouseup to trigger return
    this.canvas.addEventListener('mouseup', () => {
      this.cameraReturning = true;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.cameraReturning = true;
    });
    this.canvas.addEventListener('mousedown', () => {
      this.cameraReturning = false;
    });
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.scrollOffset += CONFIG.scrollSpeed * dt;

    // Auto-return camera to default position
    if (this.cameraReturning && !this.camera._isDragging) {
      const returnSpeed = 3 * dt;
      this.camera.rotationX += (CONFIG.defaultTiltX - this.camera.rotationX) * returnSpeed;
      this.camera.rotationY += (CONFIG.defaultTiltY - this.camera.rotationY) * returnSpeed;

      // Stop returning when close enough
      if (Math.abs(this.camera.rotationX - CONFIG.defaultTiltX) < 0.001 &&
          Math.abs(this.camera.rotationY - CONFIG.defaultTiltY) < 0.001) {
        this.camera.rotationX = CONFIG.defaultTiltX;
        this.camera.rotationY = CONFIG.defaultTiltY;
        this.cameraReturning = false;
      }
    }

    // Manually clamp horizontal rotation (Camera3D doesn't have clampY)
    const maxRotY = 0.25;
    this.camera.rotationY = Math.max(-maxRotY, Math.min(maxRotY, this.camera.rotationY));

    this.camera.update(dt);

    // Update runner animation
    if (this.runner && this.runner.loaded) {
      this.runner.update(dt);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Draw scene
    this._renderSky(ctx, w, h);
    this._renderSidewalk(ctx, cx, cy, w, h);
    this._renderWall(ctx, cx, cy);
    this._renderPatternSections(ctx, cx, cy);
    this._renderRunner(ctx, cx, cy);
    this._renderLampPosts(ctx, cx, cy);
  }

  _renderSky(ctx, w, h) {
    const pixelSize = 4;  // Chunky pixels for low-res look
    const parallaxX = -this.camera.rotationY * w * 0.5;
    const parallaxY = -this.camera.rotationX * h * 0.3;

    // Stars as chunky squares
    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * 3 + star.twinkle) * 0.5 + 0.5;
      const brightness = Math.floor((0.3 + twinkle * 0.7) * 4) / 4;  // Quantized brightness
      const sx = Math.floor((star.x * w + parallaxX) / pixelSize) * pixelSize;
      const sy = Math.floor((star.y * h + parallaxY) / pixelSize) * pixelSize;
      const starSize = Math.max(pixelSize, Math.floor(star.size / pixelSize) * pixelSize);

      // Limited color palette for stars
      const gray = Math.floor(brightness * 3) * 85;  // 0, 85, 170, 255
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${Math.min(255, gray + 20)})`;
      ctx.fillRect(sx, sy, starSize, starSize);
    }

    // Moon - pixelated with banded glow
    const moonX = Math.floor((w * 0.8 + parallaxX) / pixelSize) * pixelSize;
    const moonY = Math.floor((h * 0.12 + parallaxY) / pixelSize) * pixelSize;
    const moonR = CONFIG.moonSize;

    // Banded moon glow (concentric pixel squares instead of smooth gradient)
    const glowBands = 6;
    for (let band = glowBands; band >= 0; band--) {
      const bandR = moonR + band * pixelSize * 3;
      const alpha = Math.floor((1 - band / glowBands) * 4) / 16;  // Quantized alpha
      ctx.fillStyle = `rgba(150, 180, 220, ${alpha})`;

      // Draw as chunky pixels
      for (let py = moonY - bandR; py < moonY + bandR; py += pixelSize) {
        for (let px = moonX - bandR; px < moonX + bandR; px += pixelSize) {
          const dx = px - moonX;
          const dy = py - moonY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bandR && dist >= bandR - pixelSize * 3) {
            ctx.fillRect(px, py, pixelSize, pixelSize);
          }
        }
      }
    }

    // Moon body - pixelated circle with dithered edge
    const moonColors = ['#e8e8f0', '#d0d0e0', '#b8b8d0'];  // Limited palette
    for (let py = moonY - moonR - pixelSize; py < moonY + moonR + pixelSize; py += pixelSize) {
      for (let px = moonX - moonR - pixelSize; px < moonX + moonR + pixelSize; px += pixelSize) {
        const dx = px - moonX;
        const dy = py - moonY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < moonR) {
          // Dither pattern for moon surface
          const dither = ((px / pixelSize) + (py / pixelSize)) % 3;
          ctx.fillStyle = moonColors[dither];
          ctx.fillRect(px, py, pixelSize, pixelSize);
        } else if (dist < moonR + pixelSize * 2) {
          // Dithered edge (checkerboard fade)
          if (((px / pixelSize) + (py / pixelSize)) % 2 === 0) {
            ctx.fillStyle = moonColors[2];
            ctx.fillRect(px, py, pixelSize, pixelSize);
          }
        }
      }
    }
  }

  _renderWall(ctx, cx, cy) {
    const wallLeft = -CONFIG.wallExtent;
    const wallRight = CONFIG.wallExtent;
    const wallTop = CONFIG.wallY - CONFIG.wallHeight;
    const wallBottom = CONFIG.wallY;
    const wallZ = CONFIG.wallZ;

    const tl = this.camera.project(wallLeft, wallTop, wallZ);
    const tr = this.camera.project(wallRight, wallTop, wallZ);
    const br = this.camera.project(wallRight, wallBottom, wallZ);
    const bl = this.camera.project(wallLeft, wallBottom, wallZ);

    ctx.beginPath();
    ctx.moveTo(cx + tl.x, cy + tl.y);
    ctx.lineTo(cx + tr.x, cy + tr.y);
    ctx.lineTo(cx + br.x, cy + br.y);
    ctx.lineTo(cx + bl.x, cy + bl.y);
    ctx.closePath();
    ctx.fillStyle = CONFIG.wallColor;
    ctx.fill();
  }

  _renderPatternSections(ctx, cx, cy) {
    const sectionWidth = CONFIG.sectionWidth;
    const wallBottom = CONFIG.wallY;
    const facadeZ = CONFIG.wallZ - CONFIG.buildingDepth;

    // Calculate visible sections based on scroll
    const startSection = Math.floor(this.scrollOffset / sectionWidth) - 3;
    const visibleSections = CONFIG.visibleSections;

    for (let i = 0; i < visibleSections; i++) {
      const sectionIndex = startSection + i;

      // World X position (scrolls with scene)
      const worldLeft = sectionIndex * sectionWidth - this.scrollOffset;
      const worldRight = worldLeft + sectionWidth;

      const spec = this._getBuildingSpec(sectionIndex);
      const buildingTop = CONFIG.wallY - spec.height;
      const tl = this.camera.project(worldLeft, buildingTop, facadeZ);
      const tr = this.camera.project(worldRight, buildingTop, facadeZ);
      const br = this.camera.project(worldRight, wallBottom, facadeZ);
      const bl = this.camera.project(worldLeft, wallBottom, facadeZ);

      this._drawQuad(ctx, cx, cy, tl, tr, br, bl, spec.baseColor);

      const shadowTopY = wallBottom - CONFIG.buildingCorniceHeight;
      const shadowTL = this.camera.project(worldLeft, shadowTopY, facadeZ);
      const shadowTR = this.camera.project(worldRight, shadowTopY, facadeZ);
      const shadowBR = this.camera.project(worldRight, wallBottom, facadeZ);
      const shadowBL = this.camera.project(worldLeft, wallBottom, facadeZ);
      this._drawQuad(ctx, cx, cy, shadowTL, shadowTR, shadowBR, shadowBL, CONFIG.buildingShadowColor);

      // Skip if off screen
      const minX = Math.min(tl.x, bl.x);
      const maxX = Math.max(tr.x, br.x);
      if (cx + maxX < -50 || cx + minX > this.width + 50) continue;

      // Get cached collage or trigger generation
      let collage = this.sectionCache.get(sectionIndex);
      if (collage === undefined) {
        // Trigger async generation (will be ready next frame)
        this._generateSection(sectionIndex);
        collage = null;
      }

      // Screen coordinates
      const screenTL = { x: cx + tl.x, y: cy + tl.y };
      const screenTR = { x: cx + tr.x, y: cy + tr.y };
      const screenBR = { x: cx + br.x, y: cy + br.y };
      const screenBL = { x: cx + bl.x, y: cy + bl.y };

      if (collage) {
        // Draw collage image stretched to fit the projected quad
        // Use canvas transform to map rectangle to quadrilateral
        ctx.save();

        // Clip to quad shape
        ctx.beginPath();
        ctx.moveTo(screenTL.x, screenTL.y);
        ctx.lineTo(screenTR.x, screenTR.y);
        ctx.lineTo(screenBR.x, screenBR.y);
        ctx.lineTo(screenBL.x, screenBL.y);
        ctx.closePath();
        ctx.clip();

        // Calculate bounding box of quad
        const minQX = Math.min(screenTL.x, screenTR.x, screenBR.x, screenBL.x);
        const maxQX = Math.max(screenTL.x, screenTR.x, screenBR.x, screenBL.x);
        const minQY = Math.min(screenTL.y, screenTR.y, screenBR.y, screenBL.y);
        const maxQY = Math.max(screenTL.y, screenTR.y, screenBR.y, screenBL.y);

        // Draw stretched to bounding box (clipped to quad)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(collage, minQX, minQY, maxQX - minQX, maxQY - minQY);
        ctx.restore();
      } else {
        // Fallback color while generating
        const seed = sectionIndex * 12345.6789;
        const hue = CONFIG.hue + (this._seededRandom(seed * 2.4) - 0.5) * 40;
        ctx.beginPath();
        ctx.moveTo(screenTL.x, screenTL.y);
        ctx.lineTo(screenTR.x, screenTR.y);
        ctx.lineTo(screenBR.x, screenBR.y);
        ctx.lineTo(screenBL.x, screenBL.y);
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue}, 60%, 20%)`;
        ctx.fill();
      }

      this._renderBuildingDetails(ctx, cx, cy, sectionIndex, worldLeft, worldRight, buildingTop, wallBottom, facadeZ);

      // Black section divider
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(screenTL.x, screenTL.y);
      ctx.lineTo(screenBL.x, screenBL.y);
      ctx.stroke();
    }
  }

  _renderSidewalk(ctx, cx, cy, w, h) {
    const sidewalkY = CONFIG.sidewalkY;
    const streetY = sidewalkY + CONFIG.curbHeight;  // Street is LOWER (higher Y)
    const wallZ = CONFIG.wallZ;
    const sidewalkZ = CONFIG.sidewalkZ;
    const gutterZ = CONFIG.gutterZ;
    const streetNearZ = CONFIG.streetNearZ;
    const extent = CONFIG.wallExtent;

    const wallBaseL = this.camera.project(-extent, sidewalkY, wallZ);
    const wallBaseR = this.camera.project(extent, sidewalkY, wallZ);
    const baseLX = cx + wallBaseL.x;
    const baseRX = cx + wallBaseR.x;
    const baseLY = cy + wallBaseL.y;
    const baseRY = cy + wallBaseR.y;
    const leftIsL = baseLX <= baseRX;
    const topLeftX = leftIsL ? baseLX : baseRX;
    const topLeftY = leftIsL ? baseLY : baseRY;
    const topRightX = leftIsL ? baseRX : baseLX;
    const topRightY = leftIsL ? baseRY : baseLY;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(topRightX, topRightY);
    ctx.lineTo(topLeftX, topLeftY);
    ctx.closePath();
    ctx.clip();

    // === STREET (big dark area, lowest level) ===
    const streetFL = this.camera.project(-extent, streetY, streetNearZ);
    const streetFR = this.camera.project(extent, streetY, streetNearZ);
    const streetBL = this.camera.project(-extent, streetY, gutterZ);
    const streetBR = this.camera.project(extent, streetY, gutterZ);

    ctx.fillStyle = CONFIG.streetColor;
    const streetFrontY = Math.min(cy + streetFL.y, cy + streetFR.y);
    const streetFillY = Math.max(0, Math.min(h, Math.floor(streetFrontY)));
    ctx.fillRect(0, streetFillY, w, h - streetFillY);
    this._fillScreenQuad(ctx, [
      { x: cx + streetFL.x, y: cy + streetFL.y },
      { x: cx + streetFR.x, y: cy + streetFR.y },
      { x: cx + streetBR.x, y: cy + streetBR.y },
      { x: cx + streetBL.x, y: cy + streetBL.y },
    ], CONFIG.streetColor);

    // === GUTTER (narrow dark channel) ===
    const gutterFL = this.camera.project(-extent, streetY, gutterZ);
    const gutterFR = this.camera.project(extent, streetY, gutterZ);
    const gutterBL = this.camera.project(-extent, streetY, sidewalkZ);
    const gutterBR = this.camera.project(extent, streetY, sidewalkZ);

    this._fillScreenQuad(ctx, [
      { x: cx + gutterFL.x, y: cy + gutterFL.y },
      { x: cx + gutterFR.x, y: cy + gutterFR.y },
      { x: cx + gutterBR.x, y: cy + gutterBR.y },
      { x: cx + gutterBL.x, y: cy + gutterBL.y },
    ], CONFIG.gutterColor);

    // === CURB FACE (3D vertical face showing the step) ===
    const curbTopL = this.camera.project(-extent, sidewalkY, sidewalkZ);
    const curbTopR = this.camera.project(extent, sidewalkY, sidewalkZ);
    const curbBotL = this.camera.project(-extent, streetY, sidewalkZ);
    const curbBotR = this.camera.project(extent, streetY, sidewalkZ);

    this._fillScreenQuad(ctx, [
      { x: cx + curbTopL.x, y: cy + curbTopL.y },
      { x: cx + curbTopR.x, y: cy + curbTopR.y },
      { x: cx + curbBotR.x, y: cy + curbBotR.y },
      { x: cx + curbBotL.x, y: cy + curbBotL.y },
    ], '#333');

    // Curb edge highlight
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + curbTopL.x, cy + curbTopL.y);
    ctx.lineTo(cx + curbTopR.x, cy + curbTopR.y);
    ctx.stroke();

    // === SIDEWALK (thin strip against wall, highest level) ===
    const swFL = this.camera.project(-extent, sidewalkY, sidewalkZ);
    const swFR = this.camera.project(extent, sidewalkY, sidewalkZ);
    const swBL = this.camera.project(-extent, sidewalkY, wallZ);
    const swBR = this.camera.project(extent, sidewalkY, wallZ);

    this._fillScreenQuad(ctx, [
      { x: cx + swFL.x, y: cy + swFL.y },
      { x: cx + swFR.x, y: cy + swFR.y },
      { x: cx + swBR.x, y: cy + swBR.y },
      { x: cx + swBL.x, y: cy + swBL.y },
    ], CONFIG.sidewalkColor);

    // === SIDEWALK SLAB GRID (vertical lines only, chunky/stepped for low-res look) ===
    const slabW = CONFIG.slabWidth;
    const gridPixel = 3;  // Chunky grid lines

    // Vertical slab lines (SCROLL with scene) - thick stepped
    ctx.fillStyle = CONFIG.slabLineColor;
    const sidewalkClip = this._orderScreenQuad([
      { x: cx + swFL.x, y: cy + swFL.y },
      { x: cx + swFR.x, y: cy + swFR.y },
      { x: cx + swBR.x, y: cy + swBR.y },
      { x: cx + swBL.x, y: cy + swBL.y },
    ]);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sidewalkClip[0].x, sidewalkClip[0].y);
    ctx.lineTo(sidewalkClip[1].x, sidewalkClip[1].y);
    ctx.lineTo(sidewalkClip[2].x, sidewalkClip[2].y);
    ctx.lineTo(sidewalkClip[3].x, sidewalkClip[3].y);
    ctx.closePath();
    ctx.clip();
    const slabRange = CONFIG.slabRange;
    const startX = Math.floor((this.scrollOffset - slabRange) / slabW) * slabW;
    for (let wx = startX; wx < this.scrollOffset + slabRange; wx += slabW) {
      const worldX = wx - this.scrollOffset;
      const near = this.camera.project(worldX, sidewalkY, sidewalkZ);
      const far = this.camera.project(worldX, sidewalkY, wallZ);

      // Stepped vertical line
      const x1 = Math.floor((cx + near.x) / gridPixel) * gridPixel;
      const y1 = Math.floor((cy + near.y) / gridPixel) * gridPixel;
      const y2 = Math.floor((cy + far.y) / gridPixel) * gridPixel;

      // Draw chunky vertical line
      for (let py = Math.min(y1, y2); py <= Math.max(y1, y2); py += gridPixel) {
        ctx.fillRect(x1, py, gridPixel, gridPixel);
      }
    }
    ctx.restore();
    ctx.restore();
  }

  _renderRunner(ctx, cx, cy) {
    if (!this.runner || !this.runner.loaded) return;

    // Position the runner on the sidewalk (stationary in world, appears to run forward)
    const runnerWorldX = 0;  // Center of screen
    const runnerWorldZ = (CONFIG.sidewalkZ + CONFIG.wallZ) / 2;  // Middle of sidewalk
    const groundY = CONFIG.sidewalkY;

    // Project the runner's feet position
    const proj = this.camera.project(runnerWorldX, groundY, runnerWorldZ);
    const scale = proj.scale * CONFIG.runnerScale;

    // Calculate screen position (feet at projected point)
    const screenX = cx + proj.x;
    const screenY = cy + proj.y;

    // Get the current frame's canvas
    const currentShape = this.runner.currentShape;
    if (!currentShape || !currentShape._bitmap) return;

    const frameCanvas = currentShape._bitmap;
    const drawW = CONFIG.runnerFrameWidth * scale;
    const drawH = CONFIG.runnerFrameHeight * scale;

    // Draw with feet at the projected ground position
    ctx.save();
    ctx.imageSmoothingEnabled = false;  // Keep pixelated

    const x = screenX - drawW / 2;
    const y = screenY - drawH;
    const outlineWidth = 2;

    // White outline - draw offset copies
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'brightness(0) invert(1)';  // Make white

    // Draw in 8 directions for outline
    for (let ox = -outlineWidth; ox <= outlineWidth; ox += outlineWidth) {
      for (let oy = -outlineWidth; oy <= outlineWidth; oy += outlineWidth) {
        if (ox === 0 && oy === 0) continue;
        ctx.drawImage(frameCanvas, x + ox, y + oy, drawW, drawH);
      }
    }

    // Reset filter and draw the actual sprite with blend mode
    ctx.filter = 'none';
    ctx.globalCompositeOperation = CONFIG.runnerBlendMode;
    ctx.drawImage(frameCanvas, x, y, drawW, drawH);

    ctx.restore();
  }

  _renderLampPosts(ctx, cx, cy) {
    const spacing = CONFIG.lampSpacing;
    const groundY = CONFIG.sidewalkY;
    const lampZ = (CONFIG.sidewalkZ + CONFIG.wallZ) / 2;  // Middle of sidewalk
    const lampRange = CONFIG.lampRange;

    // Calculate which lamp posts are visible (wider range)
    const startLamp = Math.floor((this.scrollOffset - lampRange) / spacing);
    const endLamp = Math.ceil((this.scrollOffset + lampRange) / spacing);

    for (let i = startLamp; i <= endLamp; i++) {
      // World X position (scrolls with scene)
      const worldX = i * spacing - this.scrollOffset + 100;

      // Skip if way off screen (use projected coords)
      const testProj = this.camera.project(worldX, groundY, lampZ);
      if (Math.abs(testProj.x) > this.width) continue;

      const base = this.camera.project(worldX, groundY, lampZ);
      const top = this.camera.project(worldX, groundY - CONFIG.lampHeight, lampZ);

      // Pole
      ctx.strokeStyle = '#444';
      ctx.lineWidth = Math.max(2, 5 * base.scale);
      ctx.beginPath();
      ctx.moveTo(cx + base.x, cy + base.y);
      ctx.lineTo(cx + top.x, cy + top.y);
      ctx.stroke();

      // Arm extending toward street (lower Z)
      const armZ = lampZ - 50;
      const armEnd = this.camera.project(worldX, groundY - CONFIG.lampHeight + 20, armZ);
      ctx.lineWidth = Math.max(1, 3 * base.scale);
      ctx.beginPath();
      ctx.moveTo(cx + top.x, cy + top.y);
      ctx.lineTo(cx + armEnd.x, cy + armEnd.y);
      ctx.stroke();

      // Light glow - pixelated banded circles
      const lightPos = this.camera.project(worldX, groundY - CONFIG.lampHeight + 35, armZ);
      const glowSize = 60 * lightPos.scale;
      const pixelSize = 6;
      const lightX = Math.floor((cx + lightPos.x) / pixelSize) * pixelSize;
      const lightY = Math.floor((cy + lightPos.y) / pixelSize) * pixelSize;

      // Draw pixelated glow as concentric bands
      const glowBands = 4;
      for (let band = glowBands; band >= 0; band--) {
        const bandR = (glowSize / glowBands) * (band + 1);
        const alpha = (1 - band / glowBands) * 0.6;
        const lightness = 70 - band * 10;

        ctx.fillStyle = `hsla(${CONFIG.hue}, 100%, ${lightness}%, ${alpha})`;

        // Draw as chunky pixels
        for (let py = lightY - bandR; py < lightY + bandR; py += pixelSize) {
          for (let px = lightX - bandR; px < lightX + bandR; px += pixelSize) {
            const dx = px - lightX;
            const dy = py - lightY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bandR && dist >= bandR - glowSize / glowBands) {
              ctx.fillRect(px, py, pixelSize, pixelSize);
            }
          }
        }
      }

      // Bright center pixel
      ctx.fillStyle = `hsla(${CONFIG.hue}, 100%, 80%, 0.9)`;
      ctx.fillRect(lightX - pixelSize, lightY - pixelSize, pixelSize * 2, pixelSize * 2);

      // Light pool on ground - pixelated rectangle instead of ellipse
      const poolLeft = this.camera.project(worldX - 80, groundY, armZ + 20);
      const poolRight = this.camera.project(worldX + 80, groundY, armZ + 20);
      const poolWidth = Math.abs(poolRight.x - poolLeft.x);
      const poolHeight = Math.max(pixelSize * 2, 30 * lightPos.scale);
      const poolX = Math.floor((cx + lightPos.x - poolWidth / 2) / pixelSize) * pixelSize;
      const poolY = Math.floor((cy + poolLeft.y - poolHeight / 2) / pixelSize) * pixelSize;

      // Draw pixelated pool as dithered rectangle
      ctx.fillStyle = `hsla(${CONFIG.hue}, 70%, 40%, 0.2)`;
      for (let py = poolY; py < poolY + poolHeight; py += pixelSize) {
        for (let px = poolX; px < poolX + poolWidth; px += pixelSize) {
          // Dither pattern - checkerboard fade at edges
          const edgeX = Math.min(px - poolX, poolX + poolWidth - px - pixelSize) / poolWidth;
          const edgeY = Math.min(py - poolY, poolY + poolHeight - py - pixelSize) / poolHeight;
          const edge = Math.min(edgeX, edgeY);

          if (edge > 0.1 || ((px / pixelSize + py / pixelSize) % 2 === 0)) {
            ctx.fillRect(px, py, pixelSize, pixelSize);
          }
        }
      }
    }
  }

  stop() {
    super.stop();
    if (this.camera) {
      this.camera.disableMouseControl();
    }
  }
}

export default function day04(canvas) {
  const game = new StreetArtDemo(canvas);
  game.start();
  return {
    stop: () => game.stop(),
    game
  };
}
