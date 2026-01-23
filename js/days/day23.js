/**
 * Genuary 2026 - Day 23
 * Prompt: "Transparency"
 * Credit: PaoloCurtoni
 *
 * LIQUID GLASS
 * Interactive glass lens shader with proper fresnel and refraction physics.
 * Uses IQ's superellipse SDF for smooth organic shapes.
 *
 * Features:
 * - IQ's superellipse SDF design
 * - Proper Fresnel reflectance with IOR
 * - Gaussian blur for frosted glass
 * - Chromatic aberration with lens distortion
 * - Drop shadows
 * - Mouse-controlled blob merging
 */

import { Game, WebGLRenderer } from '@guinetik/gcanvas';

// Import shaders as raw strings (Vite handles this with ?raw suffix)
import VERTEX_SHADER from '../../glsl/liquidg.vert?raw';
import FRAGMENT_SHADER from '../../glsl/liquidg.frag?raw';

const CONFIG = {
  // Animation
  speed: 0.3,
  
  // Glass properties
  ior: 1.5,  // Index of refraction (glass ~1.5)
  blurStrength: 1.5,
  
  // Shape
  radius: 0.28,
  superellipseN: 4.0,  // Squareness (2=circle, 4=squircle, higher=more square)
  blendRadius: 0.15,
  
  // Interaction effects
  hoverScale: 0.08,       // +8% scale on hover
  dragScale: 0.20,        // +20% scale on drag
  hoverGlow: 0.3,         // Extra glow intensity on hover
  dragSoften: 0.8,        // Superellipse N reduction during drag (more organic)
  rippleSpeed: 18.0,      // How fast ripples propagate outward
  rippleDecay: 1.2,       // How fast ripples fade (lower = longer lasting)
  rippleStrength: 0.18,   // Amplitude of ripple UV displacement
  wobbleFreq: 12.0,       // Wobble frequency
  wobbleDecay: 3.0,       // How fast wobble settles
  elasticDuration: 0.6,   // Duration of elastic animations (seconds)
};

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
    this.dragging = 0;  // 0 = none, 1 = blob1, 2 = blob2
    
    // Drag offset - difference between click point and blob center
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    // Drop positions for both blobs
    // Blob 1 starts on the left
    this.dropPos1X = -0.3;
    this.dropPos1Y = 0;
    // Blob 2 starts on the right
    this.dropPos2X = 0.3;
    this.dropPos2Y = 0;
    
    // Velocity for inertia (both blobs) - billiard physics
    this.vel1X = 0;
    this.vel1Y = 0;
    this.vel2X = 0;
    this.vel2Y = 0;
    
    // Velocity tracking for throw calculation
    this.dragVelX = 0;
    this.dragVelY = 0;
    this.lastDragX = 0;
    this.lastDragY = 0;
    this.dragSamples = [];  // Rolling average for smooth throw
    
    // ==========================================================================
    // INTERACTION STATE - hover, drag, ripple, wobble per blob
    // ==========================================================================
    
    // Hover state (which blob is being hovered, -1 = none)
    this.hoveredBlob = -1;
    
    // Animated interaction values (0-1, with elastic easing)
    this.hover1 = 0;          // Current hover intensity for blob 1
    this.hover2 = 0;          // Current hover intensity for blob 2
    this.drag1 = 0;           // Current drag intensity for blob 1
    this.drag2 = 0;           // Current drag intensity for blob 2
    
    // Target values for elastic animation
    this.targetHover1 = 0;
    this.targetHover2 = 0;
    this.targetDrag1 = 0;
    this.targetDrag2 = 0;
    
    // Ripple animation (triggered on release, counts up from 0)
    this.ripple1 = 0;
    this.ripple2 = 0;
    this.rippleActive1 = false;
    this.rippleActive2 = false;
    
    // Wobble animation (starts on release, decays)
    this.wobble1 = 0;
    this.wobble2 = 0;
    this.wobbleActive1 = false;
    this.wobbleActive2 = false;
    
    // Elastic animation timing
    this.hoverAnimTime1 = 0;
    this.hoverAnimTime2 = 0;
    this.dragAnimTime1 = 0;
    this.dragAnimTime2 = 0;

    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Hover detection (only when not dragging)
      if (this.dragging === 0) {
        this.updateHoverState(this.targetMouseX, this.targetMouseY);
      }
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      // Clear hover when mouse leaves canvas
      if (this.dragging === 0) {
        this.hoveredBlob = -1;
        this.targetHover1 = 0;
        this.targetHover2 = 0;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const clickY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Account for aspect ratio like the shader does
      const aspect = this.width / this.height;
      const clickXAspect = clickX * aspect;
      
      // Check distance to blob 1
      const dx1 = clickXAspect - this.dropPos1X * aspect;
      const dy1 = clickY - this.dropPos1Y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Check distance to blob 2
      const dx2 = clickXAspect - this.dropPos2X * aspect;
      const dy2 = clickY - this.dropPos2Y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      const hitRadius = CONFIG.radius * 1.2;
      
      // Determine which blob was clicked (prefer closer one if overlapping)
      if (dist1 < hitRadius && dist1 <= dist2) {
        this.dragging = 1;
        // Stop any existing velocity
        this.vel1X = 0;
        this.vel1Y = 0;
        // Store offset from click to blob center
        this.dragOffsetX = clickX - this.dropPos1X;
        this.dragOffsetY = clickY - this.dropPos1Y;
        // Immediate response - no smoothing
        this.mouseX = clickX;
        this.mouseY = clickY;
        this.targetMouseX = clickX;
        this.targetMouseY = clickY;
        // Reset drag velocity tracking
        this.dragSamples = [];
        this.lastDragX = clickX;
        this.lastDragY = clickY;
        
        // === INTERACTION: Start drag animation ===
        this.targetDrag1 = 1;
        this.dragAnimTime1 = 0;
        // Clear hover (we're now dragging)
        this.targetHover1 = 0;
        this.targetHover2 = 0;
        this.hoveredBlob = -1;
        // Stop any existing ripple
        this.rippleActive1 = false;
        this.ripple1 = 0;
        
      } else if (dist2 < hitRadius) {
        this.dragging = 2;
        // Stop any existing velocity
        this.vel2X = 0;
        this.vel2Y = 0;
        this.dragOffsetX = clickX - this.dropPos2X;
        this.dragOffsetY = clickY - this.dropPos2Y;
        // Immediate response - no smoothing
        this.mouseX = clickX;
        this.mouseY = clickY;
        this.targetMouseX = clickX;
        this.targetMouseY = clickY;
        // Reset drag velocity tracking
        this.dragSamples = [];
        this.lastDragX = clickX;
        this.lastDragY = clickY;
        
        // === INTERACTION: Start drag animation ===
        this.targetDrag2 = 1;
        this.dragAnimTime2 = 0;
        // Clear hover
        this.targetHover1 = 0;
        this.targetHover2 = 0;
        this.hoveredBlob = -1;
        // Stop any existing ripple
        this.rippleActive2 = false;
        this.ripple2 = 0;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      // Calculate throw velocity from rolling average
      let throwVelX = 0;
      let throwVelY = 0;
      
      if (this.dragSamples.length > 0) {
        // Use average of recent velocity samples for smooth throw
        for (const sample of this.dragSamples) {
          throwVelX += sample.vx;
          throwVelY += sample.vy;
        }
        throwVelX /= this.dragSamples.length;
        throwVelY /= this.dragSamples.length;
      }
      
      // Save drop position and apply velocity
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
        
        // === INTERACTION: Release - trigger ripple & wobble ===
        this.targetDrag1 = 0;
        this.dragAnimTime1 = 0;
        this.ripple1 = 0;
        this.rippleActive1 = true;
        this.wobble1 = 0;
        this.wobbleActive1 = true;
        
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
        
        // === INTERACTION: Release - trigger ripple & wobble ===
        this.targetDrag2 = 0;
        this.dragAnimTime2 = 0;
        this.ripple2 = 0;
        this.rippleActive2 = true;
        this.wobble2 = 0;
        this.wobbleActive2 = true;
      }
      this.dragging = 0;
    });

    // Note: The earlier mouseleave handles hover clearing
    // This one handles drag release when dragging outside canvas
    this.canvas.addEventListener('mouseup', (e) => {
      // This is a duplicate listener but needed to catch mouseup outside canvas
    }, { capture: true });
    
    // Handle drag release when mouse leaves while dragging
    window.addEventListener('mouseup', () => {
      if (this.dragging === 0) return;
      
      // Calculate throw velocity from rolling average
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
      
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
        
        // === INTERACTION: Release effects ===
        this.targetDrag1 = 0;
        this.dragAnimTime1 = 0;
        this.ripple1 = 0;
        this.rippleActive1 = true;
        this.wobble1 = 0;
        this.wobbleActive1 = true;
        
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
        
        // === INTERACTION: Release effects ===
        this.targetDrag2 = 0;
        this.dragAnimTime2 = 0;
        this.ripple2 = 0;
        this.rippleActive2 = true;
        this.wobble2 = 0;
        this.wobbleActive2 = true;
      }
      this.dragging = 0;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      const touchY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Account for aspect ratio
      const aspect = this.width / this.height;
      const touchXAspect = touchX * aspect;
      
      // Check distance to blob 1
      const dx1 = touchXAspect - this.dropPos1X * aspect;
      const dy1 = touchY - this.dropPos1Y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Check distance to blob 2
      const dx2 = touchXAspect - this.dropPos2X * aspect;
      const dy2 = touchY - this.dropPos2Y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      const hitRadius = CONFIG.radius * 1.2;
      
      // Determine which blob was touched
      if (dist1 < hitRadius && dist1 <= dist2) {
        this.dragging = 1;
        this.vel1X = 0;
        this.vel1Y = 0;
        this.dragOffsetX = touchX - this.dropPos1X;
        this.dragOffsetY = touchY - this.dropPos1Y;
        this.mouseX = touchX;
        this.mouseY = touchY;
        this.targetMouseX = touchX;
        this.targetMouseY = touchY;
        this.dragSamples = [];
        this.lastDragX = touchX;
        this.lastDragY = touchY;
        
        // === INTERACTION: Start drag animation ===
        this.targetDrag1 = 1;
        this.dragAnimTime1 = 0;
        this.rippleActive1 = false;
        this.ripple1 = 0;
        
      } else if (dist2 < hitRadius) {
        this.dragging = 2;
        this.vel2X = 0;
        this.vel2Y = 0;
        this.dragOffsetX = touchX - this.dropPos2X;
        this.dragOffsetY = touchY - this.dropPos2Y;
        this.mouseX = touchX;
        this.mouseY = touchY;
        this.targetMouseX = touchX;
        this.targetMouseY = touchY;
        this.dragSamples = [];
        this.lastDragX = touchX;
        this.lastDragY = touchY;
        
        // === INTERACTION: Start drag animation ===
        this.targetDrag2 = 1;
        this.dragAnimTime2 = 0;
        this.rippleActive2 = false;
        this.ripple2 = 0;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetMouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      // Calculate throw velocity from rolling average
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
      
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
        
        // === INTERACTION: Release - trigger ripple & wobble ===
        this.targetDrag1 = 0;
        this.dragAnimTime1 = 0;
        this.ripple1 = 0;
        this.rippleActive1 = true;
        this.wobble1 = 0;
        this.wobbleActive1 = true;
        
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
        
        // === INTERACTION: Release - trigger ripple & wobble ===
        this.targetDrag2 = 0;
        this.dragAnimTime2 = 0;
        this.ripple2 = 0;
        this.rippleActive2 = true;
        this.wobble2 = 0;
        this.wobbleActive2 = true;
      }
      this.dragging = 0;
    });
  }

  /**
   * Check which blob the mouse is hovering over
   * @param {number} mouseX - Mouse X in normalized coords (-1 to 1)
   * @param {number} mouseY - Mouse Y in normalized coords (-1 to 1)
   */
  updateHoverState(mouseX, mouseY) {
    const aspect = this.width / this.height;
    const mx = mouseX * aspect;
    
    // Check distance to blob 1
    const dx1 = mx - this.dropPos1X * aspect;
    const dy1 = mouseY - this.dropPos1Y;
    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    
    // Check distance to blob 2
    const dx2 = mx - this.dropPos2X * aspect;
    const dy2 = mouseY - this.dropPos2Y;
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
    const hitRadius = CONFIG.radius * 1.1;
    
    // Determine hover state
    const prevHovered = this.hoveredBlob;
    
    if (dist1 < hitRadius && dist1 <= dist2) {
      this.hoveredBlob = 1;
    } else if (dist2 < hitRadius) {
      this.hoveredBlob = 2;
    } else {
      this.hoveredBlob = -1;
    }
    
    // Update hover targets
    if (this.hoveredBlob !== prevHovered) {
      if (this.hoveredBlob === 1) {
        this.targetHover1 = 1;
        this.targetHover2 = 0;
        this.hoverAnimTime1 = 0;
      } else if (this.hoveredBlob === 2) {
        this.targetHover1 = 0;
        this.targetHover2 = 1;
        this.hoverAnimTime2 = 0;
      } else {
        this.targetHover1 = 0;
        this.targetHover2 = 0;
        this.hoverAnimTime1 = 0;
        this.hoverAnimTime2 = 0;
      }
    }
  }
  
  /**
   * Elastic easing function (attempt out-elastic feel)
   * @param {number} t - Progress 0-1
   * @returns {number} Eased value
   */
  easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    const p = 0.4;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }
  
  /**
   * Animate a value toward target with elastic easing
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @param {number} animTime - Animation time elapsed
   * @param {number} duration - Total animation duration
   * @returns {number} New value
   */
  animateElastic(current, target, animTime, duration) {
    if (animTime >= duration) return target;
    const t = Math.min(animTime / duration, 1);
    const eased = this.easeOutElastic(t);
    const start = target === 1 ? 0 : 1;  // Infer start from target
    return start + (target - start) * eased;
  }

  update(dt) {
    super.update(dt);
    this.time += dt * CONFIG.speed;

    // Billiard physics constants
    const friction = Math.pow(0.995, dt * 60);  // Frame-rate independent friction
    const bounce = 0.85;      // High bounce coefficient (billiard-like)
    const boundsX = 0.88;     // Horizontal boundary
    const boundsY = 0.78;     // Vertical boundary
    const maxVel = 4.0;       // Cap maximum velocity

    // When dragging, use immediate mouse position (no smoothing)
    if (this.dragging > 0) {
      // Immediate response while dragging
      this.mouseX = this.targetMouseX;
      this.mouseY = this.targetMouseY;
      
      // Calculate instantaneous velocity for throw
      const dx = this.mouseX - this.lastDragX;
      const dy = this.mouseY - this.lastDragY;
      
      if (dt > 0) {
        const vx = dx / dt;
        const vy = dy / dt;
        
        // Add to rolling samples (keep last 5 for smooth average)
        this.dragSamples.push({ vx, vy });
        if (this.dragSamples.length > 5) {
          this.dragSamples.shift();
        }
      }
      
      this.lastDragX = this.mouseX;
      this.lastDragY = this.mouseY;
    } else {
      // When not dragging, smooth mouse for shader effects
      const ease = 1 - Math.pow(0.1, dt);
      this.mouseX += (this.targetMouseX - this.mouseX) * ease;
      this.mouseY += (this.targetMouseY - this.mouseY) * ease;
    }
    
    // Blob 1 physics (billiard-style wall bouncing)
    if (this.dragging !== 1) {
      // Apply velocity
      this.dropPos1X += this.vel1X * dt;
      this.dropPos1Y += this.vel1Y * dt;
      
      // Apply friction (frame-rate independent)
      this.vel1X *= friction;
      this.vel1Y *= friction;
      
      // Clamp velocity
      const speed1 = Math.sqrt(this.vel1X * this.vel1X + this.vel1Y * this.vel1Y);
      if (speed1 > maxVel) {
        this.vel1X = (this.vel1X / speed1) * maxVel;
        this.vel1Y = (this.vel1Y / speed1) * maxVel;
      }
      
      // Stop if very slow
      if (speed1 < 0.001) {
        this.vel1X = 0;
        this.vel1Y = 0;
      }
      
      // Bounce off walls (billiard style)
      if (this.dropPos1X > boundsX) {
        this.dropPos1X = boundsX;
        this.vel1X = -Math.abs(this.vel1X) * bounce;
      } else if (this.dropPos1X < -boundsX) {
        this.dropPos1X = -boundsX;
        this.vel1X = Math.abs(this.vel1X) * bounce;
      }
      
      if (this.dropPos1Y > boundsY) {
        this.dropPos1Y = boundsY;
        this.vel1Y = -Math.abs(this.vel1Y) * bounce;
      } else if (this.dropPos1Y < -boundsY) {
        this.dropPos1Y = -boundsY;
        this.vel1Y = Math.abs(this.vel1Y) * bounce;
      }
    }
    
    // Blob 2 physics (billiard-style wall bouncing)
    if (this.dragging !== 2) {
      // Apply velocity
      this.dropPos2X += this.vel2X * dt;
      this.dropPos2Y += this.vel2Y * dt;
      
      // Apply friction (frame-rate independent)
      this.vel2X *= friction;
      this.vel2Y *= friction;
      
      // Clamp velocity
      const speed2 = Math.sqrt(this.vel2X * this.vel2X + this.vel2Y * this.vel2Y);
      if (speed2 > maxVel) {
        this.vel2X = (this.vel2X / speed2) * maxVel;
        this.vel2Y = (this.vel2Y / speed2) * maxVel;
      }
      
      // Stop if very slow
      if (speed2 < 0.001) {
        this.vel2X = 0;
        this.vel2Y = 0;
      }
      
      // Bounce off walls (billiard style)
      if (this.dropPos2X > boundsX) {
        this.dropPos2X = boundsX;
        this.vel2X = -Math.abs(this.vel2X) * bounce;
      } else if (this.dropPos2X < -boundsX) {
        this.dropPos2X = -boundsX;
        this.vel2X = Math.abs(this.vel2X) * bounce;
      }
      
      if (this.dropPos2Y > boundsY) {
        this.dropPos2Y = boundsY;
        this.vel2Y = -Math.abs(this.vel2Y) * bounce;
      } else if (this.dropPos2Y < -boundsY) {
        this.dropPos2Y = -boundsY;
        this.vel2Y = Math.abs(this.vel2Y) * bounce;
      }
    }
    
    // =========================================================================
    // INTERACTION ANIMATION
    // =========================================================================
    
    const elasticDur = CONFIG.elasticDuration;
    
    // Hover animation (blob 1)
    this.hoverAnimTime1 += dt;
    if (this.targetHover1 !== this.hover1) {
      const t = Math.min(this.hoverAnimTime1 / elasticDur, 1);
      const eased = this.easeOutElastic(t);
      const start = this.targetHover1 === 1 ? 0 : 1;
      this.hover1 = start + (this.targetHover1 - start) * eased;
    }
    
    // Hover animation (blob 2)
    this.hoverAnimTime2 += dt;
    if (this.targetHover2 !== this.hover2) {
      const t = Math.min(this.hoverAnimTime2 / elasticDur, 1);
      const eased = this.easeOutElastic(t);
      const start = this.targetHover2 === 1 ? 0 : 1;
      this.hover2 = start + (this.targetHover2 - start) * eased;
    }
    
    // Drag animation (blob 1)
    this.dragAnimTime1 += dt;
    if (this.targetDrag1 !== this.drag1) {
      const t = Math.min(this.dragAnimTime1 / elasticDur, 1);
      const eased = this.easeOutElastic(t);
      const start = this.targetDrag1 === 1 ? 0 : 1;
      this.drag1 = start + (this.targetDrag1 - start) * eased;
    }
    
    // Drag animation (blob 2)
    this.dragAnimTime2 += dt;
    if (this.targetDrag2 !== this.drag2) {
      const t = Math.min(this.dragAnimTime2 / elasticDur, 1);
      const eased = this.easeOutElastic(t);
      const start = this.targetDrag2 === 1 ? 0 : 1;
      this.drag2 = start + (this.targetDrag2 - start) * eased;
    }
    
    // Ripple animation (counts up while active)
    if (this.rippleActive1) {
      this.ripple1 += dt;
      if (this.ripple1 > 2.0) {  // Ripple fades out after ~2 seconds
        this.rippleActive1 = false;
      }
    }
    if (this.rippleActive2) {
      this.ripple2 += dt;
      if (this.ripple2 > 2.0) {
        this.rippleActive2 = false;
      }
    }
    
    // Wobble animation (counts up while active)
    if (this.wobbleActive1) {
      this.wobble1 += dt;
      if (this.wobble1 > 1.5) {  // Wobble settles after ~1.5 seconds
        this.wobbleActive1 = false;
      }
    }
    if (this.wobbleActive2) {
      this.wobble2 += dt;
      if (this.wobble2 > 1.5) {
        this.wobbleActive2 = false;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.useFallback) {
      this.renderFallback(ctx, w, h);
      return;
    }

    // Set shader uniforms
    this.webgl.setUniforms({
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uDragOffset: [this.dragOffsetX, this.dragOffsetY],
      uDragging: this.dragging,
      uDropPos1: [this.dropPos1X, this.dropPos1Y],
      uDropPos2: [this.dropPos2X, this.dropPos2Y],
      uIOR: CONFIG.ior,
      uBlurStrength: CONFIG.blurStrength,
      uRadius: CONFIG.radius,
      uSuperellipseN: CONFIG.superellipseN,
      uBlendRadius: CONFIG.blendRadius,
      
      // Interaction uniforms
      uHover1: this.hover1,
      uHover2: this.hover2,
      uDrag1: this.drag1,
      uDrag2: this.drag2,
      uRipple1: this.ripple1,
      uRipple2: this.ripple2,
      uWobble1: this.wobble1,
      uWobble2: this.wobble2,
      
      // Interaction config
      uHoverScale: CONFIG.hoverScale,
      uDragScale: CONFIG.dragScale,
      uDragSoften: CONFIG.dragSoften,
      uRippleSpeed: CONFIG.rippleSpeed,
      uRippleDecay: CONFIG.rippleDecay,
      uRippleStrength: CONFIG.rippleStrength,
      uWobbleFreq: CONFIG.wobbleFreq,
      uWobbleDecay: CONFIG.wobbleDecay,
    });

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
    const time = this.time;

    // Checker background
    const tileSize = 40;
    for (let y = 0; y < h; y += tileSize) {
      for (let x = 0; x < w; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#1a1520' : '#12101a';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Two glass blobs - both draggable (apply offset so blob doesn't jump to cursor)
    const positions = [
      { 
        x: cx + (this.dragging === 1 ? (this.mouseX - this.dragOffsetX) : this.dropPos1X) * 200, 
        y: cy + (this.dragging === 1 ? (this.mouseY - this.dragOffsetY) : this.dropPos1Y) * 200 
      },
      { 
        x: cx + (this.dragging === 2 ? (this.mouseX - this.dragOffsetX) : this.dropPos2X) * 200, 
        y: cy + (this.dragging === 2 ? (this.mouseY - this.dragOffsetY) : this.dropPos2Y) * 200 
      },
    ];

    positions.forEach((pos, i) => {
      const radius = 80;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + 15, radius * 1.1, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass blob with gradient
      const gradient = ctx.createRadialGradient(
        pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
        pos.x, pos.y, radius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.25)');
      gradient.addColorStop(0.7, 'rgba(150, 180, 220, 0.15)');
      gradient.addColorStop(1, 'rgba(200, 220, 255, 0.35)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius - 2, -0.8, 0.8, false);
      ctx.stroke();

      // Specular
      const specGradient = ctx.createRadialGradient(
        pos.x - radius * 0.4, pos.y - radius * 0.4, 0,
        pos.x - radius * 0.4, pos.y - radius * 0.4, radius * 0.35
      );
      specGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      specGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = specGradient;
      ctx.beginPath();
      ctx.arc(pos.x - radius * 0.4, pos.y - radius * 0.4, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
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
