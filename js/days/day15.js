/**
 * Genuary 2026 - Day 15
 * Prompt: "Invisible object (shadows)"
 *
 * THE BLACK HOLE
 * An invisible singularity revealed only through:
 * - Gravitational lensing distorting background stars
 * - Light from the accretion disk bending around it
 * - The dark silhouette where no light escapes
 *
 * The black hole is truly invisible - we see only its effects.
 * Click to spawn a burst of matter. Drag to orbit the view.
 */

import { Game, Camera3D, Painter, applyGravitationalLensing, keplerianOmega } from '@guinetik/gcanvas';

const CONFIG = {
  // Black hole
  bhRadius: 50,
  bhMass: 1.0,

  // Starfield
  starCount: 800,
  starFieldRadius: 1200,

  // Lensing
  lensEffectRadius: 600,
  lensStrength: 180,
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

class BlackHoleDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    const minDim = Math.min(this.width, this.height);
    this.baseScale = minDim;
    this.bhRadius = minDim * 0.06;

    // Camera with orbit controls
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
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

    // Initialize components
    this.initStarfield();
    this.initAccretionDisk();

    // Click to burst matter
    this.canvas.addEventListener('click', () => this.burstMatter());
    this.canvas.addEventListener('touchend', (e) => {
      if (!this.camera._isDragging) {
        this.burstMatter();
      }
    });
  }

  initStarfield() {
    this.stars = [];

    for (let i = 0; i < CONFIG.starCount; i++) {
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
    const t = (distance - innerR) / (outerR - innerR);

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

  burstMatter() {
    // Add a burst of particles
    const innerR = this.bhRadius * CONFIG.diskInnerRadius;
    const outerR = this.bhRadius * CONFIG.diskOuterRadius;
    const burstAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < 100; i++) {
      const t = Math.pow(Math.random(), 0.5);
      const distance = innerR + (outerR - innerR) * t;
      const angle = burstAngle + (Math.random() - 0.5) * 0.5;
      const speed = keplerianOmega(distance, CONFIG.bhMass, CONFIG.baseOrbitalSpeed, outerR);
      const yOffset = (Math.random() - 0.5) * this.bhRadius * CONFIG.diskThickness * 2;

      this.diskParticles.push({
        angle,
        distance,
        yOffset,
        speed: speed * (0.8 + Math.random() * 0.4),
        size: CONFIG.particleSizeMin + Math.random() * (CONFIG.particleSizeMax - CONFIG.particleSizeMin),
        baseColor: this.getHeatColor(distance, innerR, outerR),
        age: 0,
        maxAge: 8 + Math.random() * 4,
      });
    }

    // Cap particles
    if (this.diskParticles.length > 3000) {
      this.diskParticles = this.diskParticles.slice(-2500);
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

    // Render accretion disk
    this.renderDisk(ctx, cx, cy);

    // Render black hole shadow (the "invisible" object)
    this.renderBlackHole(ctx, cx, cy);
  }

  renderStarfield(ctx, cx, cy) {
    const time = this.time;

    for (const star of this.stars) {
      // Project star position
      const projected = this.camera.project(star.x, star.y, star.z);
      if (projected.scale <= 0) continue;

      let screenX = projected.x;
      let screenY = projected.y;

      // Apply gravitational lensing for stars behind the black hole
      if (projected.z > 0 && this.lensingStrength > 0) {
        const lensed = applyGravitationalLensing(
          screenX, screenY,
          CONFIG.lensEffectRadius,
          CONFIG.lensStrength * this.lensingStrength,
          CONFIG.lensFalloff,
          5
        );
        screenX = lensed.x;
        screenY = lensed.y;
      }

      // Occlusion check - stars within photon sphere are hidden
      const distFromCenter = Math.sqrt(screenX * screenX + screenY * screenY);
      const occlusionR = this.bhRadius * CONFIG.occlusionRadius;
      if (distFromCenter < occlusionR) continue;

      const finalX = cx + screenX;
      const finalY = cy + screenY;

      // Viewport cull
      if (finalX < -10 || finalX > this.width + 10 || finalY < -10 || finalY > this.height + 10) continue;

      // Twinkle
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = 0.5 + 0.5 * twinkle;
      if (alpha < 0.1) continue;

      // Draw star with glow
      const size = star.type.size * projected.scale * star.type.brightness;
      const brightness = Math.round(180 + star.type.brightness * 75);

      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(finalX, finalY, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  renderDisk(ctx, cx, cy) {
    const renderList = [];
    const cameraTilt = Math.abs(Math.sin(this.camera.rotationX));

    for (const p of this.diskParticles) {
      // World position (flat disk in x-z plane)
      const x = Math.cos(p.angle) * p.distance;
      const y = p.yOffset;
      const z = Math.sin(p.angle) * p.distance;

      // Camera transform
      const cosY = Math.cos(this.camera.rotationY);
      const sinY = Math.sin(this.camera.rotationY);
      let xCam = x * cosY - z * sinY;
      let zCam = x * sinY + z * cosY;

      const cosX = Math.cos(this.camera.rotationX);
      const sinX = Math.sin(this.camera.rotationX);
      let yCam = y * cosX - zCam * sinX;
      zCam = y * sinX + zCam * cosX;

      // Gravitational lensing on disk particles
      const currentR = Math.sqrt(xCam * xCam + yCam * yCam);
      const isBehind = zCam > 0;

      if (this.lensingStrength > 0 && currentR < this.bhRadius * 6) {
        const ringRadius = this.bhRadius * 1.8;
        const lensFactor = Math.exp(-currentR / (this.bhRadius * 1.8));
        const warp = lensFactor * 1.2 * this.lensingStrength;

        // Asymmetric warping for Interstellar effect
        const angleRel = p.angle + this.camera.rotationY;
        const isUpperHalf = Math.sin(angleRel) > 0;
        const edgeOnFactor = 1 - cameraTilt;

        if (currentR > 0) {
          let radialWarp = warp;
          if (!isUpperHalf && isBehind) {
            radialWarp *= 1.0 - edgeOnFactor * 0.6;
          }
          const ratio = (currentR + ringRadius * radialWarp) / currentR;
          xCam *= ratio;
          yCam *= ratio;
        }

        // Vertical curves when tilted
        if (cameraTilt > 0.05) {
          const arcWidth = this.bhRadius * 5.0;
          const normalizedX = xCam / arcWidth;
          const arcCurve = Math.max(0, Math.cos(normalizedX * Math.PI * 0.5));
          const depthFactor = isBehind
            ? Math.min(1.0, zCam / (this.bhRadius * 3))
            : Math.min(1.0, Math.abs(zCam) / (this.bhRadius * 3));
          const ringHeight = this.bhRadius * 2.0 * lensFactor * depthFactor * cameraTilt;

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

      // Perspective projection
      const perspectiveScale = this.camera.perspective / (this.camera.perspective + zCam);
      if (zCam < -this.camera.perspective + 10) continue;

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

    // Render particles
    for (const item of renderList) {
      const { r, g, b } = item.color;
      const size = this.baseScale * CONFIG.particleScale * item.scale * item.size;
      if (size < 0.1) continue;

      // Apply Doppler brightness
      const dr = Math.min(255, Math.round(r * item.doppler));
      const dg = Math.min(255, Math.round(g * item.doppler));
      const db = Math.min(255, Math.round(b * item.doppler));

      const finalAlpha = Math.max(0, Math.min(1, item.alpha * item.doppler * 0.8));

      ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${finalAlpha})`;
      ctx.beginPath();
      ctx.arc(cx + item.x, cy + item.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Glow for bright particles
      if (item.doppler > 1.1 && item.alpha > 0.5) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${finalAlpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(cx + item.x, cy + item.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  renderBlackHole(ctx, cx, cy) {
    // The black hole is invisible - we only render its silhouette
    // A pure black circle that blocks all light

    const projected = this.camera.project(0, 0, 0);
    const screenR = this.bhRadius * projected.scale;

    // Pure black center - the invisible object
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, screenR * 1.2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, screenR * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Subtle event horizon edge glow (very faint)
    const edgeGlow = ctx.createRadialGradient(cx, cy, screenR * 0.95, cx, cy, screenR * 1.15);
    edgeGlow.addColorStop(0, 'rgba(0, 50, 30, 0)');
    edgeGlow.addColorStop(0.5, 'rgba(0, 80, 50, 0.08)');
    edgeGlow.addColorStop(1, 'rgba(0, 50, 30, 0)');

    ctx.fillStyle = edgeGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, screenR * 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Create Day 15 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day15(canvas) {
  const game = new BlackHoleDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
