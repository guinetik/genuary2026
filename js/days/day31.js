/**
 * Genuary 2026 - Day 31
 * Prompt: "GLSL day"
 * Credit: Piero
 *
 * DOMAIN WARPING
 * Psychedelic flowing patterns created entirely in GLSL.
 * Layers of noise distort space itself, creating organic fluid motion.
 *
 * Features:
 * - FBM (Fractional Brownian Motion) noise
 * - Multi-layer domain warping
 * - Organic flowing colors
 * - Mouse-reactive distortion
 */

import { Game, WebGLRenderer } from '@guinetik/gcanvas';

const CONFIG = {
  // Animation
  speed: 0.4,

  // Mouse influence
  mouseInfluence: 1.5,
};

// Vertex shader - simple passthrough
const VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment shader - Domain Warping
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Centered coordinates
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= aspect;

    float t = uTime * 0.5;

    // Mouse in same coordinate space, scaled by activity
    vec2 mouse = uMouse * vec2(aspect, 1.0);
    float mouseDist = length(p - mouse);
    float mouseInf = smoothstep(1.0, 0.0, mouseDist) * uMouseActive;

    // === DOMAIN WARPING ===

    // Base position with mouse push
    vec2 pp = p - mouse * mouseInf * 0.3;

    // Layer 1
    vec2 q = vec2(
        fbm(pp * 1.5 + t * 0.2),
        fbm(pp * 1.5 + vec2(5.2, 1.3) + t * 0.25)
    );

    // Layer 2 - warp with q
    vec2 r = vec2(
        fbm(pp + q * 3.0 + vec2(1.7, 9.2) + t * 0.3),
        fbm(pp + q * 3.0 + vec2(8.3, 2.8) + t * 0.28)
    );

    // Mouse injects energy into the warp
    float mouseEnergy = mouseInf * 2.0;
    r += mouseEnergy * vec2(
        sin(t * 5.0 + mouseDist * 8.0),
        cos(t * 5.0 + mouseDist * 8.0)
    ) * 0.5;

    // Layer 3
    vec2 s = vec2(
        fbm(pp + r * 2.0 + vec2(3.1, 7.4) + t * 0.15),
        fbm(pp + r * 2.0 + vec2(6.8, 1.2) + t * 0.18)
    );

    // Final pattern with all layers
    float f = fbm(pp + q + r * 1.5 + s * 0.5);
    float f2 = fbm(pp * 2.0 + r * 2.0 + t * 0.2);

    // === COLORS ===

    vec3 col1 = vec3(0.02, 0.02, 0.08);  // Deep black-blue
    vec3 col2 = vec3(0.0, 0.25, 0.35);   // Deep teal
    vec3 col3 = vec3(0.6, 0.1, 0.4);     // Magenta
    vec3 col4 = vec3(1.0, 0.5, 0.1);     // Orange
    vec3 col5 = vec3(0.1, 0.7, 0.5);     // Seafoam

    // Color mixing
    vec3 color = col1;
    color = mix(color, col2, smoothstep(0.2, 0.5, f));
    color = mix(color, col3, smoothstep(0.4, 0.7, q.x) * 0.8);
    color = mix(color, col4, smoothstep(0.5, 0.9, r.y) * f);
    color = mix(color, col5, smoothstep(0.3, 0.6, s.x) * f2 * 0.5);

    // Bright streaks
    float streak = smoothstep(0.55, 0.6, f) * smoothstep(0.65, 0.6, f);
    color += vec3(1.0, 0.85, 0.7) * streak * 1.5;

    // Mouse glow - bright and visible
    vec3 glowCol = mix(col4, col5, sin(t * 2.0) * 0.5 + 0.5);
    color += glowCol * mouseInf * 1.5;

    // Mouse ripple rings
    float ripple = sin(mouseDist * 15.0 - t * 8.0) * 0.5 + 0.5;
    ripple *= mouseInf * smoothstep(0.0, 0.8, mouseDist);
    color += vec3(0.5, 0.8, 0.7) * ripple * 0.4;

    // Overall brightness boost
    color *= 1.2;

    // Subtle vignette
    float vig = 1.0 - length(uv - 0.5) * 0.5;
    color *= vig;

    // Clamp
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Domain Warping Demo
 */
class DomainWarpingDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();

    // Initialize WebGL renderer
    this.webgl = new WebGLRenderer(this.width, this.height);

    if (!this.webgl.isAvailable()) {
      console.warn('WebGL not available, showing fallback');
      this.useFallback = true;
      return;
    }

    // Compile shader program
    this.webgl.useProgram('tunnel', VERTEX_SHADER, FRAGMENT_SHADER);

    // Time tracking
    this.time = 0;

    // Mouse tracking (normalized -1 to 1)
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Mouse activity (decays over time)
    this.mouseActive = 0;
    this.mouseMoving = false;

    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      this.mouseActive = 1.0;
      this.mouseMoving = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseMoving = false;
    });

    this.canvas.addEventListener('mouseenter', () => {
      this.mouseMoving = true;
      this.mouseActive = 1.0;
    });

    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetMouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.targetMouseX = 0;
      this.targetMouseY = 0;
    });
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Smooth mouse tracking
    const ease = 1 - Math.pow(0.05, dt);
    this.mouseX += (this.targetMouseX - this.mouseX) * ease;
    this.mouseY += (this.targetMouseY - this.mouseY) * ease;

    // Decay mouse activity when not moving
    if (!this.mouseMoving) {
      this.mouseActive = Math.max(0, this.mouseActive - dt * 0.5); // Fade over ~2 seconds
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.useFallback) {
      // Canvas 2D fallback - simple tunnel approximation
      this.renderFallback(ctx, w, h);
      return;
    }

    // Set shader uniforms
    this.webgl.setUniforms({
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uMouseActive: this.mouseActive,
    });

    // Render shader to WebGL canvas
    this.webgl.clear(0, 0, 0, 1);
    this.webgl.render();

    // Composite WebGL canvas onto main canvas
    ctx.drawImage(this.webgl.getCanvas(), 0, 0, w, h);

    // Overlay text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DOMAIN WARPING', 20, 30);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('Move mouse to disturb', 20, 50);
  }

  /**
   * Canvas 2D fallback for browsers without WebGL
   */
  renderFallback(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2 + this.mouseX * w * 0.1;
    const cy = h / 2 + this.mouseY * h * 0.1;
    const time = this.time;

    // Draw concentric rings
    const ringCount = 20;
    for (let i = ringCount; i > 0; i--) {
      const t = (i / ringCount + time * 0.3) % 1;
      const radius = t * Math.max(w, h) * 0.8;
      const alpha = (1 - t) * 0.8;

      ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Radial lines
      if (i % 3 === 0) {
        const segments = 12;
        for (let j = 0; j < segments; j++) {
          const angle = (j / segments) * Math.PI * 2 + time * 0.2;
          const x1 = cx + Math.cos(angle) * radius * 0.8;
          const y1 = cy + Math.sin(angle) * radius * 0.8;
          const x2 = cx + Math.cos(angle) * radius;
          const y2 = cy + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Center glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    gradient.addColorStop(0, 'rgba(0, 255, 100, 0.5)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DOMAIN WARPING (Fallback)', 20, 30);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('WebGL not available', 20, 50);
  }

  onResize() {
    if (this.webgl && this.webgl.isAvailable()) {
      this.webgl.resize(this.width, this.height);
    }
  }

  stop() {
    if (this.webgl) {
      this.webgl.destroy();
    }
    super.stop();
  }
}

/**
 * Create Day 31 visualization
 */
export default function day31(canvas) {
  const game = new DomainWarpingDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
