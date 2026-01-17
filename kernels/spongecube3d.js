/**
 * Day 26: Recursive Grids
 * Prompt: "Split the canvas into a grid and recurse on each cell again and again"
 *
 * Menger Sponge - the classic 3D recursive fractal.
 * A cube subdivided into 3x3x3 grid, removing the center and face-centers,
 * then recursing on each remaining cube.
 *
 * Controls:
 * - Drag: Rotate camera
 * - Click: Toggle auto-zoom / reset
 * - Scroll: Manual zoom
 */

import { Game, Camera3D, Cube3D, Painter, Easing } from "@guinetik/gcanvas";

const CONFIG = {
  background: "#000",

  // Menger sponge settings
  maxDepth: 3, // 8000 cubes
  baseSize: 300,

  // Colors - terminal green aesthetic
  colors: {
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
    autoRotateSpeed: 0.2,
    zoomSpeed: 0.06,
    zoomMin: 0.3,
    zoomMax: 20,
    buildDelay: 0.008,
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
    // Leaf node - add this cube
    positions.push({ x: cx, y: cy, z: cz, size, depth });
    return positions;
  }

  const third = size / 3;
  const offset = size / 3;

  // Iterate through 3x3x3 grid
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Count how many axes are at center (0)
        const centerCount =
          (dx === 0 ? 1 : 0) + (dy === 0 ? 1 : 0) + (dz === 0 ? 1 : 0);

        // Skip if 2 or more axes are centered (removes center + face centers)
        // This is the Menger sponge rule: keep only corners and edges
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
 * Day 26 Demo - Menger Sponge
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
    this.zoom = 1;
    this.targetZoom = 1;
    this.autoZoom = true;
    this.zoomDirection = 1;
    this.globalRotation = 0;

    // Build state for animated construction
    this.buildProgress = 0;
    this.cubesBuilt = 0;

    // Generate Menger sponge positions
    this.generateSponge();

    // Click to toggle auto-zoom
    this.canvas.addEventListener("click", () => {
      this.autoZoom = !this.autoZoom;
      if (!this.autoZoom) {
        this.targetZoom = this.zoom;
      }
    });

    // Scroll to manual zoom
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.autoZoom = false;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.targetZoom = Math.max(
          CONFIG.animation.zoomMin,
          Math.min(CONFIG.animation.zoomMax, this.targetZoom * delta)
        );
      },
      { passive: false }
    );
  }

  generateSponge() {
    // Calculate responsive base size
    const minDim = Math.min(this.width, this.height);
    const baseSize = minDim * 0.4;

    // Generate all cube positions
    const positions = generateMengerPositions(
      0,
      0,
      0,
      baseSize,
      0,
      CONFIG.maxDepth
    );

    // Sort by depth for build animation (shallow first)
    positions.sort((a, b) => a.depth - b.depth);

    // Create Cube3D instances
    this.cubes = positions.map((pos, i) => {
      // Color varies by depth - brighter for deeper cubes
      const depthRatio = pos.depth / CONFIG.maxDepth;
      const hue = 135; // Green
      const lightness = 12 + depthRatio * 8;

      const cube = new Cube3D(pos.size * 0.95, {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        camera: this.camera,
        faceColors: {
          front: `hsl(${hue}, 100%, ${lightness}%)`,
          back: `hsl(${hue}, 100%, ${lightness}%)`,
          top: `hsl(${hue}, 100%, ${lightness + 2}%)`,
          bottom: `hsl(${hue}, 100%, ${lightness - 2}%)`,
          left: `hsl(${hue}, 100%, ${lightness}%)`,
          right: `hsl(${hue}, 100%, ${lightness}%)`,
        },
        stroke: CONFIG.colors.stroke,
        lineWidth: 1,
      });

      return {
        cube,
        depth: pos.depth,
        buildDelay: i * CONFIG.animation.buildDelay,
        visible: false,
        scale: 0,
      };
    });

    this.buildProgress = 0;
    this.cubesBuilt = 0;
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Update camera
    this.camera.update(dt);

    // Global rotation
    this.globalRotation += CONFIG.animation.autoRotateSpeed * dt;

    // Auto zoom oscillation
    if (this.autoZoom) {
      this.targetZoom += this.zoomDirection * CONFIG.animation.zoomSpeed * dt;

      if (this.targetZoom >= CONFIG.animation.zoomMax) {
        this.zoomDirection = -1;
      } else if (this.targetZoom <= CONFIG.animation.zoomMin) {
        this.zoomDirection = 1;
      }
    }

    // Smooth zoom interpolation
    this.zoom += (this.targetZoom - this.zoom) * 0.05;

    // Build animation - reveal cubes over time
    this.buildProgress += dt;

    for (const cubeData of this.cubes) {
      if (!cubeData.visible && this.buildProgress > cubeData.buildDelay) {
        cubeData.visible = true;
        this.cubesBuilt++;
      }

      // Scale animation for newly visible cubes
      if (cubeData.visible && cubeData.scale < 1) {
        cubeData.scale = Math.min(1, cubeData.scale + dt * 3);
      }

      // Update cube rotation
      cubeData.cube.selfRotationY = this.globalRotation;
    }
  }

  render() {
    // Solid clear - no motion blur for performance
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Collect all faces for global depth sorting
    const allFaces = [];

    for (const cubeData of this.cubes) {
      if (!cubeData.visible) continue;

      const cube = cubeData.cube;
      const scale = cubeData.scale * this.zoom;

      // Apply zoom to cube position
      const scaledX = cube.x * this.zoom;
      const scaledY = cube.y * this.zoom;
      const scaledZ = cube.z * this.zoom;
      const scaledSize = (cube.size * scale) / this.zoom;

      // Get cube faces
      const faces = this.getCubeFaces(
        scaledX,
        scaledY,
        scaledZ,
        scaledSize,
        cube
      );
      allFaces.push(...faces);
    }

    // Sort by depth (back to front)
    allFaces.sort((a, b) => b.depth - a.depth);

    // Render all faces
    ctx.save();
    ctx.translate(centerX, centerY);

    for (const face of allFaces) {
      // Draw face
      ctx.beginPath();
      ctx.moveTo(face.vertices[0].x, face.vertices[0].y);
      for (let i = 1; i < face.vertices.length; i++) {
        ctx.lineTo(face.vertices[i].x, face.vertices[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = face.color;
      ctx.fill();

      // Always draw wireframe
      ctx.strokeStyle = CONFIG.colors.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();

    // Draw info text
    ctx.fillStyle = CONFIG.colors.stroke;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `MENGER SPONGE | Depth: ${CONFIG.maxDepth} | Cubes: ${this.cubesBuilt}/${this.cubes.length}`,
      10,
      this.height - 10
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `Zoom: ${this.zoom.toFixed(2)}x | ${this.autoZoom ? "AUTO" : "MANUAL"}`,
      this.width - 10,
      this.height - 10
    );
  }

  /**
   * Get projected faces for a cube
   */
  getCubeFaces(x, y, z, size, cubeRef) {
    const hs = size / 2;
    const faces = [];

    // Face definitions
    const faceData = [
      {
        name: "front",
        corners: [
          [-1, -1, -1],
          [1, -1, -1],
          [1, 1, -1],
          [-1, 1, -1],
        ],
        normal: [0, 0, -1],
      },
      {
        name: "back",
        corners: [
          [1, -1, 1],
          [-1, -1, 1],
          [-1, 1, 1],
          [1, 1, 1],
        ],
        normal: [0, 0, 1],
      },
      {
        name: "top",
        corners: [
          [-1, -1, 1],
          [1, -1, 1],
          [1, -1, -1],
          [-1, -1, -1],
        ],
        normal: [0, -1, 0],
      },
      {
        name: "bottom",
        corners: [
          [-1, 1, -1],
          [1, 1, -1],
          [1, 1, 1],
          [-1, 1, 1],
        ],
        normal: [0, 1, 0],
      },
      {
        name: "left",
        corners: [
          [-1, -1, 1],
          [-1, -1, -1],
          [-1, 1, -1],
          [-1, 1, 1],
        ],
        normal: [-1, 0, 0],
      },
      {
        name: "right",
        corners: [
          [1, -1, -1],
          [1, -1, 1],
          [1, 1, 1],
          [1, 1, -1],
        ],
        normal: [1, 0, 0],
      },
    ];

    const rotY = this.globalRotation;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    for (const face of faceData) {
      // Rotate normal
      let [nx, ny, nz] = face.normal;
      const rnx = nx * cosY - nz * sinY;
      const rnz = nx * sinY + nz * cosY;

      // Apply camera rotation to normal
      const camCosY = Math.cos(this.camera.rotationY);
      const camSinY = Math.sin(this.camera.rotationY);
      const camCosX = Math.cos(this.camera.rotationX);
      const camSinX = Math.sin(this.camera.rotationX);

      let vnx = rnx * camCosY - rnz * camSinY;
      let vnz = rnx * camSinY + rnz * camCosY;
      let vny = ny * camCosX - vnz * camSinX;
      const vnz2 = ny * camSinX + vnz * camCosX;

      // Backface culling
      if (vnz2 > 0.01) continue;

      // Calculate lighting in world space (light stays fixed as camera moves)
      // Light comes from top-right-front in world space
      const worldLightX = 0.5;
      const worldLightY = -0.8;
      const worldLightZ = -0.6;
      const lightLen = Math.sqrt(worldLightX ** 2 + worldLightY ** 2 + worldLightZ ** 2);

      // Use the rotated normal (after self-rotation but before camera)
      const dotProduct = -(rnx * worldLightX + ny * worldLightY + rnz * worldLightZ) / lightLen;
      const diffuse = Math.max(0, dotProduct);

      // Add rim lighting based on view angle (fresnel-like effect)
      const rim = Math.pow(1.0 - Math.abs(vnz2), 2) * 0.3;

      // Combine lighting
      const lightIntensity = 0.2 + diffuse * 0.6 + rim;

      // Transform and project corners
      const vertices = face.corners.map(([cx, cy, cz]) => {
        // Scale to size
        let px = cx * hs;
        let py = cy * hs;
        let pz = cz * hs;

        // Apply self rotation
        const rx = px * cosY - pz * sinY;
        const rz = px * sinY + pz * cosY;
        px = rx;
        pz = rz;

        // Add position
        px += x;
        py += y;
        pz += z;

        // Project through camera
        return this.camera.project(px, py, pz);
      });

      // Calculate depth
      const avgDepth =
        vertices.reduce((sum, v) => sum + v.z, 0) / vertices.length;

      // Color with dynamic lighting
      const litLight = Math.round(10 + lightIntensity * 30);
      const saturation = 100 - lightIntensity * 20; // Slightly desaturate bright faces
      const color = `hsl(135, ${saturation}%, ${litLight}%)`;

      // Calculate face size for LOD wireframe
      const dx = vertices[1].x - vertices[0].x;
      const dy = vertices[1].y - vertices[0].y;
      const faceSize = Math.sqrt(dx * dx + dy * dy);

      faces.push({
        vertices,
        depth: avgDepth,
        color,
        name: face.name,
        size: faceSize,
      });
    }

    return faces;
  }

  onResize() {
    // Regenerate sponge for new size
    if (this.cubes) {
      this.generateSponge();
    }
  }
}

export default function day26(canvas) {
  const game = new Day26Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
