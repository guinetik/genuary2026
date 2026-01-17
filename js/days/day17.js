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

// Fragment shader - Poincaré hyperbolic tiling
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
const int MAX_ITER = 40;

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
  
  // Invert if outside unit disk
  float p2 = dot(p, p);
  if (p2 > 1.0) {
    p /= p2;
  }
  
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
  
  // Tessellate the point
  vec3 result = tessellate(uv, a1, tana1, cosda1, sinda1, radius, center);
  vec2 tp = result.xy;
  float iter = result.z;
  
  // Distance from inversion circle (for edge highlighting)
  float distToCircle = abs(length(tp - center) - radius);
  float edgeFactor = exp(-distToCircle * 20.0);
  
  // Color based on iteration count and position
  float hue = mod(uHue + iter * 0.07, 1.0);
  float sat = 0.7 + edgeFactor * 0.2;
  float val = 0.4 + edgeFactor * 0.5;
  
  // Darker outside the main disk for depth
  float diskDist = length(uv);
  float diskFade = smoothstep(0.8, 2.0, diskDist);
  val *= 1.0 - diskFade * 0.5;
  
  vec3 col = hsv2rgb(vec3(hue, sat, val));
  
  // Edge lines
  float line = smoothstep(0.02, 0.0, distToCircle);
  col = mix(col, vec3(1.0), line * 0.5);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG = {
  tilings: [
    { n1: 7, n2: 3, name: 'Heptagons' },
    { n1: 5, n2: 4, name: 'Pentagons' },
    { n1: 4, n2: 5, name: 'Squares' },
    { n1: 3, n2: 7, name: 'Triangles' },
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
    this.zoom = 1.5;
    this.targetZoom = 1.5;
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
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = this.canvas.getBoundingClientRect();
      this.lastMouseX = e.clientX - rect.left;
      this.lastMouseY = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const dx = (mx - this.lastMouseX) / Math.min(this.width, this.height) * this.zoom * 2;
      const dy = (my - this.lastMouseY) / Math.min(this.width, this.height) * this.zoom * 2;
      
      this.targetOffsetX -= dx;
      this.targetOffsetY += dy;
      
      this.lastMouseX = mx;
      this.lastMouseY = my;
    });
    
    this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
    this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });
    
    // Click to change tiling
    this._clickStart = 0;
    this.canvas.addEventListener('mousedown', () => { this._clickStart = Date.now(); });
    this.canvas.addEventListener('mouseup', (e) => {
      if (Date.now() - this._clickStart < 200) {
        CONFIG.currentTiling = (CONFIG.currentTiling + 1) % CONFIG.tilings.length;
      }
    });
    
    // Scroll to zoom (infinite - no limits)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      this.targetZoom *= zoomFactor;
    }, { passive: false });
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    
    // Animate hue
    this.hue = (this.hue + CONFIG.hueSpeed * dt) % 1.0;
    
    // Auto-rotate (always)
    this.rotation += CONFIG.rotationSpeed * dt;
    
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
