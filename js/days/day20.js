/**
 * Genuary 2026 - Day 20
 * Prompt: "One line"
 * Credit: Jos Vromans
 *
 * OUROBOROS
 * The ancient symbol - a serpent eating its own tail.
 * One continuous line, eternally consuming and regenerating itself.
 *
 * Move mouse to rotate the view.
 */
import { Game, Painter } from "@guinetik/gcanvas";

const CONFIG = {
  colors: {
    bg: "#000",
    baseHue: 135,
  },
  segments: 300,
  baseRadius: 0.6,
  
  // Timing
  growthDuration: 8, // seconds to full growth
  
  // Psychedelic
  hueSpeed: 20,       // Base hue cycle speed
  glowSize: 40,       // Glow radius multiplier
  cometLength: 30,    // Comet tail segments
};

class Day20Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.colors.bg;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.container = this.canvas.parentElement;
    if (this.container) {
      this.enableFluidSize(this.container);
    }

    this.time = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;

    // Growth - the snake starts tiny and keeps growing
    this.size = 0.05;
    this.targetSize = 0.05;
    this.snakeLength = 20; // How many history points the snake uses
    this.maxSnakeLength = 350;

    // Ouroboros state - only true when head catches tail
    this.isOuroboros = false;
    this.ouroborosBlend = 0;
    this.perfection = 0; // 0 = organic/messy, 1 = geometric perfection
    this.eatPulse = 0; // Pulse effect when eating
    this.totalEaten = 0; // How much it has consumed
    this.eatAngleOffset = 0; // Rotation offset when eating (dash forward)
    this.coils = 1; // How many times the snake wraps around (grows when eating)
    this.targetCoils = 1; // Smooth coil growth

    // Smooth animation vars
    this.lungeOffset = 0;
    this.targetLungeOffset = 0;
    this.phaseOffset = 0;
    this.currentRadius = 0;
    
    // Psychedelic color cycling
    this.hueOffset = Math.random() * 360; // Random start hue
    this.screenFlash = 0; // Flash on eat
    
    // Particles for eat burst
    this.particles = [];

    // Snake body - store position history for slithering
    this.maxHistory = 400;
    this.history = [];
    // Initialize with starting position
    for (let i = 0; i < this.maxHistory; i++) {
      this.history.push({ x: 0, y: 0 });
    }

    this.headX = 0;
    this.headY = 0;
    this.headAngle = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
      this.targetX = (this.mouseX - 0.5) * 1.4;
      this.targetY = (this.mouseY - 0.5) * 1.4;
    });

    this.canvas.addEventListener("click", (e) => {
      if (this.isOuroboros) {
        this.doEat(e);
      }
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (this.isOuroboros) {
        this.doEat(e.touches[0]);
      }
    });

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (touch.clientX - rect.left) / rect.width;
      this.mouseY = (touch.clientY - rect.top) / rect.height;
    });
  }

  /**
   * Eat action - spawn particles, flash, lunge
   */
  doEat() {
    this.eatPulse = 1;
    this.screenFlash = 1;
    this.targetLungeOffset += 0.5;
    this.targetCoils += 0.08;
    this.totalEaten += 1;
    
    // Spawn particle burst from head
    const headPoint = this.getSnakePoint(1, this.time);
    const projected = this.projectPoint(headPoint);
    const cx = this.width / 2;
    const cy = this.height / 2;
    const scale = Math.min(this.width, this.height) * 0.7;
    const headX = cx + projected.x * scale;
    const headY = cy + projected.y * scale;
    
    // Burst of particles
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x: headX,
        y: headY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        hue: this.hueOffset + this.totalEaten * 25 + Math.random() * 60,
        size: 4 + Math.random() * 8,
      });
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    
    // Cycle hue - faster as more is consumed
    const hueSpeed = CONFIG.hueSpeed + this.totalEaten * 3;
    this.hueOffset = (this.hueOffset + hueSpeed * dt) % 360;

    // Grow snake length over time (8 seconds to full)
    const growthRate = (this.maxSnakeLength - 20) / CONFIG.growthDuration;
    if (!this.isOuroboros && this.snakeLength < this.maxSnakeLength) {
      this.snakeLength = Math.min(this.maxSnakeLength, this.snakeLength + dt * growthRate);
    }

    // Grow size slowly
    this.targetSize = Math.min(1, 0.05 + (this.snakeLength / this.maxSnakeLength) * 0.95);
    this.size += (this.targetSize - this.size) * 0.02;

    // Smooth ouroboros transition
    if (this.isOuroboros) {
      this.ouroborosBlend = Math.min(1, this.ouroborosBlend + dt * 0.8);
      
      // Calculate perfection based on consumption
      const targetPerfection = Math.min(1, this.totalEaten / 15);
      this.perfection += (targetPerfection - this.perfection) * dt * 0.5;

      // Smooth animations
      this.lungeOffset += (this.targetLungeOffset - this.lungeOffset) * dt * 5;
      this.coils += (this.targetCoils - this.coils) * dt * 2;
      
      // Smooth radius return to default
      const targetR = CONFIG.baseRadius * this.size;
      this.currentRadius += (targetR - this.currentRadius) * dt * 2;
    }

    // Decay eat pulse and screen flash
    if (this.eatPulse > 0) {
      this.eatPulse = Math.max(0, this.eatPulse - dt * 3);
    }
    if (this.screenFlash > 0) {
      this.screenFlash = Math.max(0, this.screenFlash - dt * 4);
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt * 1.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (!this.isOuroboros) {
      // Slithering mode - head chases target with sinusoidal motion
      const dx = this.targetX - this.headX;
      const dy = this.targetY - this.headY;

      // Target angle
      const targetAngle = Math.atan2(dy, dx);

      // Smooth angle transition with slither wobble
      let angleDiff = targetAngle - this.headAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.headAngle += angleDiff * 0.08;

      // Add slither wave to angle
      const slitherWave = Math.sin(this.time * 8) * 0.4;
      const moveAngle = this.headAngle + slitherWave;

      // Move forward
      const speed = 0.012 * (0.5 + this.size * 0.5);
      this.headX += Math.cos(moveAngle) * speed;
      this.headY += Math.sin(moveAngle) * speed;

      // Add to history - only keep what we need for the snake body
      this.history.unshift({ x: this.headX, y: this.headY });
      const maxNeeded = Math.floor(this.snakeLength) + 10;
      while (this.history.length > maxNeeded) {
        this.history.pop();
      }

      // Check if head caught tail (only when long enough)
      if (this.snakeLength >= this.maxSnakeLength - 10) {
        // Tail is at the end of the visible snake
        const tailIndex = Math.min(Math.floor(this.snakeLength) - 1, this.history.length - 1);
        const tail = this.history[tailIndex];

        if (tail) {
          const headToTail = Math.sqrt(
            (this.headX - tail.x) ** 2 + (this.headY - tail.y) ** 2
          );

          // Caught the tail! (generous hitbox)
          if (headToTail < 0.2) {
            this.isOuroboros = true;
            
            // Align phase
            const currentHeadAngle = Math.atan2(this.headY, this.headX);
            // Angle at t=1 (head) based on ring logic:
            const baseRingAngle = Math.PI * 2 * this.coils - this.time * 0.5; 
            this.phaseOffset = currentHeadAngle - baseRingAngle;
            
            // Align radius
            this.currentRadius = Math.sqrt(this.headX ** 2 + this.headY ** 2);
            
            // Initialize offsets
            this.lungeOffset = 0;
            this.targetLungeOffset = 0;
          }
        }
      }
    }
  }

  // Get point on the ouroboros
  getSnakePoint(t, time) {
    // t goes from 0 (tail) to 1 (head)

    // Ouroboros circle position (used when head catches tail)
    // lungeOffset makes the head lunge forward when eating
    // coils determines how many times it wraps around
    const angle = t * Math.PI * 2 * this.coils - time * 0.5 + this.phaseOffset + this.lungeOffset;
    
    // Smooth radius transition
    const chaos = 1 - this.perfection;
    const baseR = this.isOuroboros ? this.currentRadius : (CONFIG.baseRadius * this.size);
    
    const undulation = Math.sin(t * Math.PI * 8 * this.coils + time * 2) * 0.05 * this.size * chaos;
    const r = baseR + undulation;

    // Circle coordinates
    const circleX = Math.cos(angle) * r;
    const circleY = Math.sin(angle) * r;
    
    // Infinity (lemniscate) coordinates
    // Parametric: x = a*cos(t)/(1+sin²(t)), y = a*sin(t)*cos(t)/(1+sin²(t))
    // Simplified figure-8 that's wider horizontally
    const infAngle = angle * 2; // Double angle for figure-8 (two loops)
    const sinA = Math.sin(infAngle);
    const cosA = Math.cos(infAngle);
    const denom = 1 + sinA * sinA;
    const infScale = r * 1.4; // Slightly larger for visual balance
    const infX = infScale * cosA / denom;
    const infY = infScale * sinA * cosA / denom * 0.7; // Squish vertically a bit
    
    // Blend from circle to infinity as perfection goes from 0.7 to 1.0
    const infBlend = Math.max(0, Math.min(1, (this.perfection - 0.7) / 0.3));
    const smoothInf = infBlend * infBlend * (3 - 2 * infBlend); // Smoothstep
    
    const shapeX = circleX * (1 - smoothInf) + infX * smoothInf;
    const shapeY = circleY * (1 - smoothInf) + infY * smoothInf;

    // Slithering mode - follow the history trail
    // t=1 is head (history[0]), t=0 is tail (further back in history)
    const historyIndex = Math.floor((1 - t) * Math.min(this.snakeLength, this.history.length - 1));
    const historyPoint = this.history[Math.min(historyIndex, this.history.length - 1)];

    const followX = historyPoint ? historyPoint.x : 0;
    const followY = historyPoint ? historyPoint.y : 0;

    // Blend between slithering and ouroboros shape
    const blend = this.ouroborosBlend;
    const x = followX * (1 - blend) + shapeX * blend;
    const y = followY * (1 - blend) + shapeY * blend;

    // Z undulation for 3D effect (only in ouroboros mode)
    // Increases slightly for infinity shape to show the crossover
    const zBase = Math.sin(t * Math.PI * 6 * this.coils + time * 1.5) * 0.08 * this.size * blend;
    const zInfinity = Math.sin(angle) * 0.15 * this.size * blend * smoothInf; // Crossover depth
    const z = zBase * chaos + zInfinity;

    return { x, y, z, t };
  }

  // Project 3D to 2D with rotation
  projectPoint(p) {
    // Less rotation when in following mode
    const rotationStrength = this.ouroborosBlend;

    // Rotate around Y axis based on mouse X (inverted, unclamped)
    const rotY = -(this.mouseX - 0.5) * Math.PI * 2 * rotationStrength;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const x1 = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;

    // Rotate around X axis based on mouse Y (inverted, unclamped)
    const rotX = -(this.mouseY - 0.5) * Math.PI * 1.5 * rotationStrength;
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const y1 = p.y * cosX - z1 * sinX;
    const z2 = p.y * sinX + z1 * cosX;

    // Perspective
    const perspective = 1 / (1 - z2 * 0.3 * rotationStrength);

    return {
      x: x1 * perspective,
      y: y1 * perspective,
      z: z2
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.7;

    // Fade trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, w, h);

    const numPoints = CONFIG.segments;
    const points = [];

    // Calculate all points
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const p3d = this.getSnakePoint(t, this.time);
      const projected = this.projectPoint(p3d);

      points.push({
        x: cx + projected.x * scale,
        y: cy + projected.y * scale,
        z: projected.z,
        t: t,
      });
    }

    // Draw the snake body with psychedelic effects
    this.drawSnake(ctx, points);

    // Draw comet tail glow behind head
    this.drawCometTail(ctx, points);

    // Draw the head (eating the tail)
    this.drawHead(ctx, points);
    
    // Draw particles (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;
      
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
      grad.addColorStop(0.5, `hsla(${p.hue}, 100%, 50%, ${alpha * 0.4})`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    
    // Screen flash on eat
    if (this.screenFlash > 0) {
      const flashHue = this.hueOffset + this.totalEaten * 25;
      ctx.fillStyle = `hsla(${flashHue}, 100%, 80%, ${this.screenFlash * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }

    // UI hints
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";

    if (!this.isOuroboros) {
      const progress = Math.floor((this.snakeLength / this.maxSnakeLength) * 100);
      if (progress < 97) {
        ctx.fillText(`Growing... ${progress}%`, cx, h - 20);
      } else {
        ctx.fillText("NOW! Catch the tail!", cx, h - 20);

        // Draw indicator toward tail
        const tailIndex = Math.min(Math.floor(this.snakeLength), this.history.length - 1);
        const tail = this.history[tailIndex];
        if (tail) {
          const tailScreenX = cx + tail.x * scale;
          const tailScreenY = cy + tail.y * scale;

          // Pulsing glow on tail - terminal green
          const pulse = 0.6 + Math.sin(this.time * 6) * 0.4;
          const tailHue = 135; // Terminal green
          const gradient = ctx.createRadialGradient(tailScreenX, tailScreenY, 0, tailScreenX, tailScreenY, 40);
          gradient.addColorStop(0, `hsla(${tailHue}, 100%, 70%, ${pulse})`);
          gradient.addColorStop(0.5, `hsla(${tailHue}, 100%, 50%, ${pulse * 0.5})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(tailScreenX, tailScreenY, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Ouroboros mode UI
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillText("Click to consume • Drag to rotate", cx, h - 20);

      if (this.totalEaten > 0) {
        const uiHue = this.hueOffset;
        ctx.fillStyle = `hsla(${uiHue}, 80%, 60%, 0.6)`;
        const perfectionPct = Math.floor(this.perfection * 100);
        
        // Show form name based on perfection
        let formName = "Circle";
        if (this.perfection >= 0.95) {
          formName = "∞ Infinity";
        } else if (this.perfection >= 0.7) {
          formName = "Morphing...";
        }
        
        ctx.fillText(`Consumed: ${this.totalEaten} • ${formName} (${perfectionPct}%)`, cx, 30);
      }
    }
  }

  drawSnake(ctx, points) {
    if (points.length < 2) return;

    // Terminal green (135) while slithering, rainbow after catching tail
    const terminalGreen = 135;
    const rainbowShift = this.hueOffset + this.totalEaten * 25;

    // Draw from tail to head with varying thickness
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      // Thickness varies - thin at tail, thick at head
      const t = i / points.length;
      
      const naturalThickness = 2 + t * 14 + this.totalEaten * 0.6;
      const uniformThickness = 7 + this.totalEaten * 0.4;
      
      const baseThickness = naturalThickness * (1 - this.perfection) + uniformThickness * this.perfection;

      // Breathing effect + eat pulse wave
      const breathe = 1 + Math.sin(this.time * 2 + t * 10) * 0.1 * (1 - this.perfection);
      const eatWave = this.eatPulse * Math.sin(t * Math.PI * 12 + this.time * 25) * 0.4;
      const thickness = baseThickness * (breathe + eatWave);

      // Depth affects brightness
      const depthFade = 0.5 + (p1.z + 0.5) * 0.5;

      // Color: terminal green while slithering, rainbow after ouroboros
      const eatFlash = this.eatPulse * 40;
      const rainbowHue = (rainbowShift + t * 80 + Math.sin(this.time * 2 + t * 8) * 30) % 360;
      const hue = terminalGreen * (1 - this.ouroborosBlend) + rainbowHue * this.ouroborosBlend;
      const sat = 100 * (1 - this.ouroborosBlend) + (85 + t * 15) * this.ouroborosBlend;
      const light = (45 + t * 15) * (1 - this.ouroborosBlend) + (35 + t * 25 + eatFlash) * this.ouroborosBlend;

      // Outer glow (additive)
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, 100%, ${light}%, ${0.25 * depthFade})`;
      ctx.lineWidth = thickness + 12;
      ctx.lineCap = "round";
      ctx.stroke();
      
      ctx.globalCompositeOperation = 'source-over';

      // Main body
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 10}%, ${depthFade})`;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bright core
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, ${sat - 10}%, ${Math.min(85, light + 30)}%, ${0.7 * depthFade})`;
      ctx.lineWidth = thickness * 0.35;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Draw scales/pattern
    this.drawScales(ctx, points);
  }

  drawScales(ctx, points) {
    const scaleSpacing = Math.max(3, Math.floor(points.length / 50));
    const terminalGreen = 135;
    const rainbowShift = this.hueOffset + this.totalEaten * 25;

    ctx.globalCompositeOperation = 'lighter';
    for (let i = scaleSpacing; i < points.length - scaleSpacing; i += scaleSpacing) {
      const p = points[i];
      const t = i / points.length;

      const size = 2 + t * 5;
      const depthFade = 0.5 + (p.z + 0.5) * 0.5;

      const rainbowHue = (rainbowShift + t * 80) % 360;
      const hue = terminalGreen * (1 - this.ouroborosBlend) + rainbowHue * this.ouroborosBlend;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 40 * this.ouroborosBlend}, 80%, 65%, ${0.35 * depthFade})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw comet tail glow behind head
   */
  drawCometTail(ctx, points) {
    if (points.length < CONFIG.cometLength) return;
    
    const terminalGreen = 135;
    const rainbowShift = this.hueOffset + this.totalEaten * 25;
    
    ctx.globalCompositeOperation = 'lighter';
    
    // Draw fading glow circles from head backwards
    for (let i = 0; i < CONFIG.cometLength; i++) {
      const idx = points.length - 1 - i;
      if (idx < 0) break;
      
      const p = points[idx];
      const progress = 1 - i / CONFIG.cometLength;
      
      const glowSize = CONFIG.glowSize * (0.3 + 0.7 * progress) * (1 + this.eatPulse * 0.5);
      const alpha = progress * 0.4 * (1 + this.eatPulse);
      
      const rainbowHue = (rainbowShift + 60 + i * 2) % 360;
      const hue = terminalGreen * (1 - this.ouroborosBlend) + rainbowHue * this.ouroborosBlend;
      
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      grad.addColorStop(0, `hsla(${hue}, 100%, 60%, ${alpha})`);
      grad.addColorStop(0.5, `hsla(${hue + 20 * this.ouroborosBlend}, 100%, 50%, ${alpha * 0.3})`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }

  drawHead(ctx, points) {
    if (points.length < 2) return;
    
    // Fade out head as we approach infinity (no head/tail distinction)
    const headFade = Math.max(0, 1 - (this.perfection - 0.7) / 0.25);
    if (headFade <= 0) return;

    const head = points[points.length - 1];
    const neck = points[points.length - 10] || points[points.length - 2];
    const angle = Math.atan2(head.y - neck.y, head.x - neck.x);

    // Match body thickness at head
    const bodyThickness = (2 + 14 + this.totalEaten * 0.6) * (1 - this.perfection) + 
                          (7 + this.totalEaten * 0.4) * this.perfection;
    
    const depthFade = 0.5 + (head.z + 0.5) * 0.5;
    const alpha = depthFade * headFade;
    
    // Terminal green while slithering, rainbow after ouroboros
    const terminalGreen = 135;
    const rainbowShift = this.hueOffset + this.totalEaten * 25;
    const rainbowHue = (rainbowShift + 80) % 360;
    const headHue = terminalGreen * (1 - this.ouroborosBlend) + rainbowHue * this.ouroborosBlend;
    const light = (45 + 15) * (1 - this.ouroborosBlend) + (35 + 25 + this.eatPulse * 40) * this.ouroborosBlend;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    // Head shape - wider horizontally than vertically (snake head)
    const headLength = bodyThickness * 1.8; // Long horizontally
    const headWidth = bodyThickness * 1.1;  // Slightly wider than body

    // Main head ellipse - stretched horizontal
    ctx.beginPath();
    ctx.ellipse(headLength * 0.3, 0, headLength, headWidth, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${headHue}, 100%, ${light}%, ${alpha})`;
    ctx.fill();
    
    // Brighter core
    ctx.beginPath();
    ctx.ellipse(headLength * 0.2, 0, headLength * 0.6, headWidth * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${headHue}, 90%, ${light + 15}%, ${alpha * 0.6})`;
    ctx.fill();

    // Eyes - two of them
    const eyeSize = (1.2 + bodyThickness * 0.04) * headFade;
    const eyeX = headLength * 0.4;
    const eyeY = headWidth * 0.35;
    
    // Top eye
    ctx.beginPath();
    ctx.arc(eyeX, -eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(50, 100%, 90%, ${alpha})`;
    ctx.fill();
    // Pupil
    ctx.beginPath();
    ctx.ellipse(eyeX, -eyeY, eyeSize * 0.3, eyeSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(0, 0%, 5%, ${alpha})`;
    ctx.fill();
    
    // Bottom eye (visible from other side when rotated)
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(50, 100%, 90%, ${alpha})`;
    ctx.fill();
    // Pupil
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, eyeSize * 0.3, eyeSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(0, 0%, 5%, ${alpha})`;
    ctx.fill();

    ctx.restore();

    // Tail glow (also fades) - terminal green while slithering
    const tail = points[0];
    const tailRainbowHue = (rainbowShift + 120) % 360;
    const tailHue = terminalGreen * (1 - this.ouroborosBlend) + tailRainbowHue * this.ouroborosBlend;
    
    ctx.globalCompositeOperation = 'lighter';
    const tailGlow = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 20);
    tailGlow.addColorStop(0, `hsla(${tailHue}, 100%, 60%, ${0.5 * headFade})`);
    tailGlow.addColorStop(1, "transparent");
    ctx.fillStyle = tailGlow;
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}

export default function day20(canvas) {
  const game = new Day20Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
