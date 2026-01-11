/**
 * Day 9: Crazy Automaton - Maxwell's Demon
 *
 * A thought experiment demon that sorts hot/cold gas particles,
 * seemingly violating the second law of thermodynamics!
 *
 * Left chamber = Hot (red)
 * Right chamber = Cold (blue)
 * Demon in middle controls a door, letting fast particles left
 * and slow particles right.
 */
import {
  Game,
  FluidSystem,
  Tweenetik,
  Easing,
  StateMachine,
  GameObject,
  Group,
  Circle,
  Arc,
  Shape,
  Painter,
} from "@guinetik/gcanvas";

/**
 * Ellipse shape - not built into gcanvas, so we create our own
 */
class Ellipse extends Shape {
  constructor(radiusX, radiusY, options = {}) {
    super(options);
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.width = radiusX * 2;
    this.height = radiusY * 2;
  }

  draw() {
    super.draw();
    if (this.color) {
      Painter.shapes.fillEllipse(0, 0, this.radiusX, this.radiusY, 0, this.color);
    }
    if (this.stroke) {
      Painter.shapes.strokeEllipse(0, 0, this.radiusX, this.radiusY, 0, this.stroke, this.lineWidth);
    }
  }
}

/**
 * Horn shape - pointed triangle for demon horns
 * Draws a thin pointed horn shape
 */
class Horn extends Shape {
  constructor(options = {}) {
    super(options);
    this.baseWidth = options.baseWidth || 8;  // Width at base
    this.height = options.height || 18;       // Height of horn
    this.flip = options.flip || false;        // Mirror for right horn
  }

  draw() {
    super.draw();
    const hw = this.baseWidth / 2;
    const h = this.height;

    // Points for a pointed horn (tip at top, base at bottom)
    const points = this.flip
      ? [
          { x: -hw, y: 0 },      // Base left
          { x: 0, y: -h },       // Tip (offset inward)
          { x: hw, y: 0 },       // Base right
        ]
      : [
          { x: -hw, y: 0 },      // Base left
          { x: 0, y: -h },       // Tip (offset inward)
          { x: hw, y: 0 },       // Base right
        ];

    Painter.shapes.polygon(points, this.color, this.stroke, this.lineWidth);
  }
}

/**
 * Demon - Maxwell's Demon as a proper GameObject with shape composition
 *
 * Uses Group to compose:
 * - Head (Circle, purple)
 * - Eyes (Circle x2, white)
 * - Pupils (Circle x2, black) - animated to track particle direction
 * - Horns (Triangle x2, dark purple)
 * - Mouth (Ellipse or Arc based on state)
 */
class Demon extends GameObject {
  constructor(game, options = {}) {
    super(game, options);

    this.size = options.size || 24;

    // Animation state
    this.eyeAngle = 0;          // -0.5 to 0.5, where to look
    this.mouthOpen = 0;         // 0-1 how open the mouth is
    this.puff = 1;              // Scale multiplier for "puffed up" state
    this.spitEffect = { active: false, direction: 0, timer: 0 };

    // Build the demon composition
    this._buildShapes();
  }

  _buildShapes() {
    // Main group for the demon body
    this.body = new Group({ x: 0, y: 0 });

    // Head - purple circle
    this.head = new Circle(this.size, {
      color: "#9b59b6",
    });
    this.body.add(this.head);

    // Horns - dark purple pointed shapes (matching original)
    this.leftHorn = new Horn({
      x: -12,
      y: -14,
      baseWidth: 8,
      height: 18,
      color: "#6c3483",
    });
    this.rightHorn = new Horn({
      x: 12,
      y: -14,
      baseWidth: 8,
      height: 18,
      flip: true,
      color: "#6c3483",
    });
    this.body.add(this.leftHorn);
    this.body.add(this.rightHorn);

    // Eyes - white circles
    const eyeY = -4;
    const eyeOffset = 8;
    this.leftEyeWhite = new Circle(6, {
      x: -eyeOffset,
      y: eyeY,
      color: "#fff",
    });
    this.rightEyeWhite = new Circle(6, {
      x: eyeOffset,
      y: eyeY,
      color: "#fff",
    });
    this.body.add(this.leftEyeWhite);
    this.body.add(this.rightEyeWhite);

    // Pupils - black circles (will be animated)
    this.leftPupil = new Circle(3, {
      x: -eyeOffset,
      y: eyeY,
      color: "#000",
    });
    this.rightPupil = new Circle(3, {
      x: eyeOffset,
      y: eyeY,
      color: "#000",
    });
    this.body.add(this.leftPupil);
    this.body.add(this.rightPupil);

    // Mouth shapes - we'll switch between these
    this.closedMouth = new Arc(8, 0.2, Math.PI - 0.2, {
      y: 10,
      stroke: "rgba(0, 0, 0, 0.8)",
      lineWidth: 3,
    });

    this.openMouth = new Ellipse(5, 5, {
      y: 12,
      color: "rgba(40, 10, 40, 0.9)",
      stroke: "rgba(0, 0, 0, 0.8)",
      lineWidth: 3,
    });

    // Start with closed mouth
    this.body.add(this.closedMouth);
    this.currentMouth = "closed";
  }

