/**
 * Day 16: Order and Disorder - Maxwell's Demon
 *
 * A thought experiment demon that sorts hot/cold gas particles,
 * seemingly violating the second law of thermodynamics!
 *
 * Left chamber = Hot (red)
 * Right chamber = Cold (blue)
 * Demon in middle controls a door, letting fast particles left
 * and slow particles right.
 *
 * The perfect visualization for "Order and Disorder" - the demon
 * creates order from chaos by sorting particles by temperature.
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
  Cloud,
  Painter,
  heatTransferFalloff,
} from "@guinetik/gcanvas";

/**
 * Apply heat transfer between nearby particles.
 * (Temporary local copy until npm link works)
 */
function applyParticleHeatTransfer(particles, options = {}) {
  const {
    maxDistance = 50,
    rate = 0.01,
    falloff = 1,
    temperatureKey = 'temperature',
    filter = null,
  } = options;

  const n = particles.length;
  const maxDist2 = maxDistance * maxDistance;

  for (let i = 0; i < n; i++) {
    const pi = particles[i];
    if (filter && !filter(pi)) continue;
    if (pi.custom[temperatureKey] === undefined) pi.custom[temperatureKey] = 0.5;

    for (let j = i + 1; j < n; j++) {
      const pj = particles[j];
      if (filter && !filter(pj)) continue;
      if (pj.custom[temperatureKey] === undefined) pj.custom[temperatureKey] = 0.5;

      const dx = pi.x - pj.x;
      const dy = pi.y - pj.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 >= maxDist2 || dist2 < 0.0001) continue;

      const dist = Math.sqrt(dist2);
      const delta = heatTransferFalloff(
        pi.custom[temperatureKey],
        pj.custom[temperatureKey],
        dist, maxDistance, rate, falloff
      );

      pi.custom[temperatureKey] = Math.max(0, Math.min(1, pi.custom[temperatureKey] + delta));
      pj.custom[temperatureKey] = Math.max(0, Math.min(1, pj.custom[temperatureKey] - delta));
    }
  }
}

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

/**
 * ThoughtBubble - Comic-style thought bubble with trailing circles
 *
 * Appears above the demon with text inside, trailing circles lead down to head
 */
class ThoughtBubble extends GameObject {
  constructor(game, options = {}) {
    super(game, options);

    this.text = options.text || "...";
    this.targetX = options.targetX || 0;  // Where the trail points to (demon head)
    this.targetY = options.targetY || 0;
    this.alpha = 0;  // For fade in/out

    this._buildShapes();
  }

  _buildShapes() {
    // Main cloud bubble - big enough for "YOU ARE ALL FREE NOW"
    this.cloud = new Cloud(70, {
      color: "rgba(255, 255, 255, 0.95)",
    });

    // Trailing circles (thought trail) - positioned relative to bubble
    this.trailCircles = [
      new Circle(10, { color: "rgba(255, 255, 255, 0.9)" }),
      new Circle(7, { color: "rgba(255, 255, 255, 0.85)" }),
      new Circle(4, { color: "rgba(255, 255, 255, 0.8)" }),
    ];
  }

  draw() {
    super.draw();
    if (this.alpha <= 0) return;

    const ctx = Painter.ctx;
    ctx.globalAlpha = this.alpha;

    // Draw trailing circles from bubble toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    for (let i = 0; i < this.trailCircles.length; i++) {
      const t = (i + 1) / (this.trailCircles.length + 1);
      const cx = dx * t * 0.6;  // Trail doesn't go all the way
      const cy = dy * t * 0.6 + 30;  // Offset down from bubble center

      ctx.save();
      ctx.translate(cx, cy);
      this.trailCircles[i].render();
      ctx.restore();
    }

    // Draw main cloud
    this.cloud.render();

    // Draw text inside bubble
    ctx.fillStyle = "#333";
    ctx.font = "bold 10px 'Fira Code', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, 0, 0);

    ctx.globalAlpha = 1;
  }
}

