/**
 * Genuary 2026 - Day 31
 * Prompt: "GLSL day"
 * 
 * @fileoverview FINALE: Synthwave landscape with floating poster gallery
 * 
 * A cinematic finale combining multiple rendering techniques:
 * - Raymarched terrain with black hole gravitational lensing
 * - Sierpinski fractal sky with procedural generation
 * - 3D poster billboards flying by like roadside signs
 * - Bird flocks crossing the sky using simplified boids
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, WebGLRenderer, Camera3D } from '@guinetik/gcanvas';

// Import shaders as raw strings (Vite handles this with ?raw suffix)
import VERTEX_SHADER from '../../glsl/finale.vert?raw';
import FRAGMENT_SHADER from '../../glsl/finale.frag?raw';

// Black hole as separate composited layer
import BH_VERTEX from '../../glsl/blackhole.vert?raw';
import BH_FRAGMENT from '../../glsl/blackhole.frag?raw';

// Day 31 modules
import { CONFIG } from './day31.config.js';
import { BirdFlock } from './day31.birds.js';
import { FlyingPoster } from './day31.posters.js';
import { Runner } from './day31.runner.js';
import { MatrixRain } from './day31.matrix.js';

/**
 * Genuary Finale Demo
 * 
 * Main game class for Day 31, managing WebGL shaders, poster rendering,
 * bird flocks, and user interaction.
 * 
 * @class GenuaryFinaleDemo
 * @extends {Game}
 */
class GenuaryFinaleDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();

    // Initialize WebGL renderer for terrain
    this.webgl = new WebGLRenderer(this.width, this.height);

    if (!this.webgl.isAvailable()) {
      console.warn('WebGL not available');
      this.useFallback = true;
      return;
    }

    // Compile terrain shader program
    this.webgl.useProgram('finale', VERTEX_SHADER, FRAGMENT_SHADER);
    
    // Initialize WebGL renderer for black hole (separate layer)
    this.webglBH = new WebGLRenderer(this.width, this.height);
    this.webglBH.useProgram('blackhole', BH_VERTEX, BH_FRAGMENT);
    
    // Black hole position/size (will be driven by shader animation or fixed)
    // Position is in normalized coords (0.5, 0.5 = center)
    // Y > 0.5 = higher on screen (toward sky)
    this.bhPosition = [0.5, 0.55]; // Up in the sky, above horizon
    this.bhSize = 0.04; // Radius in screen proportion (smaller)

    // Time tracking
    this.time = 0;
    this.completion = 0;
    
    // Camera Z position (matches shader movement)
    this.cameraZ = 0;

    // Mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseActive = 0;

    // Setup 3D camera for poster projection
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: 0,
      rotationY: 0,
    });

    // Load poster images and create flying posters
    this.posters = [];
    this.loadPosters();
    
    // Spawn timing - alternating sides like roadside billboards
    this.spawnCooldown = 0.5;  // Short initial delay
    this.nextPosterIndex = 0;
    this.nextSide = 1;         // Start on right, alternate: 1 = right, -1 = left

    // Mouse event listeners
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * 2.0 - 1.0;
      this.mouseActive = 1.0;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseActive = 0.0;
    });

    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * 2.0 - 1.0;
      this.mouseY = ((touch.clientY - rect.top) / rect.height) * 2.0 - 1.0;
      this.mouseActive = 1.0;
    });

    this.canvas.addEventListener('touchend', () => {
      this.mouseActive = 0.0;
    });

    // Texture (available if needed)
    this.paintingTexture = null;
    
    // Pulse for spawn effects (sent to shader)
    this.pulse = 0;
    this.pulseDecay = 2.5; // How fast pulse fades (per second)
    
    // Bird flocks
    this.flocks = [];
    this.nextFlockTime = 3 + Math.random() * 5; // First flock after a few seconds
    
    // The iconic running girl
    this.runner = new Runner(this);
    this._loadRunner();
    
    // Matrix rain effect (periodic)
    this.matrixRain = new MatrixRain();
    this.matrixRain.init(this.width, this.height);
  }
  
  /**
   * Load the runner sprite asynchronously
   * @private
   */
  async _loadRunner() {
    await this.runner.load();
  }
  
  /**
   * Spawn a new flock of birds flying across the sky
   * 
   * Birds spawn from random screen edges and fly across the upper portion
   * of the screen (sky area). Uses simplified boids for flocking behavior.
   */
  spawnFlock() {
    const w = this.width;
    const h = this.height;
    
    // Random flock size
    const count = CONFIG.birdFlockSize.min + 
      Math.floor(Math.random() * (CONFIG.birdFlockSize.max - CONFIG.birdFlockSize.min + 1));
    
    // Spawn from random edge, fly across
    const side = Math.floor(Math.random() * 4);
    let startX, startY, targetX, targetY;
    
    // Keep birds in upper portion of screen (sky area)
    const skyTop = h * 0.1;
    const skyBottom = h * 0.45;
    
    switch (side) {
      case 0: // From left
        startX = -50;
        startY = skyTop + Math.random() * (skyBottom - skyTop);
        targetX = w + 50;
        targetY = skyTop + Math.random() * (skyBottom - skyTop);
        break;
      case 1: // From right
        startX = w + 50;
        startY = skyTop + Math.random() * (skyBottom - skyTop);
        targetX = -50;
        targetY = skyTop + Math.random() * (skyBottom - skyTop);
        break;
      case 2: // From top-left diagonal
        startX = -50;
        startY = skyTop;
        targetX = w + 50;
        targetY = skyBottom;
        break;
      default: // From top-right diagonal
        startX = w + 50;
        startY = skyTop;
        targetX = -50;
        targetY = skyBottom;
    }
    
    this.flocks.push(new BirdFlock(startX, startY, targetX, targetY, count));
  }
  
  /**
   * Trigger visual pulse effect in black hole shader
   * 
   * Called when a new poster spawns to create a synchronized visual effect.
   * The pulse decays over time and is sent to the GLSL shader as a uniform.
   */
  triggerPulse() {
    this.pulse = 1.0;
  }

  /**
   * Load all poster images from the public directory
   * 
   * Loads numbered poster images (001.jpg through 010.jpg) and creates
   * FlyingPoster instances for each. Images load asynchronously.
   */
  loadPosters() {
    for (let i = 1; i <= CONFIG.posterCount; i++) {
      const img = new Image();
      const filename = String(i).padStart(3, '0') + '.jpg';
      img.src = `./${filename}`;
      
      const poster = new FlyingPoster(img, i - 1);
      
      img.onload = () => {
        poster.loaded = true;
      };
      
      this.posters.push(poster);
    }
  }

  /**
   * Update game state each frame
   * 
   * @param {number} dt - Delta time in seconds since last frame
   */
  update(dt) {
    super.update(dt);
    this.time += dt;
    this.completion = Math.min(1.0, this.time / 5.0);
    
    // Move camera forward (matching shader speed)
    this.cameraZ += CONFIG.posterSpeed * dt;
    
    // Update all posters
    for (const poster of this.posters) {
      poster.update(this.cameraZ);
    }
    
    // Count active posters
    const activeCount = this.posters.filter(p => p.active).length;
    
    // Spawn timer - spawn new poster periodically if under max
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0 && activeCount < CONFIG.maxVisible) {
      this.spawnNextPoster();
      this.spawnCooldown = CONFIG.spawnDelay;
    }
    
    // Apply mouse to camera rotation for parallax with posters
    if (this.mouseActive > 0) {
      this.camera.rotationY = this.mouseX * 0.2;
      this.camera.rotationX = this.mouseY * 0.08;
    } else {
      // Ease back to center
      this.camera.rotationY *= 0.95;
      this.camera.rotationX *= 0.95;
    }
    
    // Decay pulse
    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - this.pulseDecay * dt);
    }
    
    // Update bird flocks
    for (const flock of this.flocks) {
      flock.update(dt, this.width, this.height);
    }
    // Remove inactive flocks
    this.flocks = this.flocks.filter(f => f.active);
    
    // Spawn new flock periodically
    this.nextFlockTime -= dt;
    if (this.nextFlockTime <= 0) {
      this.spawnFlock();
      // Random interval for next flock
      this.nextFlockTime = CONFIG.birdFlockInterval.min + 
        Math.random() * (CONFIG.birdFlockInterval.max - CONFIG.birdFlockInterval.min);
    }
    
    // Update runner animation
    if (this.runner) {
      this.runner.update(dt);
    }
    
    // Update matrix rain
    if (this.matrixRain) {
      this.matrixRain.update(dt);
    }
  }
  
  /**
   * Spawn the next poster on alternating sides of the road
   * 
   * Finds the next available (inactive and loaded) poster and spawns it
   * on the current side, then alternates sides for the next spawn.
   * Triggers a visual pulse effect when spawning.
   */
  spawnNextPoster() {
    // Find next inactive and loaded poster
    let poster = null;
    for (let i = 0; i < this.posters.length; i++) {
      const idx = (this.nextPosterIndex + i) % this.posters.length;
      if (!this.posters[idx].active && this.posters[idx].loaded) {
        poster = this.posters[idx];
        this.nextPosterIndex = (idx + 1) % this.posters.length;
        break;
      }
    }
    
    if (poster) {
      // Spawn on current side, then alternate
      poster.spawn(this.cameraZ, this.nextSide);
      this.nextSide *= -1; // Flip side for next poster
      
      // Trigger GLSL pulse from black hole
      this.triggerPulse();
    }
  }

  /**
   * Render all layers of the scene
   * 
   * Renders in order:
   * 1. Terrain/Sky (raymarched GLSL)
   * 2. Black Hole (composited GLSL layer)
   * 3. Bird flocks (2D canvas)
   * 4. Running girl (2D canvas sprite)
   * 5. Flying posters (2D canvas with perspective)
   * 6. Matrix rain (periodic overlay)
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.useFallback) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // === LAYER 1: Terrain/Sky ===
    this.webgl.setUniforms({
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uMouseActive: this.mouseActive,
      uCompletion: this.completion,
      uHasTexture: this.paintingTexture ? 1.0 : 0.0,
      uPulse: this.pulse,
    });

    this.webgl.clear(0, 0, 0, 1);
    this.webgl.render();

    // Draw terrain to main canvas
    ctx.drawImage(this.webgl.getCanvas(), 0, 0, w, h);
    
    // === LAYER 2: Black Hole (composited on top) ===
    // Adjust black hole position to compensate for camera rotation
    // so it stays centered in the 3D scene
    // Camera yaw = mouse.x * 0.8 in shader, need strong X compensation
    const bhX = this.bhPosition[0] - this.mouseX * this.mouseActive * 0.35;
    const bhY = this.bhPosition[1] - this.mouseY * this.mouseActive * 0.03;
    
    this.webglBH.setUniforms({
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uMouseActive: this.mouseActive,
      uPulse: this.pulse,
      uBHPosition: [bhX, bhY],
      uBHSize: this.bhSize,
    });
    
    this.webglBH.clear(0, 0, 0, 0); // Clear with transparent
    this.webglBH.render();
    
    // Composite black hole on top (uses alpha from shader)
    ctx.drawImage(this.webglBH.getCanvas(), 0, 0, w, h);
    
    // === LAYER 3: Bird flocks ===
    for (const flock of this.flocks) {
      flock.render(ctx);
    }
    
    // === LAYER 4: Running girl ===
    if (this.runner) {
      this.runner.render(ctx, w, h);
    }
    
    // === LAYER 5: Flying posters on top ===
    this.renderPosters(ctx, w, h);
    
    // === LAYER 6: Matrix rain (periodic overlay) ===
    if (this.matrixRain) {
      this.matrixRain.render(ctx, w, h);
    }
  }
  
  /**
   * Render all flying posters with depth sorting
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  renderPosters(ctx, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;
    
    // Get only active posters and sort by Z (furthest first)
    const active = this.posters.filter(p => p.active);
    active.sort((a, b) => b.z - a.z);
    
    // Render each poster (uses simple perspective, not affected by mouse)
    for (const poster of active) {
      poster.render(ctx, this.cameraZ, centerX, centerY, h);
    }
  }

  /**
   * Handle canvas resize
   * 
   * Resizes both WebGL renderers (terrain and black hole) when the canvas
   * dimensions change.
   */
  onResize() {
    if (this.webgl && this.webgl.isAvailable()) {
      this.webgl.resize(this.width, this.height);
    }
    if (this.webglBH && this.webglBH.isAvailable()) {
      this.webglBH.resize(this.width, this.height);
    }
  }

  /**
   * Cleanup resources when game stops
   * 
   * Destroys WebGL renderers and calls parent stop method.
   */
  stop() {
    if (this.webgl) {
      this.webgl.destroy();
    }
    if (this.webglBH) {
      this.webglBH.destroy();
    }
    super.stop();
  }
}

/**
 * Create Day 31 visualization
 * 
 * Factory function that creates and starts the Genuary Finale demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {GenuaryFinaleDemo} returns.game - The game instance
 */
export default function day31(canvas) {
  const game = new GenuaryFinaleDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