  /**
   * Update eye tracking position
   */
  setEyeAngle(angle) {
    this.eyeAngle = angle;
    const eyeOffset = 8;
    const pupilShift = angle * 10;

    this.leftPupil.x = -eyeOffset + pupilShift;
    this.rightPupil.x = eyeOffset + pupilShift;
  }

  /**
   * Set mouth open amount (0-1)
   */
  setMouthOpen(amount) {
    this.mouthOpen = amount;

    if (amount > 0.1 && this.currentMouth === "closed") {
      // Switch to open mouth
      this.body.remove(this.closedMouth);
      this.body.add(this.openMouth);
      this.currentMouth = "open";
    } else if (amount <= 0.1 && this.currentMouth === "open") {
      // Switch to closed mouth
      this.body.remove(this.openMouth);
      this.body.add(this.closedMouth);
      this.currentMouth = "closed";
    }

    // Scale open mouth based on amount
    if (this.currentMouth === "open") {
      const w = 3 + amount * 4;
      const h = 2 + amount * 6;
      this.openMouth.radiusX = w;
      this.openMouth.radiusY = h;
    }
  }

  /**
   * Trigger spit effect
   */
  startSpitEffect(direction) {
    this.spitEffect.active = true;
    this.spitEffect.direction = direction;
    this.spitEffect.timer = 0.2;
  }

  update(dt) {
    super.update(dt);

    // Update spit effect timer
    if (this.spitEffect.active) {
      this.spitEffect.timer -= dt;
      if (this.spitEffect.timer <= 0) {
        this.spitEffect.active = false;
      }
    }
  }

  draw() {
    super.draw();

    // Apply puff scale
    Painter.save();
    Painter.ctx.scale(this.puff, this.puff);

    // Render the body group
    this.body.render();

    Painter.restore();

    // Draw spit motion lines (need raw ctx for these lines)
    if (this.spitEffect.active) {
      this._drawSpitLines();
    }
  }

  _drawSpitLines() {
    const dir = this.spitEffect.direction;
    const mouthY = 10;
    const alpha = this.spitEffect.timer / 0.2;
    const ctx = Painter.ctx;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (let i = 0; i < 3; i++) {
      const offsetY = (i - 1) * 6;
      const lineLength = 20 + i * 8;
      ctx.beginPath();
      ctx.moveTo(dir * 12, mouthY + offsetY * 0.3);
      ctx.lineTo(dir * (12 + lineLength), mouthY + offsetY);
      ctx.stroke();
    }
  }
}

const CONFIG = {
  particleSize: 12,
  maxParticles: 500,
  gravity: 0,  // No gravity for gas
  container: {
    marginX: 0,
    marginY: 0,
  },
  // Wall settings
  wall: {
    width: 8,
  },
  // Demon AI settings
  demon: {
    speedThreshold: 120,  // Particles faster than this are "hot"
    detectionRange: 600,  // How far demon can see (whole chamber)
    arrivalDelay: 20,     // Seconds before demon appears
    gobbleCooldown: 0.2,  // Seconds between gobbles
  },
};

