/**
 * Day 13: Self Portrait
 * Prompt: "Self portrait"
 *
 * Pixel Teleporter - Upload an image and watch as its pixels
 * fly across the screen to recreate the hidden avatar portrait.
 * Each pixel finds its best color match and animates from source to target.
 *
 * Controls:
 * - Drag & drop an image onto the left box
 * - Click "Transform" to teleport pixels
 */

import {
  Game,
  Scene,
  ImageGo,
  Painter,
  Button,
  Motion,
  Easing,
} from '@guinetik/gcanvas';

const CONFIG = {
  background: '#000',
  borderColor: '#0f0',
  borderWidth: 3,
  boxPadding: 20,
  boxGap: 40,

  // UI
  buttonWidth: 220,
  buttonHeight: 50,
  buttonY: 50,

  // Processing
  maxImageSize: 800,

  // Pixel animation
  pixelSampleStep: 4,       // Sample every Nth pixel (lower = more particles)
  pixelSize: 4,             // Size of flying pixels
  flightDuration: 0.4,      // Base flight time in seconds
  flightStagger: 0.0003,    // Delay between each pixel starting
  trailAlpha: 0.15,         // Motion blur trail

  // Color matching
  colorPreservation: 0.7,   // 0 = exact match, 1 = full source color variety
  processResolution: 128,   // Downsample source to this max dimension for processing

  // Layering
  layerOpacity: 0.6,        // Opacity for subsequent layers (first is always 1.0)
};

/**
 * ImageBox - A visual container with border
 */
class ImageBox extends Scene {
  constructor(game, options = {}) {
    super(game, {
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.size ?? 200,
      height: options.size ?? 200,
    });

    this.visible = true;
    this.active = true;
    this.boxSize = options.size ?? 200;
    this.labelText = options.label ?? '';
    this.image = null;
  }

  setImage(imageData, width, height) {
    if (this.image) {
      this.remove(this.image);
    }

    this.image = new ImageGo(this.game, imageData, {
      x: this.x,
      y: this.y,
      width: width,
      height: height,
      anchor: 'center',
    });

    this.add(this.image);
    this.labelText = '';
  }

  clearImage() {
    if (this.image) {
      this.remove(this.image);
      this.image = null;
    }
  }

  render() {
    if (!this.visible) return;

    const ctx = this.game.ctx;
    ctx.save();

    // Draw border
    ctx.strokeStyle = CONFIG.borderColor;
    ctx.lineWidth = CONFIG.borderWidth;
    ctx.strokeRect(
      this.x - this.boxSize / 2,
      this.y - this.boxSize / 2,
      this.boxSize,
      this.boxSize
    );

    // Draw label if no image
    if (this.labelText) {
      ctx.fillStyle = CONFIG.borderColor;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.labelText, this.x, this.y);
    }

    ctx.restore();

    // Render image if present
    if (this.image && this.image.visible !== false) {
      this.image.render();
    }
  }

  setImageVisible(visible) {
    if (this.image) {
      this.image.visible = visible;
    }
  }
}

/**
 * Flying Pixel - represents a pixel traveling from source to target
 */
class FlyingPixel {
  constructor(sx, sy, tx, ty, color, delay, sourcePixelInfo, layerOpacity = 1.0) {
    this.sx = sx;  // Source x
    this.sy = sy;  // Source y
    this.tx = tx;  // Target x
    this.ty = ty;  // Target y
    this.x = sx;
    this.y = sy;
    this.color = color;
    this.delay = delay;
    this.time = 0;
    this.arrived = false;
    this.spawned = false;  // Track if pixel has left source
    this.layerOpacity = layerOpacity;  // Max opacity for this layer
    this.alpha = layerOpacity;
    this.sourcePixelInfo = sourcePixelInfo;  // { x, y } in display coords
    // Store RGB for rasterization
    this.r = 0; this.g = 0; this.b = 0;
    this._parseColor(color);
  }

  _parseColor(color) {
    const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (match) {
      this.r = parseInt(match[1]);
      this.g = parseInt(match[2]);
      this.b = parseInt(match[3]);
    }
  }

