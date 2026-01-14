/**
 * Genuary 2026 - Day 8
 * Prompt: "A City"
 *
 * FORGE STAR - A Stellar Foundry
 *
 * An optimistic sci-fi vision of a Dyson-like megastructure:
 * a civilization that has industrialized a blue hypergiant star,
 * turning cosmic fury into abundance.
 *
 * Not a monument, but an organ. Not colonization, but symbiosis.
 * Energy is infinite. Distance is a parameter. Pattern persists.
 *
 * Drag to orbit. Watch the city breathe.
 */

import {
  Game,
  Camera3D,
  Sphere3D,
  Cube3D,
  Painter,
  Motion,
  StateMachine,
  ParticleSystem,
  ParticleEmitter,
  Updaters,
  Easing,
} from '@guinetik/gcanvas';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Star properties (blue hypergiant)
  star: {
    radius: 80,
    temperature: 25000,        // Kelvin - hot blue
    activityLevel: 0.7,
    color: [0.6, 0.8, 1.0],    // Blue-white
    rotationSpeed: 0.3,
  },

  // Dyson lattice
  lattice: {
    shellRadius: 160,
    nodeSize: 1.5,
    rotationSpeed: 0.03,
    color: '#44aaff',
    // Multiple shell layers
    layers: [
      { radius: 140, count: 80, size: 1 },
      { radius: 160, count: 120, size: 1.5 },
      { radius: 180, count: 100, size: 1.25 },
    ],
  },

  // Energy streams (star to lattice) - blue near star, gold at lattice
  streams: {
    particleCount: 80,   // Reduced from 300
    speed: 100,
    innerColor: { r: 150, g: 200, b: 255, a: 0.9 },  // Blue-white near star
    outerColor: { r: 255, g: 200, b: 100, a: 0.8 },  // Gold at lattice
  },

  // Ships/drones - teal/green for life
  ships: {
    count: 15,              // Reduced from 40 - less cluttered
    size: 4,
    speed: 120,             // Regular ship speed
    constructorSpeed: 250,  // Fast constructor ships
    trailLength: 12,
    color: '#44ddbb',       // Teal
    glowColor: 'rgba(80, 220, 180, 0.8)',
    trailColor: 'rgba(80, 200, 170, 0.4)',
  },

  // Orbital stations - Cloud City style
  stations: {
    count: 5,                 // 1 Capitol + 4 Annexes
    orbitRadius: 350,         // Base orbit distance from star (larger orbit)
  },

  // Camera
  camera: {
    perspective: 700,
    autoRotateSpeed: 0.08,
    friction: 0.92,
  },

  // Narrative phases (plays once, then idles in EMPIRE)
  phases: {
    intro: 3,        // Just the star, contemplative (shorter)
    arrival: 4,      // Rocket approaches star (shorter)
    deployment: 3,   // Panels deploy, satellites separate (shorter)
    capitol: 8,      // Capitol station reveals (longer but reveal is faster)
    empire: null,    // Full activity - stays forever
  },

  // Starship spacecraft
  // NOTE: Must use 6-char hex (not 3-char shorthand) for Cube3D._applyLighting()
  rocket: {
    startDistance: 800,     // Where ship starts (far from star)
    bodyColor: '#663399',   // Purple hull
    accentColor: '#ffcc00', // Yellow accents
    thrustColor: '#ff8800', // Orange engine glow
    panelColor: '#8866ff',  // Light purple panels
    voxelSize: 4,
  },

  // Reveal animation settings
  reveal: {
    staggerDelay: 0.008,    // Delay between each voxel pop (faster!)
    annexStagger: 1.0,      // Delay between constructor ship launches
    shipSpawnInterval: 0.8, // Delay between each regular ship spawn
  },

  // Visual style
  style: {
    bgColor: '#000',
    glowColor: 'rgba(100, 180, 255, 0.3)',
    trailAlpha: 0.12,
  },

  // Background starfield for space immersion
  starfield: {
    count: 250,           // Number of background stars
    radius: 450,          // Sphere radius (behind stations but visible)
    minSize: 0.5,
    maxSize: 1.5,
    twinkleSpeed: 1.5,    // How fast stars twinkle
    color: '#ffffff',
  },

  // Wormhole portal effect (Twilight Princess style)
  wormhole: {
    radius: 60,           // Base size of portal
    ringCount: 5,         // Number of swirling rings
    particleCount: 40,    // Particles spiraling in
    rotationSpeed: 2,     // Ring rotation speed
    spawnTime: 2.3,       // Time to fully open (dramatic reveal)
    colors: {
      core: '#ffffff',
      inner: '#aa88ff',   // Purple inner glow
      outer: '#4488ff',   // Blue outer ring
      particles: '#cc99ff',
    },
    fadeOutStart: 0.4,    // Start fading at 40% through ARRIVAL
    fadeOutEnd: 0.8,      // Fully faded at 80%
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate points on a sphere using fibonacci spiral (uniform distribution)
 */
function fibonacciSphere(numPoints, radius) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < numPoints; i++) {
    const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    points.push({
      x: Math.cos(theta) * radiusAtY * radius,
      y: y * radius,
      z: Math.sin(theta) * radiusAtY * radius,
    });
  }
  return points;
}

/**
 * Simple ship shape (triangle pointing in direction of travel) - Teal/Green
 */
function drawShip(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Ship body - teal
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, -size * 0.5);
  ctx.lineTo(-size * 0.3, 0);
  ctx.lineTo(-size * 0.6, size * 0.5);
  ctx.closePath();

  ctx.fillStyle = CONFIG.ships.color;
  ctx.fill();

  // Engine glow - bright teal
  ctx.beginPath();
  ctx.arc(-size * 0.4, 0, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = CONFIG.ships.glowColor;
  ctx.fill();

  ctx.restore();
}

// Remove old drawStation function as it's no longer used
// function drawStation(...) { ... }

// ============================================================================
// SHIP CLASS - 3D cargo ships traveling between waypoints with orbiting behavior
// ============================================================================

class Ship {
  constructor(id, route, speed) {
    this.id = id;
    this.route = route; // Array of { type: 'station'|'space', target: Object|Point }
    this.routeIndex = 0; // Start at first point
    this.speed = speed;

    this.active = false;  // Ships start inactive, spawn progressively
    this.state = 'travel'; // 'travel' | 'orbit'
    this.stateTimer = 0;

    // Orbit/Docking properties
    this.orbitRadius = 25 + Math.random() * 15; // Distance to orbit at
    this.orbitSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.8);
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitTilt = (Math.random() - 0.5) * 1.0;

    // Position will be set when spawned
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.trail = [];
    this.angle = 0;
  }

  /**
   * Spawn ship at a specific position (e.g., Capitol)
   */
  spawn(x, y, z) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.z = z;
    this.state = 'travel';
    this.routeIndex = 0;
    this.trail = [];
  }

  getCurrentTargetPos() {
    const waypoint = this.route[this.routeIndex];
    if (waypoint.type === 'station') {
      return { 
        x: waypoint.target.x, 
        y: waypoint.target.y, 
        z: waypoint.target.z 
      };
    }
    // Static point
    return waypoint.target;
  }

  update(dt) {
    const targetPos = this.getCurrentTargetPos();
    
    // Update trail
    this.trail.push({ x: this.x, y: this.y, z: this.z });
    if (this.trail.length > 25) this.trail.shift();

    if (this.state === 'travel') {
      // Calculate vector to target
      const dx = targetPos.x - this.x;
      const dy = targetPos.y - this.y;
      const dz = targetPos.z - this.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Determine arrival radius
      // If it's a station, we stop at orbitRadius. If space point, we get closer.
      const arrivalDist = (this.route[this.routeIndex].type === 'station') 
        ? this.orbitRadius 
        : 5;

      if (dist < arrivalDist + 2) {
        // Arrived! Switch to orbit/dock state
        this.state = 'orbit';
        this.stateTimer = 4 + Math.random() * 5; // Orbit for 4-9 seconds (loading cargo)
        
        // Set initial orbit angle to match arrival for smoothness
        this.orbitAngle = Math.atan2(this.z - targetPos.z, this.x - targetPos.x);
      } else {
        // Move towards target
        const moveSpeed = this.speed * dt;
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        this.z += (dz / dist) * moveSpeed;
        
        // Point ship towards target
        this.angle = Math.atan2(dy, dx);
      }
      
    } else if (this.state === 'orbit') {
      this.stateTimer -= dt;
      
      if (this.stateTimer <= 0) {
        // Done orbiting, move to next waypoint
        this.state = 'travel';
        this.routeIndex = (this.routeIndex + 1) % this.route.length;
        return;
      }
      
      // Orbit mechanics
      this.orbitAngle += this.orbitSpeed * dt;
      
      // Calculate position on orbit sphere/circle
      const r = this.orbitRadius;
      // Simple tilted circle orbit
      const ox = Math.cos(this.orbitAngle) * r;
      const oz = Math.sin(this.orbitAngle) * r;
      const oy = Math.sin(this.orbitAngle) * Math.sin(this.orbitTilt) * r; // Tilt effect
      
      // Apply to target position (which might be moving!)
      this.x = targetPos.x + ox;
      this.y = targetPos.y + oy;
      this.z = targetPos.z + oz;
      
      // Face direction of orbit (tangent)
      // Approximate by looking ahead
      const nextAngle = this.orbitAngle + 0.1 * Math.sign(this.orbitSpeed);
      const nextOx = Math.cos(nextAngle) * r;
      const nextOy = Math.sin(nextAngle) * Math.sin(this.orbitTilt) * r;
      const nextOz = Math.sin(nextAngle) * r; // Not used for 2D angle but needed for consistency
      
      // 2D projection angle for the sprite
      this.angle = Math.atan2(nextOy - oy, nextOx - ox);
    }
  }
}

// ============================================================================
// STARSHIP CLASS - Star Destroyer wedge that slides into orbit
// ============================================================================

