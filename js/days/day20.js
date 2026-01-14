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
    this.eatPulse = 0; // Pulse effect when eating
    this.totalEaten = 0; // How much it has consumed
    this.eatAngleOffset = 0; // Rotation offset when eating (dash forward)
    this.coils = 1; // How many times the snake wraps around (grows when eating)

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

    this.canvas.addEventListener("click", () => {
      if (this.isOuroboros) {
        // Eat! Snake lunges forward and regenerates tail
        this.eatPulse = 1;
        this.eatAngleOffset += 0.25; // Dash forward (head bites)
        this.coils += 0.08; // Tail regenerates - snake grows longer
        this.totalEaten += 1;
      }
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (this.isOuroboros) {
        this.eatPulse = 1;
        this.eatAngleOffset += 0.25;
        this.coils += 0.08;
        this.totalEaten += 1;
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

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Grow snake length over time
    if (!this.isOuroboros && this.snakeLength < this.maxSnakeLength) {
      this.snakeLength = Math.min(this.maxSnakeLength, this.snakeLength + dt * 15);
    }

    // Grow size slowly
    this.targetSize = Math.min(1, 0.05 + (this.snakeLength / this.maxSnakeLength) * 0.95);
    this.size += (this.targetSize - this.size) * 0.02;

    // Smooth ouroboros transition
    if (this.isOuroboros) {
      this.ouroborosBlend = Math.min(1, this.ouroborosBlend + dt * 0.5);
    }

    // Decay eat pulse
    if (this.eatPulse > 0) {
      this.eatPulse = Math.max(0, this.eatPulse - dt * 3);
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
          if (headToTail < 0.15) {
            this.isOuroboros = true;
          }
        }
      }
    }
  }

  // Get point on the ouroboros
  getSnakePoint(t, time) {
    // t goes from 0 (tail) to 1 (head)

    // Ouroboros circle position (used when head catches tail)
    // eatAngleOffset makes the head lunge forward when eating
    // coils determines how many times it wraps around
    const angle = t * Math.PI * 2 * this.coils - time * 0.5 + this.eatAngleOffset;
    const baseR = CONFIG.baseRadius * this.size;
    const undulation = Math.sin(t * Math.PI * 8 * this.coils + time * 2) * 0.05 * this.size;
    const r = baseR + undulation;

    const circleX = Math.cos(angle) * r;
    const circleY = Math.sin(angle) * r;

    // Slithering mode - follow the history trail
    // t=1 is head (history[0]), t=0 is tail (further back in history)
    const historyIndex = Math.floor((1 - t) * Math.min(this.snakeLength, this.history.length - 1));
    const historyPoint = this.history[Math.min(historyIndex, this.history.length - 1)];

    const followX = historyPoint ? historyPoint.x : 0;
    const followY = historyPoint ? historyPoint.y : 0;

    // Blend between slithering and ouroboros
    const blend = this.ouroborosBlend;
    const x = followX * (1 - blend) + circleX * blend;
    const y = followY * (1 - blend) + circleY * blend;

    // Z undulation for 3D effect (only in ouroboros mode)
    const z = Math.sin(t * Math.PI * 6 * this.coils + time * 1.5) * 0.08 * this.size * blend;

    return { x, y, z, t };
  }

  // Project 3D to 2D with rotation
  projectPoint(p) {
    // Less rotation when in following mode
    const rotationStrength = this.ouroborosBlend;

    // Rotate around Y axis based on mouse X (only in ouroboros mode)
    const rotY = (this.mouseX - 0.5) * Math.PI * 0.8 * rotationStrength;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const x1 = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;

    // Rotate around X axis based on mouse Y
    const rotX = (this.mouseY - 0.5) * Math.PI * 0.6 * rotationStrength;
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
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

    // Draw the snake body
    this.drawSnake(ctx, points);

    // Draw the head (eating the tail)
    this.drawHead(ctx, points);

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

          // Pulsing glow on tail
          const pulse = 0.5 + Math.sin(this.time * 4) * 0.3;
          const gradient = ctx.createRadialGradient(tailScreenX, tailScreenY, 0, tailScreenX, tailScreenY, 30);
          gradient.addColorStop(0, `rgba(255, 200, 100, ${pulse})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(tailScreenX, tailScreenY, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Ouroboros mode UI
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillText("Click to consume • Drag to rotate", cx, h - 20);

      if (this.totalEaten > 0) {
        ctx.fillStyle = `hsla(${CONFIG.colors.baseHue}, 80%, 60%, 0.6)`;
        ctx.fillText(`Consumed: ${this.totalEaten}`, cx, 30);
      }
    }
  }

  drawSnake(ctx, points) {
    if (points.length < 2) return;

    // Draw from tail to head with varying thickness
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      // Thickness varies - thin at tail, thick at head
      const t = i / points.length;
      const baseThickness = 2 + t * 12 + this.totalEaten * 0.5;

      // Breathing effect + eat pulse
      const breathe = 1 + Math.sin(this.time * 2 + t * 10) * 0.1;
      const eatWave = this.eatPulse * Math.sin(t * Math.PI * 8 + this.time * 20) * 0.3;
      const thickness = baseThickness * (breathe + eatWave);

      // Depth affects brightness
      const depthFade = 0.5 + (p1.z + 0.5) * 0.5;

      // Color shifts along body - flash brighter when eating
      const eatFlash = this.eatPulse * 30;
      const hue = CONFIG.colors.baseHue + t * 40 + Math.sin(this.time + t * 5) * 10;
      const sat = 70 + t * 20;
      const light = 40 + t * 20 + eatFlash;

      // Glow layer
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.3 * depthFade})`;
      ctx.lineWidth = thickness + 8;
      ctx.lineCap = "round";
      ctx.stroke();

      // Main body
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 15}%, ${depthFade})`;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bright core
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsla(${hue}, ${sat - 20}%, ${light + 35}%, ${0.6 * depthFade})`;
      ctx.lineWidth = thickness * 0.3;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Draw scales/pattern
    this.drawScales(ctx, points);
  }

  drawScales(ctx, points) {
    const scaleSpacing = Math.max(3, Math.floor(points.length / 50));

    for (let i = scaleSpacing; i < points.length - scaleSpacing; i += scaleSpacing) {
      const p = points[i];
      const t = i / points.length;

      const size = 2 + t * 4;
      const depthFade = 0.5 + (p.z + 0.5) * 0.5;

      const hue = CONFIG.colors.baseHue + t * 40;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 20}, 60%, 70%, ${0.3 * depthFade})`;
      ctx.fill();
    }
  }

  drawHead(ctx, points) {
    if (points.length < 2) return;

    const head = points[points.length - 1];
    const neck = points[points.length - 10] || points[points.length - 2];

    // Head direction
    const angle = Math.atan2(head.y - neck.y, head.x - neck.x);

    const headSize = 8 + 10 * this.size;
    const depthFade = 0.5 + (head.z + 0.5) * 0.5;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    // Head glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headSize * 2);
    gradient.addColorStop(0, `hsla(${CONFIG.colors.baseHue + 40}, 100%, 60%, ${0.5 * depthFade})`);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, headSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Head shape (triangle-ish)
    ctx.beginPath();
    ctx.moveTo(headSize, 0);
    ctx.lineTo(-headSize * 0.5, -headSize * 0.6);
    ctx.lineTo(-headSize * 0.5, headSize * 0.6);
    ctx.closePath();
    ctx.fillStyle = `hsla(${CONFIG.colors.baseHue + 40}, 80%, 55%, ${depthFade})`;
    ctx.fill();

    // Eye
    const eyeX = headSize * 0.2;
    const eyeY = -headSize * 0.2;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(60, 100%, 70%, ${depthFade})`;
    ctx.fill();

    // Mouth (open, eating)
    ctx.beginPath();
    ctx.moveTo(headSize, 0);
    ctx.lineTo(headSize * 0.3, -headSize * 0.15);
    ctx.lineTo(headSize * 0.3, headSize * 0.15);
    ctx.closePath();
    ctx.fillStyle = `hsla(0, 70%, 30%, ${depthFade})`;
    ctx.fill();

    ctx.restore();

    // Tail being eaten (at the start)
    const tail = points[0];
    const tailGlow = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 15);
    tailGlow.addColorStop(0, `hsla(${CONFIG.colors.baseHue}, 100%, 50%, 0.5)`);
    tailGlow.addColorStop(1, "transparent");
    ctx.fillStyle = tailGlow;
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function day20(canvas) {
  const game = new Day20Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