  update(dt) {
    if (this.arrived) return;

    this.time += dt;

    if (this.time < this.delay) return;

    // Mark as spawned when delay passes
    if (!this.spawned) {
      this.spawned = true;
    }

    const flightTime = this.time - this.delay;
    const progress = Math.min(flightTime / CONFIG.flightDuration, 1);

    // Use easeOutExpo for smooth deceleration
    const eased = Easing.easeOutExpo(progress);

    this.x = this.sx + (this.tx - this.sx) * eased;
    this.y = this.sy + (this.ty - this.sy) * eased;

    // Fade in as it flies (respect layer opacity as max)
    this.alpha = Math.min(this.layerOpacity, progress * 2 * this.layerOpacity);

    if (progress >= 1) {
      this.arrived = true;
      this.x = this.tx;
      this.y = this.ty;
    }
  }

  render(ctx) {
    if (this.time < this.delay) return;

    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - CONFIG.pixelSize / 2,
      this.y - CONFIG.pixelSize / 2,
      CONFIG.pixelSize,
      CONFIG.pixelSize
    );
  }
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Create Web Worker for color matching (inline worker via Blob)
 */
function createMatchingWorker() {
  const workerCode = `
    // Perceptual luminance
    function getLuminance(r, g, b) {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Build luminance-based color map
    function buildColorMap(sourceData, width, height) {
      const map = new Map();
      const bucketSize = 8;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = sourceData[i];
          const g = sourceData[i + 1];
          const b = sourceData[i + 2];
          const a = sourceData[i + 3];

          if (a < 10) continue;

          const lum = getLuminance(r, g, b);
          const lumBucket = Math.floor(lum / bucketSize);

          const lumKey = 'L' + lumBucket;
          if (!map.has(lumKey)) {
            map.set(lumKey, []);
          }
          map.get(lumKey).push({ r, g, b, x, y, lum });
        }
      }
      return map;
    }

    // Find matching pixel with color preservation
    // colorPreservation: 0 = exact match, 1 = random from luminance bracket
    function findBestMatch(targetR, targetG, targetB, colorMap, sourceData, sourceWidth, sourceHeight, colorPreservation) {
      const targetLum = getLuminance(targetR, targetG, targetB);
      const lumBucketSize = 8;
      const lumBucket = Math.floor(targetLum / lumBucketSize);

      // Collect all candidates within luminance range
      const goodCandidates = [];
      const lumTolerance = 15;  // Accept pixels within this luminance difference

      for (let dl = -2; dl <= 2; dl++) {
        const lumKey = 'L' + (lumBucket + dl);
        const candidates = colorMap.get(lumKey);

        if (!candidates) continue;

        for (const candidate of candidates) {
          const lumDiff = Math.abs(targetLum - candidate.lum);
          if (lumDiff <= lumTolerance) {
            // Score for sorting (lower = better match)
            const colorDiff = Math.sqrt(
              (targetR - candidate.r) ** 2 +
              (targetG - candidate.g) ** 2 +
              (targetB - candidate.b) ** 2
            );
            goodCandidates.push({ ...candidate, score: lumDiff * 2 + colorDiff });
          }
        }
      }

      if (goodCandidates.length === 0) {
        // Fallback: random pixel from source
        const x = Math.floor(Math.random() * sourceWidth);
        const y = Math.floor(Math.random() * sourceHeight);
        const i = (y * sourceWidth + x) * 4;
        return {
          r: sourceData[i], g: sourceData[i + 1], b: sourceData[i + 2],
          x, y,
          lum: getLuminance(sourceData[i], sourceData[i + 1], sourceData[i + 2])
        };
      }

      // Sort by score (best matches first)
      goodCandidates.sort((a, b) => a.score - b.score);

      // Color preservation determines how deep into the candidate pool we pick
      // 0 = always best, 1 = random from all good matches
      const poolSize = Math.max(1, Math.floor(goodCandidates.length * colorPreservation));
      const randomIndex = Math.floor(Math.random() * poolSize);

      return goodCandidates[randomIndex];
    }

    // Main message handler
    self.onmessage = function(e) {
      const { avatarData, avatarWidth, avatarHeight, sourceData, sourceWidth, sourceHeight, step, displayWidth, displayHeight, colorPreservation } = e.data;

      // Build color map
      self.postMessage({ type: 'progress', stage: 'Building color map...', percent: 0 });
      const colorMap = buildColorMap(sourceData, sourceWidth, sourceHeight);

      // Process avatar pixels
      const pixelData = [];
      let totalPixels = 0;

      // Count total first
      for (let ty = 0; ty < avatarHeight; ty += step) {
        for (let tx = 0; tx < avatarWidth; tx += step) {
          const idx = (ty * avatarWidth + tx) * 4;
          if (avatarData[idx + 3] >= 10) totalPixels++;
        }
      }

      let processed = 0;
      let lastProgress = 0;

      for (let ty = 0; ty < avatarHeight; ty += step) {
        for (let tx = 0; tx < avatarWidth; tx += step) {
          const idx = (ty * avatarWidth + tx) * 4;
          const r = avatarData[idx];
          const g = avatarData[idx + 1];
          const b = avatarData[idx + 2];
          const a = avatarData[idx + 3];

          if (a < 10) continue;

          const match = findBestMatch(r, g, b, colorMap, sourceData, sourceWidth, sourceHeight, colorPreservation);

          const sourceX = (match.x / sourceWidth) * displayWidth;
          const sourceY = (match.y / sourceHeight) * displayHeight;

          pixelData.push({
            sourceX, sourceY,
            targetX: tx, targetY: ty,
            r: match.r, g: match.g, b: match.b,
            displaySourceX: Math.floor(sourceX),
            displaySourceY: Math.floor(sourceY),
          });

          processed++;
          const progress = Math.floor((processed / totalPixels) * 100);
          if (progress > lastProgress) {
            lastProgress = progress;
            self.postMessage({ type: 'progress', stage: 'Matching pixels...', percent: progress });
          }
        }
      }

      // Shuffle
      for (let i = pixelData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pixelData[i], pixelData[j]] = [pixelData[j], pixelData[i]];
      }

      self.postMessage({ type: 'complete', pixelData });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

/**
 * Pixel Teleporter Demo
 */
class Day13Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Calculate box dimensions
    const availableWidth = this.width - CONFIG.boxPadding * 2;
    const totalBoxWidth = Math.min(
      availableWidth - CONFIG.boxGap,
      (this.height - CONFIG.boxPadding * 2 - CONFIG.buttonHeight - CONFIG.buttonY) * 2 - CONFIG.boxGap
    );
    const boxSize = Math.floor((totalBoxWidth - CONFIG.boxGap) / 2);
    this.boxSize = boxSize;

    // Calculate center positions for each box
    const totalWidth = boxSize * 2 + CONFIG.boxGap;
    const startX = (this.width - totalWidth) / 2;
    const leftBoxX = startX + boxSize / 2;
    const rightBoxX = startX + boxSize + CONFIG.boxGap + boxSize / 2;
    const boxCenterY = this.height / 2;

    this.leftBoxX = leftBoxX;
    this.rightBoxX = rightBoxX;
    this.boxCenterY = boxCenterY;

    // Create left ImageBox (for uploaded image)
    this.leftBox = new ImageBox(this, {
      x: leftBoxX,
      y: boxCenterY,
      size: boxSize,
      label: 'Drop Image Here',
    });
    this.pipeline.add(this.leftBox);

    // Create right ImageBox (hidden avatar - face reveal)
    this.rightBox = new ImageBox(this, {
      x: rightBoxX,
      y: boxCenterY,
      size: boxSize,
      label: '?',  // Mystery - will be revealed
    });
    this.pipeline.add(this.rightBox);

    // Load avatar secretly (don't display)
    this.loadAvatarData();

    // Create Transform button
    this.createTransformButton();

    // Setup drag & drop
    this.setupDragAndDrop();

    // State
    this.uploadedImageData = null;
    this.avatarImageData = null;
    this.flyingPixels = [];
    this.isAnimating = false;
    this.isProcessing = false;
    this.landedPixels = [];  // Pixels that have arrived

    // Layering - persistent result canvas
    this.resultCanvas = null;
    this.resultCtx = null;
    this.layerCount = 0;  // Track how many transforms have been applied
  }

  /**
   * Load avatar data secretly (no display)
   */
  async loadAvatarData() {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/avatar.jpeg';
      });

      // Scale to fit box
      const scale = Math.min(
        this.boxSize / img.width,
        this.boxSize / img.height
      );
      const scaledWidth = Math.floor(img.width * scale);
      const scaledHeight = Math.floor(img.height * scale);

      // Create scaled ImageData (but don't display it)
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = scaledWidth;
      scaledCanvas.height = scaledHeight;
      const scaledCtx = scaledCanvas.getContext('2d');
      scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      this.avatarImageData = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight);
      this.avatarWidth = scaledWidth;
      this.avatarHeight = scaledHeight;

      console.log('[Day13] Avatar data loaded secretly:', scaledWidth, 'x', scaledHeight);
    } catch (error) {
      console.error('[Day13] Failed to load avatar:', error);
    }
  }

  createTransformButton() {
    this.transformButton = new Button(this, {
      x: this.width / 2,
      y: CONFIG.buttonY,
      width: CONFIG.buttonWidth,
      height: CONFIG.buttonHeight,
      text: 'Transform',
      onClick: () => this.startTransform(),
    });
    this.pipeline.add(this.transformButton);
  }

  setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.canvas.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    this.canvas.addEventListener('drop', async (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        await this.loadUploadedImage(files[0]);
      }
    });

    // Click to upload - with debounce to prevent repeated triggers
    this.isPickingFile = false;

    this.canvas.addEventListener('click', async (e) => {
      // Guard against repeated triggers
      if (this.isAnimating || this.isProcessing || this.isPickingFile) return;

      // Don't open picker if already have an image loaded
      if (this.processImageData) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const boxLeft = this.leftBox.x - this.boxSize / 2;
      const boxTop = this.leftBox.y - this.boxSize / 2;

      if (
        x >= boxLeft && x <= boxLeft + this.boxSize &&
        y >= boxTop && y <= boxTop + this.boxSize
      ) {
        this.isPickingFile = true;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (changeEvent) => {
          if (changeEvent.target.files.length > 0) {
            await this.loadUploadedImage(changeEvent.target.files[0]);
          }
          this.isPickingFile = false;
        };

        // Also reset flag if user cancels
        input.addEventListener('cancel', () => {
          this.isPickingFile = false;
        });

        // Fallback: reset after timeout in case events don't fire
        setTimeout(() => {
          this.isPickingFile = false;
        }, 10000);

        input.click();
      }
    });
  }

  async loadUploadedImage(file) {
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Scale to fit box for DISPLAY (preview)
      const padding = 10;
      const availableSize = this.boxSize - padding * 2;
      const displayScale = Math.min(availableSize / img.width, availableSize / img.height);
      const displayWidth = Math.floor(img.width * displayScale);
      const displayHeight = Math.floor(img.height * displayScale);

      // Create display ImageData (full quality preview)
      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = displayWidth;
      displayCanvas.height = displayHeight;
      const displayCtx = displayCanvas.getContext('2d');
      displayCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
      const displayImageData = displayCtx.getImageData(0, 0, displayWidth, displayHeight);

      this.displayWidth = displayWidth;
      this.displayHeight = displayHeight;
      this.leftBox.setImage(displayImageData, displayWidth, displayHeight);

      // Create DOWNSAMPLED version for processing (much smaller = faster)
      const maxProcessDim = CONFIG.processResolution;
      const processScale = Math.min(maxProcessDim / img.width, maxProcessDim / img.height, 1);
      const processWidth = Math.floor(img.width * processScale);
      const processHeight = Math.floor(img.height * processScale);

      const processCanvas = document.createElement('canvas');
      processCanvas.width = processWidth;
      processCanvas.height = processHeight;
      const processCtx = processCanvas.getContext('2d');
      processCtx.drawImage(img, 0, 0, processWidth, processHeight);
      this.processImageData = processCtx.getImageData(0, 0, processWidth, processHeight);
      this.processWidth = processWidth;
      this.processHeight = processHeight;

      console.log(`[Day13] Display: ${displayWidth}x${displayHeight}, Process: ${processWidth}x${processHeight}`);

      // Reset animation state
      this.flyingPixels = [];
      this.landedPixels = [];
      this.isAnimating = false;
      this.rightBox.labelText = '?';
      this.rightBox.clearImage();

    } catch (error) {
      console.error('[Day13] Failed to load uploaded image:', error);
    }
  }

  /**
   * Start the pixel transformation animation
   */
  startTransform() {
    if (!this.processImageData || !this.avatarImageData || this.isAnimating || this.isProcessing) {
      console.warn('[Day13] Cannot transform - missing data or already processing');
      return;
    }

    this.isProcessing = true;
    this.transformButton.label.text = 'Processing 0%';

    // Track layer count and determine opacity for this layer
    this.layerCount++;
    this.currentLayerOpacity = this.layerCount === 1 ? 1.0 : CONFIG.layerOpacity;

    // Create result canvas if it doesn't exist
    if (!this.resultCanvas) {
      this.resultCanvas = document.createElement('canvas');
      this.resultCanvas.width = this.avatarWidth;
      this.resultCanvas.height = this.avatarHeight;
      this.resultCtx = this.resultCanvas.getContext('2d');
    }

    // Create a canvas to track the "dissolving" source image
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCanvas.width = this.displayWidth;
    this.sourceCanvas.height = this.displayHeight;
    this.sourceCtx = this.sourceCanvas.getContext('2d');
    this.sourceCtx.drawImage(this.leftBox.image.shape._buffer || this.leftBox.image.shape._bitmap, 0, 0);
    this.sourceImageData = this.sourceCtx.getImageData(0, 0, this.displayWidth, this.displayHeight);

    // Create worker and send data
    const worker = createMatchingWorker();

    worker.onmessage = (e) => {
      const { type, stage, percent, pixelData } = e.data;

      if (type === 'progress') {
        this.transformButton.label.text = `${stage} ${percent}%`;
      } else if (type === 'complete') {
        worker.terminate();
        this.onMatchingComplete(pixelData);
      }
    };

    worker.onerror = (e) => {
      console.error('[Day13] Worker error:', e);
      worker.terminate();
      this.isProcessing = false;
      this.transformButton.label.text = 'Transform';
    };

    // Send DOWNSAMPLED data to worker (much faster processing)
    worker.postMessage({
      avatarData: Array.from(this.avatarImageData.data),
      avatarWidth: this.avatarWidth,
      avatarHeight: this.avatarHeight,
      sourceData: Array.from(this.processImageData.data),  // Use downsampled!
      sourceWidth: this.processWidth,
      sourceHeight: this.processHeight,
      step: CONFIG.pixelSampleStep,
      displayWidth: this.displayWidth,
      displayHeight: this.displayHeight,
      colorPreservation: CONFIG.colorPreservation,
    });
  }

  /**
   * Called when worker completes matching - create flying pixels
   */
  onMatchingComplete(pixelData) {
    this.isProcessing = false;
    this.isAnimating = true;
    this.flyingPixels = [];
    this.landedPixels = [];
    this.rightBox.labelText = '';
    this.rightBox.clearImage();

    // Calculate offsets for centering images in boxes
    const leftOffsetX = this.leftBoxX - this.displayWidth / 2;
    const leftOffsetY = this.boxCenterY - this.displayHeight / 2;
    const rightOffsetX = this.rightBoxX - this.avatarWidth / 2;
    const rightOffsetY = this.boxCenterY - this.avatarHeight / 2;

    // Create flying pixels with staggered delays
    for (let i = 0; i < pixelData.length; i++) {
      const p = pixelData[i];
      const delay = i * CONFIG.flightStagger;

      const screenSourceX = leftOffsetX + p.sourceX;
      const screenSourceY = leftOffsetY + p.sourceY;
      const screenTargetX = rightOffsetX + p.targetX;
      const screenTargetY = rightOffsetY + p.targetY;

      const color = `rgb(${p.r},${p.g},${p.b})`;

      this.flyingPixels.push(new FlyingPixel(
        screenSourceX, screenSourceY,
        screenTargetX, screenTargetY,
        color, delay,
        { x: p.displaySourceX, y: p.displaySourceY },
        this.currentLayerOpacity
      ));
    }

    console.log('[Day13] Created', this.flyingPixels.length, 'flying pixels (randomized)');
    this.transformButton.label.text = 'Transforming...';
  }

  /**
   * Calculate perceptual luminance (0-255)
   * Using Rec. 709 coefficients for better perceptual accuracy
   */
  getLuminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Build luminance-based color map from source image
   * Buckets pixels by luminance for fast lookup
   */
  buildColorMap(source) {
    const map = new Map();
    const sourceData = source.data;
    const bucketSize = 8;  // Smaller buckets for better luminance matching

    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const i = (y * source.width + x) * 4;
        const r = sourceData[i];
        const g = sourceData[i + 1];
        const b = sourceData[i + 2];
        const a = sourceData[i + 3];

        if (a < 10) continue;

        // Calculate luminance and bucket by it
        const lum = this.getLuminance(r, g, b);
        const lumBucket = Math.floor(lum / bucketSize);

        // Also bucket by color for better matching when colors ARE available
        const bucketR = Math.floor(r / 32);
        const bucketG = Math.floor(g / 32);
        const bucketB = Math.floor(b / 32);

        // Primary key: luminance bucket (for B&W matching)
        const lumKey = `L${lumBucket}`;
        if (!map.has(lumKey)) {
          map.set(lumKey, []);
        }
        map.get(lumKey).push({ r, g, b, x, y, lum });

        // Secondary key: color bucket (for color matching)
        const colorKey = `C${bucketR},${bucketG},${bucketB}`;
        if (!map.has(colorKey)) {
          map.set(colorKey, []);
        }
        map.get(colorKey).push({ r, g, b, x, y, lum });
      }
    }

    return map;
  }

  /**
   * Find best matching pixel based on luminance AND color
   * Prioritizes luminance matching (shadows/highlights) over exact color
   */
  findBestMatch(targetR, targetG, targetB, colorMap) {
    const targetLum = this.getLuminance(targetR, targetG, targetB);
    const lumBucketSize = 8;
    const lumBucket = Math.floor(targetLum / lumBucketSize);

    let bestMatch = null;
    let bestScore = Infinity;

    // First, search by luminance (most important for structure)
    for (let dl = -2; dl <= 2; dl++) {
      const lumKey = `L${lumBucket + dl}`;
      const candidates = colorMap.get(lumKey);

      if (!candidates) continue;

      for (const candidate of candidates) {
        // Score = luminance difference (weighted heavily) + color difference
        const lumDiff = Math.abs(targetLum - candidate.lum);
        const colorDiff = Math.sqrt(
          (targetR - candidate.r) ** 2 +
          (targetG - candidate.g) ** 2 +
          (targetB - candidate.b) ** 2
        );

        // Luminance is 3x more important than color
        // This ensures B&W images match shadows/highlights correctly
        const score = lumDiff * 3 + colorDiff;

        if (score < bestScore) {
          bestScore = score;
          bestMatch = candidate;
        }
      }
    }

    // If no luminance match, try color buckets
    if (!bestMatch) {
      const bucketR = Math.floor(targetR / 32);
      const bucketG = Math.floor(targetG / 32);
      const bucketB = Math.floor(targetB / 32);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dg = -1; dg <= 1; dg++) {
          for (let db = -1; db <= 1; db++) {
            const colorKey = `C${bucketR + dr},${bucketG + dg},${bucketB + db}`;
            const candidates = colorMap.get(colorKey);

            if (!candidates) continue;

            for (const candidate of candidates) {
              const lumDiff = Math.abs(targetLum - candidate.lum);
              const colorDiff = Math.sqrt(
                (targetR - candidate.r) ** 2 +
                (targetG - candidate.g) ** 2 +
                (targetB - candidate.b) ** 2
              );
              const score = lumDiff * 3 + colorDiff;

              if (score < bestScore) {
                bestScore = score;
                bestMatch = candidate;
              }
            }
          }
        }
      }
    }

    // Ultimate fallback: random pixel from source
    if (!bestMatch) {
      const x = Math.floor(Math.random() * this.uploadedWidth);
      const y = Math.floor(Math.random() * this.uploadedHeight);
      const i = (y * this.uploadedWidth + x) * 4;
      const data = this.uploadedImageData.data;
      bestMatch = {
        r: data[i], g: data[i + 1], b: data[i + 2],
        x, y,
        lum: this.getLuminance(data[i], data[i + 1], data[i + 2])
      };
    }

    return bestMatch;
  }

  update(dt) {
    super.update(dt);

    if (!this.isAnimating || this.flyingPixels.length === 0) return;

    // Update all flying pixels and erase source pixels as they spawn
    let allArrived = true;
    const eraseSize = CONFIG.pixelSampleStep;  // Erase area matching sample step

    for (const pixel of this.flyingPixels) {
      const wasSpawned = pixel.spawned;
      pixel.update(dt);

      // When pixel just spawned, erase it from source image
      if (!wasSpawned && pixel.spawned && pixel.sourcePixelInfo) {
        const sx = pixel.sourcePixelInfo.x;
        const sy = pixel.sourcePixelInfo.y;

        // Erase a block of pixels from source image data
        for (let dy = 0; dy < eraseSize; dy++) {
          for (let dx = 0; dx < eraseSize; dx++) {
            const px = sx + dx;
            const py = sy + dy;
            if (px >= 0 && px < this.displayWidth && py >= 0 && py < this.displayHeight) {
              const idx = (py * this.displayWidth + px) * 4;
              this.sourceImageData.data[idx + 3] = 0;  // Set alpha to 0
            }
          }
        }
        this.sourceDirty = true;
      }

      if (!pixel.arrived) {
        allArrived = false;
      }
    }

    // Update the source canvas if pixels were erased
    if (this.sourceDirty) {
      this.sourceCtx.putImageData(this.sourceImageData, 0, 0);
      this.sourceDirty = false;
    }

    // Check if animation is complete
    if (allArrived) {
      this.rasterizePixels();
      this.isAnimating = false;
      this.transformButton.label.text = 'Transform';
      console.log('[Day13] Transform complete! Layer', this.layerCount);
    }
  }

  /**
   * Rasterize flying pixels to the result canvas and clear them
   */
  rasterizePixels() {
    if (!this.resultCanvas || this.flyingPixels.length === 0) return;

    const rightOffsetX = this.rightBoxX - this.avatarWidth / 2;
    const rightOffsetY = this.boxCenterY - this.avatarHeight / 2;

    // Draw each pixel to the result canvas with layer opacity
    this.resultCtx.globalAlpha = this.currentLayerOpacity;

    for (const pixel of this.flyingPixels) {
      // Convert screen position to result canvas position
      const rx = pixel.tx - rightOffsetX;
      const ry = pixel.ty - rightOffsetY;

      this.resultCtx.fillStyle = pixel.color;
      this.resultCtx.fillRect(
        rx - CONFIG.pixelSize / 2,
        ry - CONFIG.pixelSize / 2,
        CONFIG.pixelSize,
        CONFIG.pixelSize
      );
    }

    this.resultCtx.globalAlpha = 1;

    // Clear flying pixels - they're now rasterized
    this.flyingPixels = [];

    // Reset left box - image was consumed, prompt for new upload
    this.leftBox.clearImage();
    this.leftBox.labelText = 'Drop Image Here';
    this.processImageData = null;  // Clear processed data

    console.log('[Day13] Rasterized layer', this.layerCount, 'to result canvas');
  }

  render() {
    const ctx = this.ctx;

    // Motion blur trail
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // During animation, hide the original left image and draw dissolving version
    if (this.isAnimating && this.leftBox.image) {
      this.leftBox.image.visible = false;
    }

    // Render pipeline (boxes, button)
    super.render();

    // Draw dissolving source image during animation
    if (this.isAnimating && this.sourceCanvas) {
      const leftOffsetX = this.leftBoxX - this.displayWidth / 2;
      const leftOffsetY = this.boxCenterY - this.displayHeight / 2;
      ctx.drawImage(this.sourceCanvas, leftOffsetX, leftOffsetY);
    }

    // Draw accumulated result canvas in right box (shifted 1px for border)
    if (this.resultCanvas && this.layerCount > 0) {
      const rightOffsetX = this.rightBoxX - this.avatarWidth / 2 + 1;
      const rightOffsetY = this.boxCenterY - this.avatarHeight / 2 + 1;
      ctx.drawImage(this.resultCanvas, rightOffsetX, rightOffsetY, this.avatarWidth - 2, this.avatarHeight - 2);
    }

    // Render flying pixels
    ctx.save();
    for (const pixel of this.flyingPixels) {
      pixel.render(ctx);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export default function day13(canvas) {
  const game = new Day13Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
