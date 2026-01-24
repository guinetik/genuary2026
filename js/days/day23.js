/**
 * Genuary 2026 - Day 23
 * Prompt: "Transparency"
 * Credit: PaoloCurtoni
 *
 * LIQUID GLASS
 * Interactive glass lens shader with proper fresnel and refraction physics.
 * Click anywhere to spawn blobs. Drag them around. Release for ripples.
 *
 * Features:
 * - Unlimited spawnable blobs (up to MAX_BLOBS)
 * - IQ's superellipse SDF design
 * - Proper Fresnel reflectance with IOR
 * - Gaussian blur for frosted glass
 * - Chromatic aberration with lens distortion
 * - Water ripple effect on release
 * - Billiard-style physics
 */

import { Game, WebGLRenderer } from '@guinetik/gcanvas';

// Import shaders as raw strings (Vite handles this with ?raw suffix)
import VERTEX_SHADER from '../../glsl/liquidg.vert?raw';
import FRAGMENT_SHADER from '../../glsl/liquidg.frag?raw';

/** Maximum number of blobs (must match shader #define MAX_BLOBS) */
const MAX_BLOBS = 6;

const CONFIG = {
  // Animation
  speed: 0.3,
  
  // Glass properties
  ior: 1.5,  // Index of refraction (glass ~1.5)
  blurStrength: 1.5,
  
  // Shape
  radius: 0.22,  // Slightly smaller for multiple blobs
  superellipseN: 4.0,
  blendRadius: 0.12,
  
  // Interaction effects
  hoverScale: 0.08,
  dragScale: 0.20,
  hoverGlow: 0.3,
  dragSoften: 0.8,
  rippleSpeed: 18.0,
  rippleDecay: 1.2,
  rippleStrength: 0.18,
  wobbleFreq: 12.0,
  wobbleDecay: 3.0,
  elasticDuration: 0.6,
  
  // Physics
  friction: 0.995,
  bounce: 0.85,
  boundsX: 0.88,
  boundsY: 0.78,
  maxVel: 4.0,
};

/**
 * Create a new blob object
 * @param {number} x - Initial X position
 * @param {number} y - Initial Y position
 * @returns {Object} Blob state object
 */
function createBlob(x, y) {
  return {
    // Position
    x,
    y,
    // Velocity
    vx: 0,
    vy: 0,
    // Spawn scale (0 → 1 with elastic)
    scale: 0,
    scaleAnimTime: 0,
    // Interaction state (animated values)
    hover: 0,
    drag: 0,
    ripple: 0,
    wobble: 0,
    // Target values for elastic animation
    targetHover: 0,
    targetDrag: 0,
    // Animation timers
    hoverAnimTime: 0,
    dragAnimTime: 0,
    // Active flags
    rippleActive: false,
    wobbleActive: false,
  };
}

/**
 * Liquid Glass Demo
 */
class LiquidGlassDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#0a0812';
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
    this.webgl.useProgram('liquidGlass', VERTEX_SHADER, FRAGMENT_SHADER);

    // Time tracking
    this.time = 0;

    // Mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    
    // Drag state
    this.dragging = -1;  // -1 = none, 0+ = blob index
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    // Velocity tracking for throw calculation
    this.dragSamples = [];
    this.lastDragX = 0;
    this.lastDragY = 0;
    
    // Hover state
    this.hoveredBlob = -1;
    
    // ==========================================================================
    // BLOB ARRAY - Starts with one blob at center after delay
    // ==========================================================================
    this.blobs = [];
    this.startDelay = 0;
    this.initialBlobSpawned = false;

    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Hover detection (only when not dragging)
      if (this.dragging === -1) {
        this.updateHoverState(this.targetMouseX, this.targetMouseY);
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      if (this.dragging === -1) {
        this.hoveredBlob = -1;
        this.blobs.forEach(b => b.targetHover = 0);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const clickY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      this.handleClick(clickX, clickY);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.handleRelease();
    });
    
    // Handle release even if mouse leaves canvas
    window.addEventListener('mouseup', () => {
      if (this.dragging !== -1) {
        this.handleRelease();
      }
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      const touchY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
      
      this.handleClick(touchX, touchY);
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetMouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.handleRelease();
    });
  }
  
  /**
   * Handle click/tap - either drag existing blob or spawn new one
   * @param {number} clickX - Click X in normalized coords
   * @param {number} clickY - Click Y in normalized coords
   */
  handleClick(clickX, clickY) {
    const aspect = this.width / this.height;
    const clickXAspect = clickX * aspect;
    
    // Find closest blob within hit radius
    let closestIdx = -1;
    let closestDist = Infinity;
    const hitRadius = CONFIG.radius * 1.2;
    
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      const dx = clickXAspect - blob.x * aspect;
      const dy = clickY - blob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx !== -1) {
      // Drag existing blob
      const blob = this.blobs[closestIdx];
      this.dragging = closestIdx;
      blob.vx = 0;
      blob.vy = 0;
      this.dragOffsetX = clickX - blob.x;
      this.dragOffsetY = clickY - blob.y;
      this.mouseX = clickX;
      this.mouseY = clickY;
      this.targetMouseX = clickX;
      this.targetMouseY = clickY;
      this.dragSamples = [];
      this.lastDragX = clickX;
      this.lastDragY = clickY;
      
      // Start drag animation
      blob.targetDrag = 1;
      blob.dragAnimTime = 0;
      blob.targetHover = 0;
      blob.rippleActive = false;
      blob.ripple = 0;
      
      // Clear hover on all blobs
      this.hoveredBlob = -1;
      this.blobs.forEach(b => b.targetHover = 0);
      
    } else if (this.blobs.length < MAX_BLOBS) {
      // Spawn new blob at click position
      const newBlob = createBlob(clickX, clickY);
      
      // Start with a spawn ripple effect
      newBlob.ripple = 0;
      newBlob.rippleActive = true;
      newBlob.wobble = 0;
      newBlob.wobbleActive = true;
      
      this.blobs.push(newBlob);
    }
  }
  
  /**
   * Handle mouse/touch release
   */
  handleRelease() {
    if (this.dragging === -1) return;
    
    const blob = this.blobs[this.dragging];
    
    // Calculate throw velocity
    let throwVelX = 0;
    let throwVelY = 0;
    
    if (this.dragSamples.length > 0) {
      for (const sample of this.dragSamples) {
        throwVelX += sample.vx;
        throwVelY += sample.vy;
      }
      throwVelX /= this.dragSamples.length;
      throwVelY /= this.dragSamples.length;
    }
    
    // Update blob position and velocity
    blob.x = this.mouseX - this.dragOffsetX;
    blob.y = this.mouseY - this.dragOffsetY;
    blob.vx = throwVelX;
    blob.vy = throwVelY;
    
    // Trigger release effects
    blob.targetDrag = 0;
    blob.dragAnimTime = 0;
    blob.ripple = 0;
    blob.rippleActive = true;
    blob.wobble = 0;
    blob.wobbleActive = true;
    
    this.dragging = -1;
  }

  /**
   * Check which blob the mouse is hovering over
   * @param {number} mouseX - Mouse X in normalized coords
   * @param {number} mouseY - Mouse Y in normalized coords
   */
  updateHoverState(mouseX, mouseY) {
    const aspect = this.width / this.height;
    const mx = mouseX * aspect;
    
    let closestIdx = -1;
    let closestDist = Infinity;
    const hitRadius = CONFIG.radius * 1.1;
    
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      const dx = mx - blob.x * aspect;
      const dy = mouseY - blob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx !== this.hoveredBlob) {
      // Clear previous hover
      if (this.hoveredBlob !== -1 && this.hoveredBlob < this.blobs.length) {
        this.blobs[this.hoveredBlob].targetHover = 0;
        this.blobs[this.hoveredBlob].hoverAnimTime = 0;
      }
      
      // Set new hover
      this.hoveredBlob = closestIdx;
      if (closestIdx !== -1) {
        this.blobs[closestIdx].targetHover = 1;
        this.blobs[closestIdx].hoverAnimTime = 0;
      }
    }
  }
  
  /**
   * Elastic easing function
   * @param {number} t - Progress 0-1
   * @returns {number} Eased value
   */
  easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    const p = 0.4;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }

  update(dt) {
    super.update(dt);
    this.time += dt * CONFIG.speed;
    
    // Spawn initial blob at center after 1 second delay
    this.startDelay += dt;
    if (!this.initialBlobSpawned && this.startDelay >= 1.0) {
      this.initialBlobSpawned = true;
      const blob = createBlob(0, 0);  // Center
      blob.ripple = 0;
      blob.rippleActive = true;
      blob.wobble = 0;
      blob.wobbleActive = true;
      this.blobs.push(blob);
    }

    const friction = Math.pow(CONFIG.friction, dt * 60);
    const bounce = CONFIG.bounce;
    const boundsX = CONFIG.boundsX;
    const boundsY = CONFIG.boundsY;
    const maxVel = CONFIG.maxVel;
    const elasticDur = CONFIG.elasticDuration;

    // Mouse smoothing
    if (this.dragging !== -1) {
      this.mouseX = this.targetMouseX;
      this.mouseY = this.targetMouseY;
      
      // Calculate velocity for throw
      const dx = this.mouseX - this.lastDragX;
      const dy = this.mouseY - this.lastDragY;
      
      if (dt > 0) {
        const vx = dx / dt;
        const vy = dy / dt;
        this.dragSamples.push({ vx, vy });
        if (this.dragSamples.length > 5) {
          this.dragSamples.shift();
        }
      }
      
      this.lastDragX = this.mouseX;
      this.lastDragY = this.mouseY;
    } else {
      const ease = 1 - Math.pow(0.1, dt);
      this.mouseX += (this.targetMouseX - this.mouseX) * ease;
      this.mouseY += (this.targetMouseY - this.mouseY) * ease;
    }
    
    // Update each blob
    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      
      // Physics (only if not being dragged)
      if (this.dragging !== i) {
        blob.x += blob.vx * dt;
        blob.y += blob.vy * dt;
        blob.vx *= friction;
        blob.vy *= friction;
        
        // Clamp velocity
        const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy);
        if (speed > maxVel) {
          blob.vx = (blob.vx / speed) * maxVel;
          blob.vy = (blob.vy / speed) * maxVel;
        }
        
        // Wall bouncing
        if (blob.x > boundsX) {
          blob.x = boundsX;
          blob.vx *= -bounce;
        } else if (blob.x < -boundsX) {
          blob.x = -boundsX;
          blob.vx *= -bounce;
        }
        if (blob.y > boundsY) {
          blob.y = boundsY;
          blob.vy *= -bounce;
        } else if (blob.y < -boundsY) {
          blob.y = -boundsY;
          blob.vy *= -bounce;
        }
      }
      
      // Spawn scale animation (0 → 1 with elastic)
      if (blob.scale < 1) {
        blob.scaleAnimTime += dt;
        const t = Math.min(blob.scaleAnimTime / (elasticDur * 4.0), 1);  // Slow dramatic entrance
        blob.scale = this.easeOutElastic(t);
      }
      
      // Hover animation
      blob.hoverAnimTime += dt;
      if (blob.targetHover !== blob.hover) {
        const t = Math.min(blob.hoverAnimTime / elasticDur, 1);
        const eased = this.easeOutElastic(t);
        const start = blob.targetHover === 1 ? 0 : 1;
        blob.hover = start + (blob.targetHover - start) * eased;
      }
      
      // Drag animation
      blob.dragAnimTime += dt;
      if (blob.targetDrag !== blob.drag) {
        const t = Math.min(blob.dragAnimTime / elasticDur, 1);
        const eased = this.easeOutElastic(t);
        const start = blob.targetDrag === 1 ? 0 : 1;
        blob.drag = start + (blob.targetDrag - start) * eased;
      }
      
      // Ripple animation
      if (blob.rippleActive) {
        blob.ripple += dt;
        if (blob.ripple > 2.0) {
          blob.rippleActive = false;
        }
      }
      
      // Wobble animation
      if (blob.wobbleActive) {
        blob.wobble += dt;
        if (blob.wobble > 1.5) {
          blob.wobbleActive = false;
        }
      }
    }
    
    // Note: Blobs pass through each other (merge visually via smin in shader)
    // Only walls stop them - no blob-blob collision
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.useFallback) {
      this.renderFallback(ctx, w, h);
      return;
    }

    // Build uniforms object with individual array elements
    const uniforms = {
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uDragOffset: [this.dragOffsetX, this.dragOffsetY],
      uDragging: this.dragging,
      uIOR: CONFIG.ior,
      uBlurStrength: CONFIG.blurStrength,
      uRadius: CONFIG.radius,
      uSuperellipseN: CONFIG.superellipseN,
      uBlendRadius: CONFIG.blendRadius,
      uBlobCount: this.blobs.length,
      
      // Interaction config
      uHoverScale: CONFIG.hoverScale,
      uDragScale: CONFIG.dragScale,
      uDragSoften: CONFIG.dragSoften,
      uRippleSpeed: CONFIG.rippleSpeed,
      uRippleDecay: CONFIG.rippleDecay,
      uRippleStrength: CONFIG.rippleStrength,
      uWobbleFreq: CONFIG.wobbleFreq,
      uWobbleDecay: CONFIG.wobbleDecay,
    };
    
    // Set each array element individually (WebGL requires this)
    for (let i = 0; i < MAX_BLOBS; i++) {
      const blob = i < this.blobs.length ? this.blobs[i] : null;
      uniforms[`uBlobPos[${i}]`] = blob ? [blob.x, blob.y] : [0, 0];
      uniforms[`uBlobScale[${i}]`] = blob ? blob.scale : 0;
      uniforms[`uBlobHover[${i}]`] = blob ? blob.hover : 0;
      uniforms[`uBlobDrag[${i}]`] = blob ? blob.drag : 0;
      uniforms[`uBlobRipple[${i}]`] = blob ? blob.ripple : 0;
      uniforms[`uBlobWobble[${i}]`] = blob ? blob.wobble : 0;
    }

    // Set shader uniforms
    this.webgl.setUniforms(uniforms);

    // Render
    this.webgl.clear(0, 0, 0, 1);
    this.webgl.render();

    // Composite onto main canvas
    ctx.drawImage(this.webgl.getCanvas(), 0, 0, w, h);
  }

  /**
   * Canvas 2D fallback
   */
  renderFallback(ctx, w, h) {
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Checker background
    const tileSize = 40;
    for (let y = 0; y < h; y += tileSize) {
      for (let x = 0; x < w; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#1a1520' : '#12101a';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Render blobs
    this.blobs.forEach((blob, i) => {
      const posX = (this.dragging === i) ? (this.mouseX - this.dragOffsetX) : blob.x;
      const posY = (this.dragging === i) ? (this.mouseY - this.dragOffsetY) : blob.y;
      const x = cx + posX * 200;
      const y = cy - posY * 200;
      const radius = 60;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y + 15, radius * 1.1, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass blob
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 0,
        x, y, radius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.25)');
      gradient.addColorStop(0.7, 'rgba(150, 180, 220, 0.15)');
      gradient.addColorStop(1, 'rgba(200, 220, 255, 0.35)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius - 2, -0.8, 0.8, false);
      ctx.stroke();
    });
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
 * Create Day 23 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day23(canvas) {
  const game = new LiquidGlassDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
