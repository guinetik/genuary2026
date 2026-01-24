/**
 * Genuary 2026 - Day 24
 * Prompt: "Perfectionist's nightmare"
 *
 * Inspired by Pi (1998) - Darren Aronofsky
 * "Mathematics is the language of nature"
 * 
 * Visualization of π being irrational:
 * z(θ) = e^(θi) + e^(πθi)
 * 
 * Two circles rotating at speeds 1 and π. When π is rational, they sync.
 * When π is irrational, they never align. The circles never close.
 * 
 * Black and white. Grainy. Obsessive. Hand-drawn.
 */

import { Game, Painter, Camera3D, Gesture } from '@guinetik/gcanvas';

const CONFIG = {
  // Circle radii (the two rotating circles)
  radius1: 100,           // First circle (speed = 1)
  radius2: 100,           // Second circle (speed = π)

  // The key values
  piRational: 3.0,        // Simplified rational ≈ 3 (pattern closes after 3 revolutions)
  piIrrational: Math.PI,  // True π = 3.14159265... (never closes)

  // Animation
  timeStep: 0.06,

  // How much theta for "full" effects (chromatic aberration caps here)
  maxTheta: Math.PI * 60, // 30 full revolutions for effects to max out
  
  // Trail length limit (prevents infinite memory usage)
  maxTrailLength: 15000,  // Keep last N points

  // 3D depth - how much Z increases per theta
  depthPerTheta: 8,       // Z increases as pattern spirals away
  
  // Camera
  perspective: 800,
  initialRotationX: 0.05,  // Start almost flat

  // Zoom
  initialZoom: 0.08,       // Start tiny - see the whole thing from very far
  maxZoom: 1.5,            // End zoomed in (pulled into the vortex)
  wheelZoomSpeed: 0.08,    // Mouse wheel zoom sensitivity
  autoZoomSpeed: 0.0008,   // How fast auto-zoom pulls in per frame

  // Hand-drawn jitter
  jitterAmount: 0.6,

  // Film grain / dirt
  grainDensity: 0.25,
  scratchChance: 0.012,
  dustChance: 0.0006,

  // Flicker
  flickerSpeed: 0.08,
  flickerIntensity: 0.1,

  // Chromatic aberration - gets trippier as you go deeper
  chromaMaxOffset: 4,      // Max pixel offset - subtle fringe, not separate lines
  chromaStartProgress: 0.05, // When to start the effect

  // === NIGHTMARE MODE ===
  
  // Rational flash - glimpse of the closed form you'll never reach
  rationalFlashInterval: Math.PI * 8,  // Every 4 revolutions
  rationalFlashDuration: 12,           // Frames to show it (longer glimpse)
  
  // Line degradation - things that feel wrong
  maxJitterMultiplier: 4,    // Jitter increases over time up to this
  frameSkipChance: 0.03,     // Chance to skip rendering a frame (stutter)
  lineVibrateAmount: 2,      // Subtle vibration displacement
  
  // Crushed contrast - harsh, oppressive
  contrastBoost: 1.4,        // Multiply brightness differences
  crushBlacks: 20,           // Values below this become 0
  blowWhites: 235,           // Values above this become 255
};

