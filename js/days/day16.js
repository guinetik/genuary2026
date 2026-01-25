/**
 * Genuary 2026 - Day 16
 * Prompt: "Order and disorder"
 * 
 * @fileoverview Maxwell's Demon - Particle sorting visualization
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
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
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
    this.puff = 1;              // Base scale multiplier for "puffed up" state
    this.squash = 0;            // -1 to 1: negative = tall/thin, positive = wide/flat
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
    this.spitEffect.timer = 0.08;  // Quick spit visual
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

    // Apply puff scale with squash/stretch (12 principles of animation!)
    // squash > 0 = wide and flat (inhaling), squash < 0 = tall and thin (exhaling)
    // More dramatic deformation for metaball/organic feel
    const scaleX = this.puff * (1 + this.squash * 0.35);
    const scaleY = this.puff * (1 - this.squash * 0.28);
    
    Painter.save();
    Painter.ctx.scale(scaleX, scaleY);

    // Render the body group
    this.body.render();

    Painter.restore();
    // Spit lines are drawn separately via drawSpitEffect() after particles
  }

  /**
   * Draw spit motion lines - call this AFTER particles render so it appears on top
   */
  drawSpitEffect() {
    if (!this.spitEffect.active) return;
    
    const ctx = Painter.ctx;
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Apply the same scale as the body so lines match the mouth position
    const scaleX = this.puff * (1 + this.squash * 0.35);
    const scaleY = this.puff * (1 - this.squash * 0.28);
    ctx.scale(scaleX, scaleY);
    
    this._drawSpitLines();
    ctx.restore();
  }

  _drawSpitLines() {
    const dir = this.spitEffect.direction;
    const mouthY = 14;  // Match the open mouth position (y: 12 + a bit lower)
    const alpha = this.spitEffect.timer / 0.08;  // Match timer duration
    const ctx = Painter.ctx;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (let i = 0; i < 3; i++) {
      const offsetY = (i - 1) * 5;
      const lineLength = 15 + i * 6;
      ctx.beginPath();
      // Start closer to the mouth edge
      ctx.moveTo(dir * 6, mouthY + offsetY * 0.3);
      ctx.lineTo(dir * (6 + lineLength), mouthY + offsetY);
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
    // Main cloud bubble - smaller with multiline text
    this.cloud = new Cloud(50, {
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

    // Draw text inside bubble (supports multiline with \n)
    ctx.fillStyle = "#333";
    ctx.font = "bold 10px 'Fira Code', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const lines = this.text.split('\n');
    const lineHeight = 12;
    const startY = -((lines.length - 1) * lineHeight) / 2;
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, startY + i * lineHeight);
    }

    ctx.globalAlpha = 1;
  }
}

const CONFIG = {
  particleSize: 20,  // 30% smaller
  // maxParticles calculated dynamically based on screen size
  // @ 1080p, scales proportionally
  baseParticles: 1000,
  baseArea: 1920 * 1080,  // 1080p reference
  minParticles: 500,
  maxParticles: 3000,  // Allow more on 4K screens
  gravity: 0,  // No gravity - pure gas
  container: {
    marginX: 0,
    marginY: 0,
  },
  // Wall settings
  wall: {
    width: 8,
  },
  // NO heat transfer - particles keep their random initial temperatures
  // This matches Maxwell's Demon concept: demon sorts by inherent particle speed
  // Heat zones also disabled - temps are fixed at spawn
  // Demon AI settings
  demon: {
    tempThreshold: 0.5,   // Particles hotter than this are "hot" (0.5 = balanced 50/50)
    gobbleCooldown: 0.15, // Seconds between gobbles (faster sorting!)
    batchPercent: 0.02,   // Gobble this % of total particles at once (2% = 20 per 1000)
    minBatch: 5,          // Minimum particles per gobble
    maxBatch: 50,         // Maximum particles per gobble (tripled on 2K+ screens)
    largeScreenWidth: 2560, // Width threshold for "large screen"
  },
  // Phase timings
  phases: {
    entropyDuration: 10,    // Seconds of entropy before demon arrives
    exhaustedDuration: 10,  // Seconds showing sorted chambers + thought bubble ("FREE NOW")
    departureDuration: 5,   // Seconds for departure - particles are FREE!
    colorTransitionTime: 2, // Seconds to fade from true colors to gradient at entropy start
  },
};

