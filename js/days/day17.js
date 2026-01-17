/**
 * Genuary 2026 - Day 17
 * Prompt: "Wallpaper group"
 *
 * POINCARÉ HYPERBOLIC WALLPAPER
 * WebGL shader-based hyperbolic tessellation that tiles the entire plane.
 * Uses Möbius transformations (circle inversions) for {n1,n2} tilings.
 *
 * Click to cycle tilings. Drag to pan. Scroll to zoom.
 */

import { Game, WebGLRenderer } from '@guinetik/gcanvas';

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

// Fragment shader - Infinite nested Poincaré hyperbolic tiling
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform float uZoom;
uniform vec2 uOffset;
uniform float uRotation;
uniform float uHue;
uniform int uN1;  // Polygon sides
uniform int uN2;  // Polygons at vertex

const float PI = 3.14159265359;
const int MAX_ITER = 80;

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 2D rotation matrix
mat2 rot2D(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

// Tessellate point into fundamental domain
// Returns: xy = transformed point, z = iteration count
vec3 tessellate(vec2 p, float a1, float tana1, float cosda1, float sinda1, float radius, vec2 center) {
  float radius2 = radius * radius;
  float iterations = 0.0;
  
  for (int j = 0; j < MAX_ITER; j++) {
    vec2 ctop = p - center;
    float ctop2 = dot(ctop, ctop);
    
    if (p.y > tana1 * p.x) {
      // Reflect about line L1
      p = vec2(p.x * cosda1 + p.y * sinda1, p.x * sinda1 - p.y * cosda1);
      iterations += 1.0;
    } else if (p.y < 0.0) {
      // Reflect about line L2
      p.y = -p.y;
      iterations += 1.0;
    } else if (ctop2 < radius2) {
      // Invert about circle C
      p = ctop * radius2 / ctop2 + center;
      iterations += 1.0;
    } else {
      break;
    }
  }
  
  return vec3(p, iterations);
}

void main() {
  // Normalized coordinates centered at origin
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y);
  
  // Apply zoom and pan
  uv = uv * uZoom + uOffset;
  
  // Apply rotation
  uv *= rot2D(uRotation);
  
  // Calculate tiling geometry based on n1, n2
  float n1f = float(uN1);
  float n2f = float(uN2);
  float a1 = PI / n1f;
  float a2 = PI / n2f;
  
  float cosa2 = cos(a2);
  float sina1 = sin(a1);
  float denom = cosa2 * cosa2 - sina1 * sina1;
  
  // Handle edge case where tiling isn't hyperbolic
  if (denom <= 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  float coeff = 1.0 / sqrt(denom);
  float radius = sina1 * coeff;
  vec2 center = vec2(cosa2 * coeff, 0.0);
  
  // Pre-compute values
  float da1 = a1 * 2.0;
  float cosda1 = cos(da1);
  float sinda1 = sin(da1);
  float tana1 = tan(a1);
  
  // INFINITE NESTED DISKS - works in both zoom directions
  // Use log-polar coordinates for seamless infinite tiling
  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  
  // Protect against log(0)
  float safeR = max(r, 1e-10);
  
  // Map radius to repeating bands using log
  // This creates infinite disks both inward and outward
  float logR = log(safeR);
  float diskScale = log(3.0); // e^diskScale = ratio between disk radii (3x)
  
  // Get which "level" we're on and position within that level
  float levelF = logR / diskScale;
  float level = floor(levelF);
  float frac = fract(levelF); // 0-1 position within this disk band
  
  // Map frac back to radius within unit disk
  // Use non-linear mapping to show more of the visible pattern
  // frac 0->1 maps to localR 0.2->0.98 (avoid very center where tiles are tiny)
  float localR = 0.2 + frac * 0.78;
  
  // Reconstruct point within normalized disk
  vec2 localP = vec2(cos(angle), sin(angle)) * localR;
  
  // Tessellate the point
  vec3 result = tessellate(localP, a1, tana1, cosda1, sinda1, radius, center);
  vec2 tp = result.xy;
  float iter = result.z;
  
  // Distance from inversion circle (for edge highlighting)
  float distToCircle = abs(length(tp - center) - radius);
  float edgeFactor = exp(-distToCircle * 20.0);
  
  // Color based on iteration count, position, and nesting level
  float hue = mod(uHue + iter * 0.07 + level * 0.12, 1.0);
  float sat = 0.7 + edgeFactor * 0.2;
  float val = 0.4 + edgeFactor * 0.5;
  
  // Draw circle boundaries at each disk edge
  // Boundaries occur where frac is near 0 or 1
  float boundaryWidth = 0.02;
  float nearInner = smoothstep(boundaryWidth, 0.0, frac);
  float nearOuter = smoothstep(1.0 - boundaryWidth, 1.0, frac);
  float boundaryLine = max(nearInner, nearOuter) * 0.6;
  val += boundaryLine;
  
  vec3 col = hsv2rgb(vec3(hue, sat, val));
  
  // Edge lines within tiling
  float line = smoothstep(0.02, 0.0, distToCircle);
  col = mix(col, vec3(1.0), line * 0.4);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG = {
  tilings: [
    { n1: 3, n2: 7, name: 'Triangles' },  // First - homage to Poincaré
    { n1: 7, n2: 3, name: 'Heptagons' },
    { n1: 5, n2: 4, name: 'Pentagons' },
    { n1: 4, n2: 5, name: 'Squares' },
    { n1: 6, n2: 4, name: 'Hexagons' },
    { n1: 8, n2: 3, name: 'Octagons' },
  ],
  currentTiling: 0,
  rotationSpeed: 0.1,
  hueSpeed: 0.02,
};

class PoincareDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    this.time = 0;
    this.hue = 0.38; // Green-ish
    this.zoom = 10;
    this.targetZoom = 10;
    this.offsetX = 0;
    this.offsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.rotation = 0;
    
    // Drag state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Initialize WebGL renderer
    this._glRenderer = new WebGLRenderer(this.width, this.height);
    
    if (!this._glRenderer.isAvailable()) {
      console.warn('WebGL not available, falling back to basic render');
      this._webglAvailable = false;
      return;
    }
    this._webglAvailable = true;
    
    // Setup shader program
    this._glRenderer.useProgram('poincare', VERTEX_SHADER, FRAGMENT_SHADER);
    
    // Mouse controls
    this._hasDragged = false;
    this._lastTilingChange = 0;
    this._mouseDownTime = 0;
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this._hasDragged = false;
      this._mouseDownTime = Date.now();
      const rect = this.canvas.getBoundingClientRect();
      this.lastMouseX = e.clientX - rect.left;
      this.lastMouseY = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const moveX = Math.abs(mx - this.lastMouseX);
      const moveY = Math.abs(my - this.lastMouseY);
      
      // Mark as dragged if moved more than 5 pixels
      if (moveX > 5 || moveY > 5) {
        this._hasDragged = true;
      }
      
      const dx = (mx - this.lastMouseX) / Math.min(this.width, this.height) * this.zoom * 2;
      const dy = (my - this.lastMouseY) / Math.min(this.width, this.height) * this.zoom * 2;
      
      this.targetOffsetX -= dx;
      this.targetOffsetY += dy;
      
      this.lastMouseX = mx;
      this.lastMouseY = my;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      const now = Date.now();
      const clickDuration = now - this._mouseDownTime;
      const timeSinceLastChange = now - this._lastTilingChange;
      
      // Only change tiling if:
      // - Not a drag
      // - Click was quick (< 300ms)
      // - At least 500ms since last change (debounce)
      if (!this._hasDragged && clickDuration < 300 && timeSinceLastChange > 500) {
        CONFIG.currentTiling = (CONFIG.currentTiling + 1) % CONFIG.tilings.length;
        this._lastTilingChange = now;
      }
      this.isDragging = false;
    });
    
    this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });
    
    // Scroll to zoom (with limits to prevent black edges)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      this.targetZoom *= zoomFactor;
      // Cap zoom out only (no limit on zoom in)
      this.targetZoom = Math.min(50, this.targetZoom);
    }, { passive: false });
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    
    // Animate hue
    this.hue = (this.hue + CONFIG.hueSpeed * dt) % 1.0;
    
    // Auto-rotate (always)
    this.rotation += CONFIG.rotationSpeed * dt;
    
    // Gradually return to center when not dragging
    if (!this.isDragging) {
      this.targetOffsetX *= 0.98; // Slowly drift back to 0
      this.targetOffsetY *= 0.98;
    }
    
    // Smooth zoom/pan
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
    this.offsetX += (this.targetOffsetX - this.offsetX) * 0.1;
    this.offsetY += (this.targetOffsetY - this.offsetY) * 0.1;
    
    // Resize WebGL if needed
    if (this._webglAvailable && 
        (this._glRenderer.width !== this.width || this._glRenderer.height !== this.height)) {
      this._glRenderer.resize(this.width, this.height);
      this._glRenderer.useProgram('poincare', VERTEX_SHADER, FRAGMENT_SHADER);
    }
  }

  render() {
    const ctx = this.ctx;
    
    if (this._webglAvailable) {
      const tiling = CONFIG.tilings[CONFIG.currentTiling];
      const gl = this._glRenderer;
      const glCtx = gl.gl;
      
      // Use shader
      gl.useProgram('poincare', VERTEX_SHADER, FRAGMENT_SHADER);
      
      // Set uniforms
      gl.setUniforms({
        uTime: this.time,
        uResolution: [this.width, this.height],
        uZoom: this.zoom,
        uOffset: [this.offsetX, this.offsetY],
        uRotation: this.rotation,
        uHue: this.hue,
      });
      
      // Set integer uniforms manually
      const program = gl.programs.get('poincare');
      glCtx.uniform1i(glCtx.getUniformLocation(program, 'uN1'), tiling.n1);
      glCtx.uniform1i(glCtx.getUniformLocation(program, 'uN2'), tiling.n2);
      
      // Render
      gl.clear(0, 0, 0, 1);
      gl.render();
      
      // Composite onto main canvas
      gl.compositeOnto(ctx, 0, 0);
      
      // Info overlay
      ctx.font = '14px "Fira Code", monospace';
      ctx.fillStyle = `hsl(${this.hue * 360}, 70%, 60%)`;
      ctx.textAlign = 'left';
      ctx.fillText(`{${tiling.n1}, ${tiling.n2}} ${tiling.name.toUpperCase()}`, 15, 25);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('CLICK: CHANGE · DRAG: PAN · SCROLL: ZOOM', 15, 45);
    } else {
      // Fallback
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#0f0';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WebGL not available', this.width/2, this.height/2);
    }
  }
  
  stop() {
    super.stop();
    if (this._glRenderer) {
      this._glRenderer.destroy();
    }
  }
}

/**
 * Create Day 17 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day17(canvas) {
  const game = new PoincareDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