class PerfectionistNightmare extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // State
    this.theta = 0;
    this.isRational = false;
    this.isAnimating = true;

    // Scale to fit
    this.scale = Math.min(this.width, this.height) / 500;

    // Center (for screen projection)
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // Camera3D setup - orbit around the spiral
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: CONFIG.initialRotationX,
      rotationY: Math.PI,  // Start rotated 180° - opposite view
      inertia: true,
      friction: 0.92,
      sensitivity: 0.004,
      clampX: false,  // Free rotation
      clampY: false,
    });
    this.camera.enableMouseControl(this.canvas);

    // Trail - the accumulating 3D path
    this.trail = [];

    // Zoom state
    this.zoom = CONFIG.initialZoom;
    this.targetZoom = CONFIG.initialZoom;
    this.userZoomed = false;  // While user is scrolling, disable auto-zoom
    this.zoomResumeTimer = null;  // Timer to resume auto-zoom

    // Nightmare mode state
    this.rationalFlashFrames = 0;  // Countdown for rational flash
    this.lastFlashTheta = 0;       // When we last flashed
    this.skipFrame = false;        // Frame skip stutter
    this.vibrateOffset = { x: 0, y: 0 };  // Current vibration

    // Grain buffer
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = this.width;
    this.grainCanvas.height = this.height;
    this.grainCtx = this.grainCanvas.getContext('2d');

    // Double-click to toggle mode (single click interferes with drag)
    if (!this._dblClickHandler) {
      this._dblClickHandler = () => {
        this.isRational = !this.isRational;
        this.trail = [];
        this.theta = 0;
        this.zoom = CONFIG.initialZoom;
        this.targetZoom = CONFIG.initialZoom;
        this.userZoomed = false;  // Re-enable auto-zoom
        if (this.zoomResumeTimer) {
          clearTimeout(this.zoomResumeTimer);
          this.zoomResumeTimer = null;
        }
      };
      this.canvas.addEventListener('dblclick', this._dblClickHandler);
    }

    // Gesture handler for zoom (wheel + pinch) - pauses auto-zoom
    if (!this._gesture) {
      this._gesture = new Gesture(this.canvas, {
        onZoom: (delta) => {
          this.userZoomed = true;  // Pause auto-zoom
          
          // Clear existing timer
          if (this.zoomResumeTimer) {
            clearTimeout(this.zoomResumeTimer);
          }
          
          // Resume auto-zoom after 2 seconds of no zooming
          this.zoomResumeTimer = setTimeout(() => {
            this.userZoomed = false;
          }, 2000);
          
          // Convert delta to zoom change
          const zoomDelta = delta * CONFIG.wheelZoomSpeed * 2;
          this.targetZoom = Math.max(0.05, this.targetZoom + zoomDelta);
        },
        // Double-tap to toggle mode on mobile
        onTap: () => {
          // Debounce taps
          const now = Date.now();
          if (this._lastTapTime && now - this._lastTapTime < 400) {
            // Double tap detected - toggle mode
            this.isRational = !this.isRational;
            this.trail = [];
            this.theta = 0;
            this.zoom = CONFIG.initialZoom;
            this.targetZoom = CONFIG.initialZoom;
            this.userZoomed = false;
            if (this.zoomResumeTimer) {
              clearTimeout(this.zoomResumeTimer);
              this.zoomResumeTimer = null;
            }
            this._lastTapTime = 0;
          } else {
            this._lastTapTime = now;
          }
        },
        wheelZoomFactor: CONFIG.wheelZoomSpeed,
        pinchZoomFactor: 2
      });
    }

    // Space to pause
    if (!this._keyHandler) {
      this._keyHandler = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          this.isAnimating = !this.isAnimating;
        }
      };
      this.canvas.addEventListener('keydown', this._keyHandler);
    }

    this.canvas.tabIndex = 0;
    this.canvas.focus();
  }

  get piValue() {
    return this.isRational ? CONFIG.piRational : CONFIG.piIrrational;
  }

  /**
   * Calculate 3D position using z(θ) = e^(θi) + e^(πθi)
   * x = cos(θ) + cos(π*θ)
   * y = sin(θ) + sin(π*θ)
   * z = θ * depthFactor (spiraling into the void)
   * @param {number} theta - The angle parameter
   * @returns {{x: number, y: number, z: number}} The 3D position
   */
  calculatePosition(theta) {
    const pi = this.piValue;
    const r1 = CONFIG.radius1 * this.scale;
    const r2 = CONFIG.radius2 * this.scale;
    
    // z(θ) = e^(θi) + e^(πθi) in the XY plane
    const x = r1 * Math.cos(theta) + r2 * Math.cos(pi * theta);
    const y = r1 * Math.sin(theta) + r2 * Math.sin(pi * theta);
    
    // Z = theta * depth factor - spiraling away
    const z = theta * CONFIG.depthPerTheta;
    
    return { x, y, z };
  }

  /**
   * Add hand-drawn jitter to a coordinate
   */
  jitter(val) {
    return val + (Math.random() - 0.5) * CONFIG.jitterAmount;
  }

  update(dt) {
    super.update(dt);
    
    // Update camera (for inertia/momentum)
    this.camera.update(dt);
    
    // Smooth zoom transition
    this.zoom += (this.targetZoom - this.zoom) * 0.05;
    
    if (!this.isAnimating) return;

    this.theta += CONFIG.timeStep;
    
    // Auto-zoom: slowly pull in from current position (only if user hasn't taken control)
    if (!this.userZoomed && this.targetZoom < CONFIG.maxZoom) {
      // Gradually increase zoom from wherever we are
      this.targetZoom += CONFIG.autoZoomSpeed;
      this.targetZoom = Math.min(this.targetZoom, CONFIG.maxZoom);
    }

    // === NIGHTMARE MODE ===
    
    // Rational flash - glimpse of peace, snatched away
    if (!this.isRational && this.rationalFlashFrames > 0) {
      this.rationalFlashFrames--;
    }
    if (!this.isRational && 
        this.theta - this.lastFlashTheta >= CONFIG.rationalFlashInterval) {
      this.rationalFlashFrames = CONFIG.rationalFlashDuration;
      this.lastFlashTheta = this.theta;
    }
    
    // Frame skip stutter - random chance to skip
    this.skipFrame = Math.random() < CONFIG.frameSkipChance;
    
    // Line vibration - subtle wrongness
    this.vibrateOffset = {
      x: (Math.random() - 0.5) * CONFIG.lineVibrateAmount,
      y: (Math.random() - 0.5) * CONFIG.lineVibrateAmount
    };

    // Calculate current 3D position
    const pos = this.calculatePosition(this.theta);
    
    // Store current position for the drawing point indicator
    this.currentPos = pos;

    // Add to trail (3D coordinates)
    this.trail.push({ 
      x: pos.x, 
      y: pos.y, 
      z: pos.z, 
      theta: this.theta 
    });
    
    // Trim trail to prevent infinite memory growth
    if (this.trail.length > CONFIG.maxTrailLength) {
      this.trail.shift();
    }
  }

  /**
   * Generate film grain, scratches, and dust overlay
   */
  renderGrain() {
    const ctx = this.grainCtx;
    
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Irregular grain - harsh, high contrast
    const clumpCount = Math.floor(this.width * this.height * CONFIG.grainDensity / 80);
    for (let i = 0; i < clumpCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 2.5 + 0.5;
      const isBright = Math.random() > 0.8;
      // Crushed contrast - either very dark or blown out
      const val = isBright ? CONFIG.blowWhites + Math.random() * 20 : Math.random() * CONFIG.crushBlacks;
      const alpha = Math.random() * 0.5 + 0.15;
      
      ctx.fillStyle = `rgba(${val}, ${val}, ${val}, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Vertical scratches
    if (Math.random() < CONFIG.scratchChance) {
      const scratchX = Math.random() * this.width;
      const scratchHeight = Math.random() * this.height * 0.7 + this.height * 0.2;
      const scratchY = Math.random() * (this.height - scratchHeight);
      
      ctx.strokeStyle = `rgba(200, 200, 200, ${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(scratchX, scratchY);
      for (let y = scratchY; y < scratchY + scratchHeight; y += 10) {
        ctx.lineTo(scratchX + (Math.random() - 0.5) * 2, y);
      }
      ctx.stroke();
    }
    
    // Dust specks
    const dustCount = Math.floor(this.width * this.height * CONFIG.dustChance);
    for (let i = 0; i < dustCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 4 + 2;
      
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.6 + 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Horizontal distortion band
    if (Math.random() < 0.03) {
      const bandY = Math.random() * this.height;
      const bandHeight = Math.random() * 8 + 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      ctx.fillRect(0, bandY, this.width, bandHeight);
    }
  }

  render() {
    const ctx = this.ctx;

    // Frame skip stutter - occasionally don't render (feels wrong)
    if (this.skipFrame) {
      return; // Skip this frame entirely - stutter effect
    }

    // Flicker effect - more intense over time
    const progress = Math.min(1, this.theta / CONFIG.maxTheta);
    const flickerIntensity = CONFIG.flickerIntensity * (1 + progress * 0.5);
    const flicker = 1 - Math.random() * flickerIntensity * 
      (0.5 + 0.5 * Math.sin(this.theta * CONFIG.flickerSpeed * 10));

    // Jitter multiplier - increases over time (degradation)
    const jitterMult = 1 + (CONFIG.maxJitterMultiplier - 1) * progress;

    // Clear with crushed black
    ctx.fillStyle = `rgb(${CONFIG.crushBlacks}, ${CONFIG.crushBlacks}, ${CONFIG.crushBlacks})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Set up hand-drawn style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Project all trail points through camera and draw
    if (this.trail.length > 1) {
      // Center the Z around current trail's midpoint
      const firstZ = this.trail[0].z;
      const lastZ = this.trail[this.trail.length - 1].z;
      const midZ = (firstZ + lastZ) / 2;
      
      // Project all points with zoom applied
      const projected = this.trail.map(p => {
        const proj = this.camera.project(p.x, p.y, p.z - midZ);
        return {
          sx: this.centerX + proj.x * this.zoom,
          sy: this.centerY + proj.y * this.zoom,
          scale: proj.scale * this.zoom,
          z: proj.z,
          theta: p.theta
        };
      });

      // Calculate chromatic aberration based on progress (trippier as we go deeper)
      const chromaProgress = Math.max(0, (progress - CONFIG.chromaStartProgress) / (1 - CONFIG.chromaStartProgress));
      const chromaOffset = CONFIG.chromaMaxOffset * Math.pow(chromaProgress, 1.2); // Faster ramp

      // Boost brightness for blown whites effect
      const baseBrightness = Math.min(255, Math.floor(80 * CONFIG.contrastBoost));
      const peakBrightness = Math.min(255, Math.floor(255 * CONFIG.contrastBoost));

      // Draw trail with chromatic aberration (RGB channels offset)
      ctx.globalCompositeOperation = 'lighter';
      
      const channels = [
        { color: `rgba(${peakBrightness}, ${baseBrightness}, ${baseBrightness}, ${0.7 * flicker})`, offsetX: -chromaOffset, offsetY: -chromaOffset * 0.5 },  // Red
        { color: `rgba(${baseBrightness}, ${peakBrightness}, ${baseBrightness}, ${0.7 * flicker})`, offsetX: 0, offsetY: 0 },  // Green (center)
        { color: `rgba(${baseBrightness}, ${baseBrightness}, ${peakBrightness}, ${0.7 * flicker})`, offsetX: chromaOffset, offsetY: chromaOffset * 0.5 },   // Blue
      ];
      
      for (const channel of channels) {
        ctx.beginPath();
        
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          
          // Per-point chromatic offset scales with depth
          const pointChroma = chromaOffset * (0.5 + 0.5 * p.scale);
          const offsetX = channel.offsetX * (0.3 + 0.7 * (p.theta / CONFIG.maxTheta));
          const offsetY = channel.offsetY * (0.3 + 0.7 * (p.theta / CONFIG.maxTheta));
          
          // Degrading jitter - increases over time + vibration
          const jx = p.sx + offsetX + this.vibrateOffset.x + (Math.random() - 0.5) * CONFIG.jitterAmount * jitterMult * 0.3;
          const jy = p.sy + offsetY + this.vibrateOffset.y + (Math.random() - 0.5) * CONFIG.jitterAmount * jitterMult * 0.3;
          
          if (i === 0) {
            ctx.moveTo(jx, jy);
          } else {
            ctx.lineTo(jx, jy);
          }
        }
        
        ctx.strokeStyle = channel.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw points with depth-based size/alpha and chromatic split
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < projected.length; i += 50) { // Every 50th point
        const p = projected[i];
        const depthAlpha = Math.max(0.1, Math.min(1, p.scale));
        const size = Math.max(0.5, 2 * p.scale);
        const pointProgress = p.theta / CONFIG.maxTheta;
        const pointChroma = chromaOffset * pointProgress;
        
        // RGB split on points too
        ctx.fillStyle = `rgba(255, 100, 100, ${depthAlpha * 0.25 * flicker})`;
        ctx.beginPath();
        ctx.arc(p.sx - pointChroma, p.sy - pointChroma * 0.5, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(100, 255, 100, ${depthAlpha * 0.25 * flicker})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(100, 100, 255, ${depthAlpha * 0.25 * flicker})`;
        ctx.beginPath();
        ctx.arc(p.sx + pointChroma, p.sy + pointChroma * 0.5, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      
      // === RATIONAL FLASH - glimpse of peace, snatched away ===
      if (this.rationalFlashFrames > 0 && !this.isRational) {
        const flashIntensity = this.rationalFlashFrames / CONFIG.rationalFlashDuration;
        
        // Calculate where the pattern WOULD close if π was rational
        const rationalPi = CONFIG.piRational;
        const r1 = CONFIG.radius1 * this.scale;
        const r2 = CONFIG.radius2 * this.scale;
        
        // Draw a ghost of the closed form
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 * flashIntensity * flicker})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Draw one complete closed cycle (3 revolutions for pi=3)
        const closedTheta = Math.PI * 2 * rationalPi;
        for (let t = 0; t <= closedTheta; t += 0.1) {
          const x = r1 * Math.cos(t) + r2 * Math.cos(rationalPi * t);
          const y = r1 * Math.sin(t) + r2 * Math.sin(rationalPi * t);
          const z = t * CONFIG.depthPerTheta;
          
          const proj = this.camera.project(x, y, z - midZ);
          const sx = this.centerX + proj.x * this.zoom;
          const sy = this.centerY + proj.y * this.zoom;
          
          if (t === 0) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
        
        // === EITHER big π OR scattered digits (not both) ===
        ctx.globalCompositeOperation = 'source-over';
        
        // Decide once per flash (use floor of theta to keep consistent during flash)
        const flashType = Math.floor(this.lastFlashTheta) % 2;
        
        if (flashType === 0) {
          // BIG RED π IN YOUR FACE
          const piSize = Math.min(this.width, this.height) * 0.5;
          ctx.font = `bold ${piSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(255, 0, 0, ${0.8 * flashIntensity * flicker})`;
          ctx.fillText('π', this.centerX + (Math.random() - 0.5) * 20, this.centerY + (Math.random() - 0.5) * 20);
        } else {
          // DIGITS OF PI SCATTERED EVERYWHERE
          const piDigits = '3141592653589793238462643383279502884197169399375105820974944592307816406286';
          const digitCount = Math.floor(100 * flashIntensity);
          
          for (let i = 0; i < digitCount; i++) {
            const digit = piDigits[Math.floor(Math.random() * piDigits.length)];
            const dx = Math.random() * this.width;
            const dy = Math.random() * this.height;
            const digitSize = 24 + Math.random() * 72;  // Variable sizes
            
            ctx.font = `bold ${digitSize}px monospace`;
            
            // Black and gray - subtle, obsessive
            const gray = Math.floor(Math.random() * 100 + 50);  // 50-150 gray
            ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${0.5 + Math.random() * 0.4})`;
            ctx.fillText(digit, dx, dy);
          }
        }
        
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // Current point indicator - bright pulsing dot with chromatic split
    if (this.currentPos && this.trail.length > 1) {
      const firstZ = this.trail[0].z;
      const lastZ = this.trail[this.trail.length - 1].z;
      const midZ = (firstZ + lastZ) / 2;
      const proj = this.camera.project(
        this.currentPos.x, 
        this.currentPos.y, 
        this.currentPos.z - midZ
      );
      
      const pulse = 0.7 + 0.3 * Math.sin(this.theta * 8);
      const size = Math.max(2, 4 * proj.scale * this.zoom);
      const cx = this.centerX + proj.x * this.zoom;
      const cy = this.centerY + proj.y * this.zoom;
      
      // Chromatic split on current point
      const progress = this.theta / CONFIG.maxTheta;
      const chromaProgress = Math.max(0, (progress - CONFIG.chromaStartProgress) / (1 - CONFIG.chromaStartProgress));
      const pointChroma = CONFIG.chromaMaxOffset * chromaProgress * progress;
      
      ctx.globalCompositeOperation = 'lighter';
      
      ctx.fillStyle = `rgba(255, 120, 120, ${pulse * flicker})`;
      ctx.beginPath();
      ctx.arc(cx - pointChroma, cy - pointChroma * 0.5, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = `rgba(120, 255, 120, ${pulse * flicker})`;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = `rgba(120, 120, 255, ${pulse * flicker})`;
      ctx.beginPath();
      ctx.arc(cx + pointChroma, cy + pointChroma * 0.5, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalCompositeOperation = 'source-over';
    }

    // Film grain overlay
    if (Math.random() > 0.5) {
      this.renderGrain();
    }
    ctx.drawImage(this.grainCanvas, 0, 0);
    
    // Occasional vignette
    if (Math.random() < 0.06) {
      const gradient = ctx.createRadialGradient(
        this.centerX, this.centerY, this.width * 0.2,
        this.centerX, this.centerY, this.width * 0.55
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // UI - typewriter style
    ctx.font = '12px monospace';
    ctx.fillStyle = `rgba(150, 150, 150, ${0.5 * flicker})`;
    
    const piLabel = this.isRational ? 'π ≈ 3' : 'π = 3.14159265...';
    ctx.fillText(piLabel, 20, 30);
    
    // Show the formula
    ctx.fillStyle = `rgba(120, 120, 120, ${0.4 * flicker})`;
    ctx.fillText('z(θ) = e^(θi) + e^(πθi)', 20, 48);
    
    // Progress
    const revolutions = (this.theta / (Math.PI * 2)).toFixed(1);
    ctx.fillStyle = `rgba(150, 150, 150, ${0.4 * flicker})`;
    ctx.fillText(`${revolutions} revolutions`, 20, 66);
    
    // Status message
    if (this.isRational) {
      ctx.fillStyle = `rgba(100, 255, 100, ${0.4 * flicker})`;
      ctx.fillText('it would close...', 20, 84);
    } else {
      ctx.fillStyle = `rgba(255, 100, 100, ${0.4 * flicker})`;
      ctx.fillText('it will never close.', 20, 84);
    }
    
    // Hint
    ctx.fillStyle = `rgba(100, 100, 100, ${0.3 * flicker})`;
    ctx.fillText('drag to orbit • scroll/pinch to zoom • double-tap to toggle π', 20, this.height - 20);
  }

  stop() {
    super.stop();
    if (this._gesture) {
      this._gesture.destroy();
    }
    if (this.zoomResumeTimer) {
      clearTimeout(this.zoomResumeTimer);
    }
  }
}

/**
 * Create Day 24 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day24(canvas) {
  const game = new PerfectionistNightmare(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
