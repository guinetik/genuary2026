/**
 * Genuary 2026 - Day 6
 * Prompt: Lights on/off — Make something that changes when you switch on or off the “digital” lights
 *
 * DIGITAL LAVA LAMP
 * Port of the `demos/js/lavalamp.js` idea into the Genuary showcase.
 * Toggle “LIGHTS” to fade heat, glow, and motion in/out.
 */

import {
  Game,
  ImageGo,
  Painter,
  ToggleButton,
  applyAnchor,
  Position,
  zoneTemperature,
  thermalBuoyancy,
  thermalGravity,
  heatTransfer,
  Screen,
} from "@guinetik/gcanvas";

const CONFIG = {
  render: {
    // Scale factor is set dynamically in init() using Screen.responsive()
    scaleFactor: 3, // Default, will be overridden
    blendMode: "screen",
    dithering: 1.2,        // Noise amount to reduce color banding
  },

  ui: {
    buttonWidth: 96,
    buttonHeight: 34,
    buttonOffsetX: 16,
    buttonOffsetY: 16,
    onLabel: "LIGHTS:ON",
    offLabel: "LIGHTS:OFF",
  },

  // Color transition
  colorTransition: {
    speed: 0.8, // How fast colors transition (0-1 per second)
  },

  // Mouse interaction
  mouse: {
    radius: 0.15,         // Interaction radius (normalized)
    pushForce: 0.0008,    // How hard blobs are pushed
    heatBoost: 0.3,       // Temperature boost when near mouse
  },

  // Physics (normalized units)
  physics: {
    gravity: 0.000052,
    buoyancyStrength: 0.00018,
    maxSpeed: 0.00088,
    dampingX: 0.995,
    dampingY: 0.998,

    // Drift & Chaos
    driftSpeedMin: 0.165,
    driftSpeedRange: 0.165,
    driftAmountMin: 0.0000055,
    driftAmountRange: 0.0000044,
    wobbleForce: 0.000011,
    wobbleZoneTop: 0.2,
    wobbleZoneBottom: 0.7,

    // Repulsion to prevent clustering
    repulsionStrength: 0.00004,
    repulsionRange: 2.5,
    chaosStrength: 0.000008,
    chaosTempFactor: 1.5,
  },

  temperature: {
    tempRate: 0.008,
    heatZoneY: 0.85,
    coolZoneY: 0.15,
    heatZoneMultiplier: 2.0,
    coolZoneMultiplier: 0.8,
    middleZoneMultiplier: 0.03,
    transitionWidth: 0.25,
    heatTransferRate: 0.005,
    heatTransferRange: 1.8,
  },

  spawning: {
    initialSpawnMin: 2,
    initialSpawnRange: 2,
    spawnMin: 3,
    spawnRange: 3,
    spawnOffsetY: 0.01,
    spawnOffsetYRange: 0.01,
    spawnOffsetX: 0.02,
    initialRadius: 0.005,
    targetRadiusMin: 0.04,
    targetRadiusRange: 0.025,
    growthRate: 0.0165,
    growthThreshold: 0.7,
    initialRiseVelocity: -0.00022,
    maxBlobs: 8,
    poolClearThreshold: 0.75,
  },

  boundaries: {
    left: 0.1,
    right: 0.9,
    top: -0.1,
    bounce: -0.3,
    removalY: 1.15,
  },

  deformation: {
    stretchBase: 0.75,
    stretchTempFactor: 0.5,
    wobble1Speed: 1.32,
    wobble1Amount: 0.12,
    wobble2Speed: 0.88,
    wobble2PhaseFactor: 1.7,
    wobble2Amount: 0.08,
  },

  metaballs: {
    threshold: 1.0,
    edgeWidth: 0.18,
    poolGlowStart: 0.7,
    poolGlowBoost: 0.5,
    brightnessBase: 0.4,
    brightnessTempFactor: 1.2,
    glowMax: 0.35,
    glowFactor: 0.15,
    // Internal glow for hot spots
    hotspotIntensity: 0.4,
    hotspotRadius: 0.3,
    // Specular highlight
    specularIntensity: 0.25,
    specularSize: 0.15,
    specularOffset: 0.3,
  },

  lights: {
    heatTransitionSpeed: 0.4, // 0-1 smoothing speed
    coolDownRate: 0.015,
    poolCoolRate: 0.008,
  },

  // Color palettes - each has base hue and secondary hue offset
  palettes: [
    { hue1: 0.33, hue2: 0.39, name: "terminal" },     // green (original)
    { hue1: 0.05, hue2: 0.08, name: "lava" },         // red/orange (classic)
    { hue1: 0.58, hue2: 0.65, name: "ocean" },        // blue/cyan
    { hue1: 0.75, hue2: 0.82, name: "cosmic" },       // purple/magenta
    { hue1: 0.12, hue2: 0.16, name: "sunset" },       // orange/yellow
    { hue1: 0.45, hue2: 0.52, name: "aqua" },         // teal/cyan
    { hue1: 0.92, hue2: 0.02, name: "cherry" },       // pink/red
  ],
};

