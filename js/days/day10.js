/**
 * Genuary 2026 - Day 10
 * Prompt: "Polar coordinates"
 *
 * STRING THEORY — Hyperbolic Worldsheet (Crochet Spacetime)
 *
 * We build a polar grid mesh (r, θ), then lift it into 3D with a height field:
 *
 *   z = (r^exponent) * amplitude * sin(waves*θ + (r*flow - t*speed)) + noise(...)
 *
 * It’s a “spacetime fabric” that is fundamentally parameterized by polar coordinates.
 *
 * Controls:
 * - Drag: orbit camera
 * - Click: inject energy (more chaos), then it settles
 * - Shift+Click: reseed noise
 */

import {
  Camera3D,
  Easing,
  Game,
  Motion,
  Noise,
  Painter,
  ParticleEmitter,
  ParticleSystem,
  Updaters,
} from '@guinetik/gcanvas';

const CONFIG = {
  // Visual - Teal/Blue like the crochet
  background: '#0a0a12',
  trailAlpha: 0.08,
  hueBase: 195,      // Teal
  hueRange: 25,      // Variation toward blue

  // Camera - flat top-down view
  perspective: 800,
  initialRotationX: 0,  
  initialRotationY: 0.0,

  // Polar mesh
  radiusRatio: 0.38,  // Ratio of min(width, height)
  rings: 24,
  slices: 48,

  // Hyperbolic crochet deformation - MORE dramatic ruffles
  waves: 12,
  exponent: 2.4,      // Higher = more ruffling at edges
  flow: 6.0,
  speed: 1.2,         // Slower, more organic

  // Noise - fabric texture, increases on click
  noiseScale: 0.008,
  noiseSpeed: 0.3,
  noiseStrengthBase: 15,
  noiseStrengthMax: 80,

  // Energy - click to wiggle
  energyKick: 0.4,
  energyDecay: 0.92,
  amplitudeRatioBase: 0.08,   // Ratio of radius
  amplitudeRatioMax: 0.25,    // Much more dramatic on click

  // Wireframe
  lineWidth: 0.8,

  // Excitations (particles) - yarn fibers
  maxParticles: 1500,
  excitationRate: 40,
  excitationLifetime: { min: 0.5, max: 1.5 },
  excitationSize: { min: 1.0, max: 2.0 },
  excitationDamping: 0.95,
};

const TAU = Math.PI * 2;