class Day09Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null;  // We draw our own background

    // Demon state
    this.demonArrived = false;
    this.demonTimer = 0;

    // Arrival animation state (tweened)
    this.arrival = {
      demonScale: 0,
      leftBgAlpha: 0,
      rightBgAlpha: 0,
      wallProgress: 0,  // 0 = no wall, 1 = full wall
      textAlpha: 0,     // "A wild demon appears" text
    };
    this.showAnnouncement = false;

    // Gobble state (demon animation is now on the Demon object)
    this.spitDirection = 0;
    this.gobbleFromDirection = 0;  // Which side we're gobbling from
    this.gobbleTarget = null;
    this.gobbleStartX = 0;
    this.gobbleStartY = 0;
    this.gobbleProgress = 0;  // 0-1 for mouth sync
    this.gobbleDuration = 0.3;  // Dynamic based on distance
    this.stateTimer = 0;

    // Gobble state machine
    this.gobbleState = new StateMachine({
      initial: "idle",
      context: this,
      states: {
        idle: {
          enter: () => {
            this.gobbleTarget = null;
            this.gobbleProgress = 0;
            this.stateTimer = 0.15;  // Quick pause before next
            if (this.demon) {
              this.demon.setMouthOpen(0);
            }
          },
          update: (dt) => this._idleUpdate(dt),
        },
        gobbling: {
          enter: () => {
            // Calculate duration based on distance (faster)
            const dx = this.gobbleStartX - this.wallX;
            const dy = this.gobbleStartY - (this.bounds.y + this.bounds.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minTime = 0.08;
            const maxTime = 0.25;
            const maxDist = CONFIG.demon.detectionRange;
            this.gobbleDuration = minTime + (dist / maxDist) * (maxTime - minTime);

            // Puff up like Kirby - animate on the Demon object
            if (this.demon) {
              Tweenetik.to(this.demon, { puff: 1.4 }, this.gobbleDuration, Easing.easeOutQuad);
            }
            this.stateTimer = this.gobbleDuration;
          },
          update: (dt) => this._gobblingUpdate(dt),
        },
        holding: {
          enter: () => {
            this.gobbleProgress = 1;
            if (this.demon) {
              this.demon.setMouthOpen(0);  // Close mouth while holding
            }
            this.stateTimer = 0.25;
          },
          update: (dt) => this._holdingUpdate(dt),
        },
        spitting: {
          enter: () => {
            this._doSpit();
            // Deflate - animate on the Demon object
            if (this.demon) {
              Tweenetik.to(this.demon, { puff: 1 }, 0.1, Easing.easeOutQuad);
            }
            this.stateTimer = 0.2;
          },
          update: (dt) => this._spittingUpdate(dt),
        },
      },
    });
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Container bounds
    this._updateBounds();

    // Calculate wall position (center of container)
    this.wallX = this.bounds.x + this.bounds.w / 2;

    // FluidSystem in gas mode - no heat zones, just gas physics
    this.fluid = new FluidSystem(this, {
      maxParticles: CONFIG.maxParticles,
      particleSize: CONFIG.particleSize,
      width: this.bounds.w,
      height: this.bounds.h,
      bounds: this.bounds,
      physics: "gas",
      debug: false,
      gravity: CONFIG.gravity,
      particleColor: { r: 255, g: 255, b: 255, a: 0.9 },
    });

    // Spawn particles
    this.fluid.spawn(CONFIG.maxParticles);

    // Lock in particle temperatures based on initial speed
    // This color will NEVER change - demon just sorts them
    this._lockParticleTemperatures();

    this.pipeline.add(this.fluid);

    // Create the Demon game object (initially hidden via scaleX/scaleY = 0)
    this.demon = new Demon(this, {
      x: this.wallX,
      y: this.bounds.y + this.bounds.h / 2,
      size: 24,
      visible: false,  // Start hidden until arrival animation
    });
    this.pipeline.add(this.demon);
  }

  /**
   * Lock particle temperatures based on initial velocity.
   * Called once at start - colors never change after this!
   * Splits particles 50/50 into hot and cold based on relative speed.
   */
  _lockParticleTemperatures() {
    // Calculate all speeds first
    const speeds = [];
    for (const p of this.fluid.particles) {
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      speeds.push({ particle: p, speed });
    }

    // Sort by speed to find median
    speeds.sort((a, b) => a.speed - b.speed);
    const medianSpeed = speeds[Math.floor(speeds.length / 2)].speed;
    const maxSpeed = speeds[speeds.length - 1].speed || 1;

    // Assign hot/cold based on median (50/50 split)
    for (const { particle: p, speed } of speeds) {
      p.custom.temperature = Math.min(1, speed / maxSpeed);
      p.custom.isHot = speed > medianSpeed;
    }
  }

  _updateBounds() {
    const { marginX, marginY } = CONFIG.container;
    this.bounds = {
      x: marginX,
      y: marginY,
      w: this.width - marginX * 2,
      h: this.height - marginY * 2,
    };
  }

  update(dt) {
    // Update all active tweens
    Tweenetik.updateAll(dt);

    // Track time for demon arrival
    this.demonTimer += dt;

    // Show announcement 3 seconds before demon arrives
    const announceTime = CONFIG.demon.arrivalDelay - 3;
    if (!this.showAnnouncement && this.demonTimer >= announceTime) {
      this.showAnnouncement = true;
      // Fade in text
      Tweenetik.to(this.arrival, { textAlpha: 1 }, 0.5, Easing.easeOutQuad);
    }

    if (!this.demonArrived && this.demonTimer >= CONFIG.demon.arrivalDelay) {
      this.demonArrived = true;
      // Fade out text as demon arrives
      Tweenetik.to(this.arrival, { textAlpha: 0 }, 0.3, Easing.easeOutQuad);
      this._startArrivalSequence();
    }

    // Only run demon logic after wall is fully drawn
    if (this.demonArrived && this.arrival.wallProgress >= 1) {
      // Enforce wall collision (solid wall)
      this._enforceWall();

      // Gobble state machine
      this.gobbleState.update(dt);
    }

    super.update(dt);

    // Color particles by locked temperature (never changes!)
    this._colorByTemperature();

    // Keep hot particles fast, cold particles slow
    this._enforceTemperatureSpeeds();
  }

  /**
   * Start the dramatic arrival sequence with staggered tweens
   */
  _startArrivalSequence() {
    // Make demon visible and start scale animation
    if (this.demon) {
      this.demon.visible = true;
      this.demon.scaleX = 0;
      this.demon.scaleY = 0;
      // 1. Demon pops in from scale 0
      Tweenetik.to(this.demon, { scaleX: 1, scaleY: 1 }, 0.5, Easing.easeOutBack);
    }

    // 2. Left background fades in (after demon appears)
    Tweenetik.to(this.arrival, { leftBgAlpha: 0.3 }, 0.4, Easing.easeOutQuad, {
      delay: 0.3,
    });

    // 3. Right background fades in (after left)
    Tweenetik.to(this.arrival, { rightBgAlpha: 0.3 }, 0.4, Easing.easeOutQuad, {
      delay: 0.5,
    });

    // 4. Wall draws from top to bottom (after backgrounds)
    Tweenetik.to(this.arrival, { wallProgress: 1 }, 0.6, Easing.easeInOutQuad, {
      delay: 0.7,
    });
  }


  /**
   * Enforce the wall - solid wall, particles bounce off
   */
  _enforceWall() {
    const wallX = this.wallX;
    const wallHalfWidth = CONFIG.wall.width / 2;

    for (const p of this.fluid.particles) {
      // Skip the particle being gobbled - it needs to reach the mouth
      if (p === this.gobbleTarget) continue;

      const dx = p.x - wallX;

      // Check if particle is in the wall zone
      if (Math.abs(dx) < wallHalfWidth + CONFIG.particleSize / 2) {
        // Bounce off wall
        if (dx > 0) {
          p.x = wallX + wallHalfWidth + CONFIG.particleSize / 2;
          p.vx = Math.abs(p.vx) * 0.8;
        } else {
          p.x = wallX - wallHalfWidth - CONFIG.particleSize / 2;
          p.vx = -Math.abs(p.vx) * 0.8;
        }
      }
    }
  }

  /**
   * Idle state - look for wrong particles to gobble
   */
  _idleUpdate(dt) {
    // Wait for cooldown before looking for next particle
    this.stateTimer -= dt;
    if (this.stateTimer > 0) {
      // Slowly return eyes to center
      if (this.demon) {
        this.demon.eyeAngle *= 0.95;
        this.demon.setEyeAngle(this.demon.eyeAngle);
      }
      return;
    }

    const { detectionRange } = CONFIG.demon;

    // Find the nearest "wrong" particle
    let target = null;
    let minDist = Infinity;

    for (const p of this.fluid.particles) {
      const dx = p.x - this.wallX;
      const distToWall = Math.abs(dx);

      if (distToWall > detectionRange) continue;

      const isHot = p.custom.isHot;
      const onRightSide = dx > 0;
      const onLeftSide = dx < 0;
      const isWrong = (isHot && onRightSide) || (!isHot && onLeftSide);

      if (isWrong && distToWall < minDist) {
        minDist = distToWall;
        target = p;
      }
    }

    if (target) {
      // Found a target - start gobbling
      this.gobbleTarget = target;

      // Determine which side particle is on and where to spit
      const particleOnRight = target.x > this.wallX;
      this.gobbleFromDirection = particleOnRight ? 1 : -1;  // 1 = right, -1 = left
      this.spitDirection = target.custom.isHot ? -1 : 1;    // Hot→left, Cold→right

      // Store original position for inhale animation
      this.gobbleStartX = target.x;
      this.gobbleStartY = target.y;

      // Look toward the particle (where it's coming from)
      if (this.demon) {
        this.demon.setEyeAngle(this.gobbleFromDirection * 0.5);
      }

      // Transition to gobbling state
      this.gobbleState.setState("gobbling");
    }

    // Slowly return eyes to center
    if (this.demon) {
      this.demon.eyeAngle *= 0.95;
      this.demon.setEyeAngle(this.demon.eyeAngle);
    }
  }

  /**
   * Gobbling state - suck particle toward mouth with force
   */
  _gobblingUpdate(dt) {
    this.stateTimer -= dt;
    const progress = Math.min(1, Math.max(0, 1 - (this.stateTimer / this.gobbleDuration)));

    // Store progress for mouth animation sync
    this.gobbleProgress = progress;

    // Update demon mouth opening
    if (this.demon) {
      this.demon.setMouthOpen(progress * progress);  // Ease in the opening
    }

    // Apply suction force toward mouth
    if (this.gobbleTarget) {
      const demonY = this.bounds.y + this.bounds.h / 2;
      const mouthX = this.wallX;
      const mouthY = demonY + 14;

      const dx = mouthX - this.gobbleTarget.x;
      const dy = mouthY - this.gobbleTarget.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        // Fast accelerating suction
        const suctionStrength = 1500 + progress * 2500;
        this.gobbleTarget.vx = (dx / dist) * suctionStrength;
        this.gobbleTarget.vy = (dy / dist) * suctionStrength;
      } else {
        // Particle reached mouth - NOW transition to holding
        this.gobbleTarget.x = mouthX;
        this.gobbleTarget.y = mouthY;
        this.gobbleTarget.vx = 0;
        this.gobbleTarget.vy = 0;
        this.gobbleProgress = 1;
        this.gobbleState.setState("holding");
        return;
      }
    }

    // Failsafe - if timer expired but particle didn't arrive, keep going
    // (don't transition based on time alone)
  }

  /**
   * Holding state - mouth closed, particle hidden inside, eyes move to other side
   */
  _holdingUpdate(dt) {
    this.stateTimer -= dt;
    const duration = 0.5;
    const progress = 1 - (this.stateTimer / duration);

    // Hide particle off-screen while "swallowed"
    if (this.gobbleTarget) {
      this.gobbleTarget.x = -1000;
      this.gobbleTarget.y = -1000;
      this.gobbleTarget.vx = 0;
      this.gobbleTarget.vy = 0;
    }

    // Eyes: look at source → center → target
    if (this.demon) {
      if (progress < 0.4) {
        // Still looking at source (where we gobbled from)
        this.demon.setEyeAngle(this.gobbleFromDirection * 0.5);
      } else if (progress < 0.7) {
        // Looking center
        this.demon.eyeAngle *= 0.7;
        this.demon.setEyeAngle(this.demon.eyeAngle);
      } else {
        // Looking at target (where we'll spit to)
        this.demon.setEyeAngle(this.spitDirection * 0.5);
      }
    }

    if (this.stateTimer <= 0) {
      this.gobbleState.setState("spitting");
    }
  }

  /**
   * Perform the spit - eject particle with force
   */
  _doSpit() {
    if (!this.gobbleTarget) return;

    // Position particle at mouth before spitting
    const demonY = this.bounds.y + this.bounds.h / 2;
    this.gobbleTarget.x = this.wallX;
    this.gobbleTarget.y = demonY + 14;

    const spitForce = 450 + Math.random() * 150;
    const spitAngle = (Math.random() - 0.5) * 0.3;

    // Spit in the correct direction
    this.gobbleTarget.vx = this.spitDirection * spitForce;
    this.gobbleTarget.vy = spitAngle * spitForce;

    // Activate spit effect on demon
    if (this.demon) {
      this.demon.startSpitEffect(this.spitDirection);
      this.demon.setMouthOpen(1);  // Open mouth for spit
      this.demon.setEyeAngle(this.spitDirection * 0.5);  // Look in spit direction
    }
  }

  /**
   * Spitting state - show effect then return to idle
   */
  _spittingUpdate(dt) {
    this.stateTimer -= dt;

    // Update mouth closing during spit
    if (this.demon) {
      const progress = this.stateTimer / 0.2;  // 0.2 is spit duration
      this.demon.setMouthOpen(progress);
    }

    if (this.stateTimer <= 0) {
      this.gobbleState.setState("idle");
    }
  }

  /**
   * Keep hot particles fast, cold particles slow
   */
  _enforceTemperatureSpeeds() {
    const hotSpeed = 180;   // Target speed for hot particles
    const coldSpeed = 60;   // Target speed for cold particles

    for (const p of this.fluid.particles) {
      if (p === this.gobbleTarget) continue;  // Don't mess with gobbled particle

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed < 1) continue;

      const targetSpeed = p.custom.isHot ? hotSpeed : coldSpeed;
      const scale = targetSpeed / speed;

      // Gradually nudge toward target speed
      p.vx += (p.vx * scale - p.vx) * 0.05;
      p.vy += (p.vy * scale - p.vy) * 0.05;
    }
  }

  /**
   * Color particles by temperature.
   * Before demon: gradient based on speed
   * After demon: pure red (hot) or pure blue (cold)
   */
  _colorByTemperature() {
    for (const p of this.fluid.particles) {
      if (this.demonArrived) {
        // After demon arrives: pure binary colors
        if (p.custom.isHot) {
          p.color.r = 255;
          p.color.g = 50;
          p.color.b = 50;
        } else {
          p.color.r = 50;
          p.color.g = 50;
          p.color.b = 255;
        }
      } else {
        // Before demon: gradient based on temperature
        const t = p.custom?.temperature ?? 0.5;
        p.color.r = Math.floor(255 * t);
        p.color.g = Math.floor(80 * (1 - Math.abs(t - 0.5) * 2));
        p.color.b = Math.floor(255 * (1 - t));
      }
    }
  }

  render() {
    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw announcement text before demon arrives
    if (this.arrival.textAlpha > 0) {
      ctx.save();
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(155, 89, 182, ${this.arrival.textAlpha})`;  // Purple like demon
      ctx.fillText("A wild demon appears...", this.width / 2, this.height / 2);
      ctx.restore();
    }

    // Only draw chambers and wall after arrival (using tweened values)
    if (this.demonArrived) {
      const { leftBgAlpha, rightBgAlpha, wallProgress } = this.arrival;

      // Draw chambers background (fade in with tweened alpha)
      if (leftBgAlpha > 0) {
        ctx.fillStyle = `rgba(60, 20, 20, ${leftBgAlpha})`;
        ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.w / 2, this.bounds.h);
      }
      if (rightBgAlpha > 0) {
        ctx.fillStyle = `rgba(20, 20, 60, ${rightBgAlpha})`;
        ctx.fillRect(this.wallX, this.bounds.y, this.bounds.w / 2, this.bounds.h);
      }

      // Draw wall from top to bottom (based on wallProgress)
      if (wallProgress > 0) {
        ctx.fillStyle = "#666";
        const wallHeight = this.bounds.h * wallProgress;
        ctx.fillRect(
          this.wallX - CONFIG.wall.width / 2,
          this.bounds.y,
          CONFIG.wall.width,
          wallHeight
        );
      }
    }

    // Demon and particles are rendered via pipeline
    this.pipeline.render(ctx);
  }
}

export default function day09(canvas) {
  const game = new Day09Demo(canvas);
  game.start();
  return {
    stop: () => game.stop(),
    game,
    handlesResize: true,  // FluidSystem handles resize reactively
  };
}
