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
  buttonWidth: 150,
  buttonHeight: 50,
  buttonY: 50,

  // Processing
  maxImageSize: 800,

  // Pixel animation
  pixelSampleStep: 4,       // Sample every Nth pixel (lower = more particles)
  pixelSize: 4,             // Size of flying pixels
  flightDuration: 2.0,      // Base flight time in seconds
  flightStagger: 0.003,     // Delay between each pixel starting
  trailAlpha: 0.15,         // Motion blur trail
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
  constructor(sx, sy, tx, ty, color, delay, sourcePixelInfo) {
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
    this.alpha = 1;
    this.sourcePixelInfo = sourcePixelInfo;  // { x, y } in display coords
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

    // Fade in as it flies
    this.alpha = Math.min(1, progress * 2);

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
    this.landedPixels = [];  // Pixels that have arrived
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

    // Click to upload
    this.canvas.addEventListener('click', async (e) => {
      if (this.isAnimating) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const boxLeft = this.leftBox.x - this.boxSize / 2;
      const boxTop = this.leftBox.y - this.boxSize / 2;

      if (
        x >= boxLeft && x <= boxLeft + this.boxSize &&
        y >= boxTop && y <= boxTop + this.boxSize
      ) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          if (e.target.files.length > 0) {
            await this.loadUploadedImage(e.target.files[0]);
          }
        };
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

      // Scale if too large
      let width = img.width;
      let height = img.height;
      const maxDim = Math.max(width, height);
      if (maxDim > CONFIG.maxImageSize) {
        const scale = CONFIG.maxImageSize / maxDim;
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      // Create ImageData for processing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0, width, height);
      this.uploadedImageData = tempCtx.getImageData(0, 0, width, height);
      this.uploadedWidth = width;
      this.uploadedHeight = height;

      // Scale to fit box for display
      const padding = 10;
      const availableSize = this.boxSize - padding * 2;
      const displayScale = Math.min(availableSize / width, availableSize / height);
      const displayWidth = Math.floor(width * displayScale);
      const displayHeight = Math.floor(height * displayScale);

      // Create display ImageData
      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = displayWidth;
      displayCanvas.height = displayHeight;
      const displayCtx = displayCanvas.getContext('2d');
      displayCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
      const displayImageData = displayCtx.getImageData(0, 0, displayWidth, displayHeight);

      // Store display dimensions for pixel mapping
      this.displayWidth = displayWidth;
      this.displayHeight = displayHeight;

      this.leftBox.setImage(displayImageData, displayWidth, displayHeight);

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
    if (!this.uploadedImageData || !this.avatarImageData || this.isAnimating) {
      console.warn('[Day13] Cannot transform - missing data or already animating');
      return;
    }

    this.isAnimating = true;
    this.flyingPixels = [];
    this.landedPixels = [];
    this.rightBox.labelText = '';
    this.rightBox.clearImage();

    // Create a canvas to track the "dissolving" source image
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCanvas.width = this.displayWidth;
    this.sourceCanvas.height = this.displayHeight;
    this.sourceCtx = this.sourceCanvas.getContext('2d');
    // Copy the displayed image to our tracking canvas
    this.sourceCtx.drawImage(this.leftBox.image.shape._buffer || this.leftBox.image.shape._bitmap, 0, 0);
    this.sourceImageData = this.sourceCtx.getImageData(0, 0, this.displayWidth, this.displayHeight);

    // Build color map from uploaded image
    const colorMap = this.buildColorMap(this.uploadedImageData);

    // Sample avatar pixels and collect pixel data first
    const avatarData = this.avatarImageData.data;
    const step = CONFIG.pixelSampleStep;
    const pixelData = [];

    // Calculate offsets for centering images in boxes
    const leftOffsetX = this.leftBoxX - this.displayWidth / 2;
    const leftOffsetY = this.boxCenterY - this.displayHeight / 2;
    const rightOffsetX = this.rightBoxX - this.avatarWidth / 2;
    const rightOffsetY = this.boxCenterY - this.avatarHeight / 2;

    for (let ty = 0; ty < this.avatarHeight; ty += step) {
      for (let tx = 0; tx < this.avatarWidth; tx += step) {
        const idx = (ty * this.avatarWidth + tx) * 4;
        const r = avatarData[idx];
        const g = avatarData[idx + 1];
        const b = avatarData[idx + 2];
        const a = avatarData[idx + 3];

        if (a < 10) continue;  // Skip transparent

        // Find best matching pixel from uploaded image
        const match = this.findBestMatch(r, g, b, colorMap);

        // Source position (in uploaded image, scaled to display size)
        const sourceX = (match.x / this.uploadedWidth) * this.displayWidth;
        const sourceY = (match.y / this.uploadedHeight) * this.displayHeight;

        // Screen positions
        const screenSourceX = leftOffsetX + sourceX;
        const screenSourceY = leftOffsetY + sourceY;
        const screenTargetX = rightOffsetX + tx;
        const screenTargetY = rightOffsetY + ty;

        const color = `rgb(${match.r},${match.g},${match.b})`;

        pixelData.push({
          screenSourceX, screenSourceY,
          screenTargetX, screenTargetY,
          color,
          // Source pixel position in display image coords (for erasing)
          displaySourceX: Math.floor(sourceX),
          displaySourceY: Math.floor(sourceY),
        });
      }
    }

    // Shuffle the pixel data for random order
    shuffleArray(pixelData);

    // Create flying pixels with staggered delays based on shuffled order
    for (let i = 0; i < pixelData.length; i++) {
      const p = pixelData[i];
      const delay = i * CONFIG.flightStagger;

      this.flyingPixels.push(new FlyingPixel(
        p.screenSourceX, p.screenSourceY,
        p.screenTargetX, p.screenTargetY,
        p.color, delay,
        { x: p.displaySourceX, y: p.displaySourceY }
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
      this.isAnimating = false;
      this.transformButton.label.text = 'Transform';
      console.log('[Day13] Transform complete!');
    }
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