const CONFIG = {
  particleSize: 20,  // 30% smaller
  // maxParticles calculated dynamically based on screen size
  // @ 1080p, scales proportionally
  baseParticles: 200,
  baseArea: 1920 * 1080,  // 1080p reference
  minParticles: 100,
  maxParticles: 300,
  gravity: 0,  // No gravity - pure gas
  container: {
    marginX: 0,
    marginY: 0,
  },
  // Wall settings
  wall: {
    width: 8,
  },
  // Particle-to-particle heat transfer (uses applyParticleHeatTransfer from gcanvas)
  heatTransfer: {
    maxDistance: 36,        // Particles must be this close to exchange heat
    rateEntropy: 0.015,     // Heat transfer rate during entropy (mixing)
    rateSorting: 0.002,     // Much slower while demon sorts (insulated boxes)
    falloff: 1,             // Linear falloff (2 = quadratic)
  },
  // Demon AI settings
  demon: {
    tempThreshold: 0.5,   // Particles hotter than this are "hot"
    detectionRange: 600,  // How far demon can see (whole chamber)
    gobbleCooldown: 0.2,  // Seconds between gobbles
  },
  // Phase timings
  phases: {
    entropyDuration: 10,    // Seconds of entropy before demon arrives
    exhaustedDuration: 4,   // Seconds showing thought bubble
    departureDuration: 2,   // Seconds for departure animation
  },
};

