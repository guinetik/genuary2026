/**
 * Genuary 2026 - Day 26
 * Prompt: "Recursive Grids"
 * 
 * @fileoverview Menger Sponge - 3D recursive fractal
 * 
 * The classic 3D recursive fractal.
 * 8000 particles (1 per cube) assemble from chaos into the fractal structure.
 * Particle size scales with cube depth - smaller cubes = smaller dots.
 * 
 * Controls:
 * - Drag: Rotate camera
 * - Double-click: Scatter and reassemble
 * - Scroll: Manual zoom
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Camera3D, ParticleSystem, Painter, Gesture } from "@guinetik/gcanvas";

const CONFIG = {
  background: "#000",

  // Menger sponge settings
  maxDepth: 3,
  baseSize: 280,

  // Particle settings
  particleBaseSize: 20,  // Scaled by cube size
  particleMinSize: 2,    // Minimum visible size
  particleShape: "square",

  // Colors - terminal green aesthetic
  colors: {
    primary: "#0f0",
    stroke: "#0f0",
  },

  // Camera
  camera: {
    perspective: 800,
    rotationX: 0.5,
    rotationY: -0.6,
    inertia: true,
    friction: 0.92,
    clampX: false,
  },

  // Animation
  animation: {
    autoRotateSpeed: 0.15,
    attractStrength: 8,
    damping: 0.92,
    scatterForce: 800,
    buildDelay: 0.003, // Stagger per particle
    infiniteSpawn: true, // Keep spawning new sponges forever
  },
};

// Grid positions for infinite sponge spawning (defined once)
const GRID_POSITIONS = [
  { x: 1, y: 0, z: 0 },   // right
  { x: -1, y: 0, z: 0 },  // left
  { x: 0, y: -1, z: 0 },  // top
  { x: 0, y: 1, z: 0 },   // bottom
  { x: 0, y: 0, z: 1 },   // front
  { x: 0, y: 0, z: -1 },  // back
  { x: 1, y: -1, z: 0 },  // top-right
  { x: -1, y: -1, z: 0 }, // top-left
  { x: 1, y: 1, z: 0 },   // bottom-right
  { x: -1, y: 1, z: 0 },  // bottom-left
  { x: 1, y: 0, z: 1 },   // front-right
  { x: -1, y: 0, z: 1 },  // front-left
  { x: 1, y: 0, z: -1 },  // back-right
  { x: -1, y: 0, z: -1 }, // back-left
  { x: 0, y: -1, z: 1 },  // top-front
  { x: 0, y: -1, z: -1 }, // top-back
  { x: 0, y: 1, z: 1 },   // bottom-front
  { x: 0, y: 1, z: -1 },  // bottom-back
];

/**
 * Generate Menger Sponge cube positions recursively
 * Returns array of { x, y, z, size, depth }
 */
function generateMengerPositions(
  cx,
  cy,
  cz,
  size,
  depth,
  maxDepth,
  positions = []
) {
  if (depth >= maxDepth) {
    positions.push({ x: cx, y: cy, z: cz, size, depth });
    return positions;
  }

  const third = size / 3;
  const offset = size / 3;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const centerCount =
          (dx === 0 ? 1 : 0) + (dy === 0 ? 1 : 0) + (dz === 0 ? 1 : 0);

        if (centerCount >= 2) continue;

        const nx = cx + dx * offset;
        const ny = cy + dy * offset;
        const nz = cz + dz * offset;

        generateMengerPositions(nx, ny, nz, third, depth + 1, maxDepth, positions);
      }
    }
  }

  return positions;
}

/**
 * Day 26 Demo
 * 
 * Main game class for Day 26, creating a Menger Sponge fractal using
 * 8000 particles that assemble from chaos into the recursive structure.
 * 
 * @class Day26Demo
 * @extends {Game}
 */