/**
 * Day 16 Demo
 * 
 * Main game class for Day 16, creating Maxwell's Demon visualization
 * with particle sorting, fluid simulation, and demon character animation.
 * 
 * @class Day16Demo
 * @extends {Game}
 */
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
    this.gobbleTargets = [];       // Array of particles being gobbled (batch mode!)
    this.gobbleProgress = 0;       // 0-1 for mouth sync
    this.gobbleDuration = 0.3;     // Dynamic based on distance
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
            this.gobbleTargets = [];
            this.gobbleProgress = 0;
            this.gobbleStateTimer = 0.02;  // Almost instant - demon is FAST
            if (this.demon) {
              this.demon.setMouthOpen(0);
              this.demon.puff = 1;
              this.demon.squash = 0;
            }
          },
          update: (dt) => this._idleUpdate(dt),
        },
        gobbling: {
          enter: () => {
            const demonY = this.bounds.y + this.bounds.h / 2;
            
            // Sort particles by distance (closest first) and assign stagger delay
            this.gobbleTargets.forEach((p, i) => {
              const dx = p.x - this.wallX;
              const dy = p.y - demonY;
              p._gobbleDist = Math.sqrt(dx * dx + dy * dy);
            });
            this.gobbleTargets.sort((a, b) => a._gobbleDist - b._gobbleDist);
            
            // Assign stagger start times - each particle starts 0.03s after previous
            const staggerDelay = 0.03;
            this.gobbleTargets.forEach((p, i) => {
              p._gobbleDelay = i * staggerDelay;
              p._arrived = false;
            });
            
            // Total duration = last particle's delay + time to travel
            const lastDelay = (this.gobbleTargets.length - 1) * staggerDelay;
            this.gobbleDuration = lastDelay + 0.15;  // Base travel time
            this.gobbleElapsed = 0;

            // Calculate target puff based on batch size
            this.targetPuff = 1.3 + this.gobbleTargets.length * 0.02;
            
            // Smooth anticipation squash (gets wider as mouth opens to inhale)
            if (this.demon) {
              Tweenetik.to(this.demon, { squash: 0.5 }, 0.15, Easing.easeOutQuad);
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
            this.gobbleStateTimer = 0.05;  // Brief hold
          },
          update: (dt) => this._holdingUpdate(dt),
        },
        spitting: {
          enter: () => {
            // Re-sort gobbleTargets so hot particles come first, then cold
            // (gobbling state sorts by distance which messes up our hot/cold ordering)
            this.gobbleTargets.sort((a, b) => {
              const aHot = a.custom.isHot ? 1 : 0;
              const bHot = b.custom.isHot ? 1 : 0;
              return bHot - aHot;  // Hot first (1 before 0)
            });
            
            // Recount hot/cold after re-sort
            this.hotInBatch = this.gobbleTargets.filter(p => p.custom.isHot).length;
            this.coldInBatch = this.gobbleTargets.length - this.hotInBatch;
            
            // Setup staggered spit timing
            this.spitElapsed = 0;
            this.spitIndex = 0;
            const staggerDelay = 0.03;  // Time between each spit
            const pauseBetweenGroups = 0.5;  // Clear pause when switching from hot to cold
            // Add pause time if we have both hot and cold particles
            const hasBothTypes = this.hotInBatch > 0 && this.coldInBatch > 0;
            this.spitDuration = this.gobbleTargets.length * staggerDelay + (hasBothTypes ? pauseBetweenGroups : 0) + 0.05;
            this.gobbleStateTimer = this.spitDuration;

            // Start spitting - will deflate progressively
            if (this.demon) {
              this.demon.setMouthOpen(1);
              this.demon.startSpitEffect(this.spitDirection);
              // Smooth squeeze (tall/thin) as it pushes particles out
              Tweenetik.to(this.demon, { squash: -0.8 }, 0.1, Easing.easeOutBack);
            }
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

    // FluidSystem - disable ALL built-in thermal features
    this.fluid = new FluidSystem(this, {
      maxParticles: this.particleCount,
      particleSize: CONFIG.particleSize,
      width: this.bounds.w,
      height: this.bounds.h,
      bounds: this.bounds,
      physics: "gas",
      debug: false,
      gravity: CONFIG.gravity,
      heat: { enabled: false },           // Disable built-in heat zones
      thermalEquilibrium: false,          // Disable thermal equilibrium
      heatTransfer: { enabled: false },   // Disable particle-to-particle heat
      particleColor: { r: 255, g: 255, b: 255, a: 0.9 },
    });

    // Spawn particles
    this.fluid.spawn(this.particleCount);

    // Initialize particle custom data
    this._initParticles();
    
    // Debug: count initial hot/cold distribution (using fixedTemp)
    const hotCount = this.fluid.particles.filter(p => p.custom.fixedTemp > 0.5).length;
    const coldCount = this.fluid.particles.length - hotCount;
    console.log(`[Day16] Initial fixedTemps: ${hotCount} hot, ${coldCount} cold (${(hotCount/this.fluid.particles.length*100).toFixed(1)}% hot)`);

    // Create the Demon game object (initially hidden) - RENDERED FIRST (behind particles)
    this.demon = new Demon(this, {
      x: this.wallX,
      y: this.bounds.y + this.bounds.h / 2,
      size: 24,
      visible: false,  // Start hidden until arrival animation
    });
    this.pipeline.add(this.demon);

    // Particles AFTER demon so they render on top (visible going into mouth)
    this.pipeline.add(this.fluid);

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
    
    // Click anywhere to restart from scratch (useful for recording in fullscreen)
    this.canvas.addEventListener('click', () => this._restartSimulation());
  }
  
  /**
   * Restart the simulation from scratch - resets everything to initial state.
   * Particles start from center and expand outward like a container opening.
   * Useful for recording after entering fullscreen.
   */
  _restartSimulation() {
    console.log("[Day16] Restarting simulation...");
    
    // Center of the container
    const centerX = this.bounds.x + this.bounds.w / 2;
    const centerY = this.bounds.y + this.bounds.h / 2;
    
    // Reset all particles with fresh random temperatures, starting from center
    for (const p of this.fluid.particles) {
      const temp = 0.1 + Math.random() * 0.8;
      p.custom.temperature = temp;
      p.custom.fixedTemp = temp;
      p.custom.sorted = false;
      p.size = CONFIG.particleSize;  // Full size
      
      // Start clustered near center with small random offset
      const spawnRadius = 30 + Math.random() * 50;
      const spawnAngle = Math.random() * Math.PI * 2;
      p.x = centerX + Math.cos(spawnAngle) * spawnRadius;
      p.y = centerY + Math.sin(spawnAngle) * spawnRadius;
      
      // Outward velocity - expands from center like a container opening
      const speed = 100 + Math.random() * 200;
      const velAngle = spawnAngle + (Math.random() - 0.5) * 0.5; // Mostly outward with some spread
      p.vx = Math.cos(velAngle) * speed;
      p.vy = Math.sin(velAngle) * speed;
    }
    
    // Reset demon
    if (this.demon) {
      this.demon.alpha = 0;
      this.demon.puff = 1;
      this.demon.squash = 0;
      this.demon.setMouthOpen(0);
    }
    
    // Reset thought bubble
    if (this.thoughtBubble) {
      this.thoughtBubble.alpha = 0;
    }
    
    // Reset visuals
    this.visuals = {
      leftBgAlpha: 0,
      rightBgAlpha: 0,
      wallProgress: 0,
    };
    
    // Reset gobble state
    this.gobbleTargets = [];
    this.gobbleProgress = 0;
    this.demonArrived = false;
    
    // Reset to entropy phase
    this.phaseState.setState("entropy");
    this._enterEntropy();
  }

  /**
   * Initialize particle custom data.
   * Random temperatures create initial entropy.
   * sorted = false initially, becomes true once demon spits it.
   */
  _initParticles() {
    for (const p of this.fluid.particles) {
      // Random temperature [0.1-0.9] creates initial disorder
      // Store in BOTH temperature (for color) AND fixedTemp (permanent, for classification)
      const temp = 0.1 + Math.random() * 0.8;
      p.custom.temperature = temp;
      p.custom.fixedTemp = temp;  // FluidSystem can't touch this!
      p.custom.sorted = false;
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

    // NO heat transfer during entropy - particles keep their initial random temperatures
    // This matches the Maxwell's Demon concept: demon sorts by inherent particle speed,
    // not by a changing temperature. Heat zones also disabled.
    // The demon's job is to CREATE order from disorder, not maintain it.
    
    // Debug removed - fixedTemp is now used for classification

    // Lock sorted particle temperatures (demon-processed particles stay locked)
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
    
    // Debug: count distribution using fixedTemp
    let hotOnLeft = 0, coldOnLeft = 0, hotOnRight = 0, coldOnRight = 0;
    for (const p of this.fluid.particles) {
      const isHot = (p.custom.fixedTemp ?? p.custom.temperature) > 0.5;
      const onLeft = p.x < this.wallX;
      if (onLeft && isHot) hotOnLeft++;
      else if (onLeft && !isHot) coldOnLeft++;
      else if (!onLeft && isHot) hotOnRight++;
      else coldOnRight++;
    }
    console.log(`[Day16] Sorting start (fixedTemp): LEFT: ${hotOnLeft} hot + ${coldOnLeft} cold | RIGHT: ${hotOnRight} hot + ${coldOnRight} cold`);
  }

  _updateSorting(dt) {
    // Enforce wall collision
    this._enforceWall();

    // Run gobble state machine
    this.gobbleState.update(dt);

    // Only check if sorted when demon is idle (not mid-gobble/spit)
    const isIdle = this.gobbleState.currentState === "idle" && this.gobbleTargets.length === 0;

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
      this.thoughtBubble.text = "YOU ARE\nALL FREE\nNOW";
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
    // ALL particles must have been gobbled and spit by the demon
    for (const p of this.fluid.particles) {
      if (!p.custom.sorted) {
        return false;
      }
    }
    return true;
  }

  /**
   * Randomize particle velocities and reset sorted flag to restore entropy.
   * Temperatures are KEPT - particles retain their hot/cold identity.
   */
  _randomizeParticleVelocities() {
    for (const p of this.fluid.particles) {
      const speed = 50 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.custom.sorted = false;  // Back to unsorted state
      // Keep temperatures! Particles retain their identity across cycles
      // The visual will transition from true colors back to gradient via color blend
    }
  }


  /**
   * Enforce the wall - solid wall, particles bounce off
   */
  _enforceWall() {
    const wallX = this.wallX;
    const wallHalfWidth = CONFIG.wall.width / 2;

    for (const p of this.fluid.particles) {
      // Skip particles being gobbled - they need to reach the mouth
      if (this.gobbleTargets.includes(p)) continue;

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
   * Idle state - look for wrong particles to gobble (BATCH MODE - grabs multiple!)
   */
  _idleUpdate(dt) {
    // Wait for cooldown before looking for next batch
    this.gobbleStateTimer -= dt;
    if (this.gobbleStateTimer > 0) {
      // Slowly return eyes to center
      if (this.demon) {
        this.demon.eyeAngle *= 0.95;
        this.demon.setEyeAngle(this.demon.eyeAngle);
      }
      return;
    }

    const { tempThreshold, batchPercent, minBatch, maxBatch, largeScreenWidth } = CONFIG.demon;

    // Calculate batch size based on total particles
    // Triple the max on 2K+ screens to speed up sorting
    const isLargeScreen = this.width >= largeScreenWidth;
    const effectiveMaxBatch = isLargeScreen ? maxBatch * 3 : maxBatch;
    const totalParticles = this.fluid.particles.length;
    const batchSize = Math.min(effectiveMaxBatch, Math.max(minBatch, Math.floor(totalParticles * batchPercent)));

    // Collect ALL wrong particles from each side (no distance limit!)
    const wrongOnRight = [];  // Hot particles on cold side (need to go left)
    const wrongOnLeft = [];   // Cold particles on hot side (need to go right)
    const stragglers = [];    // Unsorted particles already on correct side

    for (const p of this.fluid.particles) {
      const dx = p.x - this.wallX;
      const distToWall = Math.abs(dx);
      // Use fixedTemp for classification - FluidSystem can't change this!
      const temp = p.custom.fixedTemp ?? p.custom.temperature ?? 0.5;
      const isHot = temp > tempThreshold;
      const onRightSide = dx > 0;
      
      // Hot particles should be on LEFT, cold on RIGHT
      const isWrong = (isHot && onRightSide) || (!isHot && !onRightSide);

      if (isWrong) {
        // Wrong side - needs to be moved (even if previously sorted!)
        if (onRightSide) {
          wrongOnRight.push({ p, dist: distToWall, isHot, onRight: true });
        } else {
          wrongOnLeft.push({ p, dist: distToWall, isHot, onRight: false });
        }
      } else if (!p.custom.sorted) {
        // Correct side but not yet marked sorted - straggler
        stragglers.push({ p, dist: distToWall, isHot, onRight: onRightSide });
      }
      // If sorted AND on correct side, skip entirely
    }

    // Sort each side by distance (closest to wall first)
    wrongOnRight.sort((a, b) => a.dist - b.dist);
    wrongOnLeft.sort((a, b) => a.dist - b.dist);
    stragglers.sort((a, b) => a.dist - b.dist);

    // PICK FROM BOTH SIDES AT ONCE - demon spits hot left AND cold right simultaneously!
    // wrongOnRight = HOT particles stuck on cold side (need to go LEFT)
    // wrongOnLeft = COLD particles stuck on hot side (need to go RIGHT)
    let batch = [];
    let focusSide = 0;
    
    if (wrongOnRight.length > 0 || wrongOnLeft.length > 0) {
      // Split batch between both sides for simultaneous sorting
      const halfBatch = Math.ceil(batchSize / 2);
      
      // Take from both sides
      const fromRight = wrongOnRight.slice(0, halfBatch);  // Hot particles to send left
      const fromLeft = wrongOnLeft.slice(0, halfBatch);    // Cold particles to send right
      
      // Combine into one mixed batch
      batch = [...fromRight, ...fromLeft];
      
      // Focus on the side with more particles (for eye direction)
      focusSide = fromRight.length >= fromLeft.length ? 1 : -1;
    }
    
    // If no wrong particles, grab stragglers to finish up
    if (batch.length === 0 && stragglers.length > 0) {
      batch = stragglers.slice(0, batchSize);
      focusSide = batch[0].onRight ? 1 : -1;
    }

    if (batch.length > 0) {
      // Sort batch so all hot particles come first, then cold
      // This way demon spits all to one side, then the other (door can only open one way!)
      batch.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0));
      
      // Found targets - prepare batch for gobbling
      this.gobbleTargets = batch.map(item => {
        item.p.custom.isHot = item.isHot;
        // Store start position so particles stay put until their turn
        item.p._startX = item.p.x;
        item.p._startY = item.p.y;
        return item.p;
      });
      
      // Count hot vs cold for spit direction changes
      this.hotInBatch = batch.filter(b => b.isHot).length;
      this.coldInBatch = batch.length - this.hotInBatch;

      // Direction is based on focused side
      this.gobbleFromDirection = focusSide;

      // Start spitting hot (left) if we have any, otherwise cold (right)
      this.spitDirection = this.hotInBatch > 0 ? -1 : 1;

      // Look toward the particles
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
   * Gobbling state - suck particles toward mouth with STAGGERED timing!
   */
  _gobblingUpdate(dt) {
    this.gobbleStateTimer -= dt;
    this.gobbleElapsed += dt;
    const progress = Math.min(1, Math.max(0, 1 - (this.gobbleStateTimer / this.gobbleDuration)));

    // Store progress for mouth animation sync
    this.gobbleProgress = progress;

    // Update demon - mouth opens, body puffs up as particles arrive (Kirby style!)
    if (this.demon) {
      const arrivedCount = this.gobbleTargets.filter(p => p._arrived).length;
      const totalCount = this.gobbleTargets.length;
      const arrivalProgress = totalCount > 0 ? arrivedCount / totalCount : 0;
      
      // Mouth opens as particles arrive
      const mouthOpen = Math.min(1, arrivedCount * 0.15 + progress * 0.3);
      this.demon.setMouthOpen(mouthOpen);
      
      // Puff grows progressively as each particle arrives
      const basePuff = 1.0;
      const maxPuff = this.targetPuff || 1.5;
      const targetPuff = basePuff + (maxPuff - basePuff) * arrivalProgress;
      
      // Smoothly lerp puff (not instant)
      this.demon.puff += (targetPuff - this.demon.puff) * 0.15;
      
      // Squash effect - smoothly lerp to target (gets rounder/wider as filling up)
      const targetSquash = 0.4 + arrivalProgress * 0.6;
      this.demon.squash += (targetSquash - this.demon.squash) * 0.12;
    }

    const demonY = this.bounds.y + this.bounds.h / 2;
    const mouthX = this.wallX;
    const mouthY = demonY + 14;

    // Apply suction force to particles whose delay has passed
    for (const p of this.gobbleTargets) {
      // Skip already arrived particles - keep them at mouth, scaled to 0
      if (p._arrived) {
        p.x = mouthX;
        p.y = mouthY;
        p.vx = 0;
        p.vy = 0;
        p.size = 0;  // Scaled to nothing once swallowed
        continue;
      }

      // If this particle's turn hasn't come yet, keep it at its stored start position
      if (this.gobbleElapsed < p._gobbleDelay) {
        // Keep particle at its original position (stored when batch was created)
        if (p._startX !== undefined) {
          p.x = p._startX;
          p.y = p._startY;
          p.vx = 0;
          p.vy = 0;
        }
        continue;
      }

      const dx = mouthX - p.x;
      const dy = mouthY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        // Calculate individual progress for this particle
        const particleTime = this.gobbleElapsed - p._gobbleDelay;
        const particleProgress = Math.min(1, particleTime / 0.12);
        // Fast accelerating suction
        const suctionStrength = 2500 + particleProgress * 4000;
        p.vx = (dx / dist) * suctionStrength;
        p.vy = (dy / dist) * suctionStrength;
        
        // Only shrink when close to mouth (within 80px), not from start
        const shrinkRadius = 80;
        if (dist < shrinkRadius) {
          const shrinkProgress = 1 - (dist / shrinkRadius); // 0 at edge, 1 at center
          p.size = CONFIG.particleSize * (1 - shrinkProgress * 0.9);
        } else {
          p.size = CONFIG.particleSize; // Full size while far away
        }
      } else {
        // Particle reached mouth - snap and mark arrived
        p.x = mouthX;
        p.y = mouthY;
        p.vx = 0;
        p.vy = 0;
        p.size = 0;  // Scaled to nothing
        p._arrived = true;
      }
    }

    // Check if ALL particles have arrived
    const allArrived = this.gobbleTargets.every(p => p._arrived);

    // Transition ONLY when all particles arrived (no timer failsafe - wait for all!)
    if (allArrived) {
      this.gobbleProgress = 1;
      this.gobbleState.setState("holding");
    }
  }

  /**
   * Holding state - mouth closed, particles hidden inside, eyes move to other side
   */
  _holdingUpdate(dt) {
    this.gobbleStateTimer -= dt;
    const duration = 0.05;
    const progress = 1 - (this.gobbleStateTimer / duration);

    // Hide ALL particles while "swallowed" (invisible, at mouth)
    const demonY = this.bounds.y + this.bounds.h / 2;
    const mouthX = this.wallX;
    const mouthY = demonY + 14;
    for (const p of this.gobbleTargets) {
      p.x = mouthX;
      p.y = mouthY;
      p.vx = 0;
      p.vy = 0;
      p.size = 0;  // Scaled to nothing while inside
    }
    
    // Maintain full puff, settle squash to rounder shape with smooth wobble
    if (this.demon) {
      // Smooth wobble/settle as it holds the particles - like a water balloon
      const targetSquash = 0.6 + Math.sin(progress * Math.PI * 3) * 0.1;
      this.demon.squash += (targetSquash - this.demon.squash) * 0.2;
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
   * Spitting state - spit particles one at a time with stagger!
   */
  _spittingUpdate(dt) {
    this.gobbleStateTimer -= dt;
    this.spitElapsed += dt;

    const staggerDelay = 0.03;
    const demonY = this.bounds.y + this.bounds.h / 2;
    const mouthX = this.wallX;
    const mouthY = demonY + 14;

    // Keep un-spit particles at mouth, scaled to 0 until their turn
    for (let i = this.spitIndex; i < this.gobbleTargets.length; i++) {
      const p = this.gobbleTargets[i];
      p.x = mouthX;
      p.y = mouthY;
      p.vx = 0;
      p.vy = 0;
      p.size = 0;  // Scaled to nothing until spit
    }

    // Calculate timing with pause between hot and cold groups
    // Hot particles are first in the sorted array, then cold
    const pauseBetweenGroups = 0.5;  // Clear pause when switching sides (door closes/opens other way)
    const hotCount = this.hotInBatch || 0;
    
    // Spit particles one at a time based on elapsed time
    while (this.spitIndex < this.gobbleTargets.length) {
      // Add pause after all hot particles before starting cold
      let targetTime = this.spitIndex * staggerDelay;
      if (this.spitIndex >= hotCount && hotCount > 0) {
        // Add pause after hot group
        targetTime += pauseBetweenGroups;
      }
      
      if (this.spitElapsed < targetTime) break;

      // Spit this particle!
      const p = this.gobbleTargets[this.spitIndex];
      
      // Position at mouth (already there from above, but be explicit)
      p.x = mouthX;
      p.y = mouthY;

      // Pop to full size when spit
      p.size = CONFIG.particleSize;

      // Each particle goes to its correct side - door opens one way at a time!
      const spitDir = p.custom.isHot ? -1 : 1;
      const spitForce = 4000 + Math.random() * 1000;
      const spitAngle = (Math.random() - 0.5) * 0.2;

      p.vx = spitDir * spitForce;
      p.vy = spitAngle * spitForce * 0.3;  // Less vertical spread

      // Mark as sorted and lock temperature
      p.custom.sorted = true;
      p.custom.lockedTemp = p.custom.isHot ? 0.9 : 0.02;
      p.custom.temperature = p.custom.lockedTemp;

      // Trigger spit effect and look toward spit direction
      if (this.demon) {
        this.demon.startSpitEffect(spitDir);
        this.demon.setEyeAngle(spitDir * 0.5);
        
        // Update spit direction for visual effects
        this.spitDirection = spitDir;
      }

      this.spitIndex++;
    }

    // Update mouth and body - deflates as particles leave
    if (this.demon) {
      const totalCount = this.gobbleTargets.length;
      const spitCount = this.spitIndex;
      const remaining = totalCount - spitCount;
      const spitProgress = totalCount > 0 ? spitCount / totalCount : 1;
      
      // Mouth closes as particles leave
      const mouthOpen = Math.min(1, remaining * 0.15);
      this.demon.setMouthOpen(mouthOpen);
      
      // Puff deflates progressively back to normal (smooth lerp)
      const maxPuff = this.targetPuff || 1.5;
      const targetPuff = maxPuff - (maxPuff - 1) * spitProgress;
      this.demon.puff += (targetPuff - this.demon.puff) * 0.15;
      
      // Squash smoothly goes back to normal with bouncy overshoot
      const targetSquash = -0.6 * (1 - spitProgress) + Math.sin(spitProgress * Math.PI) * 0.25;
      this.demon.squash += (targetSquash - this.demon.squash) * 0.12;
    }

    if (this.gobbleStateTimer <= 0) {
      // Smooth return to normal state
      if (this.demon) {
        Tweenetik.to(this.demon, { puff: 1, squash: 0 }, 0.2, Easing.easeOutBack);
      }
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
    const hotSpeed = 450;   // Target speed for hot particles (faster = hotter)
    const coldSpeed = 80;   // Target speed for cold particles
    const minSpeed = 600;   // Don't slow down if above this (let spit momentum carry)

    for (const p of this.fluid.particles) {
      if (this.gobbleTargets.includes(p)) continue;
      if (!p.custom.sorted) continue;  // Only enforce on sorted particles

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed < 1) continue;
      
      // Don't slow down fast-moving particles (fresh spit)
      if (speed > minSpeed) continue;

      const targetSpeed = p.custom.isHot ? hotSpeed : coldSpeed;
      const scale = targetSpeed / speed;

      // Very gradually nudge toward target speed
      p.vx += (p.vx * scale - p.vx) * 0.01;
      p.vy += (p.vy * scale - p.vy) * 0.01;
    }
  }

  /**
   * Color particles by stored temperature.
   * Uses temperature [0-1] directly for gradient coloring.
   * Blue (cold, 0) → Purple (neutral, 0.5) → Red (hot, 1)
   */
  _colorByTemperature() {
    const phase = this.phaseState.currentState;
    
    // During early entropy, blend from true colors to gradient
    let blendToGradient = 1; // 1 = full gradient, 0 = full true colors
    if (phase === "entropy" && this.phaseTimer < CONFIG.phases.colorTransitionTime) {
      blendToGradient = this.phaseTimer / CONFIG.phases.colorTransitionTime;
    }
    
    // In exhausted/departure, ALL particles use true colors
    const allTrueColors = phase === "exhausted" || phase === "departure";
    
    for (const p of this.fluid.particles) {
      // Use fixedTemp for classification
      const t = p.custom.fixedTemp ?? p.custom.temperature;
      const isHot = t > 0.5;

      // Calculate gradient colors
      const gradR = Math.floor(255 * t);
      const gradG = Math.floor(80 * (1 - Math.abs(t - 0.5) * 2));
      const gradB = Math.floor(255 * (1 - t));
      
      // Calculate true colors
      const trueR = isHot ? 255 : 0;
      const trueG = 0;
      const trueB = isHot ? 0 : 255;

      if (allTrueColors || p.custom.sorted) {
        // True colors: after being spit, or in exhausted/departure
        p.color.r = trueR;
        p.color.g = trueG;
        p.color.b = trueB;
      } else if (phase === "entropy" && blendToGradient < 1) {
        // Blend from true to gradient during early entropy
        p.color.r = Math.floor(trueR + (gradR - trueR) * blendToGradient);
        p.color.g = Math.floor(trueG + (gradG - trueG) * blendToGradient);
        p.color.b = Math.floor(trueB + (gradB - trueB) * blendToGradient);
      } else {
        // Gradient colors: during sorting (until spit) and entropy
        p.color.r = gradR;
        p.color.g = gradG;
        p.color.b = gradB;
      }
    }
  }

  render() {
    const ctx = this.ctx;

    // Motion blur trail - subtle particle trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw chambers and wall (using tweened values - fade in AND out)
    const { leftBgAlpha, rightBgAlpha, wallProgress } = this.visuals;

    // Draw chambers background (slightly transparent to blend with trails)
    if (leftBgAlpha > 0) {
      ctx.fillStyle = `rgba(60, 20, 20, ${leftBgAlpha * 0.3})`;
      ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.w / 2, this.bounds.h);
    }
    if (rightBgAlpha > 0) {
      ctx.fillStyle = `rgba(10, 15, 80, ${rightBgAlpha * 0.3})`;
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
    
    // Draw spit effect OVER particles (so it's visible)
    if (this.demon) {
      this.demon.drawSpitEffect();
    }
  }
}

/**
 * Create Day 16 visualization
 * 
 * Factory function that creates and starts the Maxwell's Demon demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {Day16Demo} returns.game - The game instance
 */
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