/**
 * Clamp a value to [0, 1].
 * @param {number} v
 * @returns {number}
 */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

class Day06DigitalLightsDemo extends Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
  }

  init() {
    super.init();
    Screen.init(this);  // Initialize screen detection
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    this.time = 0;
    this.lastSpawnTime = 0;
    this.spawnInterval =
      CONFIG.spawning.initialSpawnMin +
      Math.random() * CONFIG.spawning.initialSpawnRange;

    // Lights state
    this.lampOn = true;
    this.heatLevel = 1.0; // Smooth transition 0-1
    this.poolTemp = 1.0; // Pool temperature

    // Color transition state
    this.currentPaletteIndex = 0;
    this.currentHue1 = CONFIG.palettes[0].hue1;
    this.currentHue2 = CONFIG.palettes[0].hue2;
    this.targetHue1 = this.currentHue1;
    this.targetHue2 = this.currentHue2;
    this.colorTransitionProgress = 1.0; // 1 = complete

    // Render buffers (ImageData + ImageGo)
    this.handleResize();

    // Colors
    this.updateColors();

    // Mouse tracking (normalized 0-1 coordinates)
    this.mouseX = -1;
    this.mouseY = -1;
    this.mouseActive = false;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
      this.mouseActive = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });

    // Click to change color
    this.canvas.addEventListener('click', (e) => {
      // Ignore clicks on the button area
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const buttonArea = CONFIG.ui.buttonOffsetX + CONFIG.ui.buttonWidth + 20;
      const buttonAreaY = CONFIG.ui.buttonOffsetY + CONFIG.ui.buttonHeight + 20;
      if (clickX < buttonArea && clickY < buttonAreaY) return;

      this.cycleColor();
    });

    // Pool blobs (mostly off-screen at bottom)
    this.poolBlobs = [
      { x: 0.2, y: 1.02, r: 0.06 },
      { x: 0.35, y: 1.0, r: 0.065 },
      { x: 0.5, y: 1.02, r: 0.07 },
      { x: 0.65, y: 1.0, r: 0.065 },
      { x: 0.8, y: 1.02, r: 0.06 },
    ];

    // Moving blobs
    this.blobs = [
      {
        x: 0.5,
        y: 0.6,
        vx: 0,
        vy: -0.0002,
        r: 0.05,
        targetR: 0.05,
        temp: 0.8,
      },
    ];

    // Lights toggle button
    this.powerButton = new ToggleButton(this, {
      text: CONFIG.ui.onLabel,
      width: CONFIG.ui.buttonWidth,
      height: CONFIG.ui.buttonHeight,
      startToggled: true,
      colorDefaultBg: "#000",
      colorStroke: "#1a1a1a",
      colorText: "#aaffaa",
      colorActiveBg: "rgba(0, 255, 0, 0.05)",
      colorActiveStroke: "#0f0",
      colorActiveText: "#0f0",
      onToggle: (isOn) => {
        this.lampOn = isOn;
        this.powerButton.label.text = isOn
          ? CONFIG.ui.onLabel
          : CONFIG.ui.offLabel;
      },
    });

    applyAnchor(this.powerButton, {
      anchor: Position.TOP_LEFT,
      anchorOffsetX: CONFIG.ui.buttonOffsetX,
      anchorOffsetY: CONFIG.ui.buttonOffsetY,
    });

    this.pipeline.add(this.lavaImage);
    this.pipeline.add(this.powerButton);
  }

  /**
   * Recreate internal render buffer to match the current canvas size.
   */
  handleResize() {
    this._lastCanvasW = this.width;
    this._lastCanvasH = this.height;

    // Use Screen.responsive for device-appropriate scale factor
    // Mobile: 1.5 (higher quality), Tablet: 2, Desktop: 3 (lower res for perf)
    const scaleFactor = Screen.responsive(1.5, 2, 3);

    this.renderWidth = Math.max(
      1,
      Math.floor(this.width / scaleFactor),
    );
    this.renderHeight = Math.max(
      1,
      Math.floor(this.height / scaleFactor),
    );

    this.imageData = Painter.img.createImageData(
      this.renderWidth,
      this.renderHeight,
    );

    if (!this.lavaImage) {
      this.lavaImage = new ImageGo(this, this.imageData, {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        anchor: "top-left",
      });
    } else {
      this.lavaImage.shape.bitmap = this.imageData;
      this.lavaImage.width = this.width;
      this.lavaImage.height = this.height;
    }
  }

  cycleColor() {
    // Current becomes the starting point
    this.currentHue1 = this.targetHue1;
    this.currentHue2 = this.targetHue2;

    // Pick next palette (skip current)
    this.currentPaletteIndex = (this.currentPaletteIndex + 1) % CONFIG.palettes.length;
    const nextPalette = CONFIG.palettes[this.currentPaletteIndex];

    this.targetHue1 = nextPalette.hue1;
    this.targetHue2 = nextPalette.hue2;
    this.colorTransitionProgress = 0;
  }

  updateColors() {
    // Interpolate hues with wrapping (for smooth transitions across 0/1 boundary)
    const lerpHue = (from, to, t) => {
      let diff = to - from;
      // Take shortest path around the hue circle
      if (diff > 0.5) diff -= 1;
      if (diff < -0.5) diff += 1;
      let result = from + diff * t;
      if (result < 0) result += 1;
      if (result > 1) result -= 1;
      return result;
    };

    const t = this.colorTransitionProgress;
    const hue1 = lerpHue(this.currentHue1, this.targetHue1, t);
    const hue2 = lerpHue(this.currentHue2, this.targetHue2, t);

    this.colors = {
      blob1: this.hslToRgb(hue1, 0.95, 0.55),
      blob2: this.hslToRgb(hue2, 0.9, 0.5),
      bgTop: this.hslToRgb(hue1, 0.5, 0.04),
      bgBottom: this.hslToRgb(hue2, 0.55, 0.08),
      // Store hues for glow calculations
      hue1,
      hue2,
    };
  }

  /**
   * Convert HSL (0..1) to RGB array (0..255 ints).
   * @param {number} h
   * @param {number} s
   * @param {number} l
   * @returns {[number, number, number]}
   */
  hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    let r, g, b;

    if (h < 1 / 6) [r, g, b] = [c, x, 0];
    else if (h < 2 / 6) [r, g, b] = [x, c, 0];
    else if (h < 3 / 6) [r, g, b] = [0, c, x];
    else if (h < 4 / 6) [r, g, b] = [0, x, c];
    else if (h < 5 / 6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
      Math.floor((r + m) * 255),
      Math.floor((g + m) * 255),
      Math.floor((b + m) * 255),
    ];
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Handle container resize (ResizeObserver updates canvas size asynchronously)
    if (this.width !== this._lastCanvasW || this.height !== this._lastCanvasH) {
      this.handleResize();
    }

    // Smooth heat level transition (0..1)
    const targetHeat = this.lampOn ? 1.0 : 0.0;
    this.heatLevel +=
      (targetHeat - this.heatLevel) *
      CONFIG.lights.heatTransitionSpeed *
      dt *
      60;
    this.heatLevel = clamp01(this.heatLevel);

    // Pool temperature follows heat level (slower transition)
    if (this.lampOn) {
      this.poolTemp +=
        (1.0 - this.poolTemp) * CONFIG.lights.poolCoolRate * 2 * dt * 60;
    } else {
      this.poolTemp +=
        (0.0 - this.poolTemp) * CONFIG.lights.poolCoolRate * dt * 60;
    }
    this.poolTemp = clamp01(this.poolTemp);

    // Color transition
    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress += CONFIG.colorTransition.speed * dt;
      this.colorTransitionProgress = clamp01(this.colorTransitionProgress);
      this.updateColors();
    }

    // Spawn new blobs from pool periodically (only when lamp is on and pool is hot)
    if (
      this.lampOn &&
      this.poolTemp > 0.7 &&
      this.time - this.lastSpawnTime > this.spawnInterval
    ) {
      const poolClear = !this.blobs.some(
        (b) => b.y > CONFIG.spawning.poolClearThreshold && !b.growing,
      );
      if (poolClear) {
        this.spawnBlob();
        this.lastSpawnTime = this.time;
        this.spawnInterval =
          CONFIG.spawning.spawnMin + Math.random() * CONFIG.spawning.spawnRange;
      }
    }

    this.updateBlobs(dt);
    this.renderLava();
    
    // IMPORTANT: ImageShape caches ImageData into an internal buffer canvas.
    // Mutating `this.imageData.data` does NOT automatically refresh the buffer,
    // so we must re-assign the bitmap to trigger `putImageData()` each frame.
    this.lavaImage.shape.bitmap = this.imageData;

    // Ensure ImageGo is sized to the canvas display
    this.lavaImage.x = 0;
    this.lavaImage.y = 0;
    this.lavaImage.width = this.width;
    this.lavaImage.height = this.height;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // Additive glow
    ctx.globalCompositeOperation = CONFIG.render.blendMode;
    this.pipeline.render();
    ctx.globalCompositeOperation = "source-over";

    // Glass reflection overlay (subtle curved highlight on left side)
    if (this.heatLevel > 0.1) {
      const glassGradient = ctx.createLinearGradient(0, 0, w * 0.4, 0);
      const alpha = 0.04 * this.heatLevel;
      glassGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      glassGradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.5})`);
      glassGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glassGradient;
      ctx.fillRect(0, 0, w * 0.4, h);

      // Subtle vignette for depth
      const vignetteGradient = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.2,
        w / 2, h / 2, Math.max(w, h) * 0.7
      );
      vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${0.3 * this.heatLevel})`);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  spawnBlob() {
    const poolBlob =
      this.poolBlobs[Math.floor(Math.random() * this.poolBlobs.length)];

    this.blobs.push({
      x: poolBlob.x + (Math.random() - 0.5) * CONFIG.spawning.spawnOffsetX,
      y:
        poolBlob.y +
        CONFIG.spawning.spawnOffsetY +
        Math.random() * CONFIG.spawning.spawnOffsetYRange,
      vx: 0,
      vy: 0,
      r: CONFIG.spawning.initialRadius,
      targetR:
        CONFIG.spawning.targetRadiusMin +
        Math.random() * CONFIG.spawning.targetRadiusRange,
      temp: 1.0,
      growing: true,
    });

    if (this.blobs.length > CONFIG.spawning.maxBlobs) {
      // Find a blob near the pool to remove (not one actively floating)
      const poolThreshold = 0.85;
      const poolBlobIndex = this.blobs.findIndex(
        (b, i) => i < this.blobs.length - 1 && b.y > poolThreshold && !b.growing
      );
      if (poolBlobIndex !== -1) {
        this.blobs.splice(poolBlobIndex, 1);
      } else {
        // Fallback: remove oldest non-growing blob
        const oldestIndex = this.blobs.findIndex((b) => !b.growing);
        if (oldestIndex !== -1) {
          this.blobs.splice(oldestIndex, 1);
        }
      }
    }
  }

  updateBlobs(dt) {
    const thermalConfig = {
      heatZone: CONFIG.temperature.heatZoneY,
      coolZone: CONFIG.temperature.coolZoneY,
      rate: CONFIG.temperature.tempRate,
      transitionWidth: CONFIG.temperature.transitionWidth,
      heatMultiplier: CONFIG.temperature.heatZoneMultiplier * this.heatLevel,
      coolMultiplier:
        CONFIG.temperature.coolZoneMultiplier + (1 - this.heatLevel) * 2,
      middleMultiplier:
        CONFIG.temperature.middleZoneMultiplier + (1 - this.heatLevel) * 0.3,
    };

    for (const blob of this.blobs) {
      // Temperature changes based on position (smooth zone transitions)
      blob.temp = zoneTemperature(blob.y, blob.temp, thermalConfig);

      // When lamp is off, all blobs cool down faster
      if (!this.lampOn) {
        blob.temp -= CONFIG.lights.coolDownRate * dt * 60;
        blob.temp = Math.max(0, blob.temp);
      }

      // Buoyancy based on temperature (hot rises)
      blob.vy -= thermalBuoyancy(blob.temp, 0.5, CONFIG.physics.buoyancyStrength);

      // Gravity pulls everything down - larger blobs sink faster
      blob.vy += thermalGravity(blob.r, CONFIG.spawning.targetRadiusMin, CONFIG.physics.gravity);

      // Mouse interaction - push and squish blobs
      blob.squish = 0; // Reset squish each frame
      blob.squishAngle = 0;
      if (this.mouseActive && this.lampOn) {
        const dx = blob.x - this.mouseX;
        const dy = blob.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = CONFIG.mouse.radius;

        if (dist < mouseRadius && dist > 0.001) {
          const influence = 1 - dist / mouseRadius;
          const influenceSq = influence * influence;

          // Push blob away from mouse
          const pushForce = CONFIG.mouse.pushForce * influenceSq;
          blob.vx += (dx / dist) * pushForce;
          blob.vy += (dy / dist) * pushForce;

          // Heat boost from interaction (like warming the glass)
          blob.temp = Math.min(1, blob.temp + CONFIG.mouse.heatBoost * influence * dt);

          // Squish effect - blob deforms toward the mouse
          blob.squish = influenceSq * 0.4;
          blob.squishAngle = Math.atan2(dy, dx);
        }
      }

      // Gradually grow to target size (smooth spawn)
      if (blob.targetR && blob.r < blob.targetR) {
        blob.r += (blob.targetR - blob.r) * CONFIG.spawning.growthRate;
        if (
          blob.growing &&
          blob.r > blob.targetR * CONFIG.spawning.growthThreshold
        ) {
          blob.growing = false;
          blob.vy = CONFIG.spawning.initialRiseVelocity;
        }
      }

      // Heat transfer and repulsion between nearby blobs
      for (const other of this.blobs) {
        if (other === blob) continue;
        const dx = other.x - blob.x;
        const dy = other.y - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const combinedR = blob.r + other.r;
        const maxDist = combinedR * CONFIG.temperature.heatTransferRange;

        // Heat transfer
        blob.temp += heatTransfer(
          blob.temp,
          other.temp,
          dist,
          maxDist,
          CONFIG.temperature.heatTransferRate,
        );

        // Repulsion force - push blobs apart
        const repulsionDist = combinedR * CONFIG.physics.repulsionRange;
        if (dist < repulsionDist && dist > 0.001) {
          const repulsionFactor = 1 - dist / repulsionDist;
          const repulsion =
            repulsionFactor *
            repulsionFactor *
            CONFIG.physics.repulsionStrength;
          const invDist = 1 / dist;
          blob.vx -= dx * invDist * repulsion * 1.5;
          blob.vy -= dy * invDist * repulsion * 0.3;
        }
      }
      blob.temp = clamp01(blob.temp);

      // Chaos - random perturbation, stronger when hot
      const chaosFactor =
        CONFIG.physics.chaosStrength * (0.3 + blob.temp * CONFIG.physics.chaosTempFactor);
      blob.vx += (Math.random() - 0.5) * chaosFactor;
      blob.vy += (Math.random() - 0.5) * chaosFactor * 0.5;

      // Damping
      blob.vx *= CONFIG.physics.dampingX;
      blob.vy *= CONFIG.physics.dampingY;

      // Organic horizontal drift using sine waves (unique per blob)
      if (!blob.driftPhase) blob.driftPhase = Math.random() * Math.PI * 2;
      if (!blob.driftSpeed)
        blob.driftSpeed =
          CONFIG.physics.driftSpeedMin + Math.random() * CONFIG.physics.driftSpeedRange;
      if (!blob.driftAmount)
        blob.driftAmount =
          CONFIG.physics.driftAmountMin + Math.random() * CONFIG.physics.driftAmountRange;

      const drift =
        Math.sin(this.time * blob.driftSpeed + blob.driftPhase) * blob.driftAmount;
      blob.vx += drift;

      // Subtle extra wobble when near top or bottom
      if (
        blob.y < CONFIG.physics.wobbleZoneTop ||
        blob.y > CONFIG.physics.wobbleZoneBottom
      ) {
        blob.vx += (Math.random() - 0.5) * CONFIG.physics.wobbleForce;
      }

      // Apply velocity
      blob.x += blob.vx;
      blob.y += blob.vy;

      // Soft boundaries
      if (blob.x < CONFIG.boundaries.left) {
        blob.x = CONFIG.boundaries.left;
        blob.vx *= CONFIG.boundaries.bounce;
      }
      if (blob.x > CONFIG.boundaries.right) {
        blob.x = CONFIG.boundaries.right;
        blob.vx *= CONFIG.boundaries.bounce;
      }
      if (blob.y < CONFIG.boundaries.top) {
        blob.y = CONFIG.boundaries.top;
        blob.vy *= CONFIG.boundaries.bounce;
        blob.temp = 0;
      }
      if (blob.y > CONFIG.boundaries.removalY && blob.vy > 0 && !blob.growing) {
        blob.removeMe = true;
      }

      // Speed limit
      const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy);
      if (speed > CONFIG.physics.maxSpeed) {
        blob.vx = (blob.vx / speed) * CONFIG.physics.maxSpeed;
        blob.vy = (blob.vy / speed) * CONFIG.physics.maxSpeed;
      }
    }

    // Remove blobs that merged back into the pool
    this.blobs = this.blobs.filter((b) => !b.removeMe);
  }

  renderLava() {
    const data = this.imageData.data;
    const w = this.renderWidth;
    const h = this.renderHeight;
    const invW = 1 / w;
    const invH = 1 / h;

    // Desaturation factor when lights are off (colors become duller)
    const saturation = 0.4 + this.heatLevel * 0.6;
    // Darkness multiplier - scene gets much darker when off
    const darkness = 0.12 + this.heatLevel * 0.88;
    // Dithering amount for smooth gradients
    const ditherAmount = CONFIG.render.dithering;

    // Pre-compute pool blob data (r² and weighted temp)
    const poolTemp = this.poolTemp;
    const poolData = this.poolBlobs.map((b) => ({
      x: b.x,
      y: b.y,
      rSq: b.r * b.r,
    }));

    // Pre-compute moving blob data once per frame (not per pixel!)
    const blobData = this.blobs.map((blob) => {
      const phase = blob.driftPhase || 0;
      const tempWobble = 0.3 + blob.temp * 0.7;
      const wobble1 =
        Math.sin(this.time * CONFIG.deformation.wobble1Speed + phase) *
        CONFIG.deformation.wobble1Amount *
        tempWobble;
      const wobble2 =
        Math.sin(
          this.time * CONFIG.deformation.wobble2Speed +
            phase * CONFIG.deformation.wobble2PhaseFactor,
        ) *
        CONFIG.deformation.wobble2Amount *
        tempWobble;

      // Base stretch from temperature and wobble
      let stretch = CONFIG.deformation.stretchBase + blob.temp * CONFIG.deformation.stretchTempFactor + wobble1;
      let skew = 1.0 + wobble2;

      // Apply mouse squish deformation
      const squish = blob.squish || 0;
      const squishAngle = blob.squishAngle || 0;

      // Squish compresses in the direction of the mouse and expands perpendicular
      // We'll compute directional scaling factors
      const cosA = Math.cos(squishAngle);
      const sinA = Math.sin(squishAngle);
      const squishStretch = 1 + squish * 0.8;  // Expand perpendicular to mouse
      const squishCompress = 1 - squish * 0.5; // Compress toward mouse

      return {
        x: blob.x,
        y: blob.y,
        r: blob.r,
        rSq: blob.r * blob.r,
        temp: blob.temp,
        invStretch: 1 / (stretch * squishCompress),
        stretchSkew: stretch * skew * squishStretch,
        squish,
        squishAngle,
        cosA,
        sinA,
        // Specular highlight position (offset up-left from center)
        specX: blob.x - blob.r * CONFIG.metaballs.specularOffset,
        specY: blob.y - blob.r * CONFIG.metaballs.specularOffset * 1.5,
      };
    });

    // Pre-compute color deltas and thresholds
    const bgDeltaR = this.colors.bgBottom[0] - this.colors.bgTop[0];
    const bgDeltaG = this.colors.bgBottom[1] - this.colors.bgTop[1];
    const bgDeltaB = this.colors.bgBottom[2] - this.colors.bgTop[2];
    const blob1 = this.colors.blob1;
    const blob2 = this.colors.blob2;
    const bgTop = this.colors.bgTop;
    const innerThreshold = CONFIG.metaballs.threshold;
    const outerThreshold = innerThreshold - CONFIG.metaballs.edgeWidth;
    const invEdgeWidth = 1 / CONFIG.metaballs.edgeWidth;

    for (let py = 0; py < h; py++) {
      const ny = py * invH;

      // Background gradient with extra glow near pool at bottom
      const poolGlow =
        ny > CONFIG.metaballs.poolGlowStart
          ? (ny - CONFIG.metaballs.poolGlowStart) /
            (1 - CONFIG.metaballs.poolGlowStart)
          : 0;
      const glowBoost =
        poolGlow * poolGlow * CONFIG.metaballs.poolGlowBoost * this.heatLevel;

      const bgR =
        (bgTop[0] + bgDeltaR * ny + blob1[0] * glowBoost) * darkness;
      const bgG =
        (bgTop[1] + bgDeltaG * ny + blob1[1] * glowBoost * 0.6) * darkness;
      const bgB =
        (bgTop[2] + bgDeltaB * ny + blob1[2] * glowBoost * 0.3) * darkness;

      for (let px = 0; px < w; px++) {
        const nx = px * invW;
        const idx = (py * w + px) << 2;

        // Calculate metaball field from pool + moving blobs
        let sum = 0;
        let avgTemp = 0;

        // Pool blobs
        for (let i = 0; i < poolData.length; i++) {
          const p = poolData[i];
          const dx = p.x - nx;
          const dy = p.y - ny;
          const distSq = dx * dx + dy * dy + 0.0001;
          const influence = p.rSq / distSq;
          sum += influence;
          avgTemp += influence * poolTemp;
        }

        // Moving blobs - track closest blob for specular
        let closestBlobDist = 999;
        let closestBlob = null;
        let specularSum = 0;

        for (let i = 0; i < blobData.length; i++) {
          const b = blobData[i];
          const dx = b.x - nx;
          const dy = b.y - ny;
          const distSq =
            dx * dx * b.stretchSkew + dy * dy * b.invStretch + 0.0001;
          const influence = b.rSq / distSq;
          sum += influence;
          avgTemp += influence * b.temp;

          // Track closest blob for specular highlight
          const rawDist = Math.sqrt(dx * dx + dy * dy);
          if (rawDist < closestBlobDist) {
            closestBlobDist = rawDist;
            closestBlob = b;
          }

          // Specular highlight calculation
          const specDx = b.specX - nx;
          const specDy = b.specY - ny;
          const specDist = Math.sqrt(specDx * specDx + specDy * specDy);
          const specRadius = b.r * CONFIG.metaballs.specularSize;
          if (specDist < specRadius) {
            const specFalloff = 1 - specDist / specRadius;
            specularSum += specFalloff * specFalloff * b.temp;
          }
        }

        // Early exit for pure background pixels
        if (sum < outerThreshold) {
          // Add dithering noise to reduce banding
          const dither = (Math.random() - 0.5) * ditherAmount;
          data[idx] = Math.max(0, Math.min(255, bgR + dither));
          data[idx + 1] = Math.max(0, Math.min(255, bgG + dither));
          data[idx + 2] = Math.max(0, Math.min(255, bgB + dither));
          data[idx + 3] = 255;
          continue;
        }

        if (sum > 0) avgTemp /= sum;

        // Blob color
        const t = ny;
        const tempInfluence = avgTemp * this.heatLevel;
        const brightness =
          (CONFIG.metaballs.brightnessBase +
            t * CONFIG.metaballs.brightnessTempFactor) *
          (0.5 + tempInfluence * 0.5) *
          darkness;

        const colorMix = t * saturation;
        const invColorMix = 1 - colorMix;
        const blobR = (blob1[0] * invColorMix + blob2[0] * colorMix) * brightness;
        const blobG = (blob1[1] * invColorMix + blob2[1] * colorMix) * brightness;
        const blobB = (blob1[2] * invColorMix + blob2[2] * colorMix) * brightness;

        if (sum >= innerThreshold) {
          // Fully inside blob
          const glow = Math.min(
            (sum - innerThreshold) * CONFIG.metaballs.glowFactor * this.heatLevel,
            CONFIG.metaballs.glowMax * this.heatLevel,
          );

          // Internal hotspot glow (brighter core based on temperature)
          let hotspot = 0;
          if (closestBlob && closestBlobDist < closestBlob.r * CONFIG.metaballs.hotspotRadius) {
            const hotspotFalloff = 1 - closestBlobDist / (closestBlob.r * CONFIG.metaballs.hotspotRadius);
            hotspot = hotspotFalloff * hotspotFalloff * closestBlob.temp * CONFIG.metaballs.hotspotIntensity * this.heatLevel;
          }

          // Specular highlight (bright white-ish reflection)
          const specular = Math.min(specularSum * CONFIG.metaballs.specularIntensity * this.heatLevel, 0.6);

          // Combine all effects
          const glowR = glow * blob1[0] * 0.4;
          const glowG = glow * blob1[1] * 0.5;
          const glowB = glow * blob1[2] * 0.3;

          // Add dithering
          const dither = (Math.random() - 0.5) * ditherAmount;
          data[idx] = Math.min(255, Math.max(0, blobR + glowR + hotspot * 80 + specular * 200 + dither));
          data[idx + 1] = Math.min(255, Math.max(0, blobG + glowG + hotspot * 120 + specular * 220 + dither));
          data[idx + 2] = Math.min(255, Math.max(0, blobB + glowB + hotspot * 40 + specular * 180 + dither));
        } else {
          // Edge zone - blend between blob and background
          const blend = (sum - outerThreshold) * invEdgeWidth;
          const smoothBlend = blend * blend * (3 - 2 * blend);
          const dither = (Math.random() - 0.5) * ditherAmount;
          data[idx] = Math.max(0, Math.min(255, bgR + (blobR - bgR) * smoothBlend + dither));
          data[idx + 1] = Math.max(0, Math.min(255, bgG + (blobG - bgG) * smoothBlend + dither));
          data[idx + 2] = Math.max(0, Math.min(255, bgB + (blobB - bgB) * smoothBlend + dither));
        }
        data[idx + 3] = 255;
      }
    }
  }
}

/**
 * Mount Day 06 into the provided canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ stop: () => void, game: Day06DigitalLightsDemo }}
 */
export default function day06(canvas) {
  const game = new Day06DigitalLightsDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}


