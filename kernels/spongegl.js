/**
 * Day 26: Recursive Grids
 * Prompt: "Split the canvas into a grid and recurse on each cell again and again"
 *
 * Menger Sponge - rendered via GPU raymarching with signed distance functions.
 * The classic 3D recursive fractal: a cube subdivided into 3x3x3 grid,
 * removing center and face-centers, recursing infinitely.
 *
 * Controls:
 * - Drag: Rotate camera
 * - Click: Toggle auto-zoom
 * - Scroll: Manual zoom
 */

import { Game, Painter } from "@guinetik/gcanvas";
import { WebGLRenderer } from "@guinetik/gcanvas";

const CONFIG = {
  background: "#000",

  // Animation
  animation: {
    autoRotateSpeed: 0.15,
    zoomSpeed: 0.3,
    zoomMin: 0.8,
    zoomMax: 15,
  },
};

// Vertex shader - simple fullscreen quad
const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aUv;
varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment shader - raymarched Menger sponge
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uZoom;
uniform vec3 uCameraRotation; // rotationX, rotationY, rotationZ
uniform float uBuildProgress; // 0 to 1, controls how much of the sponge is built

const int MAX_STEPS = 128;
const float MAX_DIST = 50.0;
const float EPSILON = 0.001;
const int MAX_ITERATIONS = 5;

// Rotation matrices
mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0,
                0.0, c, -s,
                0.0, s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, s,
                0.0, 1.0, 0.0,
                -s, 0.0, c);
}

mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, -s, 0.0,
                s, c, 0.0,
                0.0, 0.0, 1.0);
}

// Box SDF
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

// Cross SDF (for carving holes)
float sdCross(vec3 p, float s) {
    float da = max(abs(p.x), abs(p.y));
    float db = max(abs(p.y), abs(p.z));
    float dc = max(abs(p.z), abs(p.x));
    return min(da, min(db, dc)) - s;
}

// Menger Sponge SDF with animated build
float sdMenger(vec3 p) {
    // Build progress controls iteration depth and hole size
    // 0.0 = solid cube, 1.0 = full 5-iteration sponge
    float progress = clamp(uBuildProgress, 0.0, 1.0);

    // Calculate how many iterations to show (0 to MAX_ITERATIONS)
    float iterFloat = progress * float(MAX_ITERATIONS);
    int fullIters = int(floor(iterFloat));
    float partialIter = fract(iterFloat); // 0-1 for partial next iteration

    // Start with outer box - scale based on early progress for "grow in" effect
    float growScale = smoothstep(0.0, 0.15, progress);
    float d = sdBox(p, vec3(growScale));

    // If not grown yet, return early
    if (progress < 0.05) {
        return d;
    }

    float s = 1.0;

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        // Stop at current iteration depth
        if (i > fullIters) break;

        // Scale and fold into unit cell
        vec3 a = mod(p * s, 2.0) - 1.0;
        s *= 3.0;

        // Create cross-shaped hole
        vec3 r = abs(1.0 - 3.0 * abs(a));

        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / s;

        // For partial iteration, blend the hole depth
        if (i == fullIters) {
            // Ease in the holes for this iteration level
            float holeStrength = smoothstep(0.0, 1.0, partialIter);
            c = mix(d, c, holeStrength);
        }

        d = max(d, c);
    }

    return d;
}

// Scene SDF
float scene(vec3 p) {
    return sdMenger(p);
}

// Calculate normal via gradient
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(EPSILON, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

// Ambient occlusion
float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = scene(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// Soft shadows
float calcShadow(vec3 ro, vec3 rd, float mint, float maxt) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 24; i++) {
        if (t > maxt) break;
        float h = scene(ro + rd * t);
        res = min(res, 8.0 * h / t);
        t += clamp(h, 0.02, 0.2);
        if (res < 0.001) break;
    }
    return clamp(res, 0.0, 1.0);
}

// Raymarching
float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = scene(p);
        if (d < EPSILON) return t;
        if (t > MAX_DIST) break;
        t += d * 0.8; // Slightly conservative step for stability
    }
    return -1.0;
}

void main() {
    // Normalized coordinates (-1 to 1, aspect corrected)
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

    // Camera setup
    float camDist = 3.5 / uZoom;

    // Build rotation matrix from camera angles
    mat3 rot = rotateX(uCameraRotation.x) * rotateY(uCameraRotation.y);

    // Camera position and direction
    vec3 ro = rot * vec3(0.0, 0.0, camDist);
    vec3 forward = normalize(-ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);

    // Ray direction
    vec3 rd = normalize(forward + uv.x * right + uv.y * up);

    // Background - dark with subtle gradient
    vec3 col = vec3(0.02, 0.02, 0.03);
    col += 0.02 * (1.0 - length(uv));

    // Raymarch
    float t = raymarch(ro, rd);

    if (t > 0.0) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);

        // Lighting
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
        float diff = max(dot(n, lightDir), 0.0);
        float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);

        // Ambient occlusion
        float ao = calcAO(p, n);

        // Soft shadow
        float shadow = calcShadow(p + n * 0.01, lightDir, 0.02, 2.5);

        // Terminal green color palette
        vec3 baseColor = vec3(0.0, 0.8, 0.2);
        vec3 highlightColor = vec3(0.2, 1.0, 0.4);
        vec3 shadowColor = vec3(0.0, 0.15, 0.05);

        // Depth-based color variation
        float depth = clamp(t / 5.0, 0.0, 1.0);
        baseColor = mix(highlightColor, baseColor, depth);

        // Combine lighting
        vec3 ambient = shadowColor * 0.5 * ao;
        vec3 diffuse = baseColor * diff * shadow;
        vec3 specular = highlightColor * spec * shadow * 0.5;

        col = ambient + diffuse + specular;

        // Edge glow based on normal angle to view
        float edge = 1.0 - abs(dot(n, -rd));
        edge = pow(edge, 3.0);
        col += vec3(0.0, 0.5, 0.1) * edge * 0.5;

        // Distance fog
        float fog = exp(-t * 0.15);
        col = mix(vec3(0.0, 0.05, 0.02), col, fog);
    }

    // Gamma correction
    col = pow(col, vec3(0.8));

    // Vignette
    float vignette = 1.0 - 0.3 * length(uv);
    col *= vignette;

    // Scanline effect (subtle)
    col *= 0.95 + 0.05 * sin(gl_FragCoord.y * 2.0);

    gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Day 26 Demo - Menger Sponge (WebGL Raymarching)
 */
