/**
 * Day 26: Recursive Grids
 * Prompt: "Split the canvas into a grid and recurse on each cell again and again"
 *
 * Menger Sponge - the classic 3D recursive fractal.
 * Built using particles at cube vertices for a wireframe aesthetic.
 * Particles assemble from chaos into the fractal structure.
 *
 * Controls:
 * - Drag: Rotate camera
 * - Double-click: Scatter and reassemble
 * - Scroll: Manual zoom
 */

import { Game, Camera3D, ParticleSystem, Painter, Easing } from "@guinetik/gcanvas";

const CONFIG = {
  background: "#000",

  // Menger sponge settings
  maxDepth: 3,
  baseSize: 280,

  // Particle settings
  particleSize: 2.5,
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
  },
};

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
 * Generate 8 corner positions for a cube
 */
function getCubeCorners(cx, cy, cz, size) {
  const hs = size / 2;
  return [
    { x: cx - hs, y: cy - hs, z: cz - hs },
    { x: cx + hs, y: cy - hs, z: cz - hs },
    { x: cx - hs, y: cy + hs, z: cz - hs },
    { x: cx + hs, y: cy + hs, z: cz - hs },
    { x: cx - hs, y: cy - hs, z: cz + hs },
    { x: cx + hs, y: cy - hs, z: cz + hs },
    { x: cx - hs, y: cy + hs, z: cz + hs },
    { x: cx + hs, y: cy + hs, z: cz + hs },
  ];
}