/**
 * Clamp a number to a range.
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

class Day10Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();

    this.time = 0;
    this.energy = 0;

    this.seed = Math.floor(Math.random() * 65535);
    Noise.seed(this.seed);

    // Compute radius for proportional scaling
    this._radius = Math.min(this.width, this.height) * CONFIG.radiusRatio;
    this._amplitudeBase = this._radius * CONFIG.amplitudeRatioBase;
    this._amplitudeMax = this._radius * CONFIG.amplitudeRatioMax;

    this.amplitude = this._amplitudeBase;
    this.noiseStrength = CONFIG.noiseStrengthBase;
    this.breath = 1;  // Initialize before first render

    this._exciteAccum = 0;
    this._meshFrame = 0;

    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: CONFIG.initialRotationX,
      rotationY: CONFIG.initialRotationY,
      inertia: true,
      friction: 0.95,
      clampX: false,
    });
    this.camera.enableMouseControl(this.canvas);
    this.camera.update(0);  // Initialize camera state

    this.initMesh();

    // Particle “modes” riding the fabric
    this.particles = new ParticleSystem(this, {
      camera: this.camera,
      depthSort: true,
      maxParticles: CONFIG.maxParticles,
      blendMode: 'screen',
      updaters: [
        Updaters.velocity,
        Updaters.damping(CONFIG.excitationDamping),
        Updaters.fadeOut,
        Updaters.shrink(0.15),
        Updaters.lifetime,
      ],
    });

    this.particles.addEmitter('excite', new ParticleEmitter({
      rate: 0,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 40 },
      velocitySpread: { x: 60, y: 60, z: 60 },
      lifetime: CONFIG.excitationLifetime,
      size: CONFIG.excitationSize,
      color: { r: 100, g: 200, b: 255, a: 1 },  // Teal/cyan
      shape: 'circle',
    }));

    this.pipeline.add(this.particles);

    this._onClick = (e) => {
      if (this.camera._isDragging) return;

      if (e.shiftKey) {
        this.seed = Math.floor(Math.random() * 65535);
        Noise.seed(this.seed);
        return;
      }

      this.energy = Math.min(1, this.energy + CONFIG.energyKick);
    };
    this.canvas.addEventListener('click', this._onClick);
  }

  /**
   * Cleanup event listeners to avoid leaks on mount/unmount.
   */
  cleanup() {
    if (this._onClick) this.canvas.removeEventListener('click', this._onClick);
    this._onClick = null;
  }

  /**
   * Precompute polar mesh vertices, edges, and triangle faces.
   */
  initMesh() {
    const { rings, slices } = CONFIG;
    const radius = this._radius;

    /** @type {{x:number,y:number,theta:number,rRatio:number}[]} */
    this._verts = new Array((rings + 1) * slices);

    /** @type {[number, number][]} */
    this._edges = [];

    /** @type {[number, number, number][]} */
    this._faces = [];

    for (let i = 0; i <= rings; i++) {
      const rRatio = i / rings;
      const r = rRatio * radius;

      for (let j = 0; j < slices; j++) {
        const theta = (j / slices) * TAU;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        const idx = i * slices + j;
        this._verts[idx] = { x, y, theta, rRatio };

        if (i < rings) {
          const current = idx;
          const nextRing = (i + 1) * slices + j;
          const nextSlice = i * slices + ((j + 1) % slices);
          const nextBoth = (i + 1) * slices + ((j + 1) % slices);

          this._edges.push([current, nextRing]);
          this._edges.push([current, nextSlice]);

          // Two triangles per quad
          this._faces.push([current, nextRing, nextSlice]);
          this._faces.push([nextSlice, nextRing, nextBoth]);
        }
      }
    }
  }

  /**
   * Compute fabric height z(r, θ, t) for a vertex.
   * @param {{x:number,y:number,theta:number,rRatio:number}} v
   * @returns {number}
   */
  heightAt(v) {
    if (!v) return 0;
    const rRatio = v.rRatio ?? 0;
    const theta = v.theta ?? 0;

    const wavePhase = theta * CONFIG.waves;
    const twistPhase = wavePhase + (rRatio * CONFIG.flow - this.time * CONFIG.speed);
    const zBase = Math.pow(rRatio, CONFIG.exponent) * this.amplitude * Math.sin(twistPhase);

    const t = this.time * CONFIG.noiseSpeed;
    const n = Noise.simplex3(
      v.x * CONFIG.noiseScale + t,
      v.y * CONFIG.noiseScale + t,
      zBase * 0.01
    );

    return zBase + n * this.noiseStrength * rRatio;
  }

  /**
   * Override the default clear() to create a motion-blur trail.
   */
  clear() {
    Painter.useCtx((ctx) => {
      ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.trailAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);

      const w = this.width;
      const h = this.height;
      const r = Math.max(w, h) * 0.75;
      const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.15, w / 2, h / 2, r);
      g.addColorStop(0, 'rgba(0, 0, 0, 0)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, { saveState: true });
  }

  update(dt) {
    super.update(dt);

    this.time += dt;
    this.camera.update(dt);

    // Energy decays back to equilibrium
    this.energy *= CONFIG.energyDecay;
    if (this.energy < 0.001) this.energy = 0;

    // Targets based on energy
    const targetAmp = this._amplitudeBase + this.energy * (this._amplitudeMax - this._amplitudeBase);
    const targetNoise = CONFIG.noiseStrengthBase + this.energy * (CONFIG.noiseStrengthMax - CONFIG.noiseStrengthBase);

    // Exponential smoothing toward targets (spring-like settling)
    const smoothFactor = 1 - Math.pow(0.02, dt);  // Faster response to clicks
    this.amplitude += (targetAmp - this.amplitude) * smoothFactor;
    this.noiseStrength += (targetNoise - this.noiseStrength) * smoothFactor;

    // A soft global "breath" that never stops
    this.breath = Motion.pulse(
      0.92,
      1.08,
      this.time,
      3.2,
      true,
      true,
      Easing.smootherstep
    ).value;

    this.emitExcitations(dt);
  }

  /**
   * Emit short-lived excitation particles at random mesh vertices.
   * @param {number} dt
   */
  emitExcitations(dt) {
    if (!this._verts || this._verts.length === 0) return;
    if (this.energy <= 0) return;

    this._exciteAccum += (CONFIG.excitationRate * this.energy) * dt;
    const count = Math.floor(this._exciteAccum);
    if (count <= 0) return;
    this._exciteAccum -= count;

    const start = this.particles.particles.length;
    this.particles.burst(count, 'excite');
    const end = this.particles.particles.length;

    for (let i = start; i < end; i++) {
      const p = this.particles.particles[i];
      const v = this._verts[Math.floor(Math.random() * this._verts.length)];

      const z = this.heightAt(v) * this.breath;
      p.x = v.x;
      p.y = v.y;
      p.z = z;

      // Teal/cyan colors like yarn fibers
      p.color.r = Math.floor(80 + 40 * this.energy);
      p.color.g = Math.floor(180 + 50 * v.rRatio);
      p.color.b = 255;
      p.color.a = 0.85;
    }
  }

  /**
   * Render the fabric mesh, then let the particle pipeline render on top.
   */
  render() {
    Painter.setContext(this.ctx);

    if (this.running) {
      this.clear();
    }

    // Mesh is the expensive part; update it every other frame to keep CPU/GPU sane.
    this._meshFrame++;
    if (this._verts && this._edges && (this._meshFrame % 2 === 0)) {
      this.renderMesh();
    }

    this.pipeline.render();
  }

  /**
   * Render mesh as wireframe edges with depth-based coloring.
   */
  renderMesh() {
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Project all vertices
    const projected = new Array(this._verts.length);
    for (let i = 0; i < this._verts.length; i++) {
      const v = this._verts[i];
      const z = this.heightAt(v) * this.breath;
      const proj = this.camera.project(v.x, v.y, z);
      projected[i] = { x: proj.x, y: proj.y, z, rRatio: v.rRatio };
    }

    // Build edge data with depth for sorting
    const edgeData = [];
    for (const [a, b] of this._edges) {
      const p1 = projected[a];
      const p2 = projected[b];
      if (!p1 || !p2) continue;
      if (!Number.isFinite(p1.x) || !Number.isFinite(p2.x)) continue;

      const avgZ = (p1.z + p2.z) / 2;
      const avgR = (p1.rRatio + p2.rRatio) / 2;
      edgeData.push({ p1, p2, avgZ, avgR });
    }

    // Depth sort: back to front
    edgeData.sort((a, b) => a.avgZ - b.avgZ);

    Painter.useCtx((ctx) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = CONFIG.lineWidth;

      for (const edge of edgeData) {
        const { p1, p2, avgR, avgZ } = edge;

        // Color varies with radius and depth - teal to blue
        const hue = CONFIG.hueBase + avgR * CONFIG.hueRange;
        const lightness = 40 + avgZ * 0.08;
        const saturation = 70 + avgR * 20;

        ctx.globalAlpha = 0.4 + avgR * 0.5;
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${clamp(lightness, 30, 65)}%)`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }, { saveState: true });
  }
}

/**
 * Create Day 10 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {{ stop: () => void, game: Day10Demo }} Game entry compatible with main.js lifecycle
 */
export default function day10(canvas) {
  const game = new Day10Demo(canvas);
  game.start();
  return {
    stop: () => {
      game.cleanup?.();
      game.stop();
    },
    game,
  };
}
