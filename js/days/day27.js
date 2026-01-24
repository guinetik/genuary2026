/**
 * Genuary 2026 - Day 27
 * Prompt: "Lifeform"
 *
 * GASEOUS SENTIENCE
 * A massive spherical ball of swirling energy from No Man's Sky.
 * Glowing core with ribbon-like tendrils orbiting around it.
 */

import { Game, Painter } from '@guinetik/gcanvas';

const TAU = Math.PI * 2;

const CONFIG = {
  // Core
  coreRadius: 40,
  coreGlow: 120,

  // Ribbons - start simple, grow complex when fed
  ribbonStartCount: 2,
  ribbonMaxCount: 12,
  ribbonSegments: 80,
  ribbonWidth: 6,
  ribbonOrbitRadius: 100,
  ribbonSpeedMultiplier: 5,  // Faster intestine movement

  // Food system - clicker style, many clicks to grow
  foodParticlesPerClick: 10,
  foodDriftSpeed: 60,
  foodAbsorbRadius: 50,  // Distance from center to absorb
  complexityPerParticle: 0.002,  // Very slow growth

  // Gas cloud
  gasCloudParticles: 120,
  gasCloudRadius: 220,
  gasCloudSpeed: 0.5,

  // Shield/Containment bubble - grows with complexity
  shieldRadiusMin: 120,
  shieldRadiusMax: 180,
  shieldFresnelPower: 3,   // How sharp the edge glow is
  membraneDeformRadius: 120,   // How far the deformation reaches
  membraneDeformStrength: 45,  // How much it bulges

  // Particles
  particleCount: 150,
  particleRadius: 180,

  // Starfield
  starCount: 300,

  // Animation
  timeScale: 0.4,

  // Mouse interaction
  ribbonPokeRadius: 100,     // How close mouse needs to be to affect ribbons
  ribbonPokeStrength: 800,   // How much ribbons react to poke (force)
  ribbonReturnSpeed: 2,      // How fast ribbons return to normal
  ribbonDamping: 0.95,       // Velocity damping (higher = more floaty)

  // Starvation and death
  complexityDecayRate: 0.003,  // Loses complexity over time
  vitalityDecayRate: 0.05,    // How fast it dies when starving
  vitalityRecoveryRate: 0.3,  // How fast it revives when fed

  // Nebula background
  nebulaCount: 5,
  nebulaMinSize: 150,
  nebulaMaxSize: 300,
  nebulaAlpha: 0.08,  // Very subtle

  // Colors - will be randomized on init
  baseHue: 200,  // Default cyan-ish
  colorTransitionSpeed: 0.15,  // How fast creature shifts toward food color (0-1)
};

/**
 * Interpolate hue value (handles circular nature of hue 0-360)
 * Returns the shortest path around the color wheel
 */
function lerpHue(current, target, t) {
  // Normalize to 0-360
  current = ((current % 360) + 360) % 360;
  target = ((target % 360) + 360) % 360;
  
  // Find shortest path around circle
  let diff = target - current;
  if (Math.abs(diff) > 180) {
    diff = diff > 0 ? diff - 360 : diff + 360;
  }
  
  // Interpolate
  const result = current + diff * t;
  return ((result % 360) + 360) % 360;
}

/**
 * 3D vector utilities
 */
function rotateY(x, y, z, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos + z * sin,
    y: y,
    z: -x * sin + z * cos
  };
}

function rotateX(x, y, z, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x,
    y: y * cos - z * sin,
    z: y * sin + z * cos
  };
}

function rotateZ(x, y, z, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
    z: z
  };
}

/**
 * Gaseous Sentience Demo
 */
class GaseousSentienceDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    this.time = 0;
    this.rotationY = 0;
    this.rotationX = 0.3;

    // Random color palette each time
    this.hue = Math.random() * 360;

    // Generate ribbon paths - start simple
    this.ribbons = [];
    this.complexity = 0; // Increases as creature feeds
    this.vitality = 1;   // 1 = alive, 0 = stasis/dead
    for (let i = 0; i < CONFIG.ribbonStartCount; i++) {
      const ribbon = this.createRibbon(false); // Simple ribbons
      ribbon.growth = 1; // Start fully grown
      this.ribbons.push(ribbon);
    }

    // Food particles that drift toward creature
    this.foodParticles = [];
    this.currentFoodHue = Math.random() * 360;
    this.lastFeedTime = 0;

    // Gas cloud particles - radiating outward
    this.gasCloud = [];
    for (let i = 0; i < CONFIG.gasCloudParticles; i++) {
      this.gasCloud.push(this.createGasParticle());
    }

    // Particles floating around - attracted by creature's gravity
    this.particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = CONFIG.particleRadius * (0.5 + Math.random() * 0.5);

      this.particles.push({
        // Current position
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        // Orbit velocity (tangential)
        vx: 0,
        vy: 0,
        vz: 0,
        // Target orbit radius
        orbitRadius: r,
        size: 1 + Math.random() * 2,
        twinkleSpeed: 1 + Math.random() * 2,
        twinklePhase: Math.random() * TAU,
        // Orbit speed and direction
        orbitSpeed: (0.2 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1),
        orbitAxis: { // Random axis to orbit around
          x: (Math.random() - 0.5),
          y: (Math.random() - 0.5),
          z: (Math.random() - 0.5),
        },
      });
    }

    // Nebula clouds - subtle colored regions to feed from
    this.nebulae = [];
    for (let i = 0; i < CONFIG.nebulaCount; i++) {
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      const distance = 400 + Math.random() * 200; // Far background

      this.nebulae.push({
        // 3D position on sphere
        x: distance * Math.sin(phi) * Math.cos(theta),
        y: distance * Math.sin(phi) * Math.sin(theta),
        z: distance * Math.cos(phi),
        size: CONFIG.nebulaMinSize + Math.random() * (CONFIG.nebulaMaxSize - CONFIG.nebulaMinSize),
        hue: Math.random() * 360,
        drift: (Math.random() - 0.5) * 0.1, // Slow drift
        pulse: Math.random() * TAU,
        pulseSpeed: 0.2 + Math.random() * 0.3,
      });
    }

    // Background stars - on a large sphere so they rotate with camera
    this.stars = [];
    const starDistance = 800; // Far away sphere
    for (let i = 0; i < CONFIG.starCount; i++) {
      // Distribute on sphere
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);

      this.stars.push({
        x: starDistance * Math.sin(phi) * Math.cos(theta),
        y: starDistance * Math.sin(phi) * Math.sin(theta),
        z: starDistance * Math.cos(phi),
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * TAU,
      });
    }

    // Mouse tracking for membrane effect
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.mouseActive = false; // Only true when mouse is on canvas

    // Membrane deformation physics (for bounce-back)
    this.membraneDeform = {
      x: this.width / 2,  // Deformation center
      y: this.height / 2,
      intensity: 0,
      vx: 0,
      vy: 0,
      vIntensity: 0,
    };

    // Core pulse effect when eating
    this.corePulse = 0;
    this.lastFoodHue = this.hue;
    this.targetHue = this.hue; // Target hue to gradually shift toward

    // Mouse drag for rotation with inertia
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.velocityX = 0;
    this.velocityY = 0.1; // Auto-rotate

    // Touch drag tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.hasMoved = false; // Track if touch moved (to distinguish tap from drag)

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mouseenter', () => {
      this.mouseActive = true;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.mouseActive = true;

      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        // Store as velocity for inertia
        this.velocityY = dx * 0.005;
        this.velocityX = dy * 0.005;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      // Keep velocity for inertia - it will decay in update()
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.velocityY = 0.1;
      this.mouseX = this.width / 2;
      this.mouseY = this.height / 2;
      this.mouseActive = false;
    });

    // Click to feed - spawn food from nebulae or empty space
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleFeedClick(x, y);
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
      this.hasMoved = false;
      
      // Update mouse position for membrane effect
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      this.mouseActive = true;
      
      // Start drag tracking
      this.isDragging = true;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      // Update mouse position for membrane effect
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      this.mouseActive = true;
      
      // Check if touch moved significantly (more than 10px)
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const moveDist = Math.sqrt(dx * dx + dy * dy);
      if (moveDist > 10) {
        this.hasMoved = true;
      }
      
      // Handle rotation drag
      if (this.isDragging) {
        const dragDx = touch.clientX - this.lastMouseX;
        const dragDy = touch.clientY - this.lastMouseY;
        // Store as velocity for inertia
        this.velocityY = dragDx * 0.005;
        this.velocityX = dragDy * 0.005;
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      // If touch didn't move much and was quick, treat as tap (feed)
      const touchDuration = performance.now() - this.touchStartTime;
      if (!this.hasMoved && touchDuration < 300) {
        // Tap to feed
        const rect = this.canvas.getBoundingClientRect();
        // Use last known touch position
        const x = this.mouseX;
        const y = this.mouseY;
        this.handleFeedClick(x, y);
      }
      
      // Reset drag state
      this.isDragging = false;
      this.mouseX = this.width / 2;
      this.mouseY = this.height / 2;
      this.mouseActive = false;
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => {
      // Reset drag state
      this.isDragging = false;
      this.mouseX = this.width / 2;
      this.mouseY = this.height / 2;
      this.mouseActive = false;
    });
  }

  update(dt) {
    super.update(dt);
    this.time += dt * CONFIG.timeScale;

    // Gradually shift creature color toward food color
    if (Math.abs(this.hue - this.targetHue) > 0.1) {
      this.hue = lerpHue(this.hue, this.targetHue, CONFIG.colorTransitionSpeed * dt);
    } else {
      this.hue = this.targetHue; // Snap to target when close
    }

    // Apply rotation from velocity (works both when dragging and for inertia)
    this.rotationX += this.velocityX;
    this.rotationY += this.velocityY;

    // Apply friction when not dragging (inertia decay)
    if (!this.isDragging) {
      this.velocityX *= 0.95;
      this.velocityY *= 0.95;

      // Add tiny auto-rotate when nearly stopped
      if (Math.abs(this.velocityY) < 0.001 && Math.abs(this.velocityX) < 0.001) {
        this.velocityY = 0.002;
      }
    }

    // Update food particles
    this.updateFood(dt);

    // Slowly starve - lose complexity over time
    if (this.complexity > 0) {
      this.complexity -= CONFIG.complexityDecayRate * dt;
      this.complexity = Math.max(0, this.complexity);

      // Mark ribbons for retraction if complexity drops
      const targetRibbons = CONFIG.ribbonStartCount + Math.floor(this.complexity);
      let activeRibbons = this.ribbons.filter(r => r.targetGrowth === 1).length;
      while (activeRibbons > targetRibbons && activeRibbons > CONFIG.ribbonStartCount) {
        // Find a fully grown ribbon to retract
        for (let i = this.ribbons.length - 1; i >= 0; i--) {
          if (this.ribbons[i].targetGrowth === 1) {
            this.ribbons[i].targetGrowth = 0; // Mark for retraction
            activeRibbons--;
            break;
          }
        }
      }
    }

    // Vitality system - die when starving too long
    if (this.complexity === 0 && this.ribbons.filter(r => r.targetGrowth === 1).length <= CONFIG.ribbonStartCount) {
      // Starving - lose vitality
      this.vitality -= CONFIG.vitalityDecayRate * dt;
      this.vitality = Math.max(0, this.vitality);

      // When vitality drops, retract ribbons
      if (this.vitality < 0.5) {
        const activeCount = this.ribbons.filter(r => r.targetGrowth === 1).length;
        if (activeCount > 1) {
          // Retract one ribbon
          for (let i = this.ribbons.length - 1; i >= 0; i--) {
            if (this.ribbons[i].targetGrowth === 1) {
              this.ribbons[i].targetGrowth = 0;
              break;
            }
          }
        }
      }
      if (this.vitality < 0.2) {
        // Retract all remaining ribbons
        for (const ribbon of this.ribbons) {
          ribbon.targetGrowth = 0;
        }
      }
    }

    // Update ribbon growth animations
    this.updateRibbonGrowth(dt);

    // Update membrane deformation physics
    this.updateMembranePhysics(dt);

    // Update orbiting particles based on vitality/mass
    this.updateParticles(dt);

    // Decay core pulse
    this.corePulse *= 0.92;
  }

  updateRibbonGrowth(dt) {
    for (let i = this.ribbons.length - 1; i >= 0; i--) {
      const ribbon = this.ribbons[i];

      // Animate growth toward target
      if (ribbon.growth < ribbon.targetGrowth) {
        // Growing out from core
        ribbon.growth += ribbon.growthSpeed * dt;
        ribbon.growth = Math.min(ribbon.growth, ribbon.targetGrowth);
      } else if (ribbon.growth > ribbon.targetGrowth) {
        // Retracting back into core
        ribbon.growth -= ribbon.growthSpeed * 0.7 * dt; // Retract slightly slower
        ribbon.growth = Math.max(ribbon.growth, ribbon.targetGrowth);

        // Remove ribbon when fully retracted
        if (ribbon.growth <= 0.01) {
          this.ribbons.splice(i, 1);
        }
      }
    }
  }

  updateParticles(dt) {
    const gravityStrength = 80 * this.vitality; // Gravity based on vitality
    const fallSpeed = 30 * (1 - this.vitality); // Fall away when dying

    for (const p of this.particles) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (dist < 1) continue;

      // Direction to center
      const nx = p.x / dist;
      const ny = p.y / dist;
      const nz = p.z / dist;

      if (this.vitality > 0.2) {
        // Alive: attract toward orbit radius and add orbital motion
        const targetDist = p.orbitRadius * (0.8 + this.vitality * 0.4);
        const pullStrength = (dist - targetDist) * 2 * dt;

        p.vx -= nx * pullStrength * gravityStrength * dt;
        p.vy -= ny * pullStrength * gravityStrength * dt;
        p.vz -= nz * pullStrength * gravityStrength * dt;

        // Add tangential orbital velocity
        const tangentX = p.orbitAxis.y * nz - p.orbitAxis.z * ny;
        const tangentY = p.orbitAxis.z * nx - p.orbitAxis.x * nz;
        const tangentZ = p.orbitAxis.x * ny - p.orbitAxis.y * nx;
        const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ) || 1;

        p.vx += (tangentX / tangentLen) * p.orbitSpeed * this.vitality * dt * 50;
        p.vy += (tangentY / tangentLen) * p.orbitSpeed * this.vitality * dt * 50;
        p.vz += (tangentZ / tangentLen) * p.orbitSpeed * this.vitality * dt * 50;
      } else {
        // Dying: particles fall away (drift outward)
        p.vx += nx * fallSpeed * dt;
        p.vy += ny * fallSpeed * dt + 10 * dt; // Slight downward drift
        p.vz += nz * fallSpeed * dt;
      }

      // Apply velocity with damping
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vz *= 0.98;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Clamp max distance so they don't fly off forever
      const newDist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      const maxDist = CONFIG.particleRadius * 2.5;
      if (newDist > maxDist) {
        const scale = maxDist / newDist;
        p.x *= scale;
        p.y *= scale;
        p.z *= scale;
        // Bounce velocity inward slightly
        p.vx *= -0.3;
        p.vy *= -0.3;
        p.vz *= -0.3;
      }
    }
  }

  updateMembranePhysics(dt) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const m = this.membraneDeform;
    const radius = this.getShieldRadius();

    // Check if mouse is near the membrane edge
    const dx = this.mouseX - cx;
    const dy = this.mouseY - cy;
    const mouseDist = Math.sqrt(dx * dx + dy * dy);
    const nearMembrane = this.mouseActive &&
                         mouseDist > radius * 0.5 &&
                         mouseDist < radius * 1.5;

    if (nearMembrane) {
      // Directly follow mouse - no bouncing while hovering
      m.x = this.mouseX;
      m.y = this.mouseY;
      m.intensity = 1;
      // Reset velocities so bounce starts fresh when leaving
      m.vx = 0;
      m.vy = 0;
      m.vIntensity = 0;
    } else {
      // Spring back to center with bounce
      m.vx += (cx - m.x) * 5 * dt;
      m.vy += (cy - m.y) * 5 * dt;
      m.vIntensity += (0 - m.intensity) * 4 * dt;

      // Apply damping (lower = more bouncy)
      m.vx *= 0.92;
      m.vy *= 0.92;
      m.vIntensity *= 0.85;

      // Update position
      m.x += m.vx;
      m.y += m.vy;
      m.intensity += m.vIntensity;
    }

    // Clamp intensity
    m.intensity = Math.max(-0.5, Math.min(1.5, m.intensity));
  }

  updateFood(dt) {
    const cx = this.width / 2;
    const cy = this.height / 2;

    for (let i = this.foodParticles.length - 1; i >= 0; i--) {
      const p = this.foodParticles[i];

      // Calculate direction to center
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Accelerate toward center
      if (dist > 1) {
        const ax = (dx / dist) * CONFIG.foodDriftSpeed;
        const ay = (dy / dist) * CONFIG.foodDriftSpeed;
        p.vx += ax * dt;
        p.vy += ay * dt;
      }

      // Apply velocity with damping
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Shrink as it approaches
      if (dist < this.getShieldRadius()) {
        p.size *= 0.97;
        p.alpha *= 0.98;
      }

      // Absorb when reaching core
      if (dist < CONFIG.foodAbsorbRadius || p.size < 1 || p.alpha < 0.05) {
        // Trigger core pulse with food's color
        this.corePulse = Math.min(this.corePulse + 0.3, 1);
        this.lastFoodHue = p.hue;
        // Update target hue for gradual color shift
        this.targetHue = p.hue;
        this.foodParticles.splice(i, 1);
        this.onFoodAbsorbed();
      }
    }
  }

  onFoodAbsorbed() {
    // Restore vitality when fed
    this.vitality += CONFIG.vitalityRecoveryRate;
    this.vitality = Math.min(1, this.vitality);

    // Revive ribbons if was in stasis
    if (this.ribbons.length < CONFIG.ribbonStartCount) {
      this.ribbons.push(this.createRibbon(false));
    }

    this.complexity += CONFIG.complexityPerParticle;

    // Add new ribbon when enough food absorbed
    if (this.ribbons.length < CONFIG.ribbonMaxCount) {
      const targetRibbons = CONFIG.ribbonStartCount + Math.floor(this.complexity);
      if (this.ribbons.length < targetRibbons) {
        this.ribbons.push(this.createRibbon(true)); // Add complex ribbon
      }
    }

    // Make existing ribbons very slightly more chaotic
    for (const ribbon of this.ribbons) {
      ribbon.speed = Math.min(ribbon.speed * 1.001, 1.2);
    }
  }

  /**
   * Create a ribbon with complexity based on parameter
   */
  createRibbon(complex = false) {
    const deformState = [];
    for (let j = 0; j <= CONFIG.ribbonSegments; j++) {
      deformState.push({
        offsetX: 0,
        offsetY: 0,
        velocityX: 0,
        velocityY: 0,
      });
    }

    if (complex) {
      // Complex ribbon - more chaotic
      return {
        tiltX: (Math.random() - 0.5) * 3,
        tiltZ: (Math.random() - 0.5) * 3,
        phase: Math.random() * TAU,
        speed: 0.3 + Math.random() * 0.7,
        radius: CONFIG.ribbonOrbitRadius * (0.5 + Math.random() * 0.7),
        freqA: 1 + Math.floor(Math.random() * 4),
        freqB: 1 + Math.floor(Math.random() * 5),
        freqC: 1 + Math.floor(Math.random() * 4),
        deformState,
        // Growth animation - starts from core, extends outward
        growth: 0,        // 0 = inside core, 1 = fully extended
        targetGrowth: 1,  // What we're animating toward
        growthSpeed: 0.8 + Math.random() * 0.4,
      };
    } else {
      // Simple ribbon - gentle orbits
      return {
        tiltX: (Math.random() - 0.5) * 1.5,
        tiltZ: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * TAU,
        speed: 0.2 + Math.random() * 0.3,
        radius: CONFIG.ribbonOrbitRadius * (0.8 + Math.random() * 0.4),
        freqA: 1,
        freqB: 2,
        freqC: 1,
        deformState,
        // Growth animation
        growth: 0,
        targetGrowth: 1,
        growthSpeed: 0.6 + Math.random() * 0.3,
      };
    }
  }

  /**
   * Handle feed click/tap - spawn food from nebulae or empty space
   */
  handleFeedClick(x, y) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

    // Only spawn food if clicking outside the shield
    if (dist > this.getShieldRadius()) {
      // Check if clicking on a nebula
      let clickedNebula = null;
      for (const nebula of this.nebulae) {
        if (nebula.screenX === undefined) continue;
        const dx = x - nebula.screenX;
        const dy = y - nebula.screenY;
        const distToNebula = Math.sqrt(dx * dx + dy * dy);
        if (distToNebula < nebula.screenSize * 0.8) {
          clickedNebula = nebula;
          break;
        }
      }

      this.spawnFood(x, y, clickedNebula);
    }
  }

  /**
   * Spawn food cloud at position - uses nebula color if clicked on one
   */
  spawnFood(x, y, nebula = null) {
    const now = performance.now();

    // Use nebula's color or generate new color if stopped clicking
    if (nebula) {
      this.currentFoodHue = nebula.hue;
    } else if (now - this.lastFeedTime > 500) {
      this.currentFoodHue = Math.random() * 360;
    }
    this.lastFeedTime = now;

    for (let i = 0; i < CONFIG.foodParticlesPerClick; i++) {
      // Spawn in a small cloud around click position
      const angle = Math.random() * TAU;
      const dist = Math.random() * 20;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;

      this.foodParticles.push({
        x: px,
        y: py,
        size: 3 + Math.random() * 5,
        alpha: 0.5 + Math.random() * 0.4,
        hue: this.currentFoodHue + (Math.random() - 0.5) * 15,
        vx: 0,
        vy: 0,
      });
    }
  }

  /**
   * Get current shield radius based on complexity
   */
  getShieldRadius() {
    const maxComplexity = CONFIG.ribbonMaxCount - CONFIG.ribbonStartCount;
    const t = Math.min(this.complexity / maxComplexity, 1);
    return CONFIG.shieldRadiusMin + t * (CONFIG.shieldRadiusMax - CONFIG.shieldRadiusMin);
  }

  /**
   * Reset all ribbon deformation states
   */
  resetRibbonDeform() {
    for (const ribbon of this.ribbons) {
      for (const state of ribbon.deformState) {
        state.velocityX = 0;
        state.velocityY = 0;
        state.offsetX = 0;
        state.offsetY = 0;
      }
    }
  }

  /**
   * Create a gas particle that radiates outward
   */
  createGasParticle(staggered = true) {
    const theta = Math.random() * TAU;
    const phi = Math.acos(2 * Math.random() - 1);
    // Start near the shield, radiate outward
    const startRadius = this.getShieldRadius() * (0.9 + Math.random() * 0.3);

    return {
      theta,
      phi,
      radius: startRadius,
      // Stagger initial radius so they don't all spawn at once
      life: staggered ? Math.random() : 0,
      maxLife: 1,
      size: 25 + Math.random() * 40,
      baseAlpha: 0.05 + Math.random() * 0.06,
      speed: 25 + Math.random() * 35, // Outward speed
      drift: (Math.random() - 0.5) * 0.3, // Angular drift
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Dark space background
    ctx.fillStyle = '#010208';
    ctx.fillRect(0, 0, w, h);

    // Draw nebulae (very far background)
    this.renderNebulae(ctx, w, h);

    // Draw starfield
    this.renderStars(ctx, w, h);

    // Food particles drifting toward creature
    this.renderFood(ctx);

    // Gas cloud (behind everything)
    this.renderGasCloud(ctx, cx, cy);

    // Outer glow halo
    const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, CONFIG.coreGlow * 2);
    haloGrad.addColorStop(0, `hsla(${this.hue}, 70%, 70%, 0.15)`);
    haloGrad.addColorStop(0.5, `hsla(${this.hue}, 60%, 50%, 0.05)`);
    haloGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw shield (back half - behind creature)
    this.renderShield(ctx, cx, cy, false);

    // Draw particles (behind ribbons)
    this.renderParticles(ctx, cx, cy);

    // Draw ribbons
    this.renderRibbons(ctx, cx, cy);

    // Draw glowing core
    this.renderCore(ctx, cx, cy);

    // Draw shield (front half - in front of creature)
    this.renderShield(ctx, cx, cy, true);
  }

  renderNebulae(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const time = this.time;

    for (const nebula of this.nebulae) {
      // Apply camera rotation
      const rotated = rotateX(nebula.x, nebula.y, nebula.z, this.rotationX);
      const final = rotateY(rotated.x, rotated.y, rotated.z, this.rotationY);

      // Only draw if in front
      if (final.z < 100) continue;

      // Project to screen
      const scale = 600 / final.z;
      const screenX = cx + final.x * scale;
      const screenY = cy + final.y * scale;
      const screenSize = nebula.size * scale;

      // Skip if off screen
      if (screenX < -screenSize || screenX > w + screenSize ||
          screenY < -screenSize || screenY > h + screenSize) continue;

      // Pulse animation
      const pulse = 0.8 + 0.2 * Math.sin(time * nebula.pulseSpeed + nebula.pulse);
      const alpha = CONFIG.nebulaAlpha * pulse;

      // Draw nebula as layered gradients for cloud-like effect
      const layers = 3;
      for (let l = 0; l < layers; l++) {
        const layerSize = screenSize * (0.6 + l * 0.3);
        const layerAlpha = alpha * (1 - l * 0.3);
        const offsetX = Math.sin(time * 0.1 + l + nebula.pulse) * screenSize * 0.1;
        const offsetY = Math.cos(time * 0.08 + l + nebula.pulse) * screenSize * 0.1;

        const grad = ctx.createRadialGradient(
          screenX + offsetX, screenY + offsetY, 0,
          screenX + offsetX, screenY + offsetY, layerSize
        );
        grad.addColorStop(0, `hsla(${nebula.hue + l * 15}, 60%, 50%, ${layerAlpha})`);
        grad.addColorStop(0.3, `hsla(${nebula.hue + l * 10}, 50%, 40%, ${layerAlpha * 0.5})`);
        grad.addColorStop(0.6, `hsla(${nebula.hue}, 40%, 30%, ${layerAlpha * 0.2})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX + offsetX, screenY + offsetY, layerSize, 0, TAU);
        ctx.fill();
      }

      // Store screen position for click detection
      nebula.screenX = screenX;
      nebula.screenY = screenY;
      nebula.screenSize = screenSize;
    }
  }

  renderStars(ctx, w, h) {
    const time = this.time;
    const cx = w / 2;
    const cy = h / 2;

    for (const star of this.stars) {
      // Apply camera rotation to star position
      const rotated = rotateX(star.x, star.y, star.z, this.rotationX);
      const final = rotateY(rotated.x, rotated.y, rotated.z, this.rotationY);

      // Only draw stars in front of camera
      if (final.z < 0) continue;

      // Project to screen - scale to fill canvas
      const screenX = cx + final.x * (w / 800);
      const screenY = cy + final.y * (h / 800);

      // Skip if off screen
      if (screenX < 0 || screenX > w || screenY < 0 || screenY > h) continue;

      // Twinkle effect
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.brightness * (0.4 + twinkle * 0.6);

      // Slight color variation - some stars are warmer, some cooler
      const temp = star.twinklePhase; // Use as color seed
      const r = 200 + Math.sin(temp) * 55;
      const g = 210 + Math.sin(temp + 1) * 45;
      const b = 230 + Math.sin(temp + 2) * 25;

      ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, star.size, 0, TAU);
      ctx.fill();

      // Add glow to brighter stars
      if (star.brightness > 0.6 && star.size > 1) {
        ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, star.size * 3, 0, TAU);
        ctx.fill();
      }
    }
  }

  renderCore(ctx, cx, cy) {
    const pulse = this.corePulse;
    const v = this.vitality; // 0 = dead/stasis, 1 = fully alive

    // When dead/dying, render hollow shell instead of glowing core
    if (v < 0.3) {
      const shellRadius = CONFIG.coreRadius * 0.8;
      const shellAlpha = 0.15 + (v / 0.3) * 0.15; // Faint when dead

      // Hollow shell - transparent center, colored edge
      const shellGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, shellRadius);
      shellGrad.addColorStop(0, 'transparent');
      shellGrad.addColorStop(0.5, 'transparent');
      shellGrad.addColorStop(0.7, `hsla(${this.hue}, 30%, 40%, ${shellAlpha * 0.5})`);
      shellGrad.addColorStop(0.85, `hsla(${this.hue}, 40%, 50%, ${shellAlpha})`);
      shellGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = shellGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, TAU);
      ctx.fill();

      // Dim outer halo
      const haloGrad = ctx.createRadialGradient(cx, cy, shellRadius * 0.8, cx, cy, shellRadius * 2);
      haloGrad.addColorStop(0, 'transparent');
      haloGrad.addColorStop(0.3, `hsla(${this.hue}, 30%, 35%, ${shellAlpha * 0.3})`);
      haloGrad.addColorStop(0.6, `hsla(${this.hue}, 25%, 30%, ${shellAlpha * 0.15})`);
      haloGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius * 2, 0, TAU);
      ctx.fill();

      return;
    }

    const pulseGlow = CONFIG.coreGlow * (1 + pulse * 0.5) * (0.3 + v * 0.7);
    const pulseRadius = CONFIG.coreRadius * (1 + pulse * 0.3) * (0.5 + v * 0.5);

    // Brightness and saturation based on vitality
    const brightness = 30 + v * 70; // 30-100%
    const saturation = 20 + v * 60; // 20-80%
    const glowAlpha = 0.2 + v * 0.8; // Dimmer when dying

    // Outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseGlow);
    glowGrad.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`);
    glowGrad.addColorStop(0.2, `hsla(${this.hue}, ${saturation}%, ${brightness}%, ${0.8 * glowAlpha})`);
    glowGrad.addColorStop(0.4, `hsla(${this.hue}, ${saturation * 0.9}%, ${brightness * 0.6}%, ${0.4 * glowAlpha})`);
    glowGrad.addColorStop(0.7, `hsla(${this.hue}, ${saturation * 0.8}%, ${brightness * 0.5}%, ${0.1 * glowAlpha})`);
    glowGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseGlow, 0, TAU);
    ctx.fill();

    // Food color flash when eating
    if (pulse > 0.05) {
      const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseGlow * 0.8);
      flashGrad.addColorStop(0, `hsla(${this.lastFoodHue}, 80%, 70%, ${pulse * 0.6})`);
      flashGrad.addColorStop(0.5, `hsla(${this.lastFoodHue}, 70%, 50%, ${pulse * 0.3})`);
      flashGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseGlow * 0.8, 0, TAU);
      ctx.fill();
    }

    // Bright core - edges fade to transparent
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
    const coreWhite = Math.floor(100 + v * 155); // Dimmer white when dying
    coreGrad.addColorStop(0, `rgba(${coreWhite}, ${coreWhite}, ${coreWhite}, ${glowAlpha})`);
    coreGrad.addColorStop(0.4, `hsla(${this.hue}, ${saturation}%, ${brightness}%, ${0.8 * glowAlpha})`);
    coreGrad.addColorStop(0.7, `hsla(${this.hue}, ${saturation * 0.9}%, ${brightness * 0.7}%, ${0.3 * glowAlpha})`);
    coreGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, TAU);
    ctx.fill();
  }

  renderRibbons(ctx, cx, cy) {
    const time = this.time;
    const dt = 1 / 60; // Approximate dt for physics

    for (const ribbon of this.ribbons) {
      // Skip if fully retracted
      if (ribbon.growth <= 0.01) continue;

      const points = [];

      // Generate ALL 3D points along the ribbon path (full shape)
      for (let i = 0; i <= CONFIG.ribbonSegments; i++) {
        const t = (i / CONFIG.ribbonSegments) * TAU;
        // Faster animation with speed multiplier
        const animT = t + time * ribbon.speed * CONFIG.ribbonSpeedMultiplier + ribbon.phase;

        // Lissajous-like 3D curve - full radius, ribbon shape unchanged
        let x = Math.cos(animT * ribbon.freqA) * ribbon.radius;
        let y = Math.sin(animT * ribbon.freqB) * ribbon.radius * 0.6;
        let z = Math.sin(animT * ribbon.freqC) * ribbon.radius * 0.8;

        // Apply ribbon's own tilt
        const tilted = rotateX(x, y, z, ribbon.tiltX);
        const tilted2 = rotateZ(tilted.x, tilted.y, tilted.z, ribbon.tiltZ);

        // Apply global rotation
        const rotated = rotateX(tilted2.x, tilted2.y, tilted2.z, this.rotationX);
        const final = rotateY(rotated.x, rotated.y, rotated.z, this.rotationY);

        points.push({
          x: final.x,
          y: final.y,
          z: final.z,
          t: i / CONFIG.ribbonSegments,
        });
      }

      // How much of the ribbon is visible (snake traveling along path)
      const visibleLength = ribbon.growth; // 0 to 1

      // Update deformation physics and apply to screen positions
      const screenPoints = points.map((p, i) => {
        const baseX = cx + p.x;
        const baseY = cy + p.y;
        const state = ribbon.deformState[i];

        // Only apply mouse force when mouse is active on canvas
        if (this.mouseActive) {
          // Calculate mouse repulsion force
          const pdx = baseX - this.mouseX;
          const pdy = baseY - this.mouseY;
          const dist = Math.sqrt(pdx * pdx + pdy * pdy);
          const pokeRadius = CONFIG.ribbonPokeRadius;

          if (dist < pokeRadius && dist > 1) {
            // Apply force away from mouse
            const falloff = Math.pow(1 - dist / pokeRadius, 2);
            const force = falloff * CONFIG.ribbonPokeStrength * dt;
            state.velocityX += (pdx / dist) * force;
            state.velocityY += (pdy / dist) * force;
          }
        }

        // Spring force back to origin
        state.velocityX -= state.offsetX * CONFIG.ribbonReturnSpeed * dt;
        state.velocityY -= state.offsetY * CONFIG.ribbonReturnSpeed * dt;

        // Apply damping
        state.velocityX *= CONFIG.ribbonDamping;
        state.velocityY *= CONFIG.ribbonDamping;

        // Update offset
        state.offsetX += state.velocityX * dt;
        state.offsetY += state.velocityY * dt;

        // Calculate final position
        let finalX = baseX + state.offsetX;
        let finalY = baseY + state.offsetY;

        // Constrain to stay inside the shield bubble
        const dxFromCenter = finalX - cx;
        const dyFromCenter = finalY - cy;
        const distFromCenter = Math.sqrt(dxFromCenter * dxFromCenter + dyFromCenter * dyFromCenter);
        const maxDist = this.getShieldRadius() - 10; // Stay inside shield with margin

        if (distFromCenter > maxDist) {
          // Push back inside and bounce velocity
          finalX = cx + (dxFromCenter / distFromCenter) * maxDist;
          finalY = cy + (dyFromCenter / distFromCenter) * maxDist;

          // Update offset to match constrained position
          state.offsetX = finalX - baseX;
          state.offsetY = finalY - baseY;

          // Bounce velocity inward
          state.velocityX *= -0.3;
          state.velocityY *= -0.3;
        }

        return {
          x: finalX,
          y: finalY,
          z: p.z
        };
      });

      // Draw the ribbon as connected segments with glow
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Calculate visible segment range (snake traveling along path)
      // When growth < 1: snake head at growth position, tail follows
      // When growth = 1: full loop visible (ribbon complete)
      const totalSegments = screenPoints.length - 1;
      const headPos = Math.floor(visibleLength * totalSegments);

      // Snake length (how much trail behind the head)
      // Grows from short to full length as it completes the loop
      const snakeLength = visibleLength >= 0.99
        ? totalSegments  // Full ribbon when complete
        : Math.min(headPos, Math.floor(totalSegments * 0.4)); // Snake body = 40% of ribbon length

      const tailPos = visibleLength >= 0.99 ? 0 : Math.max(0, headPos - snakeLength);

      // Multiple passes for glow effect
      for (let glow = 3; glow >= 0; glow--) {
        const width = CONFIG.ribbonWidth + glow * 6;
        const alpha = glow === 0 ? 0.9 : 0.15 / (glow + 1);

        ctx.strokeStyle = `hsla(${this.hue}, 70%, 65%, ${alpha})`;
        ctx.lineWidth = width;

        ctx.beginPath();
        let started = false;

        // Only draw from tail to head position
        for (let i = tailPos; i <= headPos && i < screenPoints.length; i++) {
          const p = screenPoints[i];

          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // Draw brighter segments where ribbon is in front (positive z)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = tailPos; i < headPos && i < screenPoints.length - 1; i++) {
        const p = screenPoints[i];
        const nextP = screenPoints[i + 1];

        if (points[i].z > 0) {
          const brightness = (points[i].z / ribbon.radius) * 0.5;

          ctx.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.lineWidth = CONFIG.ribbonWidth * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nextP.x, nextP.y);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  renderParticles(ctx, cx, cy) {
    const time = this.time;

    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      // Rotate particle position (now using dynamic x,y,z)
      const rotated = rotateX(p.x, p.y, p.z, this.rotationX);
      const final = rotateY(rotated.x, rotated.y, rotated.z, this.rotationY);

      const screenX = cx + final.x;
      const screenY = cy + final.y;

      // Twinkle
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed + p.twinklePhase));

      // Depth fade - use current distance for reference
      const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      const depthAlpha = 0.3 + 0.7 * ((final.z + dist) / (dist * 2 + 1));

      const alpha = twinkle * depthAlpha * 0.6;

      ctx.fillStyle = `hsla(${this.hue}, 70%, 75%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, TAU);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  renderFood(ctx) {
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.foodParticles) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.alpha})`);
      grad.addColorStop(0.4, `hsla(${p.hue}, 70%, 50%, ${p.alpha * 0.5})`);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  renderGasCloud(ctx, cx, cy) {
    // No gas radiation if dead/in stasis
    if (this.vitality < 0.1) return;

    const dt = 1 / 60;

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.gasCloud.length; i++) {
      const g = this.gasCloud[i];

      // Update life and radius - radiating outward
      g.life += dt * CONFIG.gasCloudSpeed;
      g.radius += g.speed * dt;
      g.theta += g.drift * dt;

      // Respawn when faded out
      if (g.life >= g.maxLife) {
        this.gasCloud[i] = this.createGasParticle(false);
        continue;
      }

      // Life-based alpha: fade in then fade out
      const lifePct = g.life / g.maxLife;
      const fadeIn = Math.min(lifePct * 4, 1); // Quick fade in
      const fadeOut = 1 - Math.pow(lifePct, 2); // Gradual fade out
      const lifeAlpha = fadeIn * fadeOut;

      // Spherical to cartesian
      let x = g.radius * Math.sin(g.phi) * Math.cos(g.theta);
      let y = g.radius * Math.sin(g.phi) * Math.sin(g.theta);
      let z = g.radius * Math.cos(g.phi);

      // Apply camera rotation
      const rotated = rotateX(x, y, z, this.rotationX);
      const final = rotateY(rotated.x, rotated.y, rotated.z, this.rotationY);

      const screenX = cx + final.x;
      const screenY = cy + final.y;

      // Depth-based alpha (fade when behind)
      const depthAlpha = 0.4 + 0.6 * ((final.z + g.radius) / (g.radius * 2));
      // Fade with vitality - dying creature radiates less
      const alpha = g.baseAlpha * lifeAlpha * depthAlpha * this.vitality;

      // Size grows as it radiates
      const size = g.size * (1 + lifePct * 0.8);

      // Draw soft gas blob
      const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
      grad.addColorStop(0, `hsla(${this.hue}, 70%, 70%, ${alpha})`);
      grad.addColorStop(0.3, `hsla(${this.hue}, 60%, 55%, ${alpha * 0.6})`);
      grad.addColorStop(0.6, `hsla(${this.hue}, 50%, 45%, ${alpha * 0.25})`);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, TAU);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Calculate membrane deformation based on physics state (with bounce-back)
   */
  getMembraneDeform(screenX, screenY, cx, cy) {
    const m = this.membraneDeform;

    // No deformation if intensity is near zero
    if (Math.abs(m.intensity) < 0.01) {
      return { x: 0, y: 0 };
    }

    // Distance from this point to deformation center
    const pdx = screenX - m.x;
    const pdy = screenY - m.y;
    const distToDeform = Math.sqrt(pdx * pdx + pdy * pdy);

    // Deformation strength falls off with distance
    const deformRadius = CONFIG.membraneDeformRadius;
    if (distToDeform > deformRadius) return { x: 0, y: 0 };

    // Smooth falloff using cosine
    const falloff = Math.cos((distToDeform / deformRadius) * Math.PI * 0.5);
    const strength = falloff * CONFIG.membraneDeformStrength * m.intensity;

    // Push outward from center (bulge effect)
    const px = screenX - cx;
    const py = screenY - cy;
    const pLen = Math.sqrt(px * px + py * py) || 1;

    return {
      x: (px / pLen) * strength,
      y: (py / pLen) * strength
    };
  }

  /**
   * Render the glass containment shield with fresnel effect and membrane deformation
   * @param {boolean} frontHalf - true for front half, false for back half
   */
  renderShield(ctx, cx, cy, frontHalf) {
    const radius = this.getShieldRadius();

    ctx.globalCompositeOperation = 'lighter';

    // Draw multiple latitude lines for a more visible membrane
    const latitudes = 8;
    for (let lat = 1; lat < latitudes; lat++) {
      const phi = (lat / latitudes) * Math.PI;
      const latRadius = Math.sin(phi) * radius;
      const latZ = Math.cos(phi) * radius;

      const segments = 48;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * TAU;
        let x = Math.cos(theta) * latRadius;
        let y = Math.sin(theta) * latRadius;
        let z = latZ;

        // Rotate
        const rot = rotateX(x, y, z, this.rotationX);
        const final = rotateY(rot.x, rot.y, rot.z, this.rotationY);

        // Skip based on which half we're drawing
        if (frontHalf && final.z < 0) {
          started = false;
          continue;
        }
        if (!frontHalf && final.z >= 0) {
          started = false;
          continue;
        }

        let screenX = cx + final.x;
        let screenY = cy + final.y;

        // Apply membrane deformation
        const deform = this.getMembraneDeform(screenX, screenY, cx, cy);
        screenX += deform.x;
        screenY += deform.y;

        if (!started) {
          ctx.moveTo(screenX, screenY);
          started = true;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }

      // Fresnel - latitude lines closer to edge are brighter
      const latFresnel = Math.sin(phi) * 0.3;
      ctx.strokeStyle = `hsla(${this.hue}, 60%, 65%, ${latFresnel})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw longitude lines
    const longitudes = 12;
    for (let lon = 0; lon < longitudes; lon++) {
      const theta = (lon / longitudes) * TAU;

      const segments = 32;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI;
        let x = Math.sin(phi) * Math.cos(theta) * radius;
        let y = Math.sin(phi) * Math.sin(theta) * radius;
        let z = Math.cos(phi) * radius;

        // Rotate
        const rot = rotateX(x, y, z, this.rotationX);
        const final = rotateY(rot.x, rot.y, rot.z, this.rotationY);

        // Skip based on which half
        if (frontHalf && final.z < 0) {
          started = false;
          continue;
        }
        if (!frontHalf && final.z >= 0) {
          started = false;
          continue;
        }

        let screenX = cx + final.x;
        let screenY = cy + final.y;

        // Apply membrane deformation
        const deform = this.getMembraneDeform(screenX, screenY, cx, cy);
        screenX += deform.x;
        screenY += deform.y;

        if (!started) {
          ctx.moveTo(screenX, screenY);
          started = true;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }

      ctx.strokeStyle = `hsla(${this.hue}, 60%, 65%, 0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Add fresnel rim glow
    if (frontHalf) {
      const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.1);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(0.7, `hsla(${this.hue}, 60%, 65%, 0.05)`);
      rimGrad.addColorStop(0.9, `hsla(${this.hue}, 60%, 65%, 0.15)`);
      rimGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.1, 0, TAU);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Create Day 27 visualization
 */
export default function day27(canvas) {
  const game = new GaseousSentienceDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
