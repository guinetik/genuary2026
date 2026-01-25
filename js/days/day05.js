/**
 * Genuary 2026 - Day 5
 * Prompt: "Write 'Genuary'. Avoid using a font."
 * 
 * @fileoverview RIPPLE TEXT - Fingerprint Style
 * 
 * Hand-coded 5x7 pixel font - NO system fonts used.
 * G pulses like a heartbeat, spawning expanding ripples.
 * Each pulse creates a new letter as the wave reaches it.
 * 
 * Features:
 * - Pure pixel-art letters defined as coordinate arrays
 * - Heartbeat pulse spawns shockwaves from G
 * - Letters spawn as shockwaves reach their positions
 * - Orbital rings expand outward on each pulse
 * - Fingerprint ridge pattern on letters
 * - Mouse repulsion with glow effect
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import {
  Game,
  Camera3D,
  Painter,
  ParticleSystem,
  ParticleEmitter,
  Updaters,
  Noise,
  Easing,
} from '@guinetik/gcanvas';

const CONFIG = {
  // Letter grid settings
  pixelSize: 14,          // Size of each "pixel" in the letter grid
  letterSpacing: 2,       // Pixels between letters
  particlesPerPixel: 10,  // Particles per pixel for density
  zSpread: 10,            // 3D depth spread for volumetric effect

  // Fingerprint pattern
  fingerprintEnabled: true,
  fingerprintSpacing: 6,
  fingerprintThickness: 0.7,

  // Particle rendering
  maxParticles: 15000,
  particleSize: { min: 2.0, max: 3.5 },
  dashLength: 3.5,
  dashWidth: 0.8,

  // Concentric ripples from G (like pebble drop)
  initialRings: 3,              // Rings visible from start
  rippleBaseRadius: 50,         // Innermost ring radius
  rippleSpacing: 70,            // Distance between rings
  rippleParticlesBase: 35,      // Particles in innermost ring
  rippleParticlesGrowth: 4,     // Extra particles per ring
  rippleSpeed: 0.4,             // Orbit speed
  rippleEccentricity: 0.6,      // Ellipse shape (1 = circle)

  // G Pulse effect - continuous heartbeat
  pulsePeriod: 1.0,             // Heartbeat speed (seconds per beat)
  pulseStrength: 12,            // Scatter distance
  pulseVibration: 3,            // Vibration amount during growth
  shockwaveSpeed: 300,          // Ripple expansion speed
  shockwaveStrength: 15,        // Orbital push

  // Spawn animation
  spawnDuration: 1.8,
  gDelay: 0.0,                  // G starts immediately

  // Global drift (centers text after animation)
  driftDuration: 8.0,

  // Breathing/idle motion
  breatheAmount: 0.6,
  breatheSpeed: 1.0,

  // Camera
  perspective: 800,
  sensitivity: 0.004,

  // Mouse interaction
  mouseRadius: 160,
  mousePush: 700,
};

/**
 * 5x7 Pixel Font Definition
 * Each letter is a 5-wide x 7-tall grid
 * 1 = filled pixel, 0 = empty
 */
