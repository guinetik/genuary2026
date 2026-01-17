/**
 * Genuary 2026 - Day 2
 * Prompt: "Twelve principles of animation"
 *
 * ORIGAMI MURMURATION
 * 
 * A flock of paper cranes demonstrating animation principles
 * through emergent flocking behavior (boids algorithm).
 *
 * Principles demonstrated:
 * 1. Follow Through - Birds bank into turns, body lags behind
 * 2. Overlapping Action - Turns ripple through the flock in waves
 * 3. Arcs - Natural curved flight paths
 * 4. Slow In/Slow Out - Eased acceleration in turns
 * 5. Secondary Action - Wing angle shifts, subtle rotation
 * 6. Squash & Stretch - Bodies elongate in flight direction
 * 7. Anticipation - Leaders turn, followers react
 * 8. Staging - Flock creates dramatic shapes
 * 9. Timing - Rhythm of collective movement
 *
 * Move mouse to guide the wind. Click to scatter.
 */

import { Game, Painter, Easing, Tweenetik } from '@guinetik/gcanvas';

const CONFIG = {
  // Flock
  birdDensity: 0.00008,  // Birds per square pixel (reduced for 4K)
  
  // Boids physics
  maxSpeed: 180,
  maxForce: 4,
  separationDist: 25,
  alignmentDist: 50,
  cohesionDist: 80,
  
  // Weights
  separationWeight: 1.8,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  mouseAvoidWeight: 2.5,
  mouseAvoidDist: 120,
  
  // Visuals
  birdSizeRatio: 0.015,    // Size relative to canvas
  
  // Day/night cycle
  cycleDuration: 60,       // Seconds for full day/night cycle
  
  // Sky colors for different times
  sky: {
    dawn: { top: '#4a3f6b', bottom: '#f4a460', sun: '#ff6b4a' },
    day: { top: '#e8e0d0', bottom: '#f5f0e6', sun: '#f4d03f' },
    dusk: { top: '#4a3055', bottom: '#ff7f50', sun: '#ff4500' },
    night: { top: '#0a0a1a', bottom: '#1a1a3a', moon: '#e8e8f0' },
  },
  colors: [
    '#c41e3a',  // Crimson red
    '#1e5aa8',  // Deep blue  
    '#d4a84b',  // Gold
    '#2d5a45',  // Forest green
    '#8b4557',  // Dusty rose
    '#4a6fa5',  // Steel blue
    '#c9722e',  // Burnt orange
  ],
};

/**
 * A single origami crane in the flock
 */