class Day16Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null;  // We draw our own background

    // Demon state - controlled by phase machine
    this.demonArrived = false;

    // Visual animation state (tweened)
    this.visuals = {
      leftBgAlpha: 0,
      rightBgAlpha: 0,
      wallProgress: 0,  // 0 = no wall, 1 = full wall
    };

    // Gobble state (demon animation is now on the Demon object)
    this.spitDirection = 0;
    this.gobbleFromDirection = 0;  // Which side we're gobbling from
    this.gobbleTarget = null;
    this.gobbleStartX = 0;
    this.gobbleStartY = 0;
    this.gobbleProgress = 0;  // 0-1 for mouth sync
    this.gobbleDuration = 0.3;  // Dynamic based on distance
    this.gobbleStateTimer = 0;

    // Phase state machine - the main narrative loop
    this.phaseTimer = 0;
    this.phaseState = new StateMachine({
      initial: "entropy",
      context: this,
      states: {
        entropy: {
          enter: () => this._enterEntropy(),
          update: (dt) => this._updateEntropy(dt),
        },
        arrival: {
          enter: () => this._enterArrival(),
          update: (dt) => this._updateArrival(dt),
        },
        sorting: {
          enter: () => this._enterSorting(),
          update: (dt) => this._updateSorting(dt),
        },
        exhausted: {
          enter: () => this._enterExhausted(),
          update: (dt) => this._updateExhausted(dt),
        },
        departure: {
          enter: () => this._enterDeparture(),
          update: (dt) => this._updateDeparture(dt),
        },
      },
    });

    // Gobble state machine (sub-state of SORTING phase)
    this.gobbleState = new StateMachine({
      initial: "idle",
      context: this,
      states: {
        idle: {
          enter: () => {
            this.gobbleTarget = null;
            this.gobbleProgress = 0;
            this.gobbleStateTimer = 0.15;  // Quick pause before next
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
            this.gobbleStateTimer = this.gobbleDuration;
          },
          update: (dt) => this._gobblingUpdate(dt),
        },
        holding: {
          enter: () => {
            this.gobbleProgress = 1;
            if (this.demon) {
              this.demon.setMouthOpen(0);  // Close mouth while holding
            }
            this.gobbleStateTimer = 0.25;
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
            this.gobbleStateTimer = 0.2;
          },
          update: (dt) => this._spittingUpdate(dt),
        },
      },
    });
  }

  init() {
    super.init();
    Painter.init(this.ctx);
    console.log("[Day16] Initializing Maxwell's Demon...");

    // Container bounds
    this._updateBounds();

    // Calculate wall position (center of container)
    this.wallX = this.bounds.x + this.bounds.w / 2;

    // Calculate particle count based on screen size
    const canvasArea = this.width * this.height;
    const scale = canvasArea / CONFIG.baseArea;
    this.particleCount = Math.floor(
      Math.min(CONFIG.maxParticles,
        Math.max(CONFIG.minParticles, CONFIG.baseParticles * scale))
    );
    console.log(`[Day16] Canvas: ${this.width}x${this.height}, particles: ${this.particleCount}`);

    // FluidSystem in gas mode - we handle heat transfer ourselves
    this.fluid = new FluidSystem(this, {
      maxParticles: this.particleCount,
      particleSize: CONFIG.particleSize,
      width: this.bounds.w,
      height: this.bounds.h,
      bounds: this.bounds,
      physics: "gas",
      debug: false,
      gravity: CONFIG.gravity,
      heat: { enabled: false },  // Disable built-in heat zones
      particleColor: { r: 255, g: 255, b: 255, a: 0.9 },
    });

    // Spawn particles
    this.fluid.spawn(this.particleCount);

    // Initialize particle custom data
    this._initParticles();

    this.pipeline.add(this.fluid);

    // Create the Demon game object (initially hidden)
    this.demon = new Demon(this, {
      x: this.wallX,
      y: this.bounds.y + this.bounds.h / 2,
      size: 24,
      visible: false,  // Start hidden until arrival animation
    });
    this.pipeline.add(this.demon);

    // Create thought bubble (positioned above demon)
    this.thoughtBubble = new ThoughtBubble(this, {
      x: this.wallX,
      y: this.bounds.y + this.bounds.h / 2 - 100,
      targetX: this.wallX,
      targetY: this.bounds.y + this.bounds.h / 2 - 30,
      text: "",
    });
    this.pipeline.add(this.thoughtBubble);

    // Manually trigger initial state enter (StateMachine may not auto-call it)
    this._enterEntropy();
    console.log("[Day16] Init complete, starting entropy phase");
  }

  /**
   * Initialize particle custom data.
   * Random temperatures create initial entropy.
   * sorted = false initially, becomes true once demon spits it.
   */
  _initParticles() {
    for (const p of this.fluid.particles) {
      // Random temperature [0.1-0.9] creates initial disorder
      p.custom.temperature = 0.1 + Math.random() * 0.8;
      p.custom.sorted = false;  // Not yet processed by demon
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

    // Update phase state machine
    this.phaseState.update(dt);

    super.update(dt);

    // Apply particle-to-particle heat transfer (excludes sorted particles)
    // Slower rate when demon is sorting (insulated boxes)
    const heatRate = this.demonArrived
      ? CONFIG.heatTransfer.rateSorting
      : CONFIG.heatTransfer.rateEntropy;

    applyParticleHeatTransfer(this.fluid.particles, {
      maxDistance: CONFIG.heatTransfer.maxDistance,
      rate: heatRate,
      falloff: CONFIG.heatTransfer.falloff,
      filter: (p) => !p.custom.sorted && p !== this.gobbleTarget,
    });

    // Lock sorted particle temperatures (FluidSystem zones may have touched them)
    this._lockSortedTemperatures();

    // Color particles by temperature
    this._colorByTemperature();

    // Keep sorted particles at their locked speeds
    this._enforceTemperatureSpeeds();
  }

  // ============================================
  // Phase State Machine Handlers
  // ============================================

  /**
   * ENTROPY phase - particles mix freely, heat mechanics active
   */
  _enterEntropy() {
    console.log("[Day16] Entering ENTROPY phase");
    this.phaseTimer = 0;
    this.demonArrived = false;

    // Hide thought bubble from previous cycle
    if (this.thoughtBubble) {
      this.thoughtBubble.alpha = 0;
    }
  }

  _updateEntropy(dt) {
    this.phaseTimer += dt;

    // Transition to arrival after entropy duration
    if (this.phaseTimer >= CONFIG.phases.entropyDuration) {
      this.phaseState.setState("arrival");
    }
  }

  /**
   * ARRIVAL phase - demon appears, insulation activates
   */
  _enterArrival() {
    this.phaseTimer = 0;
    this.demonArrived = true;  // Insulation power activates!

    // Make demon visible and pop in
    if (this.demon) {
      this.demon.visible = true;
      this.demon.scaleX = 0;
      this.demon.scaleY = 0;
      Tweenetik.to(this.demon, { scaleX: 1, scaleY: 1 }, 0.5, Easing.easeOutBack);
    }

    // Fade in chamber backgrounds
    Tweenetik.to(this.visuals, { leftBgAlpha: 0.3 }, 0.4, Easing.easeOutQuad, { delay: 0.3 });
    Tweenetik.to(this.visuals, { rightBgAlpha: 0.3 }, 0.4, Easing.easeOutQuad, { delay: 0.5 });

    // Draw wall from top to bottom
    Tweenetik.to(this.visuals, { wallProgress: 1 }, 0.6, Easing.easeInOutQuad, { delay: 0.7 });
  }

  _updateArrival(dt) {
    this.phaseTimer += dt;

    // Transition to sorting once wall is fully drawn
    if (this.visuals.wallProgress >= 1) {
      this.phaseState.setState("sorting");
    }
  }

  /**
   * SORTING phase - demon actively sorts particles
   */
  _enterSorting() {
    this.phaseTimer = 0;
    this.gobbleState.setState("idle");  // Reset gobble state
  }

  _updateSorting(dt) {
    // Enforce wall collision
    this._enforceWall();

    // Run gobble state machine
    this.gobbleState.update(dt);

    // Only check if sorted when demon is idle (not mid-gobble/spit)
    const isIdle = this.gobbleState.currentState === "idle" && !this.gobbleTarget;

    if (isIdle && this._checkAllSorted()) {
      console.log("[Day16] All sorted! Transitioning to exhausted");
      this.phaseState.setState("exhausted");
    }
  }

  /**
   * EXHAUSTED phase - all sorted, demon shows thought bubble
   */
  _enterExhausted() {
    console.log("[Day16] EXHAUSTED - showing bubble");
    this.phaseTimer = 0;

    // Demon looks satisfied - eyes center
    if (this.demon) {
      this.demon.setEyeAngle(0);
      this.demon.setMouthOpen(0);
    }

    // The iconic line
    if (this.thoughtBubble) {
      console.log("[Day16] Setting bubble text and alpha");
      this.thoughtBubble.text = "YOU ARE ALL FREE NOW";
      this.thoughtBubble.alpha = 1;  // Set directly instead of tween for debug
    }
  }

  _updateExhausted(dt) {
    this.phaseTimer += dt;

    // Still enforce wall while demon is present
    this._enforceWall();

    // Transition to departure after exhausted duration
    if (this.phaseTimer >= CONFIG.phases.exhaustedDuration) {
      this.phaseState.setState("departure");
    }
  }

  /**
   * DEPARTURE phase - demon leaves, insulation fades
   */
  _enterDeparture() {
    this.phaseTimer = 0;

    // Hide thought bubble
    if (this.thoughtBubble) {
      Tweenetik.to(this.thoughtBubble, { alpha: 0 }, 0.3, Easing.easeOutQuad);
    }

    // Demon shrinks away
    if (this.demon) {
      Tweenetik.to(this.demon, { scaleX: 0, scaleY: 0 }, 0.5, Easing.easeInBack, {
        delay: 0.3,
        onComplete: () => {
          this.demon.visible = false;
        },
      });
    }

    // Fade out chamber backgrounds and wall
    Tweenetik.to(this.visuals, { leftBgAlpha: 0 }, 0.8, Easing.easeOutQuad, { delay: 0.5 });
    Tweenetik.to(this.visuals, { rightBgAlpha: 0 }, 0.8, Easing.easeOutQuad, { delay: 0.5 });
    Tweenetik.to(this.visuals, { wallProgress: 0 }, 0.8, Easing.easeInQuad, { delay: 0.5 });

    // Insulation power fades - particles will return to gradient colors
    // (handled by demonArrived = false in entropy enter)
  }

  _updateDeparture(dt) {
    this.phaseTimer += dt;

    // Transition back to entropy after departure duration
    if (this.phaseTimer >= CONFIG.phases.departureDuration) {
      console.log("[Day16] Departure complete, returning to entropy");
      // Randomize particle velocities before returning to entropy
      this._randomizeParticleVelocities();
      this.phaseState.setState("entropy");
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if all particles have been sorted by the demon
   */
  _checkAllSorted() {
    for (const p of this.fluid.particles) {
      if (!p.custom.sorted) {
        return false;
      }
    }
    return true;
  }

  /**
   * Randomize particle velocities and reset sorted flag to restore entropy
   */
  _randomizeParticleVelocities() {
    for (const p of this.fluid.particles) {
      const speed = 50 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.custom.sorted = false;  // Back to unsorted state
      p.custom.temperature = 0.1 + Math.random() * 0.8;  // Random temperature
    }
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
    this.gobbleStateTimer -= dt;
    if (this.gobbleStateTimer > 0) {
      // Slowly return eyes to center
      if (this.demon) {
        this.demon.eyeAngle *= 0.95;
        this.demon.setEyeAngle(this.demon.eyeAngle);
      }
      return;
    }

    const { detectionRange, tempThreshold } = CONFIG.demon;

    // Find the nearest "wrong" particle (unsorted only)
    let target = null;
    let minDist = Infinity;
    let targetIsHot = false;

    // Also track any unsorted particle as a fallback (straggler)
    let straggler = null;
    let stragglerIsHot = false;

    for (const p of this.fluid.particles) {
      // Skip already sorted particles
      if (p.custom.sorted) continue;

      const dx = p.x - this.wallX;
      const distToWall = Math.abs(dx);

      // Determine hot/cold based on stored TEMPERATURE
      const temp = p.custom.temperature ?? 0.5;
      const isHot = temp > tempThreshold;

      // Track as straggler - ANY unsorted particle (no range limit)
      if (!straggler) {
        straggler = p;
        stragglerIsHot = isHot;
      }

      // For "wrong" detection, use range limit
      if (distToWall > detectionRange) continue;

      const onRightSide = dx > 0;
      const onLeftSide = dx < 0;
      const isWrong = (isHot && onRightSide) || (!isHot && onLeftSide);

      if (isWrong && distToWall < minDist) {
        minDist = distToWall;
        target = p;
        targetIsHot = isHot;
      }
    }

    // If no "wrong" particle found, grab a straggler anyway
    // (particles near threshold that ended up on the "correct" side by chance)
    if (!target && straggler) {
      target = straggler;
      targetIsHot = stragglerIsHot;
    }

    if (target) {
      // Found a target - start gobbling
      this.gobbleTarget = target;

      // Lock the temperature decision NOW (based on current speed)
      target.custom.isHot = targetIsHot;

      // Determine which side particle is on and where to spit
      const particleOnRight = target.x > this.wallX;
      this.gobbleFromDirection = particleOnRight ? 1 : -1;  // 1 = right, -1 = left
      this.spitDirection = targetIsHot ? -1 : 1;    // Hot→left, Cold→right

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
    this.gobbleStateTimer -= dt;
    const progress = Math.min(1, Math.max(0, 1 - (this.gobbleStateTimer / this.gobbleDuration)));

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
    this.gobbleStateTimer -= dt;
    const duration = 0.5;
    const progress = 1 - (this.gobbleStateTimer / duration);

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

    if (this.gobbleStateTimer <= 0) {
      this.gobbleState.setState("spitting");
    }
  }

  /**
   * Perform the spit - eject particle with force
   * Mark particle as sorted and lock its temperature
   */
  _doSpit() {
    if (!this.gobbleTarget) return;

    // Position particle at mouth before spitting
    const demonY = this.bounds.y + this.bounds.h / 2;
    this.gobbleTarget.x = this.wallX;
    this.gobbleTarget.y = demonY + 14;

    const spitForce = 450 + Math.random() * 150;
    const spitAngle = (Math.random() - 0.5) * 0.3;

    // Spit in the correct direction (based on current temperature at gobble time)
    this.gobbleTarget.vx = this.spitDirection * spitForce;
    this.gobbleTarget.vy = spitAngle * spitForce;

    // Mark as sorted - this particle is now "locked" out of heat dynamics
    this.gobbleTarget.custom.sorted = true;
    // Lock the temperature so FluidSystem zones can't change it
    this.gobbleTarget.custom.lockedTemp = this.gobbleTarget.custom.isHot ? 0.9 : 0.1;
    this.gobbleTarget.custom.temperature = this.gobbleTarget.custom.lockedTemp;

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
    this.gobbleStateTimer -= dt;

    // Update mouth closing during spit
    if (this.demon) {
      const progress = this.gobbleStateTimer / 0.2;  // 0.2 is spit duration
      this.demon.setMouthOpen(progress);
    }

    if (this.gobbleStateTimer <= 0) {
      this.gobbleState.setState("idle");
    }
  }

  /**
   * Lock sorted particle temperatures to their values at sort time.
   * FluidSystem's zone heating can mess with temperatures - this overrides it.
   */
  _lockSortedTemperatures() {
    for (const p of this.fluid.particles) {
      if (p.custom.sorted && p.custom.lockedTemp !== undefined) {
        p.custom.temperature = p.custom.lockedTemp;
      }
    }
  }

  /**
   * Enforce sorted particle speeds based on their locked temperature.
   * Unsorted particles are managed by FluidSystem's thermal physics.
   */
  _enforceTemperatureSpeeds() {
    const hotSpeed = 150;   // Target speed for hot particles
    const coldSpeed = 50;   // Target speed for cold particles

    for (const p of this.fluid.particles) {
      if (p === this.gobbleTarget) continue;
      if (!p.custom.sorted) continue;  // Only enforce on sorted particles

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
   * Color particles by stored temperature.
   * Uses temperature [0-1] directly for gradient coloring.
   * Blue (cold, 0) → Purple (neutral, 0.5) → Red (hot, 1)
   */
  _colorByTemperature() {
    for (const p of this.fluid.particles) {
      const t = p.custom.temperature;

      // Temperature-based color gradient
      // Blue (cold) → Purple (mid) → Red (hot)
      p.color.r = Math.floor(255 * t);
      p.color.g = Math.floor(80 * (1 - Math.abs(t - 0.5) * 2));  // Peak at 0.5
      p.color.b = Math.floor(255 * (1 - t));
    }
  }

  render() {
    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw chambers and wall (using tweened values - fade in AND out)
    const { leftBgAlpha, rightBgAlpha, wallProgress } = this.visuals;

    // Draw chambers background
    if (leftBgAlpha > 0) {
      ctx.fillStyle = `rgba(60, 20, 20, ${leftBgAlpha})`;
      ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.w / 2, this.bounds.h);
    }
    if (rightBgAlpha > 0) {
      ctx.fillStyle = `rgba(20, 20, 60, ${rightBgAlpha})`;
      ctx.fillRect(this.wallX, this.bounds.y, this.bounds.w / 2, this.bounds.h);
    }

    // Draw wall from top to bottom
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

    // Demon, particles, and thought bubble are rendered via pipeline
    this.pipeline.render(ctx);
  }
}

export default function day16(canvas) {
  console.log("[Day16] Module loaded, creating game...");
  const game = new Day16Demo(canvas);

  // Workaround: If canvas has no dimensions yet (initial hash load), poll until ready
  function tryStart() {
    if (canvas.width > 0 && canvas.height > 0) {
      console.log("[Day16] Canvas ready, starting game");
      game.start();
    } else {
      console.log("[Day16] Canvas not ready, retrying...");
      requestAnimationFrame(tryStart);
    }
  }

  tryStart();

  return {
    stop: () => game.stop(),
    game,
    handlesResize: true,  // FluidSystem handles resize reactively
  };
}