const PIXEL_FONT = {
  G: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  U: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  A: [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
};

/**
 * Generate target positions from pixel font
 * @param {string} text - Text to render
 * @returns {Array} Array of particle target positions
 */
function generateLetterPositions(text) {
  const positions = [];
  const letters = text.split('');
  const gridWidth = 5;
  const gridHeight = 7;
  const { pixelSize, letterSpacing, particlesPerPixel, zSpread } = CONFIG;

  // Calculate total width for centering
  const totalWidth =
    letters.length * gridWidth * pixelSize +
    (letters.length - 1) * letterSpacing * pixelSize;
  const startX = -totalWidth / 2;
  const startY = (-gridHeight * pixelSize) / 2;

  letters.forEach((char, letterIndex) => {
    const grid = PIXEL_FONT[char];
    if (!grid) return;

    const letterOffsetX =
      startX + letterIndex * (gridWidth + letterSpacing) * pixelSize;

    // Calculate letter center for fingerprint pattern
    const letterCenterX = letterOffsetX + (gridWidth * pixelSize) / 2;
    const letterCenterY = 0;

    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        if (grid[row][col] === 1) {
          // Base pixel position
          const baseX = letterOffsetX + col * pixelSize + pixelSize / 2;
          const baseY = startY + row * pixelSize + pixelSize / 2;

          // Spawn multiple particles per pixel for density
          for (let p = 0; p < particlesPerPixel; p++) {
            const offsetX = (Math.random() - 0.5) * pixelSize * 0.75;
            const offsetY = (Math.random() - 0.5) * pixelSize * 0.75;
            const z = (Math.random() - 0.5) * zSpread;

            const x = baseX + offsetX;
            const y = baseY + offsetY;

            // Fingerprint contour filtering
            if (CONFIG.fingerprintEnabled) {
              const dx = x - letterCenterX;
              const dy = y - letterCenterY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              const contourVal = dist + angle * 10;
              const wave = Math.sin(
                (contourVal * Math.PI * 2) / CONFIG.fingerprintSpacing
              );

              // Keep more particles (less aggressive filtering)
              const threshold = CONFIG.fingerprintThickness;
              if (Math.abs(wave) > threshold && Math.random() > 0.4) {
                continue;
              }
            }

            // Calculate tangent angle for dash orientation
            const dx = x - letterCenterX;
            const dy = y - letterCenterY;
            const tangentAngle =
              Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5) * 0.2;

            positions.push({
              x,
              y,
              z,
              letterIndex,
              letterCenterX,
              letterCenterY,
              angle: tangentAngle,
              brightness: 0.7 + Math.random() * 0.3,
              phase: (x + y) * 0.02 + Math.random() * 0.5,
            });
          }
        }
      }
    }
  });

  return positions;
}

/**
 * Custom particle system with dash rendering for letter particles
 */
class DashParticleSystem extends ParticleSystem {
  drawParticle(ctx, p, x, y, scale) {
    const a = p.color?.a ?? 1;
    const size = p.size * scale;
    if (size < 0.3 || a <= 0) return;

    if (p.custom?.isLetter && p.custom?.angle !== undefined) {
      const { r, g, b } = p.color;
      const angle = p.custom.angle;
      const glow = p.custom.glow || 0;
      const dashScale = p.custom.dashScale ?? 1;

      const minLen = size * 0.5;
      const maxLen = size * CONFIG.dashLength;
      const dashLen = minLen + (maxLen - minLen) * dashScale;

      const minW = size * 0.8;
      const maxW = size * CONFIG.dashWidth;
      const dashW = minW + (maxW - minW) * dashScale;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineCap = 'round';

      ctx.strokeStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`;
      ctx.lineWidth = Math.max(0.5, dashW);
      ctx.beginPath();
      ctx.moveTo(-dashLen / 2, 0);
      ctx.lineTo(dashLen / 2, 0);
      ctx.stroke();

      if (glow > 0.15) {
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.4 * glow})`;
        ctx.lineWidth = dashW * 2;
        ctx.stroke();
      }

      ctx.restore();
    } else {
      super.drawParticle(ctx, p, x, y, scale);
    }
  }
}

/**
 * Ripple Text Demo
 * 
 * Main game class for Day 5, creating particle-based text using a hand-coded
 * 5x7 pixel font. Features heartbeat pulses, shockwaves, orbital rings, and
 * fingerprint ridge patterns.
 * 
 * @class RippleTextDemo
 * @extends {Game}
 */
class RippleTextDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.time = 0;
    this.mouseX = -9999;
    this.mouseY = -9999;

    // Pulse state - continuous heartbeat
    this.pulseStartTime = CONFIG.gDelay + CONFIG.spawnDuration;
    this.lastPulseBeat = 0;
    this.shockwaves = [];
    this.currentRingCount = CONFIG.initialRings;

    Noise.seed(42);

    // Camera
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: 0,
      rotationY: 0,
      sensitivity: CONFIG.sensitivity,
      inertia: true,
      friction: 0.95,
      clampX: false,
    });
    this.camera.enableMouseControl(this.canvas);

    // Generate letter positions from pixel font
    this.targetPositions = generateLetterPositions('GENUARY');

    // Find G's center for ripple/orbit origin
    const gPositions = this.targetPositions.filter((p) => p.letterIndex === 0);
    if (gPositions.length > 0) {
      const sumX = gPositions.reduce((s, p) => s + p.x, 0);
      const sumY = gPositions.reduce((s, p) => s + p.y, 0);
      this.orbitOrigin = {
        x: sumX / gPositions.length,
        y: sumY / gPositions.length,
      };
    } else {
      this.orbitOrigin = { x: -200, y: 0 };
    }

    // Global offset for drift animation (start centered on G, drift to center text)
    this.globalOffset = {
      x: -this.orbitOrigin.x,
      y: -this.orbitOrigin.y,
    };

    // Custom updaters
    const rippleMotion = this.createRippleUpdater();
    const spawnAnimation = this.createSpawnUpdater();
    const breatheMotion = this.createBreatheUpdater();
    const mouseInteraction = this.createMouseUpdater();
    const pulseEffect = this.createPulseUpdater();

    // Particle system
    this.particles = new DashParticleSystem(this, {
      camera: this.camera,
      depthSort: true,
      maxParticles: CONFIG.maxParticles,
      blendMode: 'screen',
      updaters: [
        rippleMotion,
        spawnAnimation,
        breatheMotion,
        mouseInteraction,
        pulseEffect,
        Updaters.velocity,
        Updaters.damping(0.94),
      ],
    });

    const emitter = new ParticleEmitter({
      rate: 0,
      lifetime: { min: 999, max: 999 },
      size: CONFIG.particleSize,
      color: { r: 200, g: 200, b: 200, a: 0.8 },
    });
    this.particles.addEmitter('text', emitter);

    // Spawn particles
    this.spawnLetterParticles();
    this.spawnRippleParticles();

    this.pipeline.add(this.particles);

    console.log(`[Day5] GENUARY: ${this.targetPositions.length} letter + ${this.particles.particles.length - this.targetPositions.length} ripple particles`);

    // Mouse tracking
    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    this._onMouseLeave = () => {
      this.mouseX = -9999;
      this.mouseY = -9999;
    };
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseleave', this._onMouseLeave);
  }

  /**
   * Spawn letter particles
   */
  spawnLetterParticles() {
    const emitter = this.particles.getEmitter('text');
    const originX = this.orbitOrigin.x;
    const originY = this.orbitOrigin.y;

    for (const target of this.targetPositions) {
      const p = this.particles.acquire();
      emitter.emit(p);

      // Calculate angle and distance from G
      const dx = target.x - originX;
      const dy = target.y - originY;
      const angleToTarget = Math.atan2(dy, dx);
      const distFromOrigin = Math.sqrt(dx * dx + (dy / CONFIG.rippleEccentricity) ** 2);

      // Start position: on an orbital ring
      const ringRadius = Math.max(CONFIG.rippleBaseRadius, distFromOrigin * 0.8);
      const startAngle = angleToTarget + (Math.random() - 0.5) * 0.5;
      const startRadius = ringRadius + CONFIG.rippleSpacing + (Math.random() - 0.5) * 20;

      p.x = originX + Math.cos(startAngle) * startRadius;
      p.y = originY + Math.sin(startAngle) * startRadius * CONFIG.rippleEccentricity;
      p.z = (Math.random() - 0.5) * 10;

      p.custom.targetX = target.x;
      p.custom.targetY = target.y;
      p.custom.targetZ = target.z;
      p.custom.letterCenterX = target.letterCenterX;
      p.custom.letterCenterY = target.letterCenterY;
      p.custom.phase = target.phase;
      p.custom.brightness = target.brightness;
      p.custom.baseBrightness = target.brightness;
      p.custom.isLetter = true;
      p.custom.letterIndex = target.letterIndex;
      p.custom.glow = 0;

      p.custom.targetAngle = target.angle;
      p.custom.startAngle = angleToTarget + (Math.random() - 0.5) * 0.3;
      p.custom.angle = p.custom.startAngle;

      p.custom.targetDashScale = 1.0;
      p.custom.dashScale = 0.0;

      // Letters spawn on heartbeat (synced to pulse)
      const letterDelay = CONFIG.gDelay + target.letterIndex * CONFIG.pulsePeriod;
      const particleSpread = Math.random() * 0.3;
      p.custom.spawnDelay = letterDelay + particleSpread;
      p.custom.spawnProgress = 0;

      p.color.r = 255;
      p.color.g = 255;
      p.color.b = 255;
      p.color.a = 0;

      p.custom.targetSize = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
      p.size = 2.0;

      this.particles.particles.push(p);
    }
  }

  /**
   * Spawn initial orbital ring particles
   */
  spawnRippleParticles() {
    for (let ring = 0; ring < CONFIG.initialRings; ring++) {
      this.spawnRing(ring);
    }
  }

  /**
   * Spawn a new ring at center (called on each heartbeat)
   */
  spawnRingAtCenter() {
    const emitter = this.particles.getEmitter('text');
    const originX = this.orbitOrigin.x;
    const originY = this.orbitOrigin.y;
    const particleCount = CONFIG.rippleParticlesBase;

    for (let i = 0; i < particleCount; i++) {
      const p = this.particles.acquire();
      emitter.emit(p);

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.1;

      // Start at center
      p.x = originX + Math.cos(angle) * 10;
      p.y = originY + Math.sin(angle) * 10 * CONFIG.rippleEccentricity;
      p.z = (Math.random() - 0.5) * 10;

      p.custom.isLetter = false;
      p.custom.isRipple = true;
      p.custom.originX = originX;
      p.custom.originY = originY;
      p.custom.angle = angle;
      p.custom.ringIndex = 0;
      p.custom.orbitDirection = 1;

      // Will expand to first ring position
      p.custom.targetRadius = CONFIG.rippleBaseRadius;
      p.custom.currentRadius = 10;
      p.custom.expandSpeed = CONFIG.shockwaveSpeed * 0.8;
      p.custom.expanding = true;

      const brightness = 0.5 + Math.random() * 0.4;
      p.custom.brightness = brightness;

      const gray = Math.floor(180 + brightness * 60);
      p.color.r = gray;
      p.color.g = gray;
      p.color.b = gray;
      p.color.a = 0.6 + brightness * 0.3;

      p.size = 1.8 + Math.random() * 0.6;

      this.particles.particles.push(p);
    }
  }

  /**
   * Spawn a ring at a specific index
   */
  spawnRing(ringIndex) {
    const emitter = this.particles.getEmitter('text');
    const originX = this.orbitOrigin.x;
    const originY = this.orbitOrigin.y;

    const targetRadius = CONFIG.rippleBaseRadius + ringIndex * CONFIG.rippleSpacing;
    const particleCount = CONFIG.rippleParticlesBase + ringIndex * CONFIG.rippleParticlesGrowth;

    for (let i = 0; i < particleCount; i++) {
      const p = this.particles.acquire();
      emitter.emit(p);

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.1;

      // Start at center, expand to target
      p.x = originX + Math.cos(angle) * 10;
      p.y = originY + Math.sin(angle) * 10 * CONFIG.rippleEccentricity;
      p.z = (Math.random() - 0.5) * 10;

      p.custom.isLetter = false;
      p.custom.isRipple = true;
      p.custom.originX = originX;
      p.custom.originY = originY;
      p.custom.angle = angle;
      p.custom.ringIndex = ringIndex;
      p.custom.orbitDirection = ringIndex % 2 === 0 ? 1 : -1;

      p.custom.targetRadius = targetRadius;
      p.custom.currentRadius = 10;
      p.custom.expandSpeed = CONFIG.shockwaveSpeed * 0.8;
      p.custom.expanding = true;

      const brightness = 0.5 + Math.random() * 0.4;
      p.custom.brightness = brightness;

      const gray = Math.floor(180 + brightness * 60);
      p.color.r = gray;
      p.color.g = gray;
      p.color.b = gray;
      p.color.a = 0.6 + brightness * 0.3;

      p.size = 1.8 + Math.random() * 0.6;

      this.particles.particles.push(p);
    }
  }

  /**
   * Ripple/orbital motion updater
   */
  createRippleUpdater() {
    return (p, dt) => {
      if (!p.custom.isRipple) return;

      // Despawn if too far off screen
      const maxRadius = Math.sqrt(this.width * this.width + this.height * this.height) * 1.0;
      if (p.custom.currentRadius > maxRadius) {
        p.custom.dead = true;
        return;
      }

      // Expand from center to target radius
      if (p.custom.expanding) {
        p.custom.currentRadius += p.custom.expandSpeed * dt;
        if (p.custom.currentRadius >= p.custom.targetRadius) {
          p.custom.currentRadius = p.custom.targetRadius;
          p.custom.expanding = false;
        }
      }

      p.custom.rx = p.custom.currentRadius;
      p.custom.ry = p.custom.currentRadius * CONFIG.rippleEccentricity;

      // Orbit around origin
      p.custom.angle += CONFIG.rippleSpeed * p.custom.orbitDirection * dt / (1 + p.custom.ringIndex * 0.05);

      const baseX = p.custom.originX + Math.cos(p.custom.angle) * p.custom.rx;
      const baseY = p.custom.originY + Math.sin(p.custom.angle) * p.custom.ry;

      // Subtle wave distortion
      const wave = Math.sin(this.time * 0.8 + p.custom.angle * 2) * 3;

      p.x += (baseX - p.x) * 0.12;
      p.y += (baseY + wave - p.y) * 0.12;
    };
  }

  /**
   * Spawn animation updater
   */
  createSpawnUpdater() {
    return (p, dt) => {
      if (!p.custom.isLetter) return;

      const timeSinceSpawn = this.time - p.custom.spawnDelay;

      if (timeSinceSpawn < 0) {
        p.color.a = 0;
        return;
      }

      if (p.custom.startX === undefined) {
        p.custom.startX = p.x;
        p.custom.startY = p.y;
        p.custom.startZ = p.z;
      }

      if (p.custom.spawnProgress >= 1) return;

      p.custom.spawnProgress = Math.min(1, (p.custom.spawnProgress || 0) + dt / CONFIG.spawnDuration);

      const t = Easing.easeOutElastic(p.custom.spawnProgress);
      const tSmooth = Easing.easeOutQuad(p.custom.spawnProgress);

      p.x = p.custom.startX + (p.custom.targetX - p.custom.startX) * t;
      p.y = p.custom.startY + (p.custom.targetY - p.custom.startY) * t;
      p.z = p.custom.startZ + ((p.custom.targetZ || 0) - p.custom.startZ) * tSmooth;

      p.custom.angle = p.custom.startAngle + (p.custom.targetAngle - p.custom.startAngle) * t;
      p.custom.dashScale = tSmooth;

      const startSize = 1.0;
      const endSize = p.custom.targetSize || CONFIG.particleSize.min;
      p.size = startSize + (endSize - startSize) * tSmooth;

      p.color.a = p.custom.brightness * Math.min(1, tSmooth * 1.5);

      const finalGray = Math.floor(180 + p.custom.brightness * 75);
      const gray = Math.floor(255 - (255 - finalGray) * t);
      p.color.r = gray;
      p.color.g = gray;
      p.color.b = gray;
    };
  }

  /**
   * Breathing/idle motion updater
   */
  createBreatheUpdater() {
    return (p, dt) => {
      if (!p.custom.isLetter || p.custom.spawnProgress < 1) return;

      const phase = p.custom.phase || 0;
      const breathe = Math.sin(this.time * CONFIG.breatheSpeed + phase) * CONFIG.breatheAmount;

      const baseX = p.custom.targetX + breathe;
      const baseY = p.custom.targetY + breathe * 0.5;

      const mousePush = p.custom.mousePush || 0;
      const returnSpeed = 0.15 * (1 - mousePush * 0.7);

      p.x += (baseX - p.x) * returnSpeed;
      p.y += (baseY - p.y) * returnSpeed;

      p.vx *= 0.8;
      p.vy *= 0.8;

      const angleDrift = Noise.simplex3(p.x * 0.01, p.y * 0.01, this.time * 0.3) * 0.08;
      p.custom.angle += angleDrift * dt;
    };
  }

  /**
   * Mouse interaction updater
   */
  createMouseUpdater() {
    return (p, dt) => {
      if (this.mouseX < 0) {
        p.custom.mousePush = 0;
        return;
      }

      const proj = this.camera.project(p.x, p.y, p.z);
      const screenX = this.width / 2 + proj.x + this.globalOffset.x;
      const screenY = this.height / 2 + proj.y + this.globalOffset.y;

      const mdx = screenX - this.mouseX;
      const mdy = screenY - this.mouseY;
      const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mouseDist < CONFIG.mouseRadius && mouseDist > 1) {
        const t = 1 - mouseDist / CONFIG.mouseRadius;
        const force = t * t * CONFIG.mousePush;

        const pushX = (mdx / mouseDist) * force * dt;
        const pushY = (mdy / mouseDist) * force * dt;
        p.x += pushX;
        p.y += pushY;
        p.vx += pushX * 0.5;
        p.vy += pushY * 0.5;

        p.custom.mousePush = t;

        if (p.custom.isLetter) {
          p.custom.brightness = Math.min(1, p.custom.baseBrightness + 0.4);
          p.custom.glow = Math.min(1, (p.custom.glow || 0) + dt * 6);
        }
      } else {
        p.custom.mousePush = Math.max(0, (p.custom.mousePush || 0) - dt * 8);

        if (p.custom.isLetter && p.custom.spawnProgress >= 1) {
          p.custom.brightness = p.custom.baseBrightness;
          p.custom.glow = Math.max(0, (p.custom.glow || 0) - dt * 4);
        }
      }

      if (p.custom.isLetter) {
        const gray = Math.floor(180 + p.custom.brightness * 75);
        p.color.r = gray;
        p.color.g = gray;
        p.color.b = gray;
      }
    };
  }

  /**
   * Pulse/heartbeat effect updater
   */
  createPulseUpdater() {
    return (p, dt) => {
      if (this.time < CONFIG.gDelay) return;

      // Letter particles: react to shockwaves
      if (p.custom.isLetter && p.custom.spawnProgress >= 1) {
        const dx = p.custom.targetX - this.orbitOrigin.x;
        const dy = p.custom.targetY - this.orbitOrigin.y;
        const distFromG = Math.sqrt(dx * dx + dy * dy) || 1;

        let letterPulseIntensity = 0;
        for (const wave of this.shockwaves) {
          const waveDist = Math.abs(distFromG - wave.radius);
          const waveWidth = 120;

          if (waveDist < waveWidth) {
            const proximity = 1 - (waveDist / waveWidth);
            const waveAge = (this.time - wave.startTime) / CONFIG.pulsePeriod;
            const decay = Math.max(0, 1 - waveAge * 0.5);
            letterPulseIntensity = Math.max(letterPulseIntensity, Easing.easeOutElastic(proximity) * decay);
          }
        }

        const pushStrength = CONFIG.pulseStrength * letterPulseIntensity;

        let vibX = 0, vibY = 0;
        if (letterPulseIntensity > 0.1) {
          const vibAmount = CONFIG.pulseVibration * letterPulseIntensity;
          vibX = (Math.random() - 0.5) * vibAmount;
          vibY = (Math.random() - 0.5) * vibAmount;
        }

        const targetX = p.custom.targetX + (dx / distFromG) * pushStrength + vibX;
        const targetY = p.custom.targetY + (dy / distFromG) * pushStrength + vibY;

        p.x += (targetX - p.x) * 0.18;
        p.y += (targetY - p.y) * 0.18;

        const brightBoost = letterPulseIntensity * 30;
        p.color.r = Math.min(255, 180 + p.custom.brightness * 75 + brightBoost);
        p.color.g = Math.min(255, 180 + p.custom.brightness * 75 + brightBoost);
        p.color.b = Math.min(255, 180 + p.custom.brightness * 75 + brightBoost);
      }

      // Ripple particles: react to shockwaves
      if (p.custom.isRipple) {
        const dx = p.x - this.orbitOrigin.x;
        const dy = p.y - this.orbitOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        for (const wave of this.shockwaves) {
          const shockwaveDist = Math.abs(dist - wave.radius);
          const shockwaveWidth = 60;

          if (shockwaveDist < shockwaveWidth) {
            const proximity = 1 - (shockwaveDist / shockwaveWidth);
            const age = (this.time - wave.startTime) / CONFIG.pulsePeriod;
            const decay = Math.max(0, 1 - age);
            const pushStrength = CONFIG.shockwaveStrength * proximity * decay * dt;

            p.x += (dx / dist) * pushStrength;
            p.y += (dy / dist) * pushStrength;

            p.color.a = Math.min(1, (p.color.a || 0.6) + 0.15 * proximity * decay);
          }
        }
      }
    };
  }

  stop() {
    super.stop();
    if (this.camera) this.camera.disableMouseControl();
    if (this._onMouseMove) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
    }
    if (this._onMouseLeave) {
      this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.camera.update(dt);

    // Animate global offset: drift from G-centered to text-centered
    const driftProgress = Math.min(1, this.time / CONFIG.driftDuration);
    const t = this.easeInOutQuad(driftProgress);

    const startOffsetX = -this.orbitOrigin.x;
    const startOffsetY = -this.orbitOrigin.y;
    this.globalOffset.x = startOffsetX * (1 - t);
    this.globalOffset.y = startOffsetY * (1 - t);

    // Heartbeat pulse - spawn shockwave and expand rings on each beat
    if (this.time >= CONFIG.gDelay) {
      const timeSinceStart = this.time - CONFIG.gDelay;
      const currentBeat = Math.floor(timeSinceStart / CONFIG.pulsePeriod);

      if (currentBeat > this.lastPulseBeat) {
        this.lastPulseBeat = currentBeat;

        // Spawn shockwave
        this.shockwaves.push({
          startTime: this.time,
          radius: 0,
        });

        // Push ALL existing rings outward
        for (const p of this.particles.particles) {
          if (p.custom?.isRipple) {
            p.custom.targetRadius += CONFIG.rippleSpacing;
            p.custom.expanding = true;
          }
        }

        // Spawn new ring at center
        if (this.particles.particles.length < CONFIG.maxParticles) {
          this.spawnRingAtCenter();
        }
      }

      // Expand shockwaves and remove old ones
      this.shockwaves = this.shockwaves.filter((wave) => {
        wave.radius = (this.time - wave.startTime) * CONFIG.shockwaveSpeed;
        return wave.radius < 1500;
      }).slice(-5);

      // Clean up dead particles
      this.particles.particles = this.particles.particles.filter((p) => !p.custom?.dead);
    }
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  render() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply global offset (drift from G to center)
    this.ctx.save();
    this.ctx.translate(this.globalOffset.x, this.globalOffset.y);
    this.pipeline.render(this.ctx);
    this.ctx.restore();
  }
}

/**
 * Create Day 5 visualization
 * 
 * Factory function that creates and starts the Ripple Text demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {RippleTextDemo} returns.game - The game instance
 */
export default function day05(canvas) {
  const game = new RippleTextDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