/**
 * Day 26 Demo - Menger Sponge with Particle Vertices
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

    // Generate target positions
    this.generateTargets();

    // Create particle system
    this.createParticleSystem();

    // Double-click to scatter and reassemble
    this.canvas.addEventListener("dblclick", () => {
      this.scatterParticles();
    });

    // Scroll to zoom
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.targetZoom = Math.max(0.3, Math.min(15, this.targetZoom * delta));
      },
      { passive: false }
    );
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

    // Store cubes with their corners
    this.cubes = cubePositions.map((cube, i) => {
      const corners = getCubeCorners(cube.x, cube.y, cube.z, cube.size * 0.95);
      return {
        ...cube,
        corners,
        spawnDelay: i * CONFIG.animation.buildDelay,
        spawned: false,
      };
    });

    console.log(`Menger Sponge: ${this.cubes.length} cubes, ${this.cubes.length * 8} vertices`);
  }

  createParticleSystem() {
    // Custom updater: attract each particle to its target
    const attractToTarget = (particle, dt) => {
      if (!particle.alive || !particle.custom.targetX) return;

      // Apply global rotation to target
      const rotY = this.globalRotation;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const tx = particle.custom.targetX * cosY - particle.custom.targetZ * sinY;
      const tz = particle.custom.targetX * sinY + particle.custom.targetZ * cosY;
      const ty = particle.custom.targetY;

      // Apply zoom
      const targetX = tx * this.zoom;
      const targetY = ty * this.zoom;
      const targetZ = tz * this.zoom;

      // Spring attraction
      const dx = targetX - particle.x;
      const dy = targetY - particle.y;
      const dz = targetZ - particle.z;

      const strength = CONFIG.animation.attractStrength;
      particle.vx += dx * strength * dt;
      particle.vy += dy * strength * dt;
      particle.vz += dz * strength * dt;

      // Damping
      const damping = CONFIG.animation.damping;
      particle.vx *= damping;
      particle.vy *= damping;
      particle.vz *= damping;

      // Apply velocity
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.z += particle.vz * dt;

      // Check if settled based on velocity (not distance, since target rotates)
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2 + particle.vz ** 2);

      if (!particle.custom.settled && speed < 50) {
        // Lock as settled
        particle.custom.settled = true;
        // Set to green based on depth
        const depthRatio = particle.custom.depth / CONFIG.maxDepth;
        const lightness = 40 + depthRatio * 20;
        const rgb = this.hslToRgb(135 / 360, 1, lightness / 100);
        particle.color.r = rgb.r;
        particle.color.g = rgb.g;
        particle.color.b = rgb.b;
      } else if (!particle.custom.settled) {
        // Still flying: white/bright
        particle.color.r = 255;
        particle.color.g = 255;
        particle.color.b = 255;
      }
      // If settled, color stays locked
    };

    this.particles = new ParticleSystem(this, {
      camera: this.camera,
      depthSort: true,
      maxParticles: 70000,
      blendMode: "source-over",
      updaters: [attractToTarget],
    });

    this.pipeline.add(this.particles);
  }

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  /**
   * Spawn particles for a single cube (8 corner vertices)
   */
  spawnCube(cube) {
    const spawnRadius = Math.max(this.width, this.height) * 0.8;

    for (const corner of cube.corners) {
      // Random spawn position (spherical distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spawnRadius * (0.3 + Math.random() * 0.7);

      const spawnX = r * Math.sin(phi) * Math.cos(theta);
      const spawnY = r * Math.sin(phi) * Math.sin(theta);
      const spawnZ = r * Math.cos(phi);

      // Acquire particle from pool
      const p = this.particles.acquire();

      // Set position
      p.x = spawnX;
      p.y = spawnY;
      p.z = spawnZ;

      // Set velocity (slight inward bias)
      p.vx = -spawnX * 0.5;
      p.vy = -spawnY * 0.5;
      p.vz = -spawnZ * 0.5;

      // Set appearance
      p.size = CONFIG.particleSize;
      p.color.r = 0;
      p.color.g = 255;
      p.color.b = 0;
      p.color.a = 1;
      p.shape = CONFIG.particleShape;

      // Set lifecycle (infinite)
      p.age = 0;
      p.lifetime = Infinity;
      p.alive = true;

      // Store target in custom data
      p.custom.targetX = corner.x;
      p.custom.targetY = corner.y;
      p.custom.targetZ = corner.z;
      p.custom.depth = cube.depth;
      p.custom.cubeSize = cube.size;

      // Add to active particles
      this.particles.particles.push(p);
    }

    cube.spawned = true;
    this.cubesSpawned++;
  }

  scatterParticles() {
    // Scatter all particles outward
    for (const particle of this.particles.particles) {
      if (!particle.alive) continue;

      // Reset settled state so they turn white while flying
      particle.custom.settled = false;

      // Random scatter direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const force = CONFIG.animation.scatterForce * (0.5 + Math.random());

      particle.vx += force * Math.sin(phi) * Math.cos(theta);
      particle.vy += force * Math.sin(phi) * Math.sin(theta);
      particle.vz += force * Math.cos(phi);
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

    // Smooth zoom (faster response)
    this.zoom += (this.targetZoom - this.zoom) * 0.15;

    // Spawn cubes over time
    for (const cube of this.cubes) {
      if (!cube.spawned && this.buildTime >= cube.spawnDelay) {
        this.spawnCube(cube);
      }
    }
  }

  render() {
    // Clear (no motion blur for cleaner look)
    this.ctx.fillStyle = CONFIG.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Particle system renders via pipeline
    super.render();

    // Draw info text
    const ctx = this.ctx;
    ctx.fillStyle = CONFIG.colors.stroke;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";

    const activeCount = this.particles.particles.filter(p => p.alive).length;
    ctx.fillText(
      `MENGER SPONGE | Depth: ${CONFIG.maxDepth} | Cubes: ${this.cubesSpawned}/${this.cubes.length}`,
      10,
      this.height - 10
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `Vertices: ${activeCount.toLocaleString()} | Dbl-click to scatter`,
      this.width - 10,
      this.height - 10
    );
  }

  onResize() {
    if (this.cubes) {
      // Store old spawn states
      const oldSpawned = this.cubes.map(c => c.spawned);
      const oldCubesSpawned = this.cubesSpawned;

      // Regenerate for new size
      this.generateTargets();

      // Restore spawn states
      for (let i = 0; i < Math.min(oldSpawned.length, this.cubes.length); i++) {
        this.cubes[i].spawned = oldSpawned[i];
      }
      this.cubesSpawned = oldCubesSpawned;

      // Update existing particle targets
      let particleIndex = 0;
      for (const cube of this.cubes) {
        if (!cube.spawned) continue;
        for (const corner of cube.corners) {
          const particles = this.particles.particles;
          if (particleIndex < particles.length && particles[particleIndex].alive) {
            particles[particleIndex].custom.targetX = corner.x;
            particles[particleIndex].custom.targetY = corner.y;
            particles[particleIndex].custom.targetZ = corner.z;
            particles[particleIndex].custom.depth = cube.depth;
            particleIndex++;
          }
        }
      }
    }
  }
}

export default function day26(canvas) {
  const game = new Day26Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