class Day26Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Create camera with mouse controls
    this.camera = new Camera3D({
      perspective: CONFIG.camera.perspective,
      rotationX: CONFIG.camera.rotationX,
      rotationY: CONFIG.camera.rotationY,
      inertia: CONFIG.camera.inertia,
      friction: CONFIG.camera.friction,
      clampX: CONFIG.camera.clampX,
    });
    this.camera.enableMouseControl(this.canvas);

    // Animation state
    this.time = 0;
    this.globalRotation = 0;
    this.zoom = 1;
    this.targetZoom = 1;

    // Build state
    this.buildTime = 0;
    this.cubesSpawned = 0;
    
    // Infinite spawn state
    this.spongeCount = 0;
    this.totalParticles = 0;
    
    // Persistent set for deduplication (avoids rebuilding each sponge)
    this.existingPositions = new Set();
    this.positionTolerance = 0.1;
    
    // Track next cube to spawn (avoids iterating all cubes each frame)
    this.nextCubeIndex = 0;

    // Generate target positions
    this.generateTargets();

    // Create particle system
    this.createParticleSystem();

    // Double-click to scatter and reassemble
    this.canvas.addEventListener("dblclick", () => {
      this.scatterParticles();
    });

    // Gesture handler for zoom (wheel + pinch)
    this.gesture = new Gesture(this.canvas, {
      onZoom: (delta) => {
        const factor = delta > 0 ? 1.1 : 0.9;
        this.targetZoom = Math.max(0.3, Math.min(15, this.targetZoom * factor));
      },
      // Tap to scatter on mobile (since dblclick doesn't work well)
      onTap: () => {
        this.scatterParticles();
      }
    });
  }

  stop() {
    super.stop();
    if (this.gesture) {
      this.gesture.destroy();
    }
  }

  generateTargets() {
    // Calculate responsive base size
    const minDim = Math.min(this.width, this.height);
    const baseSize = minDim * 0.35;

    // Generate cube positions
    const cubePositions = generateMengerPositions(
      0, 0, 0,
      baseSize,
      0,
      CONFIG.maxDepth
    );

    // Sort by depth for build animation (shallow first)
    cubePositions.sort((a, b) => a.depth - b.depth);

    // Store cubes (1 particle per cube center)
    const tol = this.positionTolerance;
    this.cubes = cubePositions.map((cube, i) => {
      // Add to deduplication set
      const key = `${Math.round(cube.x / tol)},${Math.round(cube.y / tol)},${Math.round(cube.z / tol)}`;
      this.existingPositions.add(key);
      
      return {
        x: cube.x,
        y: cube.y,
        z: cube.z,
        size: cube.size,
        spawnDelay: i * CONFIG.animation.buildDelay,
        spawned: false,
      };
    });

    console.log(`Menger Sponge: ${this.cubes.length} cubes/particles`);
  }

  createParticleSystem() {
    // Cache for per-frame calculations
    this._cosY = 1;
    this._sinY = 0;
    this._strength = CONFIG.animation.attractStrength;
    this._damping = CONFIG.animation.damping;

    // Custom updater: attract each particle to its target
    const attractToTarget = (particle, dt) => {
      if (!particle.alive) return;
      const custom = particle.custom;
      if (custom.targetX === undefined) return;

      // Use cached trig values (updated once per frame in update())
      const tx = custom.targetX * this._cosY - custom.targetZ * this._sinY;
      const tz = custom.targetX * this._sinY + custom.targetZ * this._cosY;

      // Apply zoom and calculate delta
      const zoom = this.zoom;
      const dx = tx * zoom - particle.x;
      const dy = custom.targetY * zoom - particle.y;
      const dz = tz * zoom - particle.z;

      // Spring attraction + damping combined
      const str = this._strength * dt;
      const damp = this._damping;
      particle.vx = (particle.vx + dx * str) * damp;
      particle.vy = (particle.vy + dy * str) * damp;
      particle.vz = (particle.vz + dz * str) * damp;

      // Apply velocity
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.z += particle.vz * dt;
    };

    this.particles = new ParticleSystem(this, {
      camera: this.camera,
      depthSort: true, // Required for 3D projection to work properly
      maxParticles: 50000,
      blendMode: "source-over",
      updaters: [attractToTarget],
    });

    this.pipeline.add(this.particles);
  }

  /**
   * Spawn 1 particle at cube center
   */
  spawnCube(cube) {
    const spawnRadius = this._spawnRadius || (this._spawnRadius = Math.max(this.width, this.height) * 0.8);

    // Random spawn position (spherical distribution)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = spawnRadius * (0.3 + Math.random() * 0.7);
    const sinPhi = Math.sin(phi);

    const spawnX = r * sinPhi * Math.cos(theta);
    const spawnY = r * sinPhi * Math.sin(theta);
    const spawnZ = r * Math.cos(phi);

    // Acquire particle from pool
    const p = this.particles.acquire();

    // Set position & velocity (slight inward bias)
    p.x = spawnX;
    p.y = spawnY;
    p.z = spawnZ;
    p.vx = -spawnX * 0.5;
    p.vy = -spawnY * 0.5;
    p.vz = -spawnZ * 0.5;

    // Size based on cube size
    const baseRef = this._baseSizeRef || (this._baseSizeRef = Math.min(this.width, this.height) * 0.35);
    p.size = Math.max(CONFIG.particleMinSize, CONFIG.particleBaseSize * cube.size / baseRef);
    
    // Green color
    p.color.r = 0;
    p.color.g = 255;
    p.color.b = 0;
    p.color.a = 1;
    p.shape = CONFIG.particleShape;

    // Lifecycle
    p.age = 0;
    p.lifetime = Infinity;
    p.alive = true;

    // Target position (only what's needed)
    p.custom.targetX = cube.x;
    p.custom.targetY = cube.y;
    p.custom.targetZ = cube.z;

    // Add to active particles
    this.particles.particles.push(p);

    cube.spawned = true;
    this.cubesSpawned++;
  }

  scatterParticles() {
    const particles = this.particles.particles;
    const baseForce = CONFIG.animation.scatterForce;
    
    for (let i = 0, len = particles.length; i < len; i++) {
      const p = particles[i];
      if (!p.alive) continue;

      // Random scatter direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const force = baseForce * (0.5 + Math.random());
      const sinPhi = Math.sin(phi);

      p.vx += force * sinPhi * Math.cos(theta);
      p.vy += force * sinPhi * Math.sin(theta);
      p.vz += force * Math.cos(phi);
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.buildTime += dt;

    // Update camera
    this.camera.update(dt);

    // Global rotation
    this.globalRotation += CONFIG.animation.autoRotateSpeed * dt;
    
    // Cache trig for particle updater
    this._cosY = Math.cos(this.globalRotation);
    this._sinY = Math.sin(this.globalRotation);

    // Smooth zoom (faster response)
    this.zoom += (this.targetZoom - this.zoom) * 0.15;

    // Spawn cubes over time (optimized: only check from next unspawned)
    while (this.nextCubeIndex < this.cubes.length) {
      const cube = this.cubes[this.nextCubeIndex];
      if (this.buildTime >= cube.spawnDelay) {
        this.spawnCube(cube);
        this.nextCubeIndex++;
      } else {
        break; // Cubes are sorted by spawnDelay, so stop here
      }
    }
    
    // Infinite spawn: when all cubes spawned, generate new sponge targets
    if (CONFIG.animation.infiniteSpawn && this.nextCubeIndex >= this.cubes.length) {
      this.spawnNextSponge();
    }
  }

  /**
   * Generate a new sponge beside/above/below - flush with no gap, shared faces
   */
  spawnNextSponge() {
    this.spongeCount++;
    this.totalParticles += this.cubesSpawned;
    
    // Same base size as original
    const minDim = Math.min(this.width, this.height);
    const baseSize = minDim * 0.35;
    
    // No gap - sponges share their boundary faces
    const spacing = baseSize;
    
    // Get position for this sponge (gridPositions defined at module level)
    const layer = Math.floor(this.spongeCount / GRID_POSITIONS.length) + 1;
    const posIndex = (this.spongeCount - 1) % GRID_POSITIONS.length;
    const pos = GRID_POSITIONS[posIndex];
    
    const offsetX = pos.x * spacing * layer;
    const offsetY = pos.y * spacing * layer;
    const offsetZ = pos.z * spacing * layer;

    // Generate new cube positions
    const cubePositions = generateMengerPositions(
      offsetX, offsetY, offsetZ,
      baseSize,
      0,
      CONFIG.maxDepth
    );

    // Filter out cubes that already exist (using persistent Set)
    const tol = this.positionTolerance;
    const existingSet = this.existingPositions;
    const newCubePositions = [];
    
    for (const cube of cubePositions) {
      const key = `${Math.round(cube.x / tol)},${Math.round(cube.y / tol)},${Math.round(cube.z / tol)}`;
      if (!existingSet.has(key)) {
        existingSet.add(key); // Add to persistent set
        newCubePositions.push(cube);
      }
    }

    // Sort by depth for build animation
    newCubePositions.sort((a, b) => a.depth - b.depth);

    // Add new cubes directly to array (avoid spread operator)
    const baseDelay = this.buildTime;
    for (let i = 0; i < newCubePositions.length; i++) {
      const cube = newCubePositions[i];
      this.cubes.push({
        x: cube.x,
        y: cube.y,
        z: cube.z,
        size: cube.size,
        spawnDelay: baseDelay + i * CONFIG.animation.buildDelay,
        spawned: false,
      });
    }
    
    const skipped = cubePositions.length - newCubePositions.length;
    console.log(`Sponge #${this.spongeCount + 1} | New: ${newCubePositions.length} | Shared: ${skipped}`);
  }

  /**
   * Override clear for motion blur trail effect
   */
  clear() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  render() {
    // Particle system renders via pipeline
    super.render();

    // Draw info text
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.colors.stroke;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";

    ctx.fillText(
      `MENGER SPONGE | Depth: ${CONFIG.maxDepth} | Sponges: ${this.spongeCount + 1} | Particles: ${this.cubesSpawned}`,
      10,
      this.height - 10
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `Zoom: ${this.zoom.toFixed(1)}x | Dbl-click to scatter`,
      this.width - 10,
      20
    );
  }

  onResize() {
    // Clear cached values so they recalculate
    this._spawnRadius = null;
    this._baseSizeRef = null;
  }
}

/**
 * Create Day 26 visualization
 * 
 * Factory function that creates and starts the Menger Sponge demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Day26Demo} returns.game - The game instance
 */
export default function day26(canvas) {
  const game = new Day26Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