class Starship {
  constructor(game) {
    this.game = game;
    this.visible = true;

    // Position in 3D space
    this.x = 0;
    this.y = 0;
    this.z = 0;

    // Heading angle (yaw) - points in direction of travel
    this.heading = 0;

    // Animation states
    this.panelDeployProgress = 0;  // 0 = folded, 1 = deployed
    this.satelliteSeparation = 0;  // 0 = attached, 1 = separated

    // Disassembly state
    this.disassembling = false;
    this.disassemblyProgress = 0;

    // Capitol target for satellite flight
    this.capitolTarget = null;

    // Voxel assembly
    this.voxels = [];       // Main hull voxels
    this.panels = [];       // Solar panel voxels (animate outward)
    this.satellites = [];   // Satellite voxels (separate during deployment)

    this.generateStarship();
  }

  /**
   * Set Capitol target for satellites to fly toward
   */
  setCapitolTarget(x, y, z) {
    this.capitolTarget = { x, y, z };
  }

  generateStarship() {
    const size = CONFIG.rocket?.voxelSize || 4;
    const hullColor = CONFIG.rocket?.bodyColor || '#663399';
    const hullDark = '#442266';   // Darker purple for depth
    const accentColor = CONFIG.rocket?.accentColor || '#ffcc00';
    const engineColor = CONFIG.rocket?.thrustColor || '#ff8800';
    const panelColor = CONFIG.rocket?.panelColor || '#8866ff';

    // Helper to create a voxel with disassembly properties
    const createVoxel = (x, y, z, color, scale = 1) => {
      // Random scatter direction for disassembly
      const scatterAngle = Math.random() * Math.PI * 2;
      const scatterPitch = (Math.random() - 0.5) * Math.PI;
      const scatterSpeed = 80 + Math.random() * 120;

      return {
        lx: x * size,
        ly: y * size,
        lz: z * size,
        size: size * scale,
        color,
        cube: new Cube3D(size * scale, {
          camera: this.game.camera,
          faceColors: {
            front: color, back: color,
            left: color, right: color,
            top: color, bottom: color
          },
          stroke: 'rgba(150, 100, 200, 0.4)',
        }),
        // Disassembly properties
        scatterVel: {
          x: Math.cos(scatterAngle) * Math.cos(scatterPitch) * scatterSpeed,
          y: Math.sin(scatterPitch) * scatterSpeed,
          z: Math.sin(scatterAngle) * Math.cos(scatterPitch) * scatterSpeed,
        },
        disassemblyOffset: { x: 0, y: 0, z: 0 },
        alpha: 1,
      };
    };

    // ─────────────────────────────────────────────────────────────────
    // STAR DESTROYER WEDGE - Large triangular hull
    // Ship points along +X axis (nose at front, engines at back)
    // Much bigger and more detailed
    // ─────────────────────────────────────────────────────────────────

    // Hull rows from back to front - BIGGER ship
    const hullRows = [
      { x: -8, width: 9 },   // Engine section - widest
      { x: -7, width: 9 },
      { x: -6, width: 8 },
      { x: -5, width: 8 },
      { x: -4, width: 7 },
      { x: -3, width: 7 },
      { x: -2, width: 6 },
      { x: -1, width: 5 },
      { x: 0, width: 5 },
      { x: 1, width: 4 },
      { x: 2, width: 4 },
      { x: 3, width: 3 },
      { x: 4, width: 3 },
      { x: 5, width: 2 },
      { x: 6, width: 2 },
      { x: 7, width: 1 },
      { x: 8, width: 1 },
      { x: 9, width: 1 },
      { x: 10, width: 0.5 },  // Nose tip
    ];

    for (const row of hullRows) {
      const halfW = row.width / 2;
      for (let z = -Math.floor(halfW); z <= Math.floor(halfW); z++) {
        // Main deck (y = 0)
        this.voxels.push(createVoxel(row.x, 0, z, hullColor));

        // Upper deck for wider sections
        if (row.width >= 5 && Math.abs(z) < halfW - 1) {
          this.voxels.push(createVoxel(row.x, 1, z, hullColor, 0.9));
        }

        // Lower hull for thicker sections
        if (row.width >= 4 && Math.abs(z) < halfW - 0.5) {
          this.voxels.push(createVoxel(row.x, -1, z, hullDark, 0.9));
        }

        // Bottom hull for widest sections
        if (row.width >= 7 && Math.abs(z) < halfW - 1.5) {
          this.voxels.push(createVoxel(row.x, -2, z, hullDark, 0.8));
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // BRIDGE TOWER (raised command section - yellow accents)
    // ─────────────────────────────────────────────────────────────────
    // Bridge base
    for (let bx = -4; bx <= 0; bx++) {
      for (let bz = -1; bz <= 1; bz++) {
        this.voxels.push(createVoxel(bx, 2, bz, hullColor, 0.85));
      }
    }
    // Bridge tower
    for (let bx = -3; bx <= -1; bx++) {
      this.voxels.push(createVoxel(bx, 3, 0, accentColor, 0.7));
    }
    // Bridge top - yellow beacon
    this.voxels.push(createVoxel(-2, 4, 0, accentColor, 0.5));

    // ─────────────────────────────────────────────────────────────────
    // YELLOW ACCENT STRIPES along hull edges
    // ─────────────────────────────────────────────────────────────────
    for (let x = -6; x <= 6; x += 2) {
      const rowIdx = hullRows.findIndex(r => r.x === x);
      if (rowIdx >= 0) {
        const w = Math.floor(hullRows[rowIdx].width / 2);
        this.voxels.push(createVoxel(x, 0, w, accentColor, 0.6));
        this.voxels.push(createVoxel(x, 0, -w, accentColor, 0.6));
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // ENGINE ARRAY (back of ship) - orange glow
    // ─────────────────────────────────────────────────────────────────
    for (let z = -4; z <= 4; z++) {
      this.voxels.push(createVoxel(-9, 0, z, engineColor, 0.8));
      if (Math.abs(z) < 3) {
        this.voxels.push(createVoxel(-9, -1, z, engineColor, 0.7));
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // WEAPON BATTERIES (yellow turrets along spine)
    // ─────────────────────────────────────────────────────────────────
    for (let x = 2; x <= 6; x += 2) {
      this.voxels.push(createVoxel(x, 1, 0, accentColor, 0.5));
    }

    // ─────────────────────────────────────────────────────────────────
    // SOLAR PANELS (deploy from sides during DEPLOYMENT)
    // ─────────────────────────────────────────────────────────────────
    const panelRows = [-5, -4, -3, -2, -1, 0, 1, 2];
    for (const px of panelRows) {
      const edgeZ = 5;
      // Right side panels
      this.panels.push({
        ...createVoxel(px, 0, edgeZ, panelColor, 0.5),
        baseX: px * size,
        baseZ: edgeZ * size,
        side: 1,
        deployOffset: 4 * size,
      });
      // Left side panels
      this.panels.push({
        ...createVoxel(px, 0, -edgeZ, panelColor, 0.5),
        baseX: px * size,
        baseZ: -edgeZ * size,
        side: -1,
        deployOffset: 4 * size,
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // SATELLITES (drones that separate - yellow)
    // ─────────────────────────────────────────────────────────────────
    const satPositions = [
      { x: 4, y: 2, z: 2, dir: { x: 1, y: 1, z: 1 } },
      { x: 4, y: 2, z: -2, dir: { x: 1, y: 1, z: -1 } },
      { x: 0, y: 2, z: 3, dir: { x: 0, y: 1, z: 1 } },
      { x: 0, y: 2, z: -3, dir: { x: 0, y: 1, z: -1 } },
      { x: -4, y: 2, z: 3, dir: { x: -1, y: 1, z: 1 } },
      { x: -4, y: 2, z: -3, dir: { x: -1, y: 1, z: -1 } },
    ];

    for (const pos of satPositions) {
      this.satellites.push({
        ...createVoxel(pos.x, pos.y, pos.z, accentColor, 0.6),
        baseX: pos.x * size,
        baseY: pos.y * size,
        baseZ: pos.z * size,
        separationDir: pos.dir,
      });
    }
  }

  /**
   * Set ship position
   */
  setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Set heading angle (radians) - ship points in this direction
   */
  setHeading(angle) {
    this.heading = angle;
  }

  /**
   * Deploy solar panels (0 = folded, 1 = fully extended)
   */
  deployPanels(progress) {
    this.panelDeployProgress = Math.max(0, Math.min(1, progress));

    for (const panel of this.panels) {
      // Animate Z position outward based on side and progress
      panel.lz = panel.baseZ + panel.side * panel.deployOffset * this.panelDeployProgress;
    }
  }

  /**
   * Separate satellites and fly them toward Capitol one at a time (fleet style)
   * @param {number} progress - 0 = all attached, 1 = all at Capitol
   */
  separateSatellites(progress) {
    this.satelliteSeparation = Math.max(0, Math.min(1, progress));

    if (!this.capitolTarget) {
      // Fallback: just separate outward if no target set
      const separationDist = 40;
      for (const sat of this.satellites) {
        const p = this.satelliteSeparation;
        sat.lx = sat.baseX + sat.separationDir.x * separationDist * p;
        sat.ly = sat.baseY + sat.separationDir.y * separationDist * p;
        sat.lz = sat.baseZ + sat.separationDir.z * separationDist * p;
      }
      return;
    }

    // Stagger satellites - each one flies sequentially
    const numSats = this.satellites.length;
    const staggerMultiplier = 0.6;  // Each satellite uses 60% of the time window
    const staggerOffset = (1 - staggerMultiplier) / Math.max(1, numSats - 1);

    for (let i = 0; i < numSats; i++) {
      const sat = this.satellites[i];

      // Each satellite has its own time window
      const satStart = i * staggerOffset;
      const satEnd = satStart + staggerMultiplier;

      // Calculate this satellite's individual progress
      let satProgress = 0;
      if (this.satelliteSeparation >= satEnd) {
        satProgress = 1;  // Arrived
      } else if (this.satelliteSeparation > satStart) {
        satProgress = (this.satelliteSeparation - satStart) / staggerMultiplier;
      }

      // Lock in start position when this satellite begins moving
      if (satProgress > 0 && !sat.flightStartPos) {
        sat.flightStartPos = {
          x: this.x + sat.baseX,
          y: this.y + sat.baseY,
          z: this.z + sat.baseZ,
        };
      }

      // If not started yet, stay attached to ship
      if (!sat.flightStartPos) {
        sat.lx = sat.baseX;
        sat.ly = sat.baseY;
        sat.lz = sat.baseZ;
        sat.worldPos = null;
        continue;
      }

      const eased = satProgress * satProgress * (3 - 2 * satProgress);  // Smoothstep

      // End position: orbit around Capitol (updates with Capitol's current position)
      const orbitRadius = 30;
      const orbitAngle = (i / numSats) * Math.PI * 2;
      const endX = this.capitolTarget.x + Math.cos(orbitAngle) * orbitRadius;
      const endY = this.capitolTarget.y + 10;  // Slightly above Capitol
      const endZ = this.capitolTarget.z + Math.sin(orbitAngle) * orbitRadius;

      // Interpolate in world space
      const worldX = sat.flightStartPos.x + (endX - sat.flightStartPos.x) * eased;
      const worldY = sat.flightStartPos.y + (endY - sat.flightStartPos.y) * eased;
      const worldZ = sat.flightStartPos.z + (endZ - sat.flightStartPos.z) * eased;

      // Store world position for rendering (bypass local offset system)
      sat.worldPos = { x: worldX, y: worldY, z: worldZ };

      // No alpha fade - stay fully visible until popped
      sat.alpha = 1;
    }
  }

  /**
   * Start disassembly animation - voxels toggle off one by one
   * @param {number} startTime - Game time when disassembly starts
   * @param {number} duration - How long the full disassembly takes
   */
  startDisassembly(startTime, duration = 4.0) {
    this.disassembling = true;
    this.disassemblyStartTime = startTime;
    this.disassemblyDuration = duration;

    // Collect all voxels and shuffle them randomly
    const allVoxels = [...this.voxels, ...this.panels, ...this.satellites];

    // Shuffle array
    for (let i = allVoxels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allVoxels[i], allVoxels[j]] = [allVoxels[j], allVoxels[i]];
    }

    // Assign hideTime to each voxel - staggered over the duration
    const stagger = duration / allVoxels.length;
    allVoxels.forEach((v, i) => {
      v.hideTime = startTime + (i * stagger);
      v.alpha = 1;
    });
  }

  /**
   * Update disassembly animation - toggle voxels off over time
   * @param {number} currentTime - Current game time
   * @returns {boolean} - True if disassembly is complete
   */
  updateDisassembly(currentTime) {
    if (!this.disassembling) return true;

    const allVoxels = [...this.voxels, ...this.panels, ...this.satellites];
    let allHidden = true;

    for (const v of allVoxels) {
      if (currentTime >= v.hideTime) {
        v.alpha = 0;  // Instant toggle off
      } else {
        allHidden = false;
      }
    }

    // Hide ship when all voxels are gone
    if (allHidden) {
      this.disassembling = false;
      this.visible = false;
      return true;
    }

    return false;
  }

  /**
   * Update ship each frame
   * @param {number} currentTime - Current game time (for disassembly)
   */
  update(currentTime) {
    // Update disassembly if active
    if (this.disassembling) {
      this.updateDisassembly(currentTime);
    }
  }

  /**
   * Add ship voxels to render list
   */
  getRenderables(renderList) {
    if (!this.visible) return;

    // Rotate around Y axis based on heading
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);

    const addVoxelToList = (v) => {
      // Skip if fully faded
      if (v.alpha <= 0) return;

      // Apply heading rotation (yaw around Y)
      const rx = v.lx * cos - v.lz * sin;
      const rz = v.lx * sin + v.lz * cos;
      const ry = v.ly;

      // World position + disassembly offset
      const wx = this.x + rx + (v.disassemblyOffset?.x || 0);
      const wy = this.y + ry + (v.disassemblyOffset?.y || 0);
      const wz = this.z + rz + (v.disassemblyOffset?.z || 0);

      const proj = this.game.camera.project(wx, wy, wz);

      renderList.push({
        type: 'voxel',
        cube: v.cube,
        x: wx,
        y: wy,
        z: wz,
        depth: proj.z,
        scale: proj.scale,
        revealScale: 1,
        alpha: v.alpha,  // Pass alpha for fading
      });
    };

    // Add all voxel groups
    for (const v of this.voxels) addVoxelToList(v);
    for (const v of this.panels) addVoxelToList(v);

    // Satellites: use world position if in flight, otherwise local offset
    for (const sat of this.satellites) {
      if (sat.alpha <= 0) continue;

      let wx, wy, wz;
      if (sat.worldPos) {
        // In flight - use world position directly
        wx = sat.worldPos.x;
        wy = sat.worldPos.y;
        wz = sat.worldPos.z;
      } else {
        // Attached to ship - use local offset with rotation
        const rx = sat.lx * cos - sat.lz * sin;
        const rz = sat.lx * sin + sat.lz * cos;
        wx = this.x + rx;
        wy = this.y + sat.ly;
        wz = this.z + rz;
      }

      const proj = this.game.camera.project(wx, wy, wz);
      renderList.push({
        type: 'voxel',
        cube: sat.cube,
        x: wx,
        y: wy,
        z: wz,
        depth: proj.z,
        scale: proj.scale,
        revealScale: 1,
        alpha: sat.alpha,
      });
    }
  }
}

// ============================================================================
// ORBITAL STATION CLASS - Cloud City Style Procedural Generation
// ============================================================================

class OrbitalStation {
  /**
   * @param {Game} game - Parent game instance
   * @param {number} id - Station ID (0 = Capitol)
   * @param {number} orbitRadius - Distance from star center
   * @param {number} startAngle - Initial orbital position
   * @param {boolean} isCapitol - Is this the main Capitol station?
   */
  constructor(game, id, orbitRadius, startAngle, isCapitol = false, sharedOrbitSpeed = 0.03) {
    this.game = game;
    this.id = id;
    this.orbitRadius = orbitRadius;
    this.isCapitol = isCapitol;

    // All stations share same angular velocity (orbit together like a clock face)
    // This keeps them equidistant over time instead of drifting with Keplerian physics
    this.orbitSpeed = sharedOrbitSpeed;

    // Slight orbital inclination for visual depth
    this.tilt = (Math.random() - 0.5) * 0.4;
    this.angle = startAngle;

    // Station self-rotation (slow spin)
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.1 + Math.random() * 0.1;

    // Size scales with Capitol status - Capitol is much larger
    this.baseRadius = isCapitol ? 16 : 4 + Math.floor(Math.random() * 2);
    this.voxelSize = isCapitol ? 5 : 4;  // Capitol has bigger voxels too

    this.voxels = [];
    this.generateCity();
    this.updatePosition();
  }

  /**
   * Procedural city generation - Cloud City style
   * Structure: Thruster (bottom) -> Dome Base (middle) -> Skyline (top)
   */
  generateCity() {
    const r = this.baseRadius;
    const voxelSize = this.voxelSize;

    // Color palettes - each station type gets unique colors
    // NOTE: Must use 6-char hex (not 3-char shorthand) for Cube3D._applyLighting()
    const palettes = {
      capitol: {
        main: '#ffaa44',      // Gold
        accent: '#ffcc88',    // Light gold
        dark: '#aa6600',      // Dark gold
        glow: '#ffff00',      // Bright yellow
        stroke: 'rgba(255, 200, 100, 0.4)'
      },
      // Annex palettes - varied industrial colors
      annex: [
        { // Cyan/Teal
          main: '#00ffaa',
          accent: '#44ffcc',
          dark: '#006644',
          glow: '#00ffff',
          stroke: 'rgba(0, 255, 200, 0.4)'
        },
        { // Blue
          main: '#4488ff',
          accent: '#88aaff',
          dark: '#222266',
          glow: '#44ccff',
          stroke: 'rgba(100, 150, 255, 0.4)'
        },
        { // Purple/Violet
          main: '#aa44ff',
          accent: '#cc88ff',
          dark: '#442244',
          glow: '#ff44ff',
          stroke: 'rgba(180, 100, 255, 0.4)'
        },
        { // Green
          main: '#44ff44',
          accent: '#88ff88',
          dark: '#224422',
          glow: '#00ff00',
          stroke: 'rgba(100, 255, 100, 0.4)'
        },
      ]
    };

    // Select palette based on station type
    const palette = this.isCapitol
      ? palettes.capitol
      : palettes.annex[this.id % palettes.annex.length];

    const strokeColor = palette.stroke;

    // Helper to add a voxel
    const addVoxel = (x, y, z, color, scale = 1) => {
      const voxelIndex = this.voxels.length;
      this.voxels.push({
        lx: x * voxelSize,
        ly: y * voxelSize,
        lz: z * voxelSize,
        size: voxelSize * scale,
        color,
        cube: new Cube3D(voxelSize * scale, {
          camera: this.game.camera,
          faceColors: {
            front: color, back: color,
            left: color, right: color,
            top: color, bottom: color
          },
          stroke: strokeColor,
        }),
        // Visibility system for progressive reveal
        visible: true,           // Start visible (narrative will hide initially)
        revealOrder: voxelIndex, // Default order = creation order
        revealTime: 0,           // When reveal animation started
        revealScale: 1,          // Current scale (0=hidden, 1=full)
      });
    };

    // ─────────────────────────────────────────────────────────────────
    // 1. THRUSTER STEM (extends DOWN from center) - Negative Y
    // ─────────────────────────────────────────────────────────────────
    const thrusterHeight = this.isCapitol ? 12 : 5 + Math.floor(Math.random() * 3);

    // Main thruster column
    for (let y = 1; y <= thrusterHeight; y++) {
      // Taper toward bottom
      const taper = y > thrusterHeight * 0.7 ? 0.7 : 1;
      addVoxel(0, -y, 0, palette.dark, taper);
    }

    // Thruster engine glow at very bottom
    addVoxel(0, -(thrusterHeight + 1), 0, palette.glow, 0.6);

    // Thruster fins (Capitol has more)
    const finCount = this.isCapitol ? 6 : 2;
    for (let f = 0; f < finCount; f++) {
      const finAngle = (f / finCount) * Math.PI * 2;
      const fx = Math.round(Math.cos(finAngle) * 1.5);
      const fz = Math.round(Math.sin(finAngle) * 1.5);
      for (let y = 2; y <= thrusterHeight * 0.6; y++) {
        addVoxel(fx, -y, fz, palette.dark, 0.6);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. DOME BASE PLATFORM (circular disk at Y=0)
    // ─────────────────────────────────────────────────────────────────
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        const d2 = x * x + z * z;
        if (d2 <= r * r) {
          // Main platform floor
          addVoxel(x, 0, z, palette.dark);

          // Dome underside curve (bowl shape)
          const depth = Math.floor(Math.sqrt(Math.max(0, r * r - d2)) * 0.3);
          if (depth > 0 && d2 > (r - 2) * (r - 2)) {
            // Only outer ring curves down
            addVoxel(x, -1, z, palette.dark, 0.8);
          }
        }
      }
    }

    // Platform rim/edge highlight
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const ex = Math.round(Math.cos(a) * r);
      const ez = Math.round(Math.sin(a) * r);
      if (Math.random() > 0.3) {
        addVoxel(ex, 1, ez, palette.accent, 0.5);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. SKYLINE (buildings grow UP from platform) - Positive Y
    // ─────────────────────────────────────────────────────────────────
    const buildingMap = new Map();

    // Downtown cluster(s) - taller buildings near center
    const clusterCount = this.isCapitol ? 7 : 2;
    for (let c = 0; c < clusterCount; c++) {
      const clusterAngle = (c / clusterCount) * Math.PI * 2 + Math.random() * 0.5;
      const clusterDist = Math.random() * r * 0.5;
      const cx = Math.round(Math.cos(clusterAngle) * clusterDist);
      const cz = Math.round(Math.sin(clusterAngle) * clusterDist);

      // Cluster base height (Capitol has taller buildings)
      const maxHeight = this.isCapitol ? 10 + Math.floor(Math.random() * 6) : 4 + Math.floor(Math.random() * 3);

      // Build cluster
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          const bx = cx + ox;
          const bz = cz + oz;
          const key = `${bx},${bz}`;

          if (buildingMap.has(key)) continue;
          if (bx * bx + bz * bz > r * r) continue;
          if (Math.random() > 0.7) continue;

          // Height varies within cluster
          const h = Math.max(1, maxHeight - Math.abs(ox) - Math.abs(oz) + Math.floor(Math.random() * 2));

          // Build upward (positive Y) with color gradient
          for (let y = 1; y <= h; y++) {
            // Slight taper at top
            const scale = y === h && h > 2 ? 0.7 : 0.9;
            // Color varies by height: dark base -> main middle -> accent top
            let color;
            if (y === h && h > 2) {
              color = palette.accent;  // Top floor is brightest
            } else if (y > h * 0.6) {
              color = palette.main;    // Upper floors
            } else {
              color = palette.dark;    // Lower floors
            }
            addVoxel(bx, y, bz, color, scale);
          }

          // Antenna/spire on tall buildings
          if (h >= maxHeight - 1 && Math.random() > 0.5) {
            addVoxel(bx, h + 1, bz, palette.glow, 0.3);
          }

          buildingMap.set(key, true);
        }
      }
    }

    // Scatter smaller buildings around platform
    const scatterCount = this.isCapitol ? 35 : 12;
    for (let i = 0; i < scatterCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.3 * r + Math.random() * r * 0.6;
      const bx = Math.round(Math.cos(angle) * dist);
      const bz = Math.round(Math.sin(angle) * dist);
      const key = `${bx},${bz}`;

      if (buildingMap.has(key)) continue;
      if (bx * bx + bz * bz > r * r) continue;

      const h = this.isCapitol ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 2);

      for (let y = 1; y <= h; y++) {
        // Small buildings: dark base, main/accent top
        const color = y === h ? palette.main : palette.dark;
        addVoxel(bx, y, bz, color, 0.8);
      }
      buildingMap.set(key, true);
    }

    // Capitol gets a central tower
    if (this.isCapitol) {
      const towerHeight = 14;
      for (let y = 1; y <= towerHeight; y++) {
        const scale = y < 3 ? 1.3 : (y > towerHeight - 2 ? 0.5 : 0.85);
        addVoxel(0, y, 0, y === towerHeight ? palette.glow : palette.main, scale);
      }
      // Add beacon on top
      addVoxel(0, towerHeight + 1, 0, palette.glow, 0.4);
    }
  }

  update(dt) {
    // Keplerian orbital motion
    this.angle += this.orbitSpeed * dt;

    // Station self-rotation
    this.rotation += this.rotationSpeed * dt;

    this.updatePosition();
  }

  updatePosition() {
    // Orbital position with slight vertical oscillation from tilt
    this.x = Math.cos(this.angle) * this.orbitRadius;
    this.z = Math.sin(this.angle) * this.orbitRadius;
    this.y = Math.sin(this.angle * 2) * Math.sin(this.tilt) * this.orbitRadius * 0.15;
  }

  /**
   * Sort voxels for optimal reveal order: base (bottom) first, growing upward
   * Uses barycenter approach - finds lowest point and grows from there
   */
  sortVoxelsForReveal() {
    // Find the base point (lowest Y voxel - this is where construction starts)
    let minY = Infinity;
    for (const v of this.voxels) {
      if (v.ly < minY) minY = v.ly;
    }

    // Calculate reveal order based on distance from base point
    // Base point is at (0, minY, 0) - center of the lowest level
    for (const v of this.voxels) {
      // Distance from base: primarily Y (height above base), with small XZ spread
      const heightAboveBase = v.ly - minY;
      const horizontalDist = Math.sqrt(v.lx * v.lx + v.lz * v.lz);
      // Grow upward layer by layer, with slight outward spread per layer
      v.revealOrder = heightAboveBase * 10 + horizontalDist * 0.5;
    }

    // Sort ascending: lowest (base) first, highest (top) last
    const sorted = [...this.voxels].sort((a, b) => a.revealOrder - b.revealOrder);
    sorted.forEach((v, i) => v.revealOrder = i);
  }

  /**
   * Start reveal animation for all voxels with staggered timing
   * @param {number} startTime - Game time when reveal starts
   * @param {number} staggerDelay - Delay between each voxel reveal (seconds)
   */
  startReveal(startTime, staggerDelay = 0.02) {
    this.sortVoxelsForReveal();

    for (const v of this.voxels) {
      v.visible = true;
      v.revealTime = startTime + (v.revealOrder * staggerDelay);
      v.revealScale = 0;
    }
  }

  /**
   * Hide all voxels (for narrative reset)
   */
  hideAll() {
    for (const v of this.voxels) {
      v.visible = false;
      v.revealScale = 0;
    }
  }

  /**
   * Update reveal animations using Motion.spring for bouncy pop
   * @param {number} currentTime - Current game time
   */
  updateReveal(currentTime) {
    for (const v of this.voxels) {
      if (!v.visible) continue;

      const elapsed = currentTime - v.revealTime;
      if (elapsed < 0) {
        v.revealScale = 0;
        continue;
      }

      // Minecraft-style instant pop with spring bounce
      const result = Motion.spring(
        0, 1,
        elapsed,
        0.3,  // Quick 0.3s reveal
        false, false,
        { stiffness: 0.8, damping: 0.5 }
      );

      v.revealScale = Math.min(1, result.value);
    }
  }

  getRenderables(renderList) {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    for (const v of this.voxels) {
      // Skip invisible or not-yet-revealed voxels
      if (!v.visible || v.revealScale <= 0.01) continue;

      // Apply station rotation (yaw) to local offset
      const rx = v.lx * cos - v.lz * sin;
      const rz = v.lx * sin + v.lz * cos;
      const ry = -v.ly;  // Flip Y for correct screen orientation (skyline UP, thruster DOWN)

      // World position
      const wx = this.x + rx;
      const wy = this.y + ry;
      const wz = this.z + rz;

      // Project for sorting
      const proj = this.game.camera.project(wx, wy, wz);

      renderList.push({
        type: 'voxel',
        cube: v.cube,
        x: wx,
        y: wy,
        z: wz,
        depth: proj.z,
        scale: proj.scale,
        revealScale: v.revealScale,  // Pass to render for size scaling
      });
    }
  }
}

// ============================================================================
// MAIN GAME CLASS
// ============================================================================

class ForgeStarDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.style.bgColor;
  }

  init() {
    console.log('[Day08] init() called');
    super.init();
    Painter.init(this.ctx);
    this.time = 0;

    const minDim = Math.min(this.width, this.height);
    this.scale = minDim / 600; // Base scale factor

    // Camera setup - only mouse rotation, auto-rotate for ambient motion
    this.camera = new Camera3D({
      perspective: CONFIG.camera.perspective * this.scale,
      rotationX: 0.3,
      rotationY: 0,
      autoRotate: true,
      autoRotateSpeed: CONFIG.camera.autoRotateSpeed,
      inertia: true,
      friction: CONFIG.camera.friction,
      sensitivity: 0.004,
    });
    this.camera.enableMouseControl(this.canvas);

    // Generate background starfield for space immersion
    this.starfield = [];
    const sfConfig = CONFIG.starfield;
    const starPositions = fibonacciSphere(sfConfig.count, sfConfig.radius * this.scale);
    for (const pos of starPositions) {
      this.starfield.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        size: sfConfig.minSize + Math.random() * (sfConfig.maxSize - sfConfig.minSize),
        twinkleOffset: Math.random() * Math.PI * 2,  // Random phase
        brightness: 0.3 + Math.random() * 0.7,       // Varying base brightness
      });
    }
    console.log('[STARFIELD] Created', this.starfield.length, 'stars');

    // Create the blue hypergiant star
    this.star = new Sphere3D(CONFIG.star.radius * this.scale, {
      camera: this.camera,
      useShader: true,
      shaderType: 'star',
      shaderUniforms: {
        uStarColor: CONFIG.star.color,
        uTemperature: CONFIG.star.temperature,
        uActivityLevel: CONFIG.star.activityLevel,
        uRotationSpeed: CONFIG.star.rotationSpeed,
      },
    });

    // Generate Dyson lattice nodes - multiple layers for depth
    this.latticeNodes = [];
    for (const layer of CONFIG.lattice.layers) {
      const layerNodes = fibonacciSphere(layer.count, layer.radius * this.scale);
      for (const node of layerNodes) {
        node.size = layer.size;
        node.layer = layer.radius;
        node.alpha = 0;           // Start invisible
        node.revealTime = 0;      // When to start fading in
      }
      this.latticeNodes.push(...layerNodes);
    }
    this.latticeRotation = 0;
    this.latticeRevealing = false;  // Flag for reveal animation

    // Create orbital stations first (ships need station positions)
    this.stations = [];
    this.createStations(this.scale);

    // Create ships with waypoint routes between lattice and stations
    this.ships = [];
    this.createShips(this.scale);

    // Create energy stream particle system
    this.createEnergyStreams(this.scale);

    // ─────────────────────────────────────────────────────────────────
    // NARRATIVE STATE
    // ─────────────────────────────────────────────────────────────────

    // Create starship - starts far to the left
    this.rocket = new Starship(this);
    const startX = -CONFIG.rocket.startDistance * this.scale;
    this.rocket.setPosition(startX, 0, 0);
    this.rocket.setHeading(0);  // Point right (+X direction)
    this.rocket.visible = true;

    // Narrative control flags
    this.shipsActive = false;           // Ships disabled until EMPIRE
    this.energyParticlesActive = false; // Particles disabled until EMPIRE
    this.latticeVisible = false;        // Lattice disabled until CAPITOL

    // Hide all station voxels for reveal sequence
    for (const station of this.stations) {
      station.hideAll();
    }

    // State machine for narrative phases
    this.initStateMachine();
  }

  createShips(scale) {
    const latticeR = CONFIG.lattice.layers[1].radius * scale; // Middle layer
    const stationR = CONFIG.stations.orbitRadius * scale;
    const stationCount = CONFIG.stations.count;

    for (let i = 0; i < CONFIG.ships.count; i++) {
      let route = [];
      const routeType = i % 4; // 4 types of routes

      if (routeType === 0) {
        // Type 0: Lattice <-> Station (Energy Haulers)
        // Pick a random station
        const station = this.stations[Math.floor(Math.random() * this.stations.length)];
        // Pick a random spot on the lattice
        const angle = Math.random() * Math.PI * 2;
        const latticePoint = {
            x: Math.cos(angle) * latticeR,
            y: (Math.random() - 0.5) * latticeR * 0.4,
            z: Math.sin(angle) * latticeR,
        };
        
        route = [
          { type: 'station', target: station },
          { type: 'space', target: latticePoint }
        ];

      } else if (routeType === 1) {
        // Type 1: Station <-> Station (Passenger/Cargo)
        const s1 = this.stations[Math.floor(Math.random() * this.stations.length)];
        let s2 = this.stations[Math.floor(Math.random() * this.stations.length)];
        while (s1 === s2) {
             s2 = this.stations[Math.floor(Math.random() * this.stations.length)];
        }
        
        route = [
          { type: 'station', target: s1 },
          { type: 'station', target: s2 }
        ];

      } else if (routeType === 2) {
        // Type 2: Patrol (Station -> Space -> Station)
        const s1 = this.stations[Math.floor(Math.random() * this.stations.length)];
        const s2 = this.stations[Math.floor(Math.random() * this.stations.length)];
        
        // Random patrol point
        const angle = Math.random() * Math.PI * 2;
        const patrolPoint = {
            x: Math.cos(angle) * stationR * 1.2,
            y: (Math.random() - 0.5) * stationR * 0.5,
            z: Math.sin(angle) * stationR * 1.2,
        };

        route = [
          { type: 'station', target: s1 },
          { type: 'space', target: patrolPoint },
          { type: 'station', target: s2 }
        ];
      } else {
        // Type 3: Deep Space Haul
        const s1 = this.stations[Math.floor(Math.random() * this.stations.length)];
        const angle = Math.random() * Math.PI * 2;
        const deepSpacePoint = {
            x: Math.cos(angle) * latticeR * 0.5, // Inner system
            y: (Math.random() - 0.5) * latticeR * 0.2,
            z: Math.sin(angle) * latticeR * 0.5,
        };
        
        route = [
          { type: 'station', target: s1 },
          { type: 'space', target: deepSpacePoint }
        ];
      }

      this.ships.push(new Ship(
        i,
        route,
        CONFIG.ships.speed * scale * (0.8 + Math.random() * 0.4)
      ));
    }
  }

  createStations(scale) {
    // Shared orbit speed - all stations rotate together like clock hands
    const sharedOrbitSpeed = 0.025;

    for (let i = 0; i < CONFIG.stations.count; i++) {
      const isCapitol = i === 0;

      // Capitol positioned in FRONT of camera (positive Z) for cinematic reveal
      // Other stations spread evenly starting from opposite side
      let angle;
      if (isCapitol) {
        angle = Math.PI * 0.5;  // Front-center (positive Z axis)
      } else {
        // Spread annexes around the rest of the orbit, starting from back
        const annexIndex = i - 1;
        const annexCount = CONFIG.stations.count - 1;
        angle = Math.PI * 0.5 + ((annexIndex + 1) / (annexCount + 1)) * Math.PI * 2;
      }

      // Vary orbit radius - Capitol (first) is at base radius, others vary
      const baseRadius = CONFIG.stations.orbitRadius * scale;
      const orbitVariance = isCapitol ? 1.0 : 0.85 + Math.random() * 0.3;
      const orbitRadius = baseRadius * orbitVariance;

      this.stations.push(new OrbitalStation(
        this,
        i,
        orbitRadius,
        angle,
        isCapitol,
        sharedOrbitSpeed  // Same speed for all = no drift
      ));
    }
  }

  createEnergyStreams(scale) {
    // Custom updater: color transition from blue to gold over lifetime
    const colorBlueToGold = (particle) => {
      const t = particle.age / particle.lifetime;
      // Interpolate from blue-white to gold
      particle.color.r = Math.round(150 + (255 - 150) * t);
      particle.color.g = Math.round(200 + (200 - 200) * t);
      particle.color.b = Math.round(255 + (100 - 255) * t);
    };

    // Particle system for energy flowing from star to lattice
    this.energyParticles = new ParticleSystem(this, {
      camera: this.camera,
      maxParticles: CONFIG.streams.particleCount,
      blendMode: 'lighter',
      depthSort: true,
      updaters: [
        Updaters.velocity,
        Updaters.lifetime,
        colorBlueToGold,
        Updaters.fadeOut,
        Updaters.shrink(0.3),
      ],
    });

    // Create emitters pointing outward from star surface
    const emitterCount = 8;
    for (let i = 0; i < emitterCount; i++) {
      const theta = (i / emitterCount) * Math.PI * 2;
      const phi = Math.PI * 0.5 + (Math.random() - 0.5) * 0.8;

      const dir = {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
      };

      const starR = CONFIG.star.radius * this.scale;

      this.energyParticles.addEmitter(`stream${i}`, new ParticleEmitter({
        rate: 2,  // Reduced from 8
        position: {
          x: dir.x * starR * 1.2,
          y: dir.y * starR * 1.2,
          z: dir.z * starR * 1.2,
        },
        velocity: {
          x: dir.x * CONFIG.streams.speed * scale,
          y: dir.y * CONFIG.streams.speed * scale,
          z: dir.z * CONFIG.streams.speed * scale,
        },
        velocitySpread: { x: 15, y: 15, z: 15 },
        lifetime: { min: 1.2, max: 2.0 },
        size: { min: 2, max: 4 },
        color: CONFIG.streams.innerColor,
        shape: 'circle',
      }));
    }

    // Don't add to pipeline yet - will be added in EMPIRE phase
    // this.pipeline.add(this.energyParticles);
  }

  /**
   * Start lattice reveal animation - nodes fly from Capitol to final positions
   */
  startLatticeReveal(startTime) {
    this.latticeRevealing = true;
    this.latticeVisible = true;

    // Store final position for each node (start position captured when flight begins)
    for (const node of this.latticeNodes) {
      node.finalX = node.x;
      node.finalY = node.y;
      node.finalZ = node.z;
      node.flightProgress = 0;
      node.flightStarted = false;  // Will capture start pos when flight begins
    }

    // Sort by radius descending (outer first), then by random for stagger within layer
    const sorted = [...this.latticeNodes].sort((a, b) => {
      if (a.layer !== b.layer) return b.layer - a.layer;
      return Math.random() - 0.5;  // Randomize within same layer
    });

    // Assign reveal times - outer first, inner last, with per-node stagger
    const layerDuration = 4.0;  // 4 seconds between layer starts (slower)
    const nodeStagger = 0.08;   // 80ms stagger between nodes in same layer

    // Find max/min radius for normalization
    const maxRadius = Math.max(...CONFIG.lattice.layers.map(l => l.radius));
    const minRadius = Math.min(...CONFIG.lattice.layers.map(l => l.radius));

    let lastLayer = null;
    let nodeIndex = 0;

    sorted.forEach((node) => {
      if (node.layer !== lastLayer) {
        lastLayer = node.layer;
        nodeIndex = 0;
      }

      // Base delay from layer (outer = 0, inner = max)
      const layerProgress = (maxRadius - node.layer) / (maxRadius - minRadius || 1);
      const layerDelay = layerProgress * layerDuration;

      // Additional stagger within layer
      const nodeDelay = nodeIndex * nodeStagger;

      node.revealTime = startTime + layerDelay + nodeDelay;
      nodeIndex++;
    });
  }

  /**
   * Update lattice flight animation - nodes fly from Capitol to final positions
   */
  updateLatticeReveal(currentTime) {
    if (!this.latticeRevealing) return;

    let allDone = true;
    const flightDuration = 2.5;  // Slower: 2.5s per node (was 1.2)
    const capitol = this.stations[0];  // Get current Capitol position

    // Current lattice rotation for target calculation
    const cos = Math.cos(this.latticeRotation);
    const sin = Math.sin(this.latticeRotation);

    for (const node of this.latticeNodes) {
      if (node.flightProgress >= 1) continue;

      const elapsed = currentTime - node.revealTime;
      if (elapsed < 0) {
        node.alpha = 0;
        node.flightProgress = 0;
        // Stay at Capitol's current position (not started yet)
        node.x = capitol.x;
        node.y = capitol.y;
        node.z = capitol.z;
        allDone = false;
      } else {
        // Capture start position when flight begins
        if (!node.flightStarted) {
          node.flightStarted = true;
          node.startX = capitol.x;
          node.startY = capitol.y;
          node.startZ = capitol.z;
        }

        // Calculate rotated target position (where lattice currently is)
        const targetX = node.finalX * cos - node.finalZ * sin;
        const targetZ = node.finalX * sin + node.finalZ * cos;
        const targetY = node.finalY;

        // Flight progress with easing
        const t = Math.min(1, elapsed / flightDuration);
        const eased = t * t * (3 - 2 * t);  // Smoothstep
        node.flightProgress = t;

        // Interpolate position from start to rotated target
        node.x = node.startX + (targetX - node.startX) * eased;
        node.y = node.startY + (targetY - node.startY) * eased;
        node.z = node.startZ + (targetZ - node.startZ) * eased;

        // Fade in during first half of flight
        node.alpha = Math.min(1, t * 2);

        if (node.flightProgress < 1) allDone = false;
      }
    }

    if (allDone) {
      this.latticeRevealing = false;
    }
  }

  /**
   * Update constructor ships - spawning and arrival handling
   * Shared between CAPITOL (starts at 50%) and EMPIRE phases
   */
  updateConstructorShips() {
    // Guard: not yet initialized or spawning not started
    if (!this.constructorShips || !this.constructorSpawningStarted) return;

    // Spawn constructor ships one at a time
    if (this.nextConstructorSpawn < this.constructorShips.length &&
        this.time >= this.nextConstructorSpawnTime) {
      const constructor = this.constructorShips[this.nextConstructorSpawn];
      const ship = this.ships[constructor.shipIndex];
      const capitol = this.stations[0];

      // Set route: Capitol -> target Annex
      ship.route = [
        { type: 'station', target: capitol },
        { type: 'station', target: constructor.annex },
      ];
      ship.routeIndex = 1;  // Start traveling to annex
      ship.speed = CONFIG.ships.constructorSpeed * this.scale;  // Fast!
      ship.spawn(capitol.x, capitol.y, capitol.z);

      console.log(`[FORGE STAR] Constructor ship ${this.nextConstructorSpawn} launched to Annex ${constructor.annexIndex}`);
      this.nextConstructorSpawn++;
      this.nextConstructorSpawnTime = this.time + CONFIG.reveal.annexStagger;
    }

    // Check for constructor ship arrivals
    for (const constructor of this.constructorShips) {
      if (constructor.triggered) continue;

      const ship = this.ships[constructor.shipIndex];
      if (!ship.active) continue;

      // Check if ship arrived at annex (switched to orbit state at annex)
      if (ship.state === 'orbit' && ship.routeIndex === 1) {
        constructor.arrived = true;

        if (!constructor.triggered) {
          constructor.triggered = true;
          console.log(`[FORGE STAR] Constructor arrived - building Annex ${constructor.annexIndex}`);

          // Start this annex's reveal
          constructor.annex.startReveal(this.time, CONFIG.reveal.staggerDelay);
          this.annexesBuilt = (this.annexesBuilt || 0) + 1;

          // Deplete purple ship voxels
          const startIdx = (constructor.annexIndex - 1) * this.voxelsPerAnnex;
          const endIdx = Math.min(startIdx + this.voxelsPerAnnex, this.remainingShipVoxels.length);
          for (let i = startIdx; i < endIdx; i++) {
            if (this.remainingShipVoxels[i]) {
              this.remainingShipVoxels[i].alpha = 0;
            }
          }

          // Set regular ships spawn time after last constructor
          if (this.nextConstructorSpawn >= this.constructorShips.length) {
            this.nextShipSpawnTime = this.time + CONFIG.reveal.shipSpawnInterval;
          }
        }
      }
    }
  }

  initStateMachine() {
    // Track phase elapsed time for animations
    this.phaseTime = 0;

    // Starship approach path: comes from upper-left, settles at "12 o'clock" (top of star)
    const capitol = this.stations[0];
    this.capitolOrbit = {
      radius: capitol.orbitRadius,
      angle: capitol.angle,
    };

    // Ship's final orbit position: TOP of star (12 o'clock = high Y, slight Z offset for visibility)
    const shipOrbitRadius = capitol.orbitRadius * 0.85;
    this.shipOrbit = {
      x: 0,                              // Centered horizontally
      y: shipOrbitRadius * 0.9,          // High above star (12 o'clock)
      z: shipOrbitRadius * 0.4,          // Slight forward offset for camera visibility
    };

    // Start position: left edge of screen, visible in default camera
    // Negative X = left side, positive Z = toward camera (visible)
    this.shipPath = {
      startX: -350 * this.scale,   // Left side of visible area
      startY: 50 * this.scale,     // Slightly above center
      startZ: 200 * this.scale,    // In front (toward camera) so it's visible
      // End position: top of star orbit
      endX: this.shipOrbit.x,
      endY: this.shipOrbit.y,
      endZ: this.shipOrbit.z,
    };

    this.sceneFSM = StateMachine.fromSequence(
      [
        // ─────────────────────────────────────────────────────────────
        // INTRO: Just the star, contemplative silence before the story
        // ─────────────────────────────────────────────────────────────
        {
          name: 'intro',
          duration: CONFIG.phases.intro,
          enter: () => {
            console.log('[FORGE STAR] Phase: INTRO');
            this.phaseTime = 0;

            // Hide everything except star and starfield
            this.rocket.visible = false;
            this.wormhole = null;

            // Slow camera rotation - peaceful contemplation
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed * 0.2;
          },
          update: (dt) => {
            this.phaseTime += dt;
            // Just let the star breathe, nothing else happens
          },
        },

        // ─────────────────────────────────────────────────────────────
        // ARRIVAL: Starship slides in from left, curves into orbit
        // ─────────────────────────────────────────────────────────────
        {
          name: 'arrival',
          duration: CONFIG.phases.arrival,
          enter: () => {
            console.log('[FORGE STAR] Phase: ARRIVAL');
            this.phaseTime = 0;

            // Slow camera rotation - contemplative approach
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed * 0.3;

            // Ship stays hidden until portal opens
            this.rocket.visible = false;

            // Initialize wormhole at ship's starting position (Y is negated like ship position)
            this.wormhole = {
              x: this.shipPath.startX,
              y: -this.shipPath.startY,  // Negate Y to match ship's actual position
              z: this.shipPath.startZ,
              alpha: 0,        // Start invisible
              scale: 0,        // Start at zero size
              rotation: 0,
              active: true,
              spawnTime: CONFIG.wormhole.spawnTime,
              particles: [],
            };

            // Generate wormhole particles (spiral pattern)
            const pCount = CONFIG.wormhole.particleCount;
            for (let i = 0; i < pCount; i++) {
              const angle = (i / pCount) * Math.PI * 2 * 3;  // 3 spiral arms
              const dist = (i / pCount) * CONFIG.wormhole.radius * this.scale;
              this.wormhole.particles.push({
                angle: angle,
                dist: dist,
                speed: 0.5 + Math.random() * 1.5,
                size: 1 + Math.random() * 2,
              });
            }
          },
          update: (dt) => {
            this.phaseTime += dt;
            const duration = CONFIG.phases.arrival;
            const spawnTime = CONFIG.wormhole.spawnTime;

            // Update wormhole - spawn, rotation and fade
            if (this.wormhole && this.wormhole.active) {
              this.wormhole.rotation += CONFIG.wormhole.rotationSpeed * dt;

              const progress = this.phaseTime / duration;
              const spawnProgress = Math.min(1, this.phaseTime / spawnTime);

              // Spawn in (scale up with overshoot)
              if (spawnProgress < 1) {
                // Elastic ease out for punchy spawn
                const sp = spawnProgress;
                const overshoot = Math.sin(sp * Math.PI * 1.5) * 0.2 * (1 - sp);
                this.wormhole.scale = sp + overshoot;
                this.wormhole.alpha = sp;
              } else {
                this.wormhole.scale = 1;

                // Show ship once portal is fully open
                if (!this.rocket.visible) {
                  this.rocket.visible = true;
                }

                // Fade out as ship moves away
                const fadeStart = CONFIG.wormhole.fadeOutStart;
                const fadeEnd = CONFIG.wormhole.fadeOutEnd;

                if (progress < fadeStart) {
                  this.wormhole.alpha = 1;
                } else if (progress > fadeEnd) {
                  this.wormhole.alpha = 0;
                  this.wormhole.active = false;
                } else {
                  this.wormhole.alpha = 1 - (progress - fadeStart) / (fadeEnd - fadeStart);
                }
              }

              // Update particle positions (spiral inward)
              for (const p of this.wormhole.particles) {
                p.angle += p.speed * dt;
              }
            }

            // Ship movement only starts after portal opens
            const shipTime = Math.max(0, this.phaseTime - spawnTime);
            const shipDuration = duration - spawnTime;
            const t = Math.min(1, shipTime / (shipDuration * 0.85));

            // Smooth easing for the approach
            const eased = Easing.easeInOutCubic(t);

            // Simple arc path: stays ABOVE the star at all times
            const x = this.shipPath.startX + (this.shipPath.endX - this.shipPath.startX) * eased;
            const z = this.shipPath.startZ + (this.shipPath.endZ - this.shipPath.startZ) * eased;

            // Y: interpolate but add upward arc to ensure we never dip below end height
            const baseY = this.shipPath.startY + (this.shipPath.endY - this.shipPath.startY) * eased;
            const arcBoost = Math.sin(eased * Math.PI) * this.shipOrbit.y * 0.3;
            const y = -(baseY + arcBoost);  // Negate to go ABOVE star

            this.rocket.setPosition(x, y, z);

            // Calculate heading based on direction of travel (XZ plane)
            const dx = this.shipPath.endX - this.shipPath.startX;
            const dz = this.shipPath.endZ - this.shipPath.startZ;
            const heading = Math.atan2(dz, dx);
            this.rocket.setHeading(heading);
          },
        },

        // ─────────────────────────────────────────────────────────────
        // DEPLOYMENT: Rocket settles, panels deploy, satellites separate
        // ─────────────────────────────────────────────────────────────
        {
          name: 'deployment',
          duration: CONFIG.phases.deployment,
          enter: () => {
            console.log('[FORGE STAR] Phase: DEPLOYMENT');
            this.phaseTime = 0;

            // Ship stays at its orbit position (top of star, 12 o'clock)
            this.rocket.setPosition(this.shipOrbit.x, -this.shipOrbit.y, this.shipOrbit.z);

            // Face forward (toward positive Z / camera)
            this.rocket.setHeading(Math.PI / 2);

            // Tell satellites where to fly (Capitol position)
            const capitol = this.stations[0];
            this.rocket.setCapitolTarget(capitol.x, capitol.y, capitol.z);
          },
          update: (dt) => {
            this.phaseTime += dt;
            const t = this.phaseTime / CONFIG.phases.deployment;

            // Ship stays at top of star during deployment
            this.rocket.setPosition(this.shipOrbit.x, -this.shipOrbit.y, this.shipOrbit.z);

            // Keep facing forward
            this.rocket.setHeading(Math.PI / 2);

            // Update Capitol target continuously (it orbits!)
            const capitol = this.stations[0];
            this.rocket.setCapitolTarget(capitol.x, capitol.y, capitol.z);

            // First half: deploy panels
            if (t < 0.5) {
              this.rocket.deployPanels(t * 2);  // 0 -> 1 over first half
            } else {
              this.rocket.deployPanels(1);
              // Second half: separate satellites
              this.rocket.separateSatellites((t - 0.5) * 2);  // 0 -> 1 over second half
            }
          },
        },

        // ─────────────────────────────────────────────────────────────
        // CAPITOL: Rocket transforms into Capitol station
        // ─────────────────────────────────────────────────────────────
        {
          name: 'capitol',
          duration: CONFIG.phases.capitol,
          enter: () => {
            console.log('[FORGE STAR] Phase: CAPITOL');
            this.phaseTime = 0;

            // Calculate how long the Capitol reveal takes
            const capitol = this.stations[0];
            const revealDuration = capitol.voxels.length * CONFIG.reveal.staggerDelay + 0.5;
            this.capitolRevealDuration = revealDuration;
            this.capitolRevealStartTime = this.time;

            // Start ship disassembly - voxels toggle off as Capitol assembles
            this.rocket.startDisassembly(this.time, revealDuration);

            // Start Capitol reveal with bounce animation
            capitol.startReveal(this.time, CONFIG.reveal.staggerDelay);

            // Start lattice reveal (outer to inner fade)
            this.startLatticeReveal(this.time);

            // Initialize constructor ships NOW (will spawn at 50% Capitol progress)
            const annexCount = this.stations.length - 1;
            this.constructorShips = [];
            this.nextConstructorSpawn = 0;
            this.constructorSpawningStarted = false;

            for (let i = 0; i < annexCount; i++) {
              const annex = this.stations[i + 1];
              this.constructorShips.push({
                shipIndex: i,
                annexIndex: i + 1,
                annex: annex,
                arrived: false,
                triggered: false,
              });
            }

            // Track remaining purple ship voxels for depletion
            this.remainingShipVoxels = this.rocket.voxels.filter(v => v.alpha > 0);
            this.voxelsPerAnnex = Math.ceil(this.remainingShipVoxels.length / annexCount);

            // Activate ships system (but don't spawn regular ships yet)
            this.shipsActive = true;
            this.nextShipToSpawn = annexCount;  // Regular ships start after constructors
            this.nextShipSpawnTime = Infinity;  // Will be set when constructors done
            this.annexesBuilt = 0;

            // Speed up camera slightly
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed * 0.6;
          },
          update: (dt) => {
            this.phaseTime += dt;

            // Update ship disassembly (pass current time)
            this.rocket.updateDisassembly(this.time);

            // Update Capitol reveal animation
            this.stations[0].updateReveal(this.time);

            // Update lattice fade-in
            this.updateLatticeReveal(this.time);

            // Check Capitol progress - start constructor ships at 50%
            const capitolProgress = (this.time - this.capitolRevealStartTime) / this.capitolRevealDuration;
            if (capitolProgress >= 0.5 && !this.constructorSpawningStarted) {
              this.constructorSpawningStarted = true;
              this.nextConstructorSpawnTime = this.time;
              console.log('[FORGE STAR] Capitol at 50% - starting constructor ships');
            }

            // Spawn constructor ships (shared logic with EMPIRE)
            this.updateConstructorShips();
          },
        },

        // ─────────────────────────────────────────────────────────────
        // EMPIRE: Full activity - annexes reveal, ships activate
        // ─────────────────────────────────────────────────────────────
        {
          name: 'empire',
          duration: null,  // Stay forever
          enter: () => {
            console.log('[FORGE STAR] Phase: EMPIRE');
            this.phaseTime = 0;

            // Constructor ships already initialized in CAPITOL phase
            // Just ensure spawning has started (in case we skipped ahead)
            if (!this.constructorSpawningStarted) {
              this.constructorSpawningStarted = true;
              this.nextConstructorSpawnTime = this.time;
            }

            // Energy particles start AFTER most annexes form
            this.energyParticlesActive = false;
            this.annexesBuilt = this.annexesBuilt || 0;

            // Track empire completion state
            this.empireComplete = false;
            this.starTransitionStartTime = null;

            // Full camera rotation speed
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed;
          },
          update: (dt) => {
            this.phaseTime += dt;

            // Update all station reveals
            for (const station of this.stations) {
              station.updateReveal(this.time);
            }

            // Continue spawning constructor ships (shared logic)
            this.updateConstructorShips();

            // Regular ships spawn after all constructors are done
            const annexCount = this.stations.length - 1;
            if (this.annexesBuilt >= annexCount &&
                this.nextShipToSpawn < this.ships.length &&
                this.time >= this.nextShipSpawnTime) {
              const capitol = this.stations[0];
              const ship = this.ships[this.nextShipToSpawn];
              ship.spawn(capitol.x, capitol.y, capitol.z);

              this.nextShipToSpawn++;
              this.nextShipSpawnTime = this.time + CONFIG.reveal.shipSpawnInterval;
            }

            // Start energy particles after most annexes built
            if (!this.energyParticlesActive && this.annexesBuilt >= annexCount - 1) {
              console.log('[FORGE STAR] Energy harvesting begins');
              this.energyParticlesActive = true;
              this.pipeline.add(this.energyParticles);
              for (const [name, emitter] of Object.entries(this.energyParticles.emitters)) {
                emitter.active = true;
              }
            }

            // Check if empire is fully formed
            if (!this.empireComplete &&
                this.annexesBuilt >= annexCount &&
                this.nextShipToSpawn >= this.ships.length) {
              console.log('[FORGE STAR] Empire complete - star transforms');
              this.empireComplete = true;
              this.starTransitionStartTime = this.time;
            }

            // Transition star to purple when empire is complete
            if (this.empireComplete) {
              const transitionDuration = 5.0;  // 5 seconds to fully change
              const elapsed = this.time - this.starTransitionStartTime;
              const t = Math.min(1, elapsed / transitionDuration);

              // Interpolate from blue [0.6, 0.8, 1.0] to purple [0.7, 0.3, 1.0]
              const r = 0.6 + (0.7 - 0.6) * t;
              const g = 0.8 + (0.3 - 0.8) * t;
              const b = 1.0;

              // Update color for our custom star rendering
              this.starColor = { r, g, b };

              // Also update shader if available
              if (this.star && this.star.setShaderUniforms) {
                this.star.setShaderUniforms({
                  uStarColor: [r, g, b],
                  uTime: this.time
                });
              }
            }

            // Continue lattice fade if not done
            this.updateLatticeReveal(this.time);
          },
        },
      ],
      { context: this, loop: false }  // Play once, then idle in EMPIRE
    );
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Update camera
    this.camera.update(dt);

    // Update state machine
    this.sceneFSM.update(dt);

    // Update lattice rotation
    this.latticeRotation += CONFIG.lattice.rotationSpeed * dt;

    // Update rocket (when visible)
    if (this.rocket && this.rocket.visible) {
      this.rocket.update(dt);
    }

    // Update ships (only active ones)
    if (this.shipsActive) {
      for (const ship of this.ships) {
        if (ship.active) {
          ship.update(dt);
        }
      }
    }

    // Update stations
    for (const station of this.stations) {
      station.update(dt);
    }

    // Update star shader time
    if (this.star && this.star.setShaderUniforms) {
      this.star.setShaderUniforms({ uTime: this.time });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Motion blur trail
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.style.trailAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // Collect all renderable items for depth sorting
    const renderList = [];

    // Add stations (as individual voxels)
    for (const station of this.stations) {
       station.getRenderables(renderList);
    }

    // Add rocket (when visible)
    if (this.rocket && this.rocket.visible) {
      this.rocket.getRenderables(renderList);
    }

    // Add star (so it's depth-sorted with everything else)
    const starProj = this.camera.project(0, 0, 0);
    renderList.push({
        type: 'star',
        x: starProj.x,
        y: starProj.y,
        z: starProj.z,
        scale: starProj.scale,
        depth: starProj.z,
    });

    // Add wormhole (when active during ARRIVAL)
    if (this.wormhole && this.wormhole.active && this.wormhole.alpha > 0) {
      const whProj = this.camera.project(this.wormhole.x, this.wormhole.y, this.wormhole.z);
      renderList.push({
        type: 'wormhole',
        x: whProj.x,
        y: whProj.y,
        z: whProj.z,
        scale: whProj.scale,
        depth: whProj.z,
        alpha: this.wormhole.alpha,
        spawnScale: this.wormhole.scale,  // Spawn animation scale
        rotation: this.wormhole.rotation,
        particles: this.wormhole.particles,
      });
    }

    // Add ships (only active ones)
    if (this.shipsActive) {
      for (const ship of this.ships) {
        if (!ship.active) continue;  // Skip inactive ships

        const proj = this.camera.project(ship.x, ship.y, ship.z);
        renderList.push({
          type: 'ship',
          x: proj.x,
          y: proj.y,
          z: proj.z,
          scale: proj.scale,
          depth: proj.z,
          angle: ship.angle,
          trail: ship.trail.map(t => {
            const tp = this.camera.project(t.x, t.y, t.z);
            return { x: tp.x, y: tp.y };
          }),
        });
      }
    }
    
    // Add lattice nodes (only when revealed in CAPITOL+)
    if (this.latticeVisible) {
      for (const node of this.latticeNodes) {
        // Skip if not yet visible
        if (node.alpha <= 0) continue;

        let rx, rz, ry;

        if (node.flightProgress < 1) {
          // Node is still flying - use world space position directly (no rotation)
          rx = node.x;
          ry = node.y;
          rz = node.z;
        } else {
          // Node has arrived - apply lattice rotation to final position
          const cos = Math.cos(this.latticeRotation);
          const sin = Math.sin(this.latticeRotation);
          rx = node.finalX * cos - node.finalZ * sin;
          rz = node.finalX * sin + node.finalZ * cos;
          ry = node.finalY;
        }

        const proj = this.camera.project(rx, ry, rz);
        renderList.push({
          type: 'latticeNode',
          x: proj.x,
          y: proj.y,
          z: proj.z,
          scale: proj.scale,
          depth: proj.z,
          nodeSize: node.size,
          alpha: node.alpha,  // Pass alpha for fade effect
        });
      }
    }

    // Sort by depth (back to front) - using new 'depth' property
    renderList.sort((a, b) => b.depth - a.depth);

    // Render pipeline (includes energy particles)
    super.render();

    // Render background starfield (after super.render clears, before main items)
    if (this.starfield && this.starfield.length > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#ffffff';

      for (const star of this.starfield) {
        const proj = this.camera.project(star.x, star.y, star.z);
        if (proj.scale <= 0) continue;

        // Twinkle effect
        const twinkle = 0.5 + 0.5 * Math.sin(this.time * CONFIG.starfield.twinkleSpeed + star.twinkleOffset);

        ctx.globalAlpha = star.brightness * twinkle;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw sorted items
    ctx.save();
    ctx.translate(cx, cy);

    for (const item of renderList) {
      if (item.scale <= 0) continue;

      switch (item.type) {
        case 'latticeNode':
          this.drawLatticeNode(ctx, item);
          break;
        case 'ship':
          this.drawShipWithTrail(ctx, item);
          break;
        case 'voxel':
          if (item.cube) {
              item.cube.x = item.x;
              item.cube.y = item.y;
              item.cube.z = item.z;

              // Check if we need special rendering (scale or alpha)
              const needsScale = item.revealScale !== undefined && item.revealScale < 1;
              const needsAlpha = item.alpha !== undefined && item.alpha < 1;

              if (needsScale || needsAlpha) {
                ctx.save();

                // Apply alpha for fade out
                if (needsAlpha) {
                  ctx.globalAlpha = Math.max(0, item.alpha);
                }

                // Apply scale for pop-in
                if (needsScale) {
                  const proj = this.camera.project(item.x, item.y, item.z);
                  ctx.translate(proj.x, proj.y);
                  ctx.scale(item.revealScale, item.revealScale);
                  ctx.translate(-proj.x, -proj.y);
                }

                item.cube.draw();
                ctx.restore();
              } else {
                item.cube.draw();
              }
          }
          break;
        case 'star':
          this.drawStarItem(ctx, item);
          break;
        case 'wormhole':
          this.drawWormhole(ctx, item);
          break;
      }
    }

    ctx.restore();
  }

  /**
   * Draw Twilight Princess style wormhole portal
   */
  drawWormhole(ctx, item) {
    const spawnScale = item.spawnScale || 1;
    const baseRadius = CONFIG.wormhole.radius * this.scale * item.scale * spawnScale;
    const colors = CONFIG.wormhole.colors;
    const ringCount = CONFIG.wormhole.ringCount;

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.globalAlpha = item.alpha;
    ctx.globalCompositeOperation = 'lighter';

    // Outer glow
    const outerGlow = ctx.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, baseRadius * 2);
    outerGlow.addColorStop(0, 'rgba(68, 136, 255, 0.3)');
    outerGlow.addColorStop(0.5, 'rgba(170, 136, 255, 0.15)');
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Swirling rings (alternate rotation directions)
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = baseRadius * (0.3 + (i / ringCount) * 0.7);
      const ringRotation = item.rotation * (i % 2 === 0 ? 1 : -0.7) + (i * Math.PI / ringCount);
      const ringAlpha = 0.6 - (i / ringCount) * 0.3;

      ctx.save();
      ctx.rotate(ringRotation);

      // Draw ring segments (broken circle effect)
      const segments = 8;
      const gapRatio = 0.3;
      for (let s = 0; s < segments; s++) {
        const startAngle = (s / segments) * Math.PI * 2;
        const endAngle = startAngle + (Math.PI * 2 / segments) * (1 - gapRatio);

        ctx.strokeStyle = i < ringCount / 2 ? colors.inner : colors.outer;
        ctx.lineWidth = 2 + (ringCount - i) * 0.5;
        ctx.globalAlpha = item.alpha * ringAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, startAngle, endAngle);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Spiral particles
    ctx.globalAlpha = item.alpha * 0.8;
    ctx.fillStyle = colors.particles;
    for (const p of item.particles) {
      const px = Math.cos(p.angle) * p.dist;
      const py = Math.sin(p.angle) * p.dist;
      ctx.beginPath();
      ctx.arc(px, py, p.size * item.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bright core
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.4);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    coreGradient.addColorStop(0.3, 'rgba(200, 180, 255, 0.6)');
    coreGradient.addColorStop(0.7, 'rgba(136, 100, 255, 0.3)');
    coreGradient.addColorStop(1, 'transparent');
    ctx.globalAlpha = item.alpha;
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawStarItem(ctx, item) {
    const gx = item.x;
    const gy = item.y;
    const baseRadius = CONFIG.star.radius * this.scale * item.scale;
    const time = this.time || 0;

    // Get current star color (blue -> purple transition)
    // Default blue: [0.6, 0.8, 1.0], Purple: [0.7, 0.3, 1.0]
    const sc = this.starColor || { r: 0.6, g: 0.8, b: 1.0 };
    const r = Math.floor(sc.r * 255);
    const g = Math.floor(sc.g * 255);
    const b = Math.floor(sc.b * 255);

    // Pulsing intensity
    const pulse = 1 + Math.sin(time * 2) * 0.05 + Math.sin(time * 3.7) * 0.03;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Layer 1: Outer corona (very large, subtle)
    const coronaRadius = baseRadius * 4 * pulse;
    const corona = ctx.createRadialGradient(gx, gy, baseRadius * 0.5, gx, gy, coronaRadius);
    corona.addColorStop(0, `rgba(${r+50}, ${g+50}, ${b}, 0.15)`);
    corona.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.08)`);
    corona.addColorStop(0.6, `rgba(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${b}, 0.03)`);
    corona.addColorStop(1, 'transparent');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(gx, gy, coronaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: Solar flares (spiky rays)
    const flareCount = 12;
    for (let i = 0; i < flareCount; i++) {
      const angle = (i / flareCount) * Math.PI * 2 + time * 0.1;
      const flareLength = baseRadius * (1.5 + Math.sin(time * 2 + i) * 0.5) * pulse;
      const flareWidth = baseRadius * 0.15;

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);

      const flareGrad = ctx.createLinearGradient(baseRadius * 0.8, 0, baseRadius + flareLength, 0);
      flareGrad.addColorStop(0, `rgba(${r+80}, ${g+60}, ${b}, 0.4)`);
      flareGrad.addColorStop(0.3, `rgba(${r+30}, ${g+30}, ${b}, 0.2)`);
      flareGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.moveTo(baseRadius * 0.8, 0);
      ctx.lineTo(baseRadius + flareLength, -flareWidth * 0.3);
      ctx.lineTo(baseRadius + flareLength, flareWidth * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Layer 3: Inner glow halo
    const haloRadius = baseRadius * 2 * pulse;
    const halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, haloRadius);
    halo.addColorStop(0, `rgba(${r+100}, ${g+80}, ${b}, 0.5)`);
    halo.addColorStop(0.2, `rgba(${r+50}, ${g+50}, ${b}, 0.35)`);
    halo.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(gx, gy, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Layer 4: Bright core
    const coreRadius = baseRadius * 1.1;
    const core = ctx.createRadialGradient(gx, gy, 0, gx, gy, coreRadius);
    core.addColorStop(0, 'rgba(255, 255, 255, 1)');
    core.addColorStop(0.3, `rgba(${r+100}, ${g+80}, ${b}, 0.95)`);
    core.addColorStop(0.6, `rgba(${r+50}, ${g+50}, ${b}, 0.8)`);
    core.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, 0.6)`);
    core.addColorStop(1, `rgba(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${b}, 0.3)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(gx, gy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Layer 5: Hot white center
    const hotRadius = baseRadius * 0.4;
    const hot = ctx.createRadialGradient(gx, gy, 0, gx, gy, hotRadius);
    hot.addColorStop(0, 'rgba(255, 255, 255, 1)');
    hot.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    hot.addColorStop(1, 'rgba(230, 245, 255, 0.4)');
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(gx, gy, hotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render the Sphere3D star on top (if using shader)
    if (this.star) {
      ctx.save();
      ctx.globalAlpha = 0.6;  // Blend with our glow effects
      ctx.translate(gx, gy);
      ctx.scale(item.scale, item.scale);
      this.star.x = 0;
      this.star.y = 0;
      this.star.z = 0;
      this.star.draw();
      ctx.restore();
    }
  }

  drawLatticeNode(ctx, item) {
    const size = (item.nodeSize || CONFIG.lattice.nodeSize) * item.scale;
    const alpha = item.alpha !== undefined ? item.alpha : 1;

    // Skip if fully transparent
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow - subtle
    const gradient = ctx.createRadialGradient(
      item.x, item.y, 0,
      item.x, item.y, size * 3
    );
    gradient.addColorStop(0, 'rgba(100, 170, 255, 0.5)');
    gradient.addColorStop(0.4, 'rgba(100, 170, 255, 0.15)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(item.x, item.y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core - brighter
    ctx.fillStyle = CONFIG.lattice.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawShipWithTrail(ctx, item) {
    // Draw trail - teal, fading
    if (item.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(item.trail[0].x, item.trail[0].y);
      for (let i = 1; i < item.trail.length; i++) {
        ctx.lineTo(item.trail[i].x, item.trail[i].y);
      }
      ctx.strokeStyle = CONFIG.ships.trailColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw ship
    drawShip(
      ctx,
      item.x,
      item.y,
      CONFIG.ships.size * item.scale,
      item.angle
    );
  }
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Create Day 8 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day08(canvas) {
  console.log('[Day08] Initializing Forge Star...', canvas);
  const game = new ForgeStarDemo(canvas);
  console.log('[Day08] Game created, starting...');
  game.start();
  console.log('[Day08] Game started');

  return {
    stop: () => game.stop(),
    game,
  };
}

