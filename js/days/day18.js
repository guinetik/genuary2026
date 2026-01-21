/**
 * Genuary 2026 - Day 18
 * Prompt: "Unexpected path"
 *
 * LANGTON'S ANT - YIN & YANG
 *
 * Two ants on two planes of existence (blend modes):
 * 1. The Light (Screen blend)
 * 2. The Shadow (Exclusion blend)
 *
 * They move in symmetry but their worlds interact in unexpected ways
 * when they cross paths, creating complex interference patterns.
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Grid
  cellSize: 3,

  // Ant speed (base, multiplied by screen size)
  baseStepsPerFrame: 150,

  // Trail length
  trailLength: 300,

  // Color cycling
  hueSpeed: 30,        // Degrees per second
  saturation: 100,
  lightness: 45,

  // Particles
  particlesPerFlip: 2,
  particleLife: 0.8,
  particleSpeed: 100,

  // Proximity spark - PARTICLE ACCELERATOR COLLISION
  proximityThreshold: 40,  // Grid cells distance
  sparkCooldown: 0.15,  // Seconds between bursts
};

// Directions: 0=up, 1=right, 2=down, 3=left
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

class LangtonAntDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();

    // Grid dimensions
    this.cols = Math.floor(this.width / CONFIG.cellSize);
    this.rows = Math.floor(this.height / CONFIG.cellSize);

    // Each ant gets its own random hue - totally independent
    const hue1 = Math.random() * 360;
    const hue2 = Math.random() * 360;

    // === ANT 1: SCREEN (additive) ===
    this.grid1 = new Array(this.cols * this.rows).fill(false);
    this.ant1 = {
      x: Math.floor(this.cols / 3),
      y: Math.floor(this.rows / 2),
      dir: 0,
      hue: hue1,
      baseHue: hue1,
      trail: [],
    };

    // === ANT 2: EXCLUSION (psychedelic inversions) ===
    this.grid2 = new Array(this.cols * this.rows).fill(false);
    this.ant2 = {
      x: Math.floor(this.cols * 2 / 3),
      y: Math.floor(this.rows / 2),
      dir: 2,
      hue: hue2,
      baseHue: hue2,
      trail: [],
    };

    this.stepCount = 0;
    this.time = 0;

    // Particles
    this.particles = [];
    
    // Spark cooldown
    this.sparkCooldown = 0;

    // Scale speed based on screen size (larger screens = faster)
    const screenArea = this.width * this.height;
    const baseArea = 1280 * 720;
    this.speedMultiplier = Math.max(1, screenArea / baseArea);
    this.stepsPerFrame = Math.floor(CONFIG.baseStepsPerFrame * this.speedMultiplier);

    // Create offscreen canvas for ant 1 (screen blend - cyan/green)
    this.gridCanvas1 = document.createElement('canvas');
    this.gridCanvas1.width = this.cols * CONFIG.cellSize;
    this.gridCanvas1.height = this.rows * CONFIG.cellSize;
    this.gridCtx1 = this.gridCanvas1.getContext('2d');
    this.gridCtx1.fillStyle = '#000';
    this.gridCtx1.fillRect(0, 0, this.gridCanvas1.width, this.gridCanvas1.height);

    // Create offscreen canvas for ant 2 (exclusion blend - magenta/pink)
    this.gridCanvas2 = document.createElement('canvas');
    this.gridCanvas2.width = this.cols * CONFIG.cellSize;
    this.gridCanvas2.height = this.rows * CONFIG.cellSize;
    this.gridCtx2 = this.gridCanvas2.getContext('2d');
    this.gridCtx2.fillStyle = '#000';
    this.gridCtx2.fillRect(0, 0, this.gridCanvas2.width, this.gridCanvas2.height);

    // Restart on R key
    if (!this._keyHandler) {
      this._keyHandler = (e) => {
        if (e.key === 'r' || e.key === 'R') {
          this.init();
        }
      };
      window.addEventListener('keydown', this._keyHandler);
    }
  }

  /**
   * Step a single ant
   */
  stepAnt(ant, grid, gridCtx, isLight) {
    const idx = ant.y * this.cols + ant.x;
    const isDark = grid[idx];

    // Add to trail
    ant.trail.push({ x: ant.x, y: ant.y, hue: ant.hue });
    if (ant.trail.length > CONFIG.trailLength) {
      ant.trail.shift();
    }

    // THE ONE SIMPLE RULE:
    if (isDark) {
      ant.dir = (ant.dir + 3) % 4; // Turn LEFT
    } else {
      ant.dir = (ant.dir + 1) % 4; // Turn RIGHT
    }

    // Flip the cell
    grid[idx] = !isDark;

    // Update grid canvas - bright psychedelic colors
    const lightness = grid[idx] ? CONFIG.lightness : 3;
    gridCtx.fillStyle = `hsl(${ant.hue}, ${CONFIG.saturation}%, ${lightness}%)`;
    gridCtx.fillRect(
      ant.x * CONFIG.cellSize,
      ant.y * CONFIG.cellSize,
      CONFIG.cellSize,
      CONFIG.cellSize
    );

    // Spawn particles
    const screenX = ant.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const screenY = ant.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    if (Math.random() < 0.3) { // Less particles for perf
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        vy: Math.sin(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        life: CONFIG.particleLife,
        maxLife: CONFIG.particleLife,
        hue: ant.hue,
        isLight,
      });
    }

    // Move forward
    ant.x += DX[ant.dir];
    ant.y += DY[ant.dir];

    // Wrap around edges
    if (ant.x < 0) ant.x = this.cols - 1;
    if (ant.x >= this.cols) ant.x = 0;
    if (ant.y < 0) ant.y = this.rows - 1;
    if (ant.y >= this.rows) ant.y = 0;
  }

  step() {
    // Step both ants
    this.stepAnt(this.ant1, this.grid1, this.gridCtx1, true);
    this.stepAnt(this.ant2, this.grid2, this.gridCtx2, false);
    
    // Check proximity and spawn sparks (with cooldown)
    const dx = this.ant1.x - this.ant2.x;
    const dy = this.ant1.y - this.ant2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < CONFIG.proximityThreshold && this.sparkCooldown <= 0) {
      this.spawnSparks(dist);
      this.sparkCooldown = CONFIG.sparkCooldown;
    }
    
    this.stepCount++;
  }

  /**
   * Spawn dynamic particle accelerator collision effect
   * @param {number} dist - Distance between ants
   */
  spawnSparks(dist) {
    // Collision point
    const midX = ((this.ant1.x + this.ant2.x) / 2) * CONFIG.cellSize + CONFIG.cellSize / 2;
    const midY = ((this.ant1.y + this.ant2.y) / 2) * CONFIG.cellSize + CONFIG.cellSize / 2;
    
    // Ant positions for directional jets
    const ant1X = this.ant1.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant1Y = this.ant1.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant2X = this.ant2.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant2Y = this.ant2.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    
    // Direction from ant1 to ant2 (collision axis)
    const dx = ant2X - ant1X;
    const dy = ant2Y - ant1Y;
    const collisionAngle = Math.atan2(dy, dx);
    
    // Perpendicular angle (for jets)
    const perpAngle = collisionAngle + Math.PI / 2;
    
    // Intensity based on proximity
    const intensity = 1 - (dist / CONFIG.proximityThreshold);
    
    // === SHOCKWAVE RING (expands outward) ===
    const ringCount = 24;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 400 + Math.random() * 200;
      
      this.particles.push({
        x: midX,
        y: midY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.8,
        hue: 50 + Math.random() * 30,
        isSpark: true,
        isShockwave: true,
      });
    }
    
    // === PERPENDICULAR JETS (spray sideways from collision) ===
    for (let side = -1; side <= 1; side += 2) {
      const jetAngle = perpAngle + side * (0.2 + Math.random() * 0.3);
      const jetCount = 15 + Math.floor(intensity * 10);
      
      for (let i = 0; i < jetCount; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const angle = jetAngle + spread;
        const speed = 300 + Math.random() * 400;
        const delay = Math.random() * 0.1;
        
        this.particles.push({
          x: midX + Math.cos(angle) * 5,
          y: midY + Math.sin(angle) * 5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0 + Math.random() * 0.8,
          maxLife: 1.5,
          hue: side > 0 ? this.ant1.hue : this.ant2.hue,
          isSpark: true,
          isJet: true,
          delay: delay,
        });
      }
    }
    
    // === STREAKING TRACERS (fast lines) ===
    const tracerCount = 12;
    for (let i = 0; i < tracerCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 600 + Math.random() * 400;
      
      this.particles.push({
        x: midX,
        y: midY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        hue: Math.random() < 0.5 ? this.ant1.hue : this.ant2.hue,
        isSpark: true,
        isTracer: true,
      });
    }
    
    // === SPIRAL DEBRIS (curves outward) ===
    const spiralCount = 20;
    for (let i = 0; i < spiralCount; i++) {
      const angle = (i / spiralCount) * Math.PI * 2;
      const speed = 150 + Math.random() * 150;
      const spin = (Math.random() - 0.5) * 400; // Angular velocity
      
      this.particles.push({
        x: midX,
        y: midY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5 + Math.random() * 1.0,
        maxLife: 2.0,
        hue: (this.ant1.hue + this.ant2.hue) / 2 + (Math.random() - 0.5) * 60,
        isSpark: true,
        isSpiral: true,
        spin: spin,
        angle: angle,
      });
    }
    
    // === FLASH SPARKS (tiny bright dots) ===
    const flashCount = 30;
    for (let i = 0; i < flashCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 300;
      
      this.particles.push({
        x: midX + (Math.random() - 0.5) * 20,
        y: midY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.5,
        hue: 40 + Math.random() * 20,
        isSpark: true,
        isFlash: true,
      });
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    
    // Update spark cooldown
    if (this.sparkCooldown > 0) {
      this.sparkCooldown -= dt;
    }

    // Each ant cycles its own hue independently
    this.ant1.hue = (this.ant1.baseHue + this.time * CONFIG.hueSpeed) % 360;
    this.ant2.hue = (this.ant2.baseHue + this.time * CONFIG.hueSpeed) % 360;

    // Trim trails
    while (this.ant1.trail.length > CONFIG.trailLength) this.ant1.trail.shift();
    while (this.ant2.trail.length > CONFIG.trailLength) this.ant2.trail.shift();

    // Run multiple steps per frame (scaled by screen size)
    for (let i = 0; i < this.stepsPerFrame; i++) {
      this.step();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Handle delay for staggered spawns
      if (p.delay && p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      
      // Spiral particles curve outward
      if (p.isSpiral && p.spin) {
        p.angle += p.spin * dt * 0.01;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.vx = Math.cos(p.angle) * speed;
        p.vy = Math.sin(p.angle) * speed;
      }
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Different damping for different types
      if (p.isTracer) {
        p.vx *= 0.98; // Less damping for tracers
        p.vy *= 0.98;
      } else if (p.isShockwave) {
        p.vx *= 0.92; // More damping for shockwave
        p.vy *= 0.92;
      } else {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
      
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Cap particles (higher limit for collisions)
    if (this.particles.length > 2000) {
      this.particles = this.particles.slice(-1500);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Motion blur fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    const offsetX = (w - this.gridCanvas1.width) / 2;
    const offsetY = (h - this.gridCanvas1.height) / 2;

    // === Define Render Helpers ===
    const renderTrail = (ant) => {
      ctx.save();
      // Use source-over to draw the path "on top" of the background
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw the line
      if (ant.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(
          offsetX + ant.trail[0].x * CONFIG.cellSize + CONFIG.cellSize / 2,
          offsetY + ant.trail[0].y * CONFIG.cellSize + CONFIG.cellSize / 2
        );
        for (let i = 1; i < ant.trail.length; i++) {
            ctx.lineTo(
                offsetX + ant.trail[i].x * CONFIG.cellSize + CONFIG.cellSize / 2,
                offsetY + ant.trail[i].y * CONFIG.cellSize + CONFIG.cellSize / 2
            );
        }
        
        // Gradient stroke
        const gradient = ctx.createLinearGradient(
            offsetX + ant.trail[0].x * CONFIG.cellSize, 
            offsetY + ant.trail[0].y * CONFIG.cellSize,
            offsetX + ant.trail[ant.trail.length-1].x * CONFIG.cellSize,
            offsetY + ant.trail[ant.trail.length-1].y * CONFIG.cellSize
        );
        gradient.addColorStop(0, `hsla(${ant.trail[0].hue}, 100%, 50%, 0)`);
        gradient.addColorStop(1, `hsla(${ant.hue}, 100%, 70%, 1)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = CONFIG.cellSize * 0.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.restore();
    };

    const glowSize = CONFIG.cellSize * 25; // Increased glow
    const renderGlow = (ant, curX, curY) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      // COMET TAIL: Draw fading glow circles along recent history
      const cometLength = 25; // How many steps back the glow extends
      const trail = ant.trail;
      
      for (let i = 0; i < Math.min(trail.length, cometLength); i++) {
        // Access from end of trail (most recent)
        const t = trail[trail.length - 1 - i];
        
        // Calculate decay
        const progress = 1 - (i / cometLength); // 1.0 at head, 0.0 at tail
        const size = glowSize * (0.4 + 0.6 * progress); // Shrink slightly
        const alpha = progress * 0.3; // Fade out

        const tX = offsetX + t.x * CONFIG.cellSize + CONFIG.cellSize / 2;
        const tY = offsetY + t.y * CONFIG.cellSize + CONFIG.cellSize / 2;

        const grad = ctx.createRadialGradient(tX, tY, 0, tX, tY, size);
        // Reduced lightness from 70% to 55% to keep trail colorful, not white
        grad.addColorStop(0, `hsla(${t.hue}, ${CONFIG.saturation}%, 55%, ${alpha})`);
        grad.addColorStop(1, `hsla(${t.hue}, ${CONFIG.saturation}%, 50%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tX, tY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // COMET HEAD: Bright core at current position
      const headHue = ant.hue;
      
      // Core
      const grad = ctx.createRadialGradient(curX, curY, 0, curX, curY, glowSize);
      // Start with color (60% lightness) instead of near-white (80-90%)
      // This prevents the "solid white ball" look
      grad.addColorStop(0, `hsla(${headHue}, 100%, 60%, 0.6)`); 
      grad.addColorStop(0.4, `hsla(${headHue}, 100%, 50%, 0.2)`);
      grad.addColorStop(1, `hsla(${headHue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(curX, curY, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Outer Bloom
      const bloomSize = glowSize * 1.5;
      const grad2 = ctx.createRadialGradient(curX, curY, 0, curX, curY, bloomSize);
      grad2.addColorStop(0, `hsla(${headHue}, 100%, 50%, 0.1)`);
      grad2.addColorStop(1, `hsla(${headHue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(curX, curY, bloomSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawBody = (x, y, hue) => {
      ctx.save();
      // Drop shadow to separate from background
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.cellSize * 1.5, 0, Math.PI * 2);
      // Tint the body to match the ant's hue
      ctx.fillStyle = `hsl(${hue}, ${CONFIG.saturation}%, 90%)`;
      ctx.fill();
      
      // Ring
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.cellSize * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    // === LAYER 1: Screen blend (The Light) ===
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.gridCanvas1, offsetX, offsetY);

    // === LAYER 2: Exclusion blend (The Shadow) ===
    ctx.globalCompositeOperation = 'exclusion';
    ctx.drawImage(this.gridCanvas2, offsetX, offsetY);

    // === ENTITIES (On Top) ===
    // We draw trails and glows AFTER the grids so they float above the chaos
    
    // Ant 1
    const ant1X = offsetX + this.ant1.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant1Y = offsetY + this.ant1.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    renderTrail(this.ant1);
    renderGlow(this.ant1, ant1X, ant1Y);

    // Ant 2
    const ant2X = offsetX + this.ant2.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant2Y = offsetY + this.ant2.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    renderTrail(this.ant2);
    renderGlow(this.ant2, ant2X, ant2Y);

    // === Particles ===
    // Draw particles BEFORE the glow to have them immersed, OR keep after.
    // Let's try lighter blend for particles to make them sparkle
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife);
      
      if (p.isSpark) {
        const px = offsetX + p.x;
        const py = offsetY + p.y;
        
        if (p.isTracer) {
          // TRACERS - fast streaking lines
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const streakLen = Math.min(speed * 0.15, 60);
          const angle = Math.atan2(p.vy, p.vx);
          
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 85%, ${alpha})`;
          ctx.lineWidth = 3 * alpha;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.cos(angle) * streakLen, py - Math.sin(angle) * streakLen);
          ctx.stroke();
          
          // Bright head
          ctx.fillStyle = `hsla(${p.hue}, 80%, 95%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 4 * alpha, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (p.isShockwave) {
          // SHOCKWAVE - bright expanding dots
          const size = 6 * alpha;
          
          ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Glow trail
          const glowSize = 15 * alpha;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
          grad.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${alpha * 0.5})`);
          grad.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, glowSize, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (p.isJet) {
          // JET - medium colorful particles with trails
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const trailLen = Math.min(speed * 0.08, 30);
          const angle = Math.atan2(p.vy, p.vx);
          
          // Trail
          const grad = ctx.createLinearGradient(
            px, py,
            px - Math.cos(angle) * trailLen, py - Math.sin(angle) * trailLen
          );
          grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
          grad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
          
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4 * alpha;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.cos(angle) * trailLen, py - Math.sin(angle) * trailLen);
          ctx.stroke();
          
          // Head glow
          const glowSize = 12 * alpha;
          const headGrad = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
          headGrad.addColorStop(0, `hsla(${p.hue}, 100%, 90%, ${alpha})`);
          headGrad.addColorStop(0.5, `hsla(${p.hue}, 100%, 70%, ${alpha * 0.5})`);
          headGrad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.arc(px, py, glowSize, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (p.isSpiral) {
          // SPIRAL - curving debris with color shift
          const size = 5 * alpha;
          const hueShift = (1 - alpha) * 60; // Shift hue as it fades
          
          ctx.fillStyle = `hsla(${p.hue + hueShift}, 100%, 70%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Small glow
          const glowSize = 10 * alpha;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
          grad.addColorStop(0, `hsla(${p.hue + hueShift}, 100%, 60%, ${alpha * 0.4})`);
          grad.addColorStop(1, `hsla(${p.hue + hueShift}, 100%, 50%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, glowSize, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (p.isFlash) {
          // FLASH - tiny bright white sparks
          const size = 3 * alpha;
          
          ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
          
        } else {
          // Default spark
          const size = 6 * alpha;
          ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const size = 6 * alpha;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(offsetX + p.x, offsetY + p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reset blend mode
    ctx.globalCompositeOperation = 'source-over';

    // Ant bodies (white cores)
    ctx.fillStyle = '#fff';
    drawBody(ant1X, ant1Y, this.ant1.hue);
    drawBody(ant2X, ant2Y, this.ant2.hue);
  }
}

/**
 * Create Day 18 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day18(canvas) {
  const game = new LangtonAntDemo(canvas);
  game.start();

  return {
    stop: () => {
      if (game._keyHandler) {
        window.removeEventListener('keydown', game._keyHandler);
        game._keyHandler = null;
      }
      game.stop();
    },
    game
  };
}
