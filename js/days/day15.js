/**
 * Genuary 2026 - Day 15
 * Prompt: "Invisible object"
 * 
 * @fileoverview THE BLACK HOLE - Gravitational lensing visualization
 * 
 * An invisible singularity revealed only through:
 * - Gravitational lensing distorting background stars
 * - Light from the accretion disk bending around it
 * - The dark silhouette where no light escapes
 * 
 * The black hole is truly invisible - we see only its effects.
 * Click to spawn a burst of matter. Drag to orbit the view.
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Camera3D, Painter, Easing, applyGravitationalLensing, keplerianOmega } from '@guinetik/gcanvas';

const CONFIG = {
  // Black hole - size as fraction of screen
  bhRadiusRatio: 0.045, // Smaller ratio = more of disk visible
  bhMass: 1.0,

  // Starfield - base count, scales with screen area
  starCountBase: 225,
  starCountPerMegapixel: 800,
  starFieldRadius: 1200,

  // Lensing - proportional to black hole size
  lensRadiusMultiplier: 8,
  lensStrengthMultiplier: 2.5,
  lensFalloff: 0.007,
  occlusionRadius: 2.6, // Photon sphere multiplier

  // Accretion disk
  diskInnerRadius: 1.8,  // Multiplier of bhRadius
  diskOuterRadius: 8.0,
  diskParticles: 3000,
  diskThickness: 0.15,
  baseOrbitalSpeed: 0.6,

  // Colors - realistic heat gradient (white-hot to deep red)
  colorHot: { r: 255, g: 250, b: 220 },   // White-hot inner
  colorMid: { r: 255, g: 160, b: 50 },    // Orange middle
  colorCool: { r: 180, g: 40, b: 20 },    // Deep red outer

  // Particle size
  particleSizeMin: 0.5,
  particleSizeMax: 1,
  particleScale: 0.0025,  // Base scale multiplier

  // Camera
  perspective: 800,
  initialTilt: 0.4,  // Start tilted to see the disk
};

// Star types for variety
const STAR_TYPES = [
  { size: 1.5, brightness: 1.0 },
  { size: 1.0, brightness: 0.7 },
  { size: 0.6, brightness: 0.5 },
];

/**
 * Black Hole Demo
 * 
 * Main game class for Day 15, creating a black hole visualization with
 * gravitational lensing, accretion disk, and particle effects.
 * 
 * @class BlackHoleDemo
 * @extends {Game}
 */
class BlackHoleDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    const minDim = Math.min(this.width, this.height);
    const screenArea = this.width * this.height;
    const megapixels = screenArea / 1000000;

    this.baseScale = minDim;
    this.bhRadius = minDim * CONFIG.bhRadiusRatio;

    // Scale star count with screen area
    this.starCount = Math.floor(CONFIG.starCountBase + CONFIG.starCountPerMegapixel * megapixels);

    // Scale lensing with black hole size
    this.lensEffectRadius = this.bhRadius * CONFIG.lensRadiusMultiplier;
    this.lensStrength = this.bhRadius * CONFIG.lensStrengthMultiplier;

    // Camera perspective scales with screen size for consistent view
    const perspectiveScale = Math.max(1, minDim / 600);
    this.camera = new Camera3D({
      perspective: CONFIG.perspective * perspectiveScale,
      rotationX: CONFIG.initialTilt,
      rotationY: 0,
      sensitivity: 0.004,
      inertia: true,
      friction: 0.92,
      clampX: false,
      autoRotate: true,
      autoRotateSpeed: 0.08,
      autoRotateAxis: 'y',
    });
    this.camera.enableMouseControl(this.canvas);

    this.time = 0;
    this.lensingStrength = 1.0;

    // Mouse tracking for spawning
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.mouseDownPos = null;
    this.isDragging = false;

    // Initialize components
    this.initStarfield();
    this.initAccretionDisk();
    this.initFallingMatter();

    // Track mouse position
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    // Track drag vs click
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseDownPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.mouseDownPos) {
        const rect = this.canvas.getBoundingClientRect();
        const dx = (e.clientX - rect.left) - this.mouseDownPos.x;
        const dy = (e.clientY - rect.top) - this.mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          this.isDragging = true;
        }
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging && this.mouseDownPos) {
        this.spawnMatterAtMouse();
      }
      this.mouseDownPos = null;
      this.isDragging = false;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
        this.mouseDownPos = { x: this.mouseX, y: this.mouseY };
        this.isDragging = false;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.mouseDownPos) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const dx = (touch.clientX - rect.left) - this.mouseDownPos.x;
        const dy = (touch.clientY - rect.top) - this.mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          this.isDragging = true;
        }
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isDragging && this.mouseDownPos) {
        this.spawnMatterAtMouse();
      }
      this.mouseDownPos = null;
      this.isDragging = false;
    });
  }

  initStarfield() {
    this.stars = [];

    for (let i = 0; i < this.starCount; i++) {
      // Distribute stars in a sphere around the scene
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = CONFIG.starFieldRadius * (0.5 + Math.random() * 0.5);

      const type = STAR_TYPES[Math.floor(Math.random() * STAR_TYPES.length)];

      this.stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        type,
        twinkleSpeed: 1 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  initAccretionDisk() {
    this.diskParticles = [];

    const innerR = this.bhRadius * CONFIG.diskInnerRadius;
    const outerR = this.bhRadius * CONFIG.diskOuterRadius;

    for (let i = 0; i < CONFIG.diskParticles; i++) {
      // Bias toward inner edge for lensing visibility
      const t = Math.pow(Math.random(), 0.5);
      const distance = innerR + (outerR - innerR) * t;
      const angle = Math.random() * Math.PI * 2;

      // Keplerian speed
      const speed = keplerianOmega(distance, CONFIG.bhMass, CONFIG.baseOrbitalSpeed, outerR);

      // Small vertical offset for disk thickness
      const yOffset = (Math.random() - 0.5) * this.bhRadius * CONFIG.diskThickness;

      this.diskParticles.push({
        angle,
        distance,
        yOffset,
        speed,
        size: CONFIG.particleSizeMin + Math.random() * (CONFIG.particleSizeMax - CONFIG.particleSizeMin),
        baseColor: this.getHeatColor(distance, innerR, outerR),
      });
    }
  }

  getHeatColor(distance, innerR, outerR) {
    const t = Math.max(0, Math.min(1, (distance - innerR) / (outerR - innerR)));

    let r, g, b;
    if (t < 0.5) {
      // Inner: hot -> mid
      const t2 = t * 2;
      r = CONFIG.colorHot.r + (CONFIG.colorMid.r - CONFIG.colorHot.r) * t2;
      g = CONFIG.colorHot.g + (CONFIG.colorMid.g - CONFIG.colorHot.g) * t2;
      b = CONFIG.colorHot.b + (CONFIG.colorMid.b - CONFIG.colorHot.b) * t2;
    } else {
      // Outer: mid -> cool
      const t2 = (t - 0.5) * 2;
      r = CONFIG.colorMid.r + (CONFIG.colorCool.r - CONFIG.colorMid.r) * t2;
      g = CONFIG.colorMid.g + (CONFIG.colorCool.g - CONFIG.colorMid.g) * t2;
      b = CONFIG.colorMid.b + (CONFIG.colorCool.b - CONFIG.colorMid.b) * t2;
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }

  initFallingMatter() {
    // Particles that fall toward the black hole
    this.fallingParticles = [];
  }

  spawnMatterAtMouse() {
    // Convert screen position to 3D world position, accounting for camera rotation
    const cx = this.width / 2;
    const cy = this.height / 2;
    const screenX = this.mouseX - cx;
    const screenY = this.mouseY - cy;

    // Start with position in camera space
    const spawnDist = 350; // Distance from center in camera space
    const perspectiveScale = this.camera.perspective / (this.camera.perspective - spawnDist);
    
    // Position in camera space (before rotation)
    let camX = screenX / perspectiveScale;
    let camY = screenY / perspectiveScale;
    let camZ = -spawnDist;

    // Reverse camera X rotation (tilt)
    const cosX = Math.cos(-this.camera.rotationX);
    const sinX = Math.sin(-this.camera.rotationX);
    let y1 = camY * cosX - camZ * sinX;
    let z1 = camY * sinX + camZ * cosX;

    // Reverse camera Y rotation (orbit)
    const cosY = Math.cos(-this.camera.rotationY);
    const sinY = Math.sin(-this.camera.rotationY);
    let worldX = camX * cosY - z1 * sinY;
    let worldZ = camX * sinY + z1 * cosY;
    let worldY = y1;

    // Single chunk of rock - no trail, just falls straight in
    this.fallingParticles.push({
      x: worldX,
      y: worldY,
      z: worldZ,
      vx: 0,
      vy: 0,
      vz: 0, // No initial velocity - gravity does all the work
      size: 4 + Math.random() * 3,
      age: 0,
      maxAge: 20, // Long lifetime to reach the black hole
    });

    // Cap falling particles
    if (this.fallingParticles.length > 50) {
      this.fallingParticles = this.fallingParticles.slice(-40);
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.camera.update(dt);

    // Update disk particles
    for (let i = this.diskParticles.length - 1; i >= 0; i--) {
      const p = this.diskParticles[i];
      p.angle += p.speed * dt;

      // Age burst particles
      if (p.age !== undefined) {
        p.age += dt;
        if (p.age > p.maxAge) {
          this.diskParticles.splice(i, 1);
        }
      }
    }

    // Update falling particles - exponential acceleration toward black hole
    const baseStrength = 300;
    const maxDist = 500; // Distance at which acceleration starts ramping up
    const eventHorizon = this.bhRadius * 2;

    for (let i = this.fallingParticles.length - 1; i >= 0; i--) {
      const p = this.fallingParticles[i];
      
      // Distance to center (black hole is at origin)
      const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      
      if (dist > 1) {
        // Normalized distance (1 = far, 0 = at event horizon)
        const t = Math.max(0, Math.min(1, dist / maxDist));
        
        // Exponential acceleration - gets MUCH stronger as particle approaches
        // easeInExpo: slow start, explosive end (perfect for gravity well)
        const easedT = 1 - Easing.easeInExpo(t);
        const force = baseStrength * (1 + easedT * 50);
        
        // Direction toward center
        const nx = -p.x / dist;
        const ny = -p.y / dist;
        const nz = -p.z / dist;
        
        p.vx += nx * force * dt;
        p.vy += ny * force * dt;
        p.vz += nz * force * dt;
        
        // Slight orbital component for spiral
        p.vx += ny * force * dt * 0.1;
        p.vy += -nx * force * dt * 0.1;
      }
      
      // Apply velocity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      
      // Age
      p.age += dt;
      
      // Remove if consumed by black hole or too old
      if (dist < eventHorizon || p.age > p.maxAge) {
        this.fallingParticles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Motion blur trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, w, h);

    // Render starfield with lensing
    this.renderStarfield(ctx, cx, cy);

    // Render falling matter
    this.renderFallingMatter(ctx, cx, cy);

    // Render accretion disk
    this.renderDisk(ctx, cx, cy);

    // Render black hole shadow (the "invisible" object)
    this.renderBlackHole(ctx, cx, cy);
  }

  renderStarfield(ctx, cx, cy) {
    const time = this.time;
    const lensingActive = this.lensingStrength > 0;
    const lensRadius = this.lensEffectRadius;
    const lensStr = this.lensStrength * this.lensingStrength;
    const occlusionR = this.bhRadius * CONFIG.occlusionRadius;
    const occlusionRSq = occlusionR * occlusionR;
    const lensRadiusSq = lensRadius * lensRadius;
    const w = this.width;
    const h = this.height;

    for (const star of this.stars) {
      // Project star position
      const projected = this.camera.project(star.x, star.y, star.z);
      if (projected.scale <= 0) continue;

      let screenX = projected.x;
      let screenY = projected.y;
      
      // Fast squared distance check (avoid sqrt when possible)
      const distSq = screenX * screenX + screenY * screenY;

      // Apply gravitational lensing only for stars near the black hole
      if (projected.z > 0 && lensingActive && distSq < lensRadiusSq) {
        const lensed = applyGravitationalLensing(
          screenX, screenY,
          lensRadius,
          lensStr,
          CONFIG.lensFalloff,
          5
        );
        screenX = lensed.x;
        screenY = lensed.y;
      }

      // Occlusion check using squared distance (skip sqrt)
      if (distSq < occlusionRSq) continue;

      const finalX = cx + screenX;
      const finalY = cy + screenY;

      // Viewport cull
      if (finalX < -10 || finalX > w + 10 || finalY < -10 || finalY > h + 10) continue;

      // Twinkle
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = 0.5 + 0.5 * twinkle;
      if (alpha < 0.1) continue;

      // Draw star - use fillRect for tiny stars (much faster than arc)
      const size = star.type.size * projected.scale * star.type.brightness;
      const brightness = Math.round(180 + star.type.brightness * 75);

      ctx.fillStyle = this._getRgba(brightness, brightness, brightness, alpha * 0.8);
      
      if (size < 1.5) {
        // Tiny stars: use fast rectangle
        const s = Math.max(1, size);
        ctx.fillRect(finalX - s * 0.5, finalY - s * 0.5, s, s);
      } else {
        // Larger stars: use arc for round shape
        ctx.beginPath();
        ctx.arc(finalX, finalY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderDisk(ctx, cx, cy) {
    const renderList = [];
    
    // CACHE camera trig values - computed ONCE, not 3000 times!
    const cosY = Math.cos(this.camera.rotationY);
    const sinY = Math.sin(this.camera.rotationY);
    const cosX = Math.cos(this.camera.rotationX);
    const sinX = Math.sin(this.camera.rotationX);
    const cameraTilt = Math.abs(sinX);
    const camRotY = this.camera.rotationY;
    
    // Pre-compute constants
    const bhRadius = this.bhRadius;
    const bhRadius6 = bhRadius * 6;
    const bhRadius18 = bhRadius * 1.8;
    const bhRadius3 = bhRadius * 3;
    const bhRadius5 = bhRadius * 5.0;
    const bhRadius2 = bhRadius * 2.0;
    const lensingActive = this.lensingStrength > 0;
    const lensingStr = this.lensingStrength;
    const edgeOnFactor = 1 - cameraTilt;
    const doVerticalCurves = cameraTilt > 0.05;
    const halfPi = Math.PI * 0.5;
    const perspective = this.camera.perspective;

    for (const p of this.diskParticles) {
      // World position (flat disk in x-z plane)
      const cosAngle = Math.cos(p.angle);
      const sinAngle = Math.sin(p.angle);
      const x = cosAngle * p.distance;
      const y = p.yOffset;
      const z = sinAngle * p.distance;

      // Camera transform (using cached trig values)
      let xCam = x * cosY - z * sinY;
      let zCam = x * sinY + z * cosY;
      let yCam = y * cosX - zCam * sinX;
      zCam = y * sinX + zCam * cosX;

      // Gravitational lensing on disk particles
      const xCamSq = xCam * xCam;
      const yCamSq = yCam * yCam;
      const currentRSq = xCamSq + yCamSq;
      const currentR = Math.sqrt(currentRSq);
      const isBehind = zCam > 0;

      if (lensingActive && currentR < bhRadius6) {
        const lensFactor = Math.exp(-currentR / bhRadius18);
        const warp = lensFactor * 1.2 * lensingStr;

        // Asymmetric warping for Interstellar effect
        const angleRel = p.angle + camRotY;
        const isUpperHalf = Math.sin(angleRel) > 0;

        if (currentR > 0) {
          let radialWarp = warp;
          if (!isUpperHalf && isBehind) {
            radialWarp *= 1.0 - edgeOnFactor * 0.6;
          }
          const ratio = (currentR + bhRadius18 * radialWarp) / currentR;
          xCam *= ratio;
          yCam *= ratio;
        }

        // Vertical curves when tilted
        if (doVerticalCurves) {
          const normalizedX = xCam / bhRadius5;
          const arcCurve = Math.max(0, Math.cos(normalizedX * halfPi));
          const depthFactor = isBehind
            ? Math.min(1.0, zCam / bhRadius3)
            : Math.min(1.0, Math.abs(zCam) / bhRadius3);
          const ringHeight = bhRadius2 * lensFactor * depthFactor * cameraTilt;

          if (isBehind) {
            if (isUpperHalf) {
              yCam -= ringHeight * arcCurve;
            } else {
              yCam += ringHeight * arcCurve * 0.5;
            }
          } else {
            yCam += ringHeight * arcCurve * 0.4;
          }
        }
      }

      // Perspective projection (using cached perspective value)
      const perspectiveScale = perspective / (perspective + zCam);
      if (zCam < -perspective + 10) continue;

      const screenX = xCam * perspectiveScale;
      const screenY = yCam * perspectiveScale;

      // Doppler beaming - approaching side brighter
      const velocityDir = Math.cos(p.angle + this.camera.rotationY);
      const doppler = 1 + velocityDir * 0.4;

      // Age fade for burst particles
      let alpha = 1;
      if (p.age !== undefined) {
        const ageRatio = p.age / p.maxAge;
        alpha = 1 - Math.pow(ageRatio, 2);
      }

      renderList.push({
        x: screenX,
        y: screenY,
        z: zCam,
        scale: perspectiveScale,
        color: p.baseColor,
        doppler,
        alpha,
        size: p.size,
      });
    }

    // Sort back to front
    renderList.sort((a, b) => b.z - a.z);

    // Pre-compute render data to avoid per-particle string allocation
    const baseScale = this.baseScale * CONFIG.particleScale;
    const glowParticles = []; // Collect glow particles for batched rendering

    // PASS 1: Render all base particles (no composite switching)
    for (const item of renderList) {
      const { r, g, b } = item.color;
      const size = baseScale * item.scale * item.size;
      if (size < 0.1) continue;

      // Apply Doppler brightness
      const dr = Math.min(255, Math.round(r * item.doppler));
      const dg = Math.min(255, Math.round(g * item.doppler));
      const db = Math.min(255, Math.round(b * item.doppler));
      const finalAlpha = Math.max(0, Math.min(1, item.alpha * item.doppler * 0.8));

      const px = cx + item.x;
      const py = cy + item.y;

      // Use cached color format
      ctx.fillStyle = this._getRgba(dr, dg, db, finalAlpha);
      
      // Use fillRect for tiny particles (much faster than arc)
      if (size < 1.5) {
        ctx.fillRect(px - size * 0.5, py - size * 0.5, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Collect bright particles for glow pass
      if (item.doppler > 1.1 && item.alpha > 0.5) {
        glowParticles.push({
          x: px,
          y: py,
          size: size * 1.5,
          color: this._getRgba(dr, dg, db, finalAlpha * 0.3),
        });
      }
    }

    // PASS 2: Render all glow particles
    if (glowParticles.length > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (const glow of glowParticles) {
        ctx.fillStyle = glow.color;
        if (glow.size < 2) {
          ctx.fillRect(glow.x - glow.size, glow.y - glow.size, glow.size * 2, glow.size * 2);
        } else {
          ctx.beginPath();
          ctx.arc(glow.x, glow.y, glow.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Get cached RGBA color string to avoid per-particle string allocation.
   * Uses a simple cache for recently used colors.
   */
  _getRgba(r, g, b, a) {
    // Quantize alpha to reduce cache entries (0.01 precision)
    const aKey = Math.round(a * 100);
    const key = (r << 24) | (g << 16) | (b << 8) | aKey;
    
    if (!this._colorCache) {
      this._colorCache = new Map();
    }
    
    let color = this._colorCache.get(key);
    if (!color) {
      color = `rgba(${r},${g},${b},${(aKey / 100).toFixed(2)})`;
      this._colorCache.set(key, color);
      
      // Limit cache size to prevent memory bloat
      if (this._colorCache.size > 1000) {
        // Clear oldest entries (Map maintains insertion order)
        const iterator = this._colorCache.keys();
        for (let i = 0; i < 500; i++) {
          this._colorCache.delete(iterator.next().value);
        }
      }
    }
    return color;
  }

  renderFallingMatter(ctx, cx, cy) {
    if (!this.fallingParticles || this.fallingParticles.length === 0) return;

    const maxDist = 400;
    const spaghettiStart = 250;
    
    // Collect render data for batched drawing
    const coreParticles = [];
    const glowParticles = [];
    const hotTips = [];

    for (const p of this.fallingParticles) {
      const projected = this.camera.project(p.x, p.y, p.z);
      if (!projected || projected.scale <= 0) continue;

      const screenX = cx + projected.x;
      const screenY = cy + projected.y;

      if (screenX < -50 || screenX > this.width + 50 || screenY < -50 || screenY > this.height + 50) continue;

      const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      const distRatio = Math.min(1, dist / maxDist);

      const r = 255;
      const g = Math.round(200 * distRatio);
      const b = Math.round(150 * distRatio * distRatio);

      const redshiftFade = Math.pow(distRatio, 0.5);
      const alpha = redshiftFade * 0.9;

      const baseSize = Math.max(1, p.size * projected.scale);

      const spaghettiT = Math.max(0, 1 - dist / spaghettiStart);
      const stretch = 1 + Easing.easeInExpo(spaghettiT) * 15;
      const squeeze = 1 / (1 + spaghettiT * 2);

      const dirX = -screenX + cx;
      const dirY = -screenY + cy;
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
      const angle = Math.atan2(dirY / dirLen, dirX / dirLen);

      const stretchLen = baseSize * stretch;
      const stretchWidth = baseSize * squeeze;

      // Collect for batched rendering
      glowParticles.push({
        x: screenX, y: screenY, angle,
        w: stretchLen * 1.5, h: stretchWidth * 2,
        color: this._getRgba(r, g, b, alpha * 0.2),
      });

      coreParticles.push({
        x: screenX, y: screenY, angle,
        w: stretchLen, h: stretchWidth,
        color: this._getRgba(r, g, b, alpha),
      });

      if (stretch > 2) {
        hotTips.push({
          x: screenX, y: screenY, angle,
          offsetX: stretchLen * 0.6,
          w: stretchLen * 0.3, h: stretchWidth * 0.5,
          color: this._getRgba(255, 255, 255, alpha * 0.6),
        });
      }
    }

    // PASS 1: All glow particles
    if (glowParticles.length > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (const p of glowParticles) {
        ctx.fillStyle = p.color;
        this._drawRotatedEllipse(ctx, p.x, p.y, p.w, p.h, p.angle);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // PASS 2: All core particles (no composite changes)
    for (const p of coreParticles) {
      ctx.fillStyle = p.color;
      this._drawRotatedEllipse(ctx, p.x, p.y, p.w, p.h, p.angle);
    }

    // PASS 3: All hot tips (no composite changes)
    for (const p of hotTips) {
      ctx.fillStyle = p.color;
      this._drawRotatedEllipseOffset(ctx, p.x, p.y, p.w, p.h, p.angle, p.offsetX);
    }
  }

  /**
   * Draw a rotated ellipse without using save/restore (faster in Firefox).
   */
  _drawRotatedEllipse(ctx, x, y, w, h, angle) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.5, w), Math.max(0.5, h), angle, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a rotated ellipse with offset along the angle direction.
   */
  _drawRotatedEllipseOffset(ctx, x, y, w, h, angle, offset) {
    const ox = x + Math.cos(angle) * offset;
    const oy = y + Math.sin(angle) * offset;
    ctx.beginPath();
    ctx.ellipse(ox, oy, Math.max(0.5, w), Math.max(0.5, h), angle, 0, Math.PI * 2);
    ctx.fill();
  }

  renderBlackHole(ctx, cx, cy) {
    // The black hole is truly invisible - no visual rendering at all.
    // Its presence is revealed only through its effects:
    // - Gravitational lensing distorts background stars
    // - Stars within the photon sphere are occluded
    // - The accretion disk bends around the invisible mass
  }
}

/**
 * Create Day 15 visualization
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {BlackHoleDemo} returns.game - The game instance
 */
export default function day15(canvas) {
  const game = new BlackHoleDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
