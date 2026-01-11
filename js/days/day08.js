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
    shellRadius: 160,          // Distance from star center
    nodeCount: 200,            // Many more nodes for denser shell
    nodeSize: 3,               // Smaller individual nodes
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

  // Orbital stations - gold/amber for warmth and habitation
  stations: {
    count: 5,
    orbitRadius: 280,
    color: '#fa4',           // Gold/amber
    accentColor: '#fc8',     // Lighter gold
    glowColor: 'rgba(255, 180, 80, 0.5)',
    types: [
      { name: 'hub', size: 20, spokes: 8, rings: 2 },
      { name: 'collector', size: 16, spokes: 6, rings: 1 },
      { name: 'relay', size: 12, spokes: 4, rings: 1 },
      { name: 'dock', size: 24, spokes: 3, rings: 3 },
    ],
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

/**
 * Draw a Cloud City style station - sleek, floating, detailed
 */
function drawStation(ctx, x, y, size, rotation, stationType) {
  ctx.save();
  ctx.translate(x, y);

  // Cloud City stays mostly upright, maybe a slight gentle sway
  const sway = Math.sin(rotation) * 0.08;
  ctx.rotate(sway);

  const type = stationType || { spokes: 6, rings: 1 };
  // Use properties for variety
  const density = (type.spokes || 6) / 2;
  const heightMult = 1 + (type.rings || 1) * 0.2;

  const w = size * 2.5; // Wider relative to base size
  const h = size * 1.1;

  // NEON TRON PALETTE based on station ID or type
  // Use a hash of the name or ID to pick a color
  const hues = [
    { main: '#0ff', glow: 'rgba(0, 255, 255, 0.4)', dark: '#044' }, // Cyan
    { main: '#f0f', glow: 'rgba(255, 0, 255, 0.4)', dark: '#404' }, // Magenta
    { main: '#0f0', glow: 'rgba(0, 255, 0, 0.4)', dark: '#040' },   // Green
    { main: '#ff0', glow: 'rgba(255, 255, 0, 0.4)', dark: '#440' }, // Yellow
    { main: '#f40', glow: 'rgba(255, 64, 0, 0.4)', dark: '#410' },  // Orange
  ];
  const paletteIdx = (type.name.charCodeAt(0) + (type.spokes || 0)) % hues.length;
  const palette = hues[paletteIdx];
  
  const mainColor = palette.main;
  const glowColor = palette.glow;
  const darkColor = 'rgba(10, 10, 15, 0.9)'; // Dark body

  // 1. The Stem (Spire) - extending downwards
  const stemLen = h * 1.0 * heightMult;
  const stemWidth = w * 0.15;

  // Stem Glow
  const stemGrad = ctx.createLinearGradient(0, 0, 0, stemLen);
  stemGrad.addColorStop(0, darkColor);
  stemGrad.addColorStop(0.5, palette.dark);
  stemGrad.addColorStop(1, '#000');

  ctx.beginPath();
  ctx.moveTo(-stemWidth * 0.6, 0);
  ctx.lineTo(-stemWidth * 0.3, stemLen * 0.9);
  ctx.lineTo(0, stemLen); // Tip
  ctx.lineTo(stemWidth * 0.3, stemLen * 0.9);
  ctx.lineTo(stemWidth * 0.6, 0);
  ctx.fillStyle = stemGrad;
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Stem details (vanes)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, stemLen * 0.8);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. The Bulb (Reactor/Sensor pod on stem)
  const bulbY = stemLen * 0.7;
  const bulbSize = stemWidth * 0.8;
  ctx.beginPath();
  ctx.arc(0, bulbY, bulbSize, 0, Math.PI * 2);
  ctx.fillStyle = darkColor;
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.stroke();
  
  // Tiny light on bulb
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 5;
  ctx.shadowColor = mainColor;
  ctx.fillRect(-1, bulbY - 1, 2, 2);
  ctx.shadowBlur = 0;

  // 3. The Main Dish (Saucer)
  // Drawn as a flattened ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, w * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = darkColor;
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Underside details (bowl shape)
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.3, 0, Math.PI, false); // Half circle down
  ctx.fillStyle = palette.dark;
  ctx.fill();
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Cityscape (Buildings on top)
  // Procedural skyline based on station properties
  const buildW = w * 0.08;
  const buildBase = -w * 0.02; // Start slightly above center line

  // Draw buildings from back (edges) to front (center) roughly, 
  // or just draw them and rely on 2D overlap. 
  // Since it's a profile, drawing order matters for overlap.
  // Let's draw center outwards? No, let's draw left to right.
  
  for (let i = -density; i <= density; i++) {
    // Unique seed per building per station
    const seed = Math.abs(Math.sin(i * 12.34 + type.size * 5.67));
    const bh = h * (0.2 + seed * 0.5);
    const bx = i * (buildW * 1.1);
    
    ctx.fillStyle = darkColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;

    // Different shapes based on seed
    if (seed > 0.7) {
        // Spire
        ctx.beginPath();
        ctx.moveTo(bx - buildW/2, buildBase);
        ctx.lineTo(bx, buildBase - bh);
        ctx.lineTo(bx + buildW/2, buildBase);
        ctx.fill();
        ctx.stroke();
    } else if (seed > 0.4) {
        // Dome
        ctx.beginPath();
        ctx.arc(bx, buildBase, bh * 0.6, Math.PI, 0); // Half circle up
        ctx.fill();
        ctx.stroke();
    } else {
        // Block
        ctx.fillRect(bx - buildW/2, buildBase - bh, buildW, bh);
        ctx.strokeRect(bx - buildW/2, buildBase - bh, buildW, bh);
    }

    // Windows / Lights
    ctx.fillStyle = (i === 0) ? '#fff' : glowColor;
    if (seed > 0.3) {
      const winH = 2;
      const winY = buildBase - bh * 0.8;
      ctx.fillRect(bx - 1, winY, 2, winH);
    }
  }

  // 5. Landing Lights / Beacons
  const blink = Math.sin(rotation * 8) > 0.5;
  if (blink) {
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#f55';
    ctx.fillStyle = '#f55'; // Red beacon
    ctx.beginPath();
    ctx.arc(-w * 0.6, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = '#5f5';
    ctx.fillStyle = '#5f5'; // Green beacon
    ctx.beginPath();
    ctx.arc(w * 0.6, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

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
// ORBITAL STATION CLASS
// ============================================================================

class OrbitalStation {
  constructor(id, orbitRadius, orbitSpeed, startAngle, stationType) {
    this.id = id;
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed;
    this.angle = startAngle;
    this.rotation = Math.random() * Math.PI * 2;
    this.tilt = (Math.random() - 0.5) * 0.6; // Slight orbital tilt
    this.stationType = stationType;
    this.size = stationType.size;

    // Calculate initial position immediately so ships can target it
    this.updatePosition();
  }

  update(dt) {
    this.angle += this.orbitSpeed * dt;
    this.rotation += dt * 0.15;
    this.updatePosition();
  }

  updatePosition() {
    // Calculate 3D position on tilted orbit
    this.x = Math.cos(this.angle) * this.orbitRadius;
    this.y = Math.sin(this.angle) * Math.sin(this.tilt) * this.orbitRadius * 0.4;
    this.z = Math.sin(this.angle) * this.orbitRadius;
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
    const types = CONFIG.stations.types;

    for (let i = 0; i < CONFIG.stations.count; i++) {
      const angle = (i / CONFIG.stations.count) * Math.PI * 2;
      const orbitSpeed = 0.025 + Math.random() * 0.02;
      // Vary orbit radius slightly
      const orbitVariance = 0.85 + Math.random() * 0.3;
      // Assign station type (cycle through types)
      const stationType = types[i % types.length];

      this.stations.push(new OrbitalStation(
        i,
        CONFIG.stations.orbitRadius * scale * orbitVariance,
        orbitSpeed,
        angle,
        stationType
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
        nodeSize: node.size,
      });
    }

    // Add ships
    for (const ship of this.ships) {
      const proj = this.camera.project(ship.x, ship.y, ship.z);
      renderList.push({
        type: 'ship',
        x: proj.x,
        y: proj.y,
        z: proj.z,
        scale: proj.scale,
        angle: ship.angle,
        trail: ship.trail.map(t => {
          const tp = this.camera.project(t.x, t.y, t.z);
          return { x: tp.x, y: tp.y };
        }),
      });
    }

    // Add stations
    for (const station of this.stations) {
      const proj = this.camera.project(station.x, station.y, station.z);
      renderList.push({
        type: 'station',
        x: proj.x,
        y: proj.y,
        z: proj.z,
        scale: proj.scale,
        rotation: station.rotation,
        stationType: station.stationType,
        size: station.size,
      });
    }

    // Add star (so it's depth-sorted with everything else)
    const starProj = this.camera.project(0, 0, 0);
    renderList.push({
        type: 'star',
        x: starProj.x,
        y: starProj.y,
        z: starProj.z,
        scale: starProj.scale,
    });

    // Sort by depth (back to front)
    renderList.sort((a, b) => b.z - a.z);

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
        case 'station':
          drawStation(
            ctx,
            item.x,
            item.y,
            item.size * item.scale,
            item.rotation,
            item.stationType
          );
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

