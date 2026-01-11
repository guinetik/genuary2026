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
    nodeSize: 3,
    rotationSpeed: 0.03,
    color: '#4af',
    // Multiple shell layers
    layers: [
      { radius: 140, count: 80, size: 2 },
      { radius: 160, count: 120, size: 3 },
      { radius: 180, count: 100, size: 2.5 },
    ],
  },

  // Energy streams (star to lattice) - blue near star, gold at lattice
  streams: {
    particleCount: 300,
    speed: 100,
    innerColor: { r: 150, g: 200, b: 255, a: 0.9 },  // Blue-white near star
    outerColor: { r: 255, g: 200, b: 100, a: 0.8 },  // Gold at lattice
  },

  // Ships/drones - teal/green for life
  ships: {
    count: 40,              // Lots of activity
    size: 4,
    speed: 50,
    trailLength: 12,
    color: '#4db',          // Teal
    glowColor: 'rgba(80, 220, 180, 0.8)',
    trailColor: 'rgba(80, 200, 170, 0.4)',
  },

  // Orbital stations - Cloud City style
  stations: {
    count: 5,                 // 1 Capitol + 4 Annexes
    orbitRadius: 280,         // Base orbit distance from star
  },

  // Camera
  camera: {
    perspective: 600,
    autoRotateSpeed: 0.08,
    friction: 0.92,
  },

  // Scene phases (Kurzgesagt-style loop)
  phases: {
    overview: 8,        // Wide view of the whole system
    starFocus: 6,       // Zoom emphasis on star
    latticeFlow: 6,     // Energy harvesting
    shipActivity: 6,    // Cargo/drone traffic
    // Then loops back to overview
  },

  // Visual style
  style: {
    bgColor: '#000',
    glowColor: 'rgba(100, 180, 255, 0.3)',
    trailAlpha: 0.12,
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
    
    this.state = 'travel'; // 'travel' | 'orbit'
    this.stateTimer = 0;
    
    // Orbit/Docking properties
    this.orbitRadius = 25 + Math.random() * 15; // Distance to orbit at
    this.orbitSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.8);
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitTilt = (Math.random() - 0.5) * 1.0;
    
    // Initialize position at first target
    const start = this.getCurrentTargetPos();
    this.x = start.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.y = start.y;
    this.z = start.z + Math.sin(this.orbitAngle) * this.orbitRadius;
    
    this.trail = [];
    this.angle = 0;
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

    // Size scales with Capitol status
    this.baseRadius = isCapitol ? 6 : 3 + Math.floor(Math.random() * 2);
    this.voxelSize = 4;

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
    const palettes = {
      capitol: {
        main: '#fa4',      // Gold
        accent: '#fc8',    // Light gold
        dark: '#a60',      // Dark gold
        glow: '#ff0',      // Bright yellow
        stroke: 'rgba(255, 200, 100, 0.4)'
      },
      // Annex palettes - varied industrial colors
      annex: [
        { // Cyan/Teal
          main: '#0fa',
          accent: '#4fc',
          dark: '#064',
          glow: '#0ff',
          stroke: 'rgba(0, 255, 200, 0.4)'
        },
        { // Blue
          main: '#48f',
          accent: '#8af',
          dark: '#226',
          glow: '#4cf',
          stroke: 'rgba(100, 150, 255, 0.4)'
        },
        { // Purple/Violet
          main: '#a4f',
          accent: '#c8f',
          dark: '#424',
          glow: '#f4f',
          stroke: 'rgba(180, 100, 255, 0.4)'
        },
        { // Green
          main: '#4f4',
          accent: '#8f8',
          dark: '#242',
          glow: '#0f0',
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
        })
      });
    };

    // ─────────────────────────────────────────────────────────────────
    // 1. THRUSTER STEM (extends DOWN from center) - Negative Y
    // ─────────────────────────────────────────────────────────────────
    const thrusterHeight = this.isCapitol ? 8 : 4 + Math.floor(Math.random() * 3);

    // Main thruster column
    for (let y = 1; y <= thrusterHeight; y++) {
      // Taper toward bottom
      const taper = y > thrusterHeight * 0.7 ? 0.7 : 1;
      addVoxel(0, -y, 0, palette.dark, taper);
    }

    // Thruster engine glow at very bottom
    addVoxel(0, -(thrusterHeight + 1), 0, palette.glow, 0.6);

    // Thruster fins (Capitol has more)
    const finCount = this.isCapitol ? 4 : 2;
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
    const clusterCount = this.isCapitol ? 4 : 2;
    for (let c = 0; c < clusterCount; c++) {
      const clusterAngle = (c / clusterCount) * Math.PI * 2 + Math.random() * 0.5;
      const clusterDist = Math.random() * r * 0.5;
      const cx = Math.round(Math.cos(clusterAngle) * clusterDist);
      const cz = Math.round(Math.sin(clusterAngle) * clusterDist);

      // Cluster base height (Capitol has taller buildings)
      const maxHeight = this.isCapitol ? 6 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 3);

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
    const scatterCount = this.isCapitol ? 20 : 10;
    for (let i = 0; i < scatterCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.3 * r + Math.random() * r * 0.6;
      const bx = Math.round(Math.cos(angle) * dist);
      const bz = Math.round(Math.sin(angle) * dist);
      const key = `${bx},${bz}`;

      if (buildingMap.has(key)) continue;
      if (bx * bx + bz * bz > r * r) continue;

      const h = 1 + Math.floor(Math.random() * 2);

      for (let y = 1; y <= h; y++) {
        // Small buildings: dark base, main/accent top
        const color = y === h ? palette.main : palette.dark;
        addVoxel(bx, y, bz, color, 0.8);
      }
      buildingMap.set(key, true);
    }

    // Capitol gets a central tower
    if (this.isCapitol) {
      const towerHeight = 8;
      for (let y = 1; y <= towerHeight; y++) {
        const scale = y < 3 ? 1.2 : (y > towerHeight - 2 ? 0.6 : 0.9);
        addVoxel(0, y, 0, y === towerHeight ? palette.glow : palette.main, scale);
      }
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

  getRenderables(renderList) {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    for (const v of this.voxels) {
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
        scale: proj.scale
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
      }
      this.latticeNodes.push(...layerNodes);
    }
    this.latticeRotation = 0;

    // Create orbital stations first (ships need station positions)
    this.stations = [];
    this.createStations(this.scale);

    // Create ships with waypoint routes between lattice and stations
    this.ships = [];
    this.createShips(this.scale);

    // Create energy stream particle system
    this.createEnergyStreams(this.scale);

    // State machine for scene phases
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
      // Spread stations evenly around orbit (like hours on a clock)
      const angle = (i / CONFIG.stations.count) * Math.PI * 2;

      // Vary orbit radius - Capitol (first) is at base radius, others vary
      const isCapitol = i === 0;
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
        rate: 8,
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

    this.pipeline.add(this.energyParticles);
  }

  initStateMachine() {
    this.sceneFSM = StateMachine.fromSequence(
      [
        {
          name: 'overview',
          duration: CONFIG.phases.overview,
          enter: () => {
            // Wide view - normal auto-rotate
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed;
          },
        },
        {
          name: 'starFocus',
          duration: CONFIG.phases.starFocus,
          enter: () => {
            // Slower rotation to appreciate the star
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed * 0.5;
          },
        },
        {
          name: 'latticeFlow',
          duration: CONFIG.phases.latticeFlow,
          enter: () => {
            // Normal speed
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed;
          },
        },
        {
          name: 'shipActivity',
          duration: CONFIG.phases.shipActivity,
          enter: () => {
            // Slightly faster to catch ship movement
            this.camera.autoRotateSpeed = CONFIG.camera.autoRotateSpeed * 1.2;
          },
        },
      ],
      { context: this, loop: true }
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

    // Update ships
    for (const ship of this.ships) {
      ship.update(dt);
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
    
    // Add ships (update sort key to 'depth')
    for (const ship of this.ships) {
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
    
    // Add lattice nodes
    for (const node of this.latticeNodes) {
      // Apply lattice rotation
      const cos = Math.cos(this.latticeRotation);
      const sin = Math.sin(this.latticeRotation);
      const rx = node.x * cos - node.z * sin;
      const rz = node.x * sin + node.z * cos;

      const proj = this.camera.project(rx, node.y, rz);
      renderList.push({
        type: 'latticeNode',
        x: proj.x,
        y: proj.y,
        z: proj.z,
        scale: proj.scale,
        depth: proj.z,
        nodeSize: node.size,
      });
    }

    // Sort by depth (back to front) - using new 'depth' property
    renderList.sort((a, b) => b.depth - a.depth);

    // Render pipeline (includes energy particles)
    super.render();

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
              item.cube.draw();
          }
          break;
        case 'star':
          this.drawStarItem(ctx, item);
          break;
      }
    }

    ctx.restore();
  }

  drawStarItem(ctx, item) {
     // Render the Sphere3D star
     if (this.star) {
       ctx.save();
       // Translate to projected screen position (context is already at center)
       ctx.translate(item.x, item.y);
       // Scale by perspective
       ctx.scale(item.scale, item.scale);
       // Star is at origin in its local space
       this.star.x = 0;
       this.star.y = 0;
       this.star.z = 0;
       // Draw the star
       this.star.draw();
       ctx.restore();
     }
 
     // Additional glow halo
     const glowRadius = CONFIG.star.radius * this.scale * 2 * item.scale;
     const gx = item.x;
     const gy = item.y;
 
     const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
     gradient.addColorStop(0, 'rgba(150, 200, 255, 0.3)');
     gradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.15)');
     gradient.addColorStop(0.6, 'rgba(80, 150, 255, 0.05)');
     gradient.addColorStop(1, 'transparent');
 
     ctx.fillStyle = gradient;
     ctx.beginPath();
     ctx.arc(gx, gy, glowRadius, 0, Math.PI * 2);
     ctx.fill();
  }

  drawLatticeNode(ctx, item) {
    const size = (item.nodeSize || CONFIG.lattice.nodeSize) * item.scale;

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