class Day26Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Create WebGL renderer
    this.glRenderer = new WebGLRenderer(this.width, this.height);

    if (!this.glRenderer.isAvailable()) {
      console.error("WebGL not available");
      return;
    }

    // Initialize shader
    this.glRenderer.useProgram("menger", VERTEX_SHADER, FRAGMENT_SHADER);

    // Animation state
    this.time = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.autoZoom = true;
    this.zoomDirection = 1;

    // Build animation - starts at 0, builds to 1 over time
    this.buildProgress = 0;
    this.buildSpeed = 0.15; // Takes ~6.5 seconds to fully build
    this.isBuilt = false;

    // Camera rotation (controlled by mouse drag)
    this.rotationX = 0.4;
    this.rotationY = 0.3;
    this.targetRotationX = 0.4;
    this.targetRotationY = 0.3;
    this.autoRotate = true;

    // Mouse state
    this.mouseX = 0;
    this.mouseY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Mouse controls
    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.autoRotate = false;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        this.targetRotationY += dx * 0.005;
        this.targetRotationX += dy * 0.005;

        // Clamp vertical rotation
        this.targetRotationX = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.targetRotationX)
        );

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
    });

    // Touch controls
    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.autoRotate = false;
      }
    });

    this.canvas.addEventListener("touchmove", (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;

        this.targetRotationY += dx * 0.005;
        this.targetRotationX += dy * 0.005;
        this.targetRotationX = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.targetRotationX)
        );

        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener("touchend", () => {
      this.isDragging = false;
    });

    // Click to toggle auto-zoom or restart build
    this.canvas.addEventListener("click", (e) => {
      // Only toggle if it wasn't a drag
      if (Math.abs(e.clientX - this.lastMouseX) < 5 &&
          Math.abs(e.clientY - this.lastMouseY) < 5) {
        if (this.isBuilt) {
          // Restart build animation
          this.buildProgress = 0;
          this.isBuilt = false;
        } else {
          // Toggle auto-zoom
          this.autoZoom = !this.autoZoom;
          if (!this.autoZoom) {
            this.targetZoom = this.zoom;
          }
        }
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

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Build animation
    if (!this.isBuilt) {
      this.buildProgress += this.buildSpeed * dt;
      if (this.buildProgress >= 1) {
        this.buildProgress = 1;
        this.isBuilt = true;
      }
    }

    // Auto rotation
    if (this.autoRotate) {
      this.targetRotationY += CONFIG.animation.autoRotateSpeed * dt;
    }

    // Smooth rotation interpolation
    this.rotationX += (this.targetRotationX - this.rotationX) * 0.08;
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.08;

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
    this.zoom += (this.targetZoom - this.zoom) * 0.03;
  }

  render() {
    if (!this.glRenderer || !this.glRenderer.isAvailable()) {
      // Fallback - just show error
      this.ctx.fillStyle = "#0f0";
      this.ctx.font = "16px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "WebGL not available",
        this.width / 2,
        this.height / 2
      );
      return;
    }

    // Resize if needed
    if (
      this.glRenderer.width !== this.width ||
      this.glRenderer.height !== this.height
    ) {
      this.glRenderer.resize(this.width, this.height);
      this.glRenderer.useProgram("menger", VERTEX_SHADER, FRAGMENT_SHADER);
    }

    // Clear
    this.glRenderer.clear(0, 0, 0, 1);

    // Set uniforms
    this.glRenderer.setUniforms({
      uTime: this.time,
      uResolution: [this.width, this.height],
      uMouse: [this.mouseX / this.width, 1.0 - this.mouseY / this.height],
      uZoom: this.zoom,
      uCameraRotation: [this.rotationX, this.rotationY, 0],
      uBuildProgress: this.buildProgress,
    });

    // Render
    this.glRenderer.render();

    // Composite onto main canvas
    this.ctx.drawImage(this.glRenderer.getCanvas(), 0, 0);

    // Draw info text
    this.ctx.fillStyle = "#0f0";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "left";

    const iterCount = Math.floor(this.buildProgress * 5);
    const buildPct = Math.round(this.buildProgress * 100);
    const status = this.isBuilt ? "COMPLETE - Click to rebuild" : `Building... ${buildPct}%`;

    this.ctx.fillText(
      `MENGER SPONGE | Iterations: ${iterCount}/5 | ${status}`,
      10,
      this.height - 10
    );

    this.ctx.textAlign = "right";
    this.ctx.fillText(
      `Zoom: ${this.zoom.toFixed(2)}x | Drag to rotate | Scroll to zoom`,
      this.width - 10,
      this.height - 10
    );
  }

  onResize() {
    // WebGL renderer will be resized in render()
  }

  stop() {
    if (this.glRenderer) {
      this.glRenderer.destroy();
    }
    super.stop();
  }
}

export default function day26(canvas) {
  const game = new Day26Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