class Bird {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
    this.vy = (Math.random() - 0.5) * CONFIG.maxSpeed;
    this.ax = 0;
    this.ay = 0;
    this.angle = Math.atan2(this.vy, this.vx);
    this.targetAngle = this.angle;
    this.color = color;
    this.wingPhase = Math.random() * Math.PI * 2;
  }

  /**
   * Apply a steering force
   */
  applyForce(fx, fy) {
    this.ax += fx;
    this.ay += fy;
  }

  /**
   * Boids: Separation - avoid crowding neighbors
   */
  separate(birds) {
    let steerX = 0, steerY = 0, count = 0;
    
    for (const other of birds) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < CONFIG.separationDist && dist > 0) {
        // Weight by distance (closer = stronger repulsion)
        steerX += (dx / dist) / dist;
        steerY += (dy / dist) / dist;
        count++;
      }
    }
    
    if (count > 0) {
      const mag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (mag > 0) {
        steerX = (steerX / mag) * CONFIG.maxSpeed - this.vx;
        steerY = (steerY / mag) * CONFIG.maxSpeed - this.vy;
        // Limit force
        const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
        if (forceMag > CONFIG.maxForce) {
          steerX = (steerX / forceMag) * CONFIG.maxForce;
          steerY = (steerY / forceMag) * CONFIG.maxForce;
        }
      }
    }
    
    return { x: steerX * CONFIG.separationWeight, y: steerY * CONFIG.separationWeight };
  }

  /**
   * Boids: Alignment - steer towards average heading of neighbors
   */
  align(birds) {
    let avgVx = 0, avgVy = 0, count = 0;
    
    for (const other of birds) {
      if (other === this) continue;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < CONFIG.alignmentDist) {
        avgVx += other.vx;
        avgVy += other.vy;
        count++;
      }
    }
    
    if (count > 0) {
      avgVx /= count;
      avgVy /= count;
      
      const mag = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
      if (mag > 0) {
        avgVx = (avgVx / mag) * CONFIG.maxSpeed;
        avgVy = (avgVy / mag) * CONFIG.maxSpeed;
      }
      
      let steerX = avgVx - this.vx;
      let steerY = avgVy - this.vy;
      
      const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (forceMag > CONFIG.maxForce) {
        steerX = (steerX / forceMag) * CONFIG.maxForce;
        steerY = (steerY / forceMag) * CONFIG.maxForce;
      }
      
      return { x: steerX * CONFIG.alignmentWeight, y: steerY * CONFIG.alignmentWeight };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Boids: Cohesion - steer towards center of neighbors
   */
  cohere(birds) {
    let centerX = 0, centerY = 0, count = 0;
    
    for (const other of birds) {
      if (other === this) continue;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < CONFIG.cohesionDist) {
        centerX += other.x;
        centerY += other.y;
        count++;
      }
    }
    
    if (count > 0) {
      centerX /= count;
      centerY /= count;
      
      return this.seek(centerX, centerY, CONFIG.cohesionWeight);
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Seek a target position
   */
  seek(targetX, targetY, weight = 1) {
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      dx = (dx / dist) * CONFIG.maxSpeed;
      dy = (dy / dist) * CONFIG.maxSpeed;
      
      let steerX = dx - this.vx;
      let steerY = dy - this.vy;
      
      const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (forceMag > CONFIG.maxForce) {
        steerX = (steerX / forceMag) * CONFIG.maxForce;
        steerY = (steerY / forceMag) * CONFIG.maxForce;
      }
      
      return { x: steerX * weight, y: steerY * weight };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Flee from a position
   */
  flee(targetX, targetY, weight = 1, radius = 100) {
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < radius && dist > 0) {
      const strength = (1 - dist / radius) * weight;
      const mag = Math.sqrt(dx * dx + dy * dy);
      return { 
        x: (dx / mag) * CONFIG.maxForce * strength, 
        y: (dy / mag) * CONFIG.maxForce * strength 
      };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Update physics
   */
  update(dt, width, height) {
    // Apply acceleration
    this.vx += this.ax;
    this.vy += this.ay;
    
    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > CONFIG.maxSpeed) {
      this.vx = (this.vx / speed) * CONFIG.maxSpeed;
      this.vy = (this.vy / speed) * CONFIG.maxSpeed;
    }
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Wrap around edges
    if (this.x < -50) this.x = width + 50;
    if (this.x > width + 50) this.x = -50;
    if (this.y < -50) this.y = height + 50;
    if (this.y > height + 50) this.y = -50;
    
    // Smooth angle transition (follow-through)
    this.targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 0.15; // Lag creates follow-through
    
    // Update wing phase
    this.wingPhase += dt * 8;
    
    // Reset acceleration
    this.ax = 0;
    this.ay = 0;
  }
}

class OrigamiMurmurationDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.bgColor;
  }

  init() {
    super.init();
    
    // Bird size proportional to canvas
    this.birdSize = Math.min(this.width, this.height) * CONFIG.birdSizeRatio;

    // Bird count proportional to canvas area
    const canvasArea = this.width * this.height;
    const birdCount = Math.floor(canvasArea * CONFIG.birdDensity);

    // Create flock
    this.birds = [];
    for (let i = 0; i < birdCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const color = CONFIG.colors[i % CONFIG.colors.length];
      this.birds.push(new Bird(x, y, color));
    }

    // Mouse position
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.mouseActive = false;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (this.height / rect.height);
      this.mouseActive = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });

    this.canvas.addEventListener('click', () => {
      // Scatter with Tweenetik for smooth eased burst
      for (const bird of this.birds) {
        const dx = bird.x - this.mouseX;
        const dy = bird.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Calculate target velocity boost
        const boostX = (dx / dist) * CONFIG.maxSpeed * 1.2;
        const boostY = (dy / dist) * CONFIG.maxSpeed * 1.2;
        
        // Store original velocity
        const startVx = bird.vx;
        const startVy = bird.vy;
        
        // Use Tweenetik to animate the velocity boost with easeOutBack for overshoot effect
        Tweenetik.to(bird, {
          vx: startVx + boostX,
          vy: startVy + boostY
        }, 0.4, Easing.easeOutBack);
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = (touch.clientX - rect.left) * (this.width / rect.width);
      this.mouseY = (touch.clientY - rect.top) * (this.height / rect.height);
      this.mouseActive = true;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.mouseActive = false;
    });

    this.time = CONFIG.cycleDuration * 0.2;
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Apply boids rules to each bird
    for (const bird of this.birds) {
      const sep = bird.separate(this.birds);
      const ali = bird.align(this.birds);
      const coh = bird.cohere(this.birds);
      
      bird.applyForce(sep.x, sep.y);
      bird.applyForce(ali.x, ali.y);
      bird.applyForce(coh.x, coh.y);
      
      // Avoid mouse (predator)
      if (this.mouseActive) {
        const flee = bird.flee(this.mouseX, this.mouseY, CONFIG.mouseAvoidWeight, CONFIG.mouseAvoidDist);
        bird.applyForce(flee.x, flee.y);
      }
      
      bird.update(dt, this.width, this.height);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Calculate time of day (0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk)
    const dayProgress = (this.time % CONFIG.cycleDuration) / CONFIG.cycleDuration;
    
    // Get sky colors based on time
    const skyColors = this.getSkyColors(dayProgress);
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, skyColors.top);
    gradient.addColorStop(1, skyColors.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Draw stars at night
    if (dayProgress > 0.8 || dayProgress < 0.2) {
      const nightIntensity = dayProgress > 0.5 
        ? Math.min(1, (dayProgress - 0.8) / 0.15)
        : Math.min(1, (0.2 - dayProgress) / 0.15);
      this.drawStars(ctx, w, h, nightIntensity);
    }

    // Calculate celestial body position (arc across sky, from offscreen to offscreen)
    const celestialRadius = Math.min(w, h) * 0.07;
    
    // Arc parameters - extend beyond screen edges
    const arcCenterX = w * 0.5;
    const arcCenterY = h * 2.0; // Center further below screen for higher arc
    const arcRadiusX = w * 0.9; // Horizontal spread
    const arcRadiusY = h * 1.9; // Taller arc - peaks higher in the sky
    
    // Sun: travels from offscreen left-bottom to offscreen right-bottom
    // Visible portion roughly 0.15 to 0.85, but we draw the full arc
    const sunProgress = dayProgress; // 0-1 over full day
    // Map to angle: start at ~200° (below left), peak at 90° (top), end at ~-20° (below right)
    const sunAngle = Math.PI * 1.15 - sunProgress * Math.PI * 1.3; // ~207° to ~-27°
    
    const sunX = arcCenterX + Math.cos(sunAngle) * arcRadiusX;
    const sunY = arcCenterY - Math.sin(sunAngle) * arcRadiusY;
    
    // Only draw sun if it's above the bottom edge (with some margin)
    if (sunY < h + celestialRadius * 2) {
      this.drawSun(ctx, sunX, sunY, celestialRadius, skyColors.celestial);
    }
    
    // Moon: opposite phase from sun (offset by 0.5)
    const moonPhase = (dayProgress + 0.5) % 1;
    const moonAngle = Math.PI * 1.15 - moonPhase * Math.PI * 1.3;
    
    const moonX = arcCenterX + Math.cos(moonAngle) * arcRadiusX * 0.9;
    const moonY = arcCenterY - Math.sin(moonAngle) * arcRadiusY * 1.0; // Full arc height like sun
    
    // Only draw moon if it's above the bottom edge
    if (moonY < h + celestialRadius * 2) {
      this.drawMoon(ctx, moonX, moonY, celestialRadius * 0.85);
    }

    // Calculate bird size proportional to canvas
    this.birdSize = Math.min(w, h) * CONFIG.birdSizeRatio;
    
    // Store day progress for bird rendering
    this.dayProgress = dayProgress;

    // Draw birds
    for (const bird of this.birds) {
      this.drawOrigamiBird(ctx, bird);
    }
  }
  
  /**
   * Convert any color to rgba
   */
  toRgba(color, alpha) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Handle rgb() colors from lerpColor
    if (color.startsWith('rgb(')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
      }
    }
    // Fallback
    return `rgba(200, 200, 200, ${alpha})`;
  }
  
  /**
   * Interpolate between two hex colors
   */
  lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Get sky colors based on time of day
   */
  getSkyColors(progress) {
    const sky = CONFIG.sky;
    
    // 0.0-0.15: night to dawn
    // 0.15-0.35: dawn to day
    // 0.35-0.65: day
    // 0.65-0.85: day to dusk
    // 0.85-1.0: dusk to night
    
    if (progress < 0.15) {
      // Night to dawn
      const t = progress / 0.15;
      return {
        top: this.lerpColor(sky.night.top, sky.dawn.top, t),
        bottom: this.lerpColor(sky.night.bottom, sky.dawn.bottom, t),
        celestial: sky.dawn.sun
      };
    } else if (progress < 0.35) {
      // Dawn to day
      const t = (progress - 0.15) / 0.2;
      return {
        top: this.lerpColor(sky.dawn.top, sky.day.top, t),
        bottom: this.lerpColor(sky.dawn.bottom, sky.day.bottom, t),
        celestial: this.lerpColor(sky.dawn.sun, sky.day.sun, t)
      };
    } else if (progress < 0.65) {
      // Day
      return {
        top: sky.day.top,
        bottom: sky.day.bottom,
        celestial: sky.day.sun
      };
    } else if (progress < 0.85) {
      // Day to dusk
      const t = (progress - 0.65) / 0.2;
      return {
        top: this.lerpColor(sky.day.top, sky.dusk.top, t),
        bottom: this.lerpColor(sky.day.bottom, sky.dusk.bottom, t),
        celestial: this.lerpColor(sky.day.sun, sky.dusk.sun, t)
      };
    } else {
      // Dusk to night
      const t = (progress - 0.85) / 0.15;
      return {
        top: this.lerpColor(sky.dusk.top, sky.night.top, t),
        bottom: this.lerpColor(sky.dusk.bottom, sky.night.bottom, t),
        celestial: sky.dusk.sun
      };
    }
  }
  
  /**
   * Draw stars for night sky using Painter
   */
  drawStars(ctx, w, h, intensity) {
    // Use seeded random for consistent star positions
    const starCount = 60;
    
    for (let i = 0; i < starCount; i++) {
      // Pseudo-random based on index
      const x = ((i * 7919) % 1000) / 1000 * w;
      const y = ((i * 6271) % 1000) / 1000 * h * 0.6; // Stars in upper portion
      const size = ((i * 3571) % 100) / 100 * 2 + 0.5;
      // Apply smootherstep easing to twinkle for more organic feel
      const rawTwinkle = (Math.sin(this.time * 3 + i) + 1) / 2;
      const twinkle = Easing.smootherstep(rawTwinkle) * 0.6 + 0.4;
      
      const alpha = intensity * twinkle * 0.8;
      Painter.shapes.fillCircle(x, y, size, `rgba(255, 255, 255, ${alpha})`);
    }
  }
  
  /**
   * Draw the sun
   */
  drawSun(ctx, x, y, radius, color) {
    // Outer glow
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
    outerGlow.addColorStop(0, this.toRgba(color, 0.3));
    outerGlow.addColorStop(0.5, this.toRgba(color, 0.1));
    outerGlow.addColorStop(1, this.toRgba(color, 0));
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle glow
    const midGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    midGlow.addColorStop(0, this.toRgba(color, 0.5));
    midGlow.addColorStop(0.6, this.toRgba(color, 0.2));
    midGlow.addColorStop(1, this.toRgba(color, 0));
    ctx.fillStyle = midGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun core
    const sunCore = ctx.createRadialGradient(x, y, 0, x, y, radius);
    sunCore.addColorStop(0, '#fffbe6');
    sunCore.addColorStop(0.5, color);
    sunCore.addColorStop(1, this.toRgba(color, 0.8));
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw the moon
   */
  drawMoon(ctx, x, y, radius) {
    // Soft glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    glow.addColorStop(0, 'rgba(200, 210, 230, 0.3)');
    glow.addColorStop(0.5, 'rgba(200, 210, 230, 0.1)');
    glow.addColorStop(1, 'rgba(200, 210, 230, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon body
    const moonGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    moonGrad.addColorStop(0, '#f8f8ff');
    moonGrad.addColorStop(0.8, '#e8e8f0');
    moonGrad.addColorStop(1, '#d0d0e0');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle craters
    ctx.fillStyle = 'rgba(180, 180, 200, 0.3)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y + radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.25, y - radius * 0.25, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.1, y + radius * 0.4, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Darken a color by a percentage
   */
  darkenColor(color, amount) {
    if (color.startsWith('#')) {
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);
      r = Math.round(r * (1 - amount));
      g = Math.round(g * (1 - amount));
      b = Math.round(b * (1 - amount));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }
  
  /**
   * Lighten a color by a percentage
   */
  lightenColor(color, amount) {
    if (color.startsWith('#')) {
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);
      r = Math.min(255, Math.round(r + (255 - r) * amount));
      g = Math.min(255, Math.round(g + (255 - g) * amount));
      b = Math.min(255, Math.round(b + (255 - b) * amount));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  /**
   * Draw a single origami bird (4-part geometric style)
   * Uses Painter.shapes.polygon for drawing and Easing for smooth wing animation
   */
  drawOrigamiBird(ctx, bird) {
    const size = this.birdSize;
    const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    
    // Squash & stretch based on speed
    const stretch = 1 + (speed / CONFIG.maxSpeed) * 0.3;
    const squash = 1 / Math.sqrt(stretch);
    
    // Wing flap animation with Easing.smoothstep for organic motion
    const rawT = (Math.sin(bird.wingPhase) + 1) / 2; // 0-1
    const flapT = Easing.smoothstep(rawT); // Smooth S-curve for natural flapping
    
    // Adjust color based on time of day
    let baseColor = bird.color;
    const progress = this.dayProgress || 0.5;
    
    // Night: birds become silhouettes
    if (progress > 0.85 || progress < 0.15) {
      const nightAmount = progress > 0.5 
        ? Math.min(1, (progress - 0.85) / 0.1)
        : Math.min(1, (0.15 - progress) / 0.1);
      baseColor = this.lerpColor(bird.color, '#1a1a2e', nightAmount * 0.85);
    }
    // Dawn/dusk: warm tint
    else if (progress < 0.25 || progress > 0.75) {
      const warmAmount = progress < 0.5
        ? 1 - (progress - 0.15) / 0.1
        : (progress - 0.75) / 0.1;
      const warmColor = progress < 0.5 ? '#ff9966' : '#ff6644';
      baseColor = this.lerpColor(bird.color, warmColor, Math.max(0, warmAmount) * 0.3);
    }
    
    // Create 4 color variations for different parts
    const bodyColor = this.darkenColor(baseColor, 0.15);
    const headColor = baseColor;
    const wingBackColor = this.lightenColor(baseColor, 0.1);
    const wingFrontColor = this.darkenColor(baseColor, 0.05);
    
    // Save state using Painter
    Painter.save();
    Painter.translateTo(bird.x, bird.y);
    Painter.rotate(bird.angle);
    Painter.scale(stretch, squash);
    
    // Normalized coordinates (bird faces right, centered at origin)
    // Based on the SVG design, scaled to our size
    const s = size / 50; // Scale factor
    
    // Wing positions: interpolate between up and down
    // Back wing (behind body)
    const backWing1 = { // Up position
      p1: { x: -40 * s, y: -45 * s },
      p2: { x: 15 * s, y: 5 * s },
      p3: { x: -15 * s, y: 20 * s }
    };
    const backWing2 = { // Down position
      p1: { x: -15 * s, y: 50 * s },
      p2: { x: 15 * s, y: -5 * s },
      p3: { x: -10 * s, y: 15 * s }
    };
    
    // Front wing
    const frontWing1 = { // Up position
      p1: { x: 15 * s, y: 5 * s },
      p2: { x: -5 * s, y: 20 * s },
      p3: { x: -30 * s, y: -50 * s }
    };
    const frontWing2 = { // Down position
      p1: { x: 15 * s, y: -5 * s },
      p2: { x: -10 * s, y: 15 * s },
      p3: { x: 5 * s, y: 50 * s }
    };
    
    // Interpolate wing positions using Easing.lerp
    const backWing = {
      p1: { x: Easing.lerp(backWing1.p1.x, backWing2.p1.x, flapT), y: Easing.lerp(backWing1.p1.y, backWing2.p1.y, flapT) },
      p2: { x: Easing.lerp(backWing1.p2.x, backWing2.p2.x, flapT), y: Easing.lerp(backWing1.p2.y, backWing2.p2.y, flapT) },
      p3: { x: Easing.lerp(backWing1.p3.x, backWing2.p3.x, flapT), y: Easing.lerp(backWing1.p3.y, backWing2.p3.y, flapT) }
    };
    
    const frontWing = {
      p1: { x: Easing.lerp(frontWing1.p1.x, frontWing2.p1.x, flapT), y: Easing.lerp(frontWing1.p1.y, frontWing2.p1.y, flapT) },
      p2: { x: Easing.lerp(frontWing1.p2.x, frontWing2.p2.x, flapT), y: Easing.lerp(frontWing1.p2.y, frontWing2.p2.y, flapT) },
      p3: { x: Easing.lerp(frontWing1.p3.x, frontWing2.p3.x, flapT), y: Easing.lerp(frontWing1.p3.y, frontWing2.p3.y, flapT) }
    };
    
    // Body (static, lerp slightly for breathing)
    const bodyBreath = Easing.lerp(0, 3 * s, flapT);
    const body = {
      p1: { x: -50 * s, y: bodyBreath },
      p2: { x: 20 * s, y: -10 * s },
      p3: { x: 15 * s, y: 5 * s - bodyBreath * 0.5 }
    };
    
    // Head (static)
    const head = {
      p1: { x: 20 * s, y: -10 * s },
      p2: { x: 50 * s, y: 0 },  // Beak tip
      p3: { x: 15 * s, y: 3 * s }
    };
    
    // Draw in order: back wing, body, head, front wing
    // Using Painter.shapes.polygon for cleaner API
    
    // Back wing
    Painter.shapes.polygon(
      [backWing.p1, backWing.p2, backWing.p3],
      wingBackColor,
      null,
      null
    );
    
    // Body
    Painter.shapes.polygon(
      [body.p1, body.p2, body.p3],
      bodyColor,
      null,
      null
    );
    
    // Head
    Painter.shapes.polygon(
      [head.p1, head.p2, head.p3],
      headColor,
      null,
      null
    );
    
    // Front wing
    Painter.shapes.polygon(
      [frontWing.p1, frontWing.p2, frontWing.p3],
      wingFrontColor,
      null,
      null
    );

    Painter.restore();
  }
}

/**
 * Create Day 2 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day02(canvas) {
  const game = new OrigamiMurmurationDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
