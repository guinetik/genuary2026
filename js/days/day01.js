/**
 * Genuary 2026 - Day 1
 * Prompt: "One color, one shape"
 * 
 * @fileoverview THE WORMHOLE - Infinite tunnel visualization
 * 
 * An infinite tunnel of circles rushing toward you. Each ring is the same
 * circle, just at different depths. The tunnel twists and warps as you
 * travel through it. Click/tap to change direction. Drag to look around.
 * 
 * Constraints:
 * - One shape: Circle
 * - One color: Green (#0f0)
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Camera3D } from '@guinetik/gcanvas';

/**
 * Configuration object for Day 1
 * 
 * @type {Object}
 * @property {number} ringCount - Number of rings in the tunnel
 * @property {number} ringSpacing - Z distance between rings
 * @property {number} baseRadiusRatio - Base radius as ratio of canvas size
 * @property {number} circlesPerRing - Number of circles per ring
 * @property {number} speed - Forward/backward movement speed
 * @property {number} twistSpeed - Rotation speed of tunnel twist
 * @property {number} wobbleRatio - Wobble amount as ratio of canvas size
 * @property {number} wobbleSpeed - Wobble animation speed
 * @property {number} hue - HSL hue value (135 = green)
 * @property {number} pulseSpeed - Ring pulsing animation speed
 * @property {number} glowIntensity - Center vortex glow intensity
 */
const CONFIG = {
  // Tunnel geometry
  ringCount: 30,
  ringSpacing: 60,
  baseRadiusRatio: 0.35,  // Ratio of canvas size
  circlesPerRing: 18,

  // Movement
  speed: 180,
  twistSpeed: 0.3,
  wobbleRatio: 0.04,  // Ratio of canvas size
  wobbleSpeed: 0.8,

  // Visuals - ONE COLOR: GREEN
  hue: 135,
  pulseSpeed: 2,
  glowIntensity: 0.4,
};

/**
 * Wormhole Demo
 * 
 * Main game class for Day 1, creating an infinite tunnel effect using
 * only circles in a single color (green). Features 3D camera controls
 * and directional movement.
 * 
 * @class WormholeDemo
 * @extends {Game}
 */
class WormholeDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  /**
   * Initialize the wormhole demo
   * 
   * Sets up 3D camera with mouse controls and initializes tunnel state.
   */
  init() {
    super.init();

    // Calculate perspective based on canvas size
    const minDim = Math.min(this.width, this.height);

    // Camera for 3D projection with mouse control
    this.camera = new Camera3D({
      perspective: minDim * 0.6,
      rotationX: 0,
      rotationY: 0,
      sensitivity: 0.003,
      inertia: true,
      friction: 0.95,
      clampX: true,
      minRotationX: -0.8,
      maxRotationX: 0.8,
    });
    this.camera.enableMouseControl(this.canvas);

    // Tunnel state
    this.time = 0;
    this.zOffset = 0;
    this.direction = 1; // 1 = forward, -1 = backward

    // Click to reverse direction
    this.canvas.addEventListener('click', () => {
      this.direction *= -1;
    });

    // Touch support
    this.canvas.addEventListener('touchend', (e) => {
      if (!this.camera._isDragging) {
        this.direction *= -1;
      }
    });
  }

  /**
   * Update game state each frame
   * 
   * @param {number} dt - Delta time in seconds since last frame
   */
  update(dt) {
    super.update(dt);
    this.time += dt;
    this.zOffset += CONFIG.speed * dt * this.direction;
    this.camera.update(dt);
  }

  /**
   * Render the wormhole tunnel
   * 
   * Projects circles at various depths through the 3D camera, sorts them
   * by depth, and renders with varying lightness based on distance.
   * Includes a center vortex glow effect.
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const minDim = Math.min(w, h);

    // Dynamic values based on canvas size
    const baseRadius = minDim * CONFIG.baseRadiusRatio;
    const wobbleAmount = minDim * CONFIG.wobbleRatio;

    // Motion blur trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    // Collect all circles with depth for sorting
    const circles = [];

    const totalDepth = CONFIG.ringCount * CONFIG.ringSpacing;

    for (let ring = 0; ring < CONFIG.ringCount; ring++) {
      // Calculate ring's z position (wrapping for infinite tunnel)
      let z = (ring * CONFIG.ringSpacing - this.zOffset) % totalDepth;
      if (z < 0) z += totalDepth;

      // Skip rings too close or behind camera
      if (z < 20) continue;

      // Tunnel twist based on depth and time
      const twist = this.time * CONFIG.twistSpeed + z * 0.002;

      // Wobble the tunnel path
      const wobbleX = Math.sin(this.time * CONFIG.wobbleSpeed + z * 0.01) * wobbleAmount;
      const wobbleY = Math.cos(this.time * CONFIG.wobbleSpeed * 0.7 + z * 0.01) * wobbleAmount * 0.6;

      // Ring radius pulses
      const pulse = 1 + Math.sin(this.time * CONFIG.pulseSpeed + z * 0.02) * 0.1;
      const ringRadius = baseRadius * pulse;

      // Create circles around this ring
      for (let i = 0; i < CONFIG.circlesPerRing; i++) {
        const angle = (i / CONFIG.circlesPerRing) * Math.PI * 2 + twist;

        // Position on the ring
        const localX = Math.cos(angle) * ringRadius + wobbleX;
        const localY = Math.sin(angle) * ringRadius + wobbleY;

        // Project through camera
        const projected = this.camera.project(localX, localY, z);

        // Circle size based on depth and canvas size
        const baseCircleSize = minDim * 0.018;
        const circleRadius = Math.max(2, baseCircleSize * projected.scale);

        // ONE COLOR - just vary lightness by depth (keep it green, not white)
        const depthRatio = 1 - z / totalDepth;
        const lightness = 35 + depthRatio * 20; // 35-55% (stays green, not white)
        const alpha = Math.min(1, depthRatio * 1.5);

        circles.push({
          x: cx + projected.x,
          y: cy + projected.y,
          radius: circleRadius,
          z: projected.z,
          lightness,
          alpha,
        });
      }
    }

    // Sort by depth (far to near)
    circles.sort((a, b) => b.z - a.z);

    // Draw circles - ALL THE SAME GREEN
    // Use simpler rendering for performance
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsl(${CONFIG.hue}, 100%, 50%)`;

    for (const circle of circles) {
      if (circle.alpha < 0.05) continue;

      const color = `hsl(${CONFIG.hue}, 100%, ${circle.lightness}%)`;

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = circle.alpha;
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;

    // Center vortex glow - project through camera so it follows the tunnel
    const vortexCenter = this.camera.project(0, 0, 200);
    const vcx = cx + vortexCenter.x;
    const vcy = cy + vortexCenter.y;
    const vortexRadius = minDim * 0.2;

    const vortexGradient = ctx.createRadialGradient(vcx, vcy, 0, vcx, vcy, vortexRadius);
    vortexGradient.addColorStop(0, `hsla(${CONFIG.hue}, 100%, 50%, 0.4)`);
    vortexGradient.addColorStop(0.5, `hsla(${CONFIG.hue}, 100%, 45%, 0.15)`);
    vortexGradient.addColorStop(1, `hsla(${CONFIG.hue}, 100%, 40%, 0)`);

    ctx.beginPath();
    ctx.arc(vcx, vcy, vortexRadius, 0, Math.PI * 2);
    ctx.fillStyle = vortexGradient;
    ctx.fill();
  }
}

/**
 * Create Day 1 visualization
 * 
 * Factory function that creates and starts the Wormhole demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {WormholeDemo} returns.game - The game instance
 */
export default function day01(canvas) {
  const game = new WormholeDemo(canvas);
  game.start();

  // Return object with stop method for lifecycle management
  return {
    stop: () => game.stop(),
    game
  };
}
