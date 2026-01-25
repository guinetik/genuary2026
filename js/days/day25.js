/**
 * Genuary 2026 - Day 25
 * Prompt: "Organic Geometry"
 * 
 * @fileoverview PRIMORDIAL SOUP - Origin of life simulation
 * 
 * The origin of life: simple molecules in a warm ocean,
 * energized by lightning and hydrothermal vents.
 * Watch complexity emerge as molecules combine.
 * 
 * Refactored to showcase gcanvas 3D features:
 * - Scene3D for automatic depth sorting and projection
 * - Sphere3D for atoms with proper 3D lighting
 * - GameObject for molecule lifecycle management
 * 
 * @author guinetik
 * @credit Manuel Larino - Inspiration
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import {
  Game,
  Painter,
  Camera3D,
  GameObject,
  Motion,
  Easing,
  Screen,
  zoneTemperature,
  thermalBuoyancy,
  heatTransferFalloff,
} from '@guinetik/gcanvas';

const TAU = Math.PI * 2;

const CONFIG = {
  // Molecule counts - scaled by canvas size
  baseMolecules: 40,    // Base count for 1920x1080
  minMolecules: 20,     // Minimum for small screens
  maxMolecules: 200,    // Maximum for 4K screens (soft limit for performance)

  // Camera
  perspective: 800,

  // Heat zones (normalized y: 0 = top, 1 = bottom)
  heatZone: 0.85, // Hydrothermal vent at bottom
  coolZone: 0.15, // Cold surface water at top
  heatRate: 0.008,

  // Thermal physics (buoyancy handles both rise AND sink)
  buoyancyStrength: 80, // Force coefficient
  neutralTemp: 0.5,

  // Movement
  baseSpeed: 15,
  damping: 0.97,
  
  // Organic motion (using Motion.float)
  floatRadius: 60, // How far molecules drift from their path
  floatSpeed: 0.4, // Float animation speed
  floatRandomness: 0.7, // Randomness in float pattern
  
  // Ocean currents (using Motion.oscillate)
  tideStrength: 100, // Horizontal tide force
  tidePeriod: 8, // Seconds per tide cycle

  // Heat transfer between molecules
  heatTransferDist: 80,
  heatTransferRate: 0.02,

  // Reactions
  reactionDistance: 100, // Increased range for more collisions
  reactionCooldown: 0.3,
  baseReactionChance: 0.4, // Much higher base chance

  // Collision / separation
  separationPadding: 0, // No extra padding - only separate when truly overlapping
  separationStiffness: 0.5, // How much of overlap to correct per frame (0-1)
  collisionDamping: 0.25, // Velocity damping on collision (soft bounce)

  // Lightning
  lightningInterval: 4, // Seconds between strikes
  lightningVariance: 2,
  lightningEnergy: 0.4, // Temperature boost
  lightningRadius: 150,

  // Visual - Terminal green aesthetic
  bgColor: '#000',
  ventGlow: 0.3,
  hueBase: 135,      // Green (#0f0)
  hueRange: 30,       // Variation for differentiation

  // Ambient particles
  bubbleCount: 40,
  particleCount: 60,
  causticSpeed: 0.3,
};

// Molecule complexity tiers
const TIERS = {
  PRIMORDIAL: 0, // H2O, CH4, NH3, H2, CO2, H2S
  PRECURSOR: 1, // Formaldehyde, HCN
  AMINO_ACID: 2, // Glycine, Alanine
  PEPTIDE: 3, // Di/tripeptides
};

// Atom visual properties - Terminal green spectrum
// Differentiated by hue offset, saturation, and lightness
const ATOMS = {
  C: { radius: 18, hue: 135, sat: 60, light: 45, name: 'Carbon' },      // Base green
  H: { radius: 10, hue: 150, sat: 40, light: 70, name: 'Hydrogen' },  // Yellow-green, lighter
  O: { radius: 16, hue: 120, sat: 80, light: 50, name: 'Oxygen' },      // Cyan-green, vibrant
  N: { radius: 15, hue: 145, sat: 70, light: 55, name: 'Nitrogen' },  // Yellow-green, medium
  S: { radius: 20, hue: 125, sat: 75, light: 60, name: 'Sulfur' },    // Blue-green, brighter
};

// Molecule templates - primordial soup ingredients
const MOLECULES = {
  // Tier 0: Primordial
  water: {
    name: 'H₂O',
    label: 'Water',
    tier: TIERS.PRIMORDIAL,
    // Bond angle: 104.5° (bent geometry)
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0 },
      { element: 'H', x: -15, y: 12, z: 0 },
      { element: 'H', x: 15, y: 12, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  methane: {
    name: 'CH₄',
    label: 'Methane',
    tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'H', x: 20, y: 20, z: 20 },
      { element: 'H', x: -20, y: -20, z: 20 },
      { element: 'H', x: -20, y: 20, z: -20 },
      { element: 'H', x: 20, y: -20, z: -20 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  ammonia: {
    name: 'NH₃',
    label: 'Ammonia',
    tier: TIERS.PRIMORDIAL,
    // Trigonal pyramidal: N at apex, 3 H form base, ~107° bond angles
    atoms: [
      { element: 'N', x: 0, y: -8, z: 0 },
      { element: 'H', x: 18, y: 10, z: 0 },
      { element: 'H', x: -9, y: 10, z: 16 },
      { element: 'H', x: -9, y: 10, z: -16 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  hydrogen: {
    name: 'H₂',
    label: 'Hydrogen',
    tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'H', x: -12, y: 0, z: 0 },
      { element: 'H', x: 12, y: 0, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
  carbonDioxide: {
    name: 'CO₂',
    label: 'Carbon Dioxide',
    tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: -28, y: 0, z: 0 },
      { element: 'O', x: 28, y: 0, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
  },
  hydrogenSulfide: {
    name: 'H₂S',
    label: 'Hydrogen Sulfide',
    tier: TIERS.PRIMORDIAL,
    // Bond angle: ~92° (more acute than water due to larger S atom)
    atoms: [
      { element: 'S', x: 0, y: 0, z: 0 },
      { element: 'H', x: -12, y: 16, z: 0 },
      { element: 'H', x: 12, y: 16, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },

  // Tier 1: Precursors
  formaldehyde: {
    name: 'CH₂O',
    label: 'Formaldehyde',
    tier: TIERS.PRECURSOR,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: 0, y: -24, z: 0 },
      { element: 'H', x: -18, y: 14, z: 0 },
      { element: 'H', x: 18, y: 14, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  hydrogenCyanide: {
    name: 'HCN',
    label: 'Hydrogen Cyanide',
    tier: TIERS.PRECURSOR,
    atoms: [
      { element: 'H', x: -30, y: 0, z: 0 },
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'N', x: 26, y: 0, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 3 },
    ],
  },

  // Tier 2: Amino Acids
  glycine: {
    name: 'Glycine',
    label: 'Glycine',
    tier: TIERS.AMINO_ACID,
    // NH₂-CH₂-COOH structure
    atoms: [
      { element: 'N', x: -35, y: 0, z: 0 },      // 0: Amino N
      { element: 'C', x: -5, y: 0, z: 0 },       // 1: Alpha C
      { element: 'C', x: 30, y: 0, z: 0 },       // 2: Carboxyl C
      { element: 'O', x: 45, y: -18, z: 0 },     // 3: C=O (carbonyl)
      { element: 'O', x: 45, y: 18, z: 0 },      // 4: O-H (hydroxyl)
      { element: 'H', x: -50, y: -10, z: 0 },    // 5: NH₂ H
      { element: 'H', x: -50, y: 10, z: 0 },     // 6: NH₂ H
      { element: 'H', x: -5, y: 18, z: 10 },     // 7: CH₂ H
      { element: 'H', x: -5, y: 18, z: -10 },    // 8: CH₂ H
      { element: 'H', x: 58, y: 25, z: 0 },      // 9: COOH H
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },  // N-C
      { from: 1, to: 2, order: 1 },  // C-C
      { from: 2, to: 3, order: 2 },  // C=O
      { from: 2, to: 4, order: 1 },  // C-OH
      { from: 0, to: 5, order: 1 },  // N-H
      { from: 0, to: 6, order: 1 },  // N-H
      { from: 1, to: 7, order: 1 },  // C-H
      { from: 1, to: 8, order: 1 },  // C-H
      { from: 4, to: 9, order: 1 },  // O-H
    ],
  },
  alanine: {
    name: 'Alanine',
    label: 'Alanine',
    tier: TIERS.AMINO_ACID,
    // NH₂-CH(CH₃)-COOH structure
    atoms: [
      { element: 'N', x: -40, y: 0, z: 0 },      // 0: Amino N
      { element: 'C', x: -10, y: 0, z: 0 },      // 1: Alpha C
      { element: 'C', x: 25, y: 0, z: 0 },       // 2: Carboxyl C
      { element: 'O', x: 40, y: -18, z: 0 },     // 3: C=O
      { element: 'O', x: 40, y: 18, z: 0 },      // 4: O-H
      { element: 'C', x: -10, y: 0, z: 28 },     // 5: CH₃ (methyl)
      { element: 'H', x: -55, y: -10, z: 0 },    // 6: NH₂ H
      { element: 'H', x: -55, y: 10, z: 0 },     // 7: NH₂ H
      { element: 'H', x: -10, y: 20, z: 0 },     // 8: Alpha C-H
      { element: 'H', x: 53, y: 25, z: 0 },      // 9: COOH H
      { element: 'H', x: -10, y: 10, z: 40 },    // 10: CH₃ H
      { element: 'H', x: -20, y: -8, z: 35 },    // 11: CH₃ H
      { element: 'H', x: 0, y: -8, z: 35 },      // 12: CH₃ H
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },  // N-C
      { from: 1, to: 2, order: 1 },  // C-C
      { from: 2, to: 3, order: 2 },  // C=O
      { from: 2, to: 4, order: 1 },  // C-OH
      { from: 1, to: 5, order: 1 },  // C-CH₃
      { from: 0, to: 6, order: 1 },  // N-H
      { from: 0, to: 7, order: 1 },  // N-H
      { from: 1, to: 8, order: 1 },  // C-H
      { from: 4, to: 9, order: 1 },  // O-H
      { from: 5, to: 10, order: 1 }, // CH₃-H
      { from: 5, to: 11, order: 1 }, // CH₃-H
      { from: 5, to: 12, order: 1 }, // CH₃-H
    ],
  },

  // Tier 3: Simple peptide
  diglycine: {
    name: 'Gly-Gly',
    label: 'Peptide',
    tier: TIERS.PEPTIDE,
    atoms: [
      { element: 'N', x: -60, y: 0, z: 0 },
      { element: 'C', x: -35, y: 0, z: 0 },
      { element: 'C', x: -10, y: 0, z: 0 },
      { element: 'O', x: -10, y: -22, z: 0 },
      { element: 'N', x: 15, y: 0, z: 0 },
      { element: 'C', x: 40, y: 0, z: 0 },
      { element: 'C', x: 65, y: 0, z: 0 },
      { element: 'O', x: 80, y: -18, z: 0 },
      { element: 'O', x: 80, y: 18, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 2, to: 4, order: 1 },
      { from: 4, to: 5, order: 1 },
      { from: 5, to: 6, order: 1 },
      { from: 6, to: 7, order: 2 },
      { from: 6, to: 8, order: 1 },
    ],
  },
};

// Primordial molecules for initial spawn
const PRIMORDIAL_KEYS = [
  'water',
  'methane',
  'ammonia',
  'hydrogen',
  'carbonDioxide',
  'hydrogenSulfide',
];

// Reaction rules - complexity increases with energy
const REACTIONS = [
  // Tier 0 → 1: Primordial to precursors
  {
    reactants: ['methane', 'water'],
    products: ['formaldehyde', 'hydrogen'],
    minTemp: 0.35,
    energy: 0.15,
  },
  {
    reactants: ['ammonia', 'methane'],
    products: ['hydrogenCyanide', 'hydrogen', 'hydrogen'],
    minTemp: 0.4,
    energy: 0.2,
  },
  {
    reactants: ['carbonDioxide', 'hydrogen'],
    products: ['formaldehyde'],
    minTemp: 0.35,
    energy: 0.15,
  },

  // Tier 1 → 2: Precursors to amino acids (Strecker synthesis analog)
  {
    reactants: ['formaldehyde', 'hydrogenCyanide'],
    products: ['glycine'],
    minTemp: 0.45,
    energy: 0.25,
  },
  {
    reactants: ['formaldehyde', 'ammonia'],
    products: ['glycine', 'water'],
    minTemp: 0.5,
    energy: 0.3,
  },
  {
    reactants: ['hydrogenCyanide', 'ammonia'],
    products: ['alanine'],
    minTemp: 0.5,
    energy: 0.3,
  },

  // Tier 2 → 3: Amino acids to peptides
  {
    reactants: ['glycine', 'glycine'],
    products: ['diglycine', 'water'],
    minTemp: 0.55,
    energy: 0.4,
  },
  {
    reactants: ['glycine', 'alanine'],
    products: ['diglycine', 'water'],
    minTemp: 0.55,
    energy: 0.4,
  },
];

/**
 * Molecule3D - A molecule composed of Atom3D children
 * Handles molecular rotation, movement, and thermal physics
 * @extends GameObject
 */
class Molecule3D extends GameObject {
  /**
   * @param {Game} game - Game instance
   * @param {string} templateKey - Key into MOLECULES dictionary
   * @param {Object} options - Position options
   */
  constructor(game, templateKey, options = {}) {
    super(game, options);

    this.templateKey = templateKey;
    this.template = MOLECULES[templateKey];
    this.name = this.template.name;
    this.label = this.template.label;
    this.tier = this.template.tier;

    // 3D position (in world space)
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.z = options.z ?? 0;

    // Velocity
    this.vx = (Math.random() - 0.5) * CONFIG.baseSpeed;
    this.vy = (Math.random() - 0.5) * CONFIG.baseSpeed;
    this.vz = (Math.random() - 0.5) * CONFIG.baseSpeed;

    // Temperature: 0 = cold, 1 = hot
    this.temperature = 0.5;
    this.reactionCooldown = 0;
    this.flash = 0; // Visual flash on reaction

    // Molecular rotation
    this.rotX = Math.random() * TAU;
    this.rotY = Math.random() * TAU;
    this.rotZ = Math.random() * TAU;
    this.rotSpeedX = (Math.random() - 0.5) * 0.5;
    this.rotSpeedY = (Math.random() - 0.5) * 0.5;
    this.rotSpeedZ = (Math.random() - 0.5) * 0.2;

    // Time offsets for staggered animations (stateless Motion needs unique times)
    this.timeOffset = Math.random() * 100;
    this.tideOffset = Math.random() * CONFIG.tidePeriod;
    
    // Base position that convection moves (float orbits around this)
    this.baseX = this.x;
    this.baseY = this.y;
    this.baseZ = this.z;

    // Store atom data for rendering
    this.atomData = this.template.atoms.map((a) => ({
      element: a.element,
      localX: a.x,
      localY: a.y,
      localZ: a.z,
      props: ATOMS[a.element],
      screenX: 0,
      screenY: 0,
      screenScale: 1,
      worldZ: 0,
    }));

    this.bonds = this.template.bonds;

    // Calculate bounding radius
    let maxDist = 0;
    for (const a of this.atomData) {
      const dist = Math.sqrt(a.localX ** 2 + a.localY ** 2 + a.localZ ** 2);
      maxDist = Math.max(maxDist, dist + a.props.radius);
    }
    this.boundingRadius = maxDist;
  }

  /**
   * Update molecule physics and state
   * @param {number} dt - Delta time
   */
  update(dt) {
    super.update(dt);

    const demo = this.game;
    const halfHeight = demo.worldHeight / 2;
    const time = demo.totalTime;
    
    // Normalized Y for temperature zones (0 = top/cold, 1 = bottom/hot)
    const normalizedY = (this.baseY + halfHeight) / demo.worldHeight;

    // === TEMPERATURE ZONE ===
    this.temperature = zoneTemperature(
      Math.max(0, Math.min(1, normalizedY)),
      this.temperature,
      {
        heatZone: CONFIG.heatZone,
        coolZone: CONFIG.coolZone,
        rate: CONFIG.heatRate,
      }
    );

    // === THERMAL CONVECTION (moves base position) ===
    const buoyancy = thermalBuoyancy(
      this.temperature,
      CONFIG.neutralTemp,
      CONFIG.buoyancyStrength
    );
    this.vy -= buoyancy * dt;
    
    // Apply damping to convection velocity
    const dampFactor = Math.pow(CONFIG.damping, dt * 60);
    this.vx *= dampFactor;
    this.vy *= dampFactor;
    this.vz *= dampFactor;
    
    // Update base position with convection
    this.baseX += this.vx * dt;
    this.baseY += this.vy * dt;
    this.baseZ += this.vz * dt;

    // === ORGANIC FLOAT (stateless Motion.float) ===
    // Each molecule has unique time offset for variety
    const myTime = time + this.timeOffset;
    const floatRadius = CONFIG.floatRadius * (0.7 + this.temperature * 0.6);
    
    const floatResult = Motion.float(
      { x: 0, y: 0 }, // Center at origin, we add offset to base
      myTime,
      15, // Duration of one float cycle
      CONFIG.floatSpeed * (0.8 + this.temperature * 0.4),
      CONFIG.floatRandomness,
      floatRadius,
      true,
      Easing.smoothstep
    );

    // === OCEAN TIDES (stateless Motion.oscillate) ===
    const tideTime = time + this.tideOffset;
    const tideResult = Motion.oscillate(
      -CONFIG.tideStrength,
      CONFIG.tideStrength,
      tideTime,
      CONFIG.tidePeriod,
      true,
      Easing.easeInOutSine
    );
    
    // Depth affects tide - surface stronger
    const depthFactor = 1 - normalizedY * 0.4;
    const tideX = tideResult.value * depthFactor;

    // === FINAL POSITION ===
    // Base (from convection) + float offset + tide offset
    this.x = this.baseX + floatResult.offsetX + tideX;
    this.y = this.baseY + floatResult.offsetY * 0.3; // Less vertical float
    this.z = this.baseZ + floatResult.offsetY * 0.5; // Use float Y for Z depth

    // Tumble based on velocity - rotation coupled to motion
    // Velocity magnitude affects tumble intensity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
    const tumbleIntensity = 0.02 + speed * 0.008;
    
    // Cross-axis rotation: moving in X causes Y/Z rotation, etc.
    // This creates a "rolling through fluid" effect
    this.rotX += (this.vy * 0.015 + this.rotSpeedX * 0.3) * tumbleIntensity * dt * 60;
    this.rotY += (this.vx * 0.015 + this.rotSpeedY * 0.3) * tumbleIntensity * dt * 60;
    this.rotZ += (this.vz * 0.01 + this.rotSpeedZ * 0.2) * tumbleIntensity * dt * 60;

    // Decay cooldown and flash
    if (this.reactionCooldown > 0) this.reactionCooldown -= dt;
    if (this.flash > 0) this.flash -= dt * 2;
  }

  /**
   * Project atoms through camera and render
   * @param {number} cx - Screen center X
   * @param {number} cy - Screen center Y
   */
  render(cx, cy) {
    if (!this.visible) return;

    const ctx = Painter.ctx;
    const camera = this.game.camera;

    // Pre-compute rotation matrices
    const cosX = Math.cos(this.rotX),
      sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY),
      sinY = Math.sin(this.rotY);
    const cosZ = Math.cos(this.rotZ),
      sinZ = Math.sin(this.rotZ);

    // Project each atom
    for (const atom of this.atomData) {
      let x = atom.localX,
        y = atom.localY,
        z = atom.localZ;

      // Rotate X
      let ty = y * cosX - z * sinX;
      let tz = y * sinX + z * cosX;
      y = ty;
      z = tz;

      // Rotate Y
      let tx = x * cosY + z * sinY;
      tz = -x * sinY + z * cosY;
      x = tx;
      z = tz;

      // Rotate Z
      tx = x * cosZ - y * sinZ;
      ty = x * sinZ + y * cosZ;
      x = tx;
      y = ty;

      // World position
      const worldX = this.x + x;
      const worldY = this.y + y;
      const worldZ = this.z + z;

      const proj = camera.project(worldX, worldY, worldZ);
      atom.screenX = cx + proj.x;
      atom.screenY = cy + proj.y;
      atom.screenScale = proj.scale;
      atom.worldZ = proj.z;
    }

    // Sort atoms by depth for rendering
    const sortedAtoms = [...this.atomData].sort((a, b) => a.worldZ - b.worldZ);

    // Render bonds first (behind atoms)
    this._renderBonds(ctx);

    // Render atoms
    for (const atom of sortedAtoms) {
      this._renderAtom(ctx, atom);
    }
  }

  /**
   * Render bonds between atoms
   * @param {CanvasRenderingContext2D} ctx
   * @private
   */
  _renderBonds(ctx) {
    for (const bond of this.bonds) {
      const a1 = this.atomData[bond.from];
      const a2 = this.atomData[bond.to];
      if (a1.screenScale <= 0 || a2.screenScale <= 0) continue;

      const avgScale = (a1.screenScale + a2.screenScale) / 2;

      // Depth affects lightness
      const avgZ = (a1.worldZ + a2.worldZ) / 2;
      const depthLightMod = Math.max(-10, Math.min(10, avgZ / 40));

      // Temperature affects bond color - green spectrum
      const tempHue = Math.round(CONFIG.hueBase + (this.temperature - 0.5) * CONFIG.hueRange);
      const bondLight = Math.round(40 + depthLightMod + this.temperature * 15);
      const bondSat = Math.round(50 + this.temperature * 30);
      ctx.strokeStyle = `hsl(${tempHue}, ${bondSat}%, ${bondLight}%)`;
      ctx.lineWidth = 3 * avgScale;
      ctx.lineCap = 'round';

      if (bond.order === 1) {
        ctx.beginPath();
        ctx.moveTo(a1.screenX, a1.screenY);
        ctx.lineTo(a2.screenX, a2.screenY);
        ctx.stroke();
      } else if (bond.order >= 2) {
        const dx = a2.screenX - a1.screenX;
        const dy = a2.screenY - a1.screenY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const gap = 4 * avgScale;
        const nx = (-dy / len) * gap;
        const ny = (dx / len) * gap;

        ctx.lineWidth = 2 * avgScale;
        for (let i = 0; i < bond.order; i++) {
          const offset = i - (bond.order - 1) / 2;
          ctx.beginPath();
          ctx.moveTo(a1.screenX + nx * offset, a1.screenY + ny * offset);
          ctx.lineTo(a2.screenX + nx * offset, a2.screenY + ny * offset);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Render a single atom with gradient
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} atom - Atom data
   * @private
   */
  _renderAtom(ctx, atom) {
    if (atom.screenScale <= 0) return;

    const props = atom.props;
    const radius = props.radius * atom.screenScale;

    // Depth affects lightness
    const depthLightMod = Math.max(-15, Math.min(10, atom.worldZ / 30));

    // Temperature-shifted colors - subtle green variations
    const tempShift = (this.temperature - 0.5) * 15; // Smaller shift for cohesion
    const hue = Math.round(props.hue + tempShift);
    const sat = Math.round(Math.min(100, props.sat + this.temperature * 15));
    const light = Math.round(props.light + depthLightMod);

    // Reaction flash - green glow
    if (this.flash > 0) {
      const flashRadius = radius * (2 + this.flash);
      const flashGrad = ctx.createRadialGradient(
        atom.screenX,
        atom.screenY,
        0,
        atom.screenX,
        atom.screenY,
        flashRadius
      );
      flashGrad.addColorStop(0, `rgba(0, 255, 100, ${this.flash * 0.8})`);
      flashGrad.addColorStop(0.4, `rgba(0, 255, 50, ${this.flash * 0.4})`);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(atom.screenX, atom.screenY, flashRadius, 0, TAU);
      ctx.fill();
    }

    // Atom sphere with terminal-style gradient (sharper, less photorealistic)
    const grad = ctx.createRadialGradient(
      atom.screenX - radius * 0.4,
      atom.screenY - radius * 0.4,
      0,
      atom.screenX,
      atom.screenY,
      radius
    );
    // More defined gradient stops for terminal aesthetic - round all HSL values
    const sat1 = Math.round(Math.min(sat + 20, 100));
    const light1 = Math.round(Math.min(light + 30, 90));
    const light2 = Math.round(Math.max(light - 15, 20));
    const sat2 = Math.round(Math.min(sat + 10, 100));
    const light3 = Math.round(Math.max(light - 25, 10));
    
    grad.addColorStop(0, `hsl(${hue}, ${sat1}%, ${light1}%)`);
    grad.addColorStop(0.3, `hsl(${hue}, ${sat}%, ${light}%)`);
    grad.addColorStop(0.7, `hsl(${hue}, ${sat}%, ${light2}%)`);
    grad.addColorStop(1, `hsl(${hue}, ${sat2}%, ${light3}%)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(atom.screenX, atom.screenY, radius, 0, TAU);
    ctx.fill();
    
    // Add subtle outline for definition (terminal style)
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  /**
   * Get bounds for Scene3D depth sorting
   * @returns {Object}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.boundingRadius * 2,
      height: this.boundingRadius * 2,
    };
  }
}

/**
 * Primordial Soup Demo - Main game class
 * Uses Scene3D for automatic 3D management of Molecule3D objects
 */
/**
 * Primordial Soup Demo
 * 
 * Main game class for Day 25, creating a molecular simulation where
 * simple molecules combine to form complex structures in a warm ocean.
 * 
 * @class PrimordialSoupDemo
 * @extends {Game}
 */
class PrimordialSoupDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.bgColor;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Setup camera
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: 0.2,
      rotationY: 0,
      inertia: true,
      friction: 0.95,
      clampX: false,
      clampY: false,
    });
    this.camera.enableMouseControl(this.canvas);

    // Disable double-click reset
    this.canvas.removeEventListener(
      'dblclick',
      this.camera._boundHandlers.dblclick
    );

    // Store molecules (we render manually for proper bond/atom control)
    this.molecules = [];
    
    // Screen center for rendering
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.reactionLog = [];
    this.totalTime = 0;
    this.nextLightning = CONFIG.lightningInterval;

    // Stats
    this.stats = { reactions: 0, maxTier: 0 };

    // World bounds
    this.worldWidth = this.width * 0.8;
    this.worldHeight = this.height * 0.9;

    // Calculate scale based on canvas size
    // Reference: 1920x1080 = ~2M pixels
    const refPixels = 1920 * 1080;
    const currentPixels = this.width * this.height;
    const scale = currentPixels / refPixels;
    
    // Scale molecule count proportionally
    this.moleculeCount = Math.floor(
      Math.min(CONFIG.maxMolecules,
        Math.max(CONFIG.minMolecules, CONFIG.baseMolecules * scale))
    );
    
    // Scale ambient effects too
    const bubbleCount = Math.floor(CONFIG.bubbleCount * Math.max(0.5, scale));
    const particleCount = Math.floor(CONFIG.particleCount * Math.max(0.5, scale));
    
    console.log(`[Day25] Canvas: ${this.width}x${this.height}, scale: ${scale.toFixed(2)}, molecules: ${this.moleculeCount}, bubbles: ${bubbleCount}, particles: ${particleCount}`);

    // Ambient bubbles
    this.bubbles = [];
    for (let i = 0; i < bubbleCount; i++) {
      this.bubbles.push(this.createBubble(true));
    }

    // Floating particles
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }

    // Spawn primordial molecules
    for (let i = 0; i < this.moleculeCount; i++) {
      this.spawnMolecule(true);
    }

    // Track drag vs click
    let dragStart = null;
    this.canvas.addEventListener('mousedown', (e) => {
      dragStart = { x: e.clientX, y: e.clientY };
    });

    // Click spawns new primordial molecule
    this.canvas.addEventListener('mouseup', (e) => {
      if (dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragStart = null;
          return;
        }
      }
      dragStart = null;

      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left - this.width / 2;
      const screenY = e.clientY - rect.top - this.height / 2;

      // Unproject through camera rotation
      const cosX = Math.cos(-this.camera.rotationX);
      const sinX = Math.sin(-this.camera.rotationX);
      const cosY = Math.cos(-this.camera.rotationY);
      const sinY = Math.sin(-this.camera.rotationY);

      let x = screenX;
      let y = screenY;
      let z = (Math.random() - 0.5) * 100;

      const tx = x * cosY - z * sinY;
      const tz = x * sinY + z * cosY;
      x = tx;
      z = tz;

      const ty = y * cosX - z * sinX;
      const tz2 = y * sinX + z * cosX;
      y = ty;
      z = tz2;

      const mol = this.spawnMolecule(true, x, y, z, undefined, true);
      if (mol) {
        this.reactionLog.unshift({
          text: `+ ${mol.label} (${mol.name})`,
          time: 2,
        });
        if (this.reactionLog.length > 5) this.reactionLog.pop();
      }
    });
  }

  /**
   * Create an ambient bubble
   * @param {boolean} randomY - Start at random Y position
   * @returns {Object}
   */
  createBubble(randomY = false) {
    const spread = this.width * 0.3;
    return {
      x: this.width / 2 + (Math.random() - 0.5) * spread,
      y: randomY ? Math.random() * this.height : this.height + Math.random() * 50,
      size: 2 + Math.random() * 6,
      speed: 30 + Math.random() * 50,
      wobblePhase: Math.random() * TAU,
      wobbleSpeed: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.3,
    };
  }

  /**
   * Create a floating particle
   * @returns {Object}
   */
  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: (Math.random() - 0.5) * 400,
      size: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 5,
      alpha: 0.05 + Math.random() * 0.15,
      hue: Math.random() < 0.5 ? CONFIG.hueBase - 10 : CONFIG.hueBase + 10, // Green variations
    };
  }

  /**
   * Spawn a new molecule
   * @param {boolean} primordialOnly - Only spawn primordial molecules
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {string} templateKey - Specific molecule type
   * @param {boolean} ignoreLimit - Bypass molecule limit
   * @returns {Molecule3D|null}
   */
  spawnMolecule(primordialOnly = false, x, y, z, templateKey, ignoreLimit = false) {
    // Use scaled soft limit (3x initial count, capped at maxMolecules)
    const softLimit = Math.min(CONFIG.maxMolecules, (this.moleculeCount || CONFIG.baseMolecules) * 3);
    if (!ignoreLimit && this.molecules.length >= softLimit) return null;

    const key =
      templateKey ||
      (primordialOnly
        ? PRIMORDIAL_KEYS[Math.floor(Math.random() * PRIMORDIAL_KEYS.length)]
        : Object.keys(MOLECULES)[
            Math.floor(Math.random() * Object.keys(MOLECULES).length)
          ]);

    const px = x ?? (Math.random() - 0.5) * this.worldWidth;
    const py = y ?? (Math.random() - 0.5) * this.worldHeight;
    const pz = z ?? (Math.random() - 0.5) * 200;

    const mol = new Molecule3D(this, key, { x: px, y: py, z: pz });
    this.molecules.push(mol);
    return mol;
  }

  /**
   * Trigger lightning strike
   */
  lightning() {
    const lx = (Math.random() - 0.5) * this.worldWidth;
    const ly = (Math.random() - 0.5) * this.worldHeight * 0.5;
    const lz = (Math.random() - 0.5) * 150;

    for (const mol of this.molecules) {
      const dx = mol.x - lx;
      const dy = mol.y - ly;
      const dz = mol.z - lz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < CONFIG.lightningRadius) {
        const intensity = 1 - dist / CONFIG.lightningRadius;
        mol.temperature = Math.min(
          1,
          mol.temperature + CONFIG.lightningEnergy * intensity
        );
        mol.flash = Math.max(mol.flash, intensity * 0.5);
      }
    }

    this.lightningFlash = { x: lx, y: ly, z: lz, intensity: 1 };
  }

  /**
   * Check for and process chemical reactions
   */
  checkReactions() {
    const toRemove = new Set();
    const toAdd = [];

    for (let i = 0; i < this.molecules.length; i++) {
      const mol1 = this.molecules[i];
      if (mol1.reactionCooldown > 0 || toRemove.has(i)) continue;

      for (let j = i + 1; j < this.molecules.length; j++) {
        const mol2 = this.molecules[j];
        if (mol2.reactionCooldown > 0 || toRemove.has(j)) continue;

        const dx = mol2.x - mol1.x;
        const dy = mol2.y - mol1.y;
        const dz = mol2.z - mol1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > CONFIG.reactionDistance) continue;

        const avgTemp = (mol1.temperature + mol2.temperature) / 2;

        for (const reaction of REACTIONS) {
          const [r1, r2] = reaction.reactants;
          const matches =
            (mol1.templateKey === r1 && mol2.templateKey === r2) ||
            (mol1.templateKey === r2 && mol2.templateKey === r1);

          if (!matches) continue;

          const chance = CONFIG.baseReactionChance * (avgTemp / reaction.minTemp);
          if (avgTemp < reaction.minTemp * 0.8 || Math.random() > chance) continue;

          // Reaction!
          toRemove.add(i);
          toRemove.add(j);

          const midX = (mol1.x + mol2.x) / 2;
          const midY = (mol1.y + mol2.y) / 2;
          const midZ = (mol1.z + mol2.z) / 2;

          for (const productKey of reaction.products) {
            if (!MOLECULES[productKey]) continue;

            const offset = (Math.random() - 0.5) * 20;
            const product = new Molecule3D(this, productKey, {
              x: midX + offset,
              y: midY + offset,
              z: midZ + offset,
            });
            product.temperature = avgTemp;
            product.flash = reaction.energy;
            product.reactionCooldown = CONFIG.reactionCooldown;
            product.vx = (mol1.vx + mol2.vx) / 2 + (Math.random() - 0.5) * 15;
            product.vy = (mol1.vy + mol2.vy) / 2 + (Math.random() - 0.5) * 15;
            product.vz = (mol1.vz + mol2.vz) / 2 + (Math.random() - 0.5) * 15;
            toAdd.push(product);

            this.stats.maxTier = Math.max(this.stats.maxTier, product.tier);
          }

          this.stats.reactions++;
          const formatMol = (m) => `${m.label} (${m.name})`;
          const reactantLabels = [formatMol(mol1), formatMol(mol2)].join(' + ');
          const productLabels = reaction.products
            .map((k) => {
              const m = MOLECULES[k];
              return m ? `${m.label} (${m.name})` : k;
            })
            .join(' + ');
          this.reactionLog.unshift({
            text: `${reactantLabels} → ${productLabels}`,
            time: 4,
          });
          if (this.reactionLog.length > 5) this.reactionLog.pop();

          break;
        }
      }
    }

    // Remove reacted molecules
    this.molecules = this.molecules.filter((_, i) => !toRemove.has(i));

    // Add new products
    for (const p of toAdd) {
      this.molecules.push(p);
    }
  }

  /**
   * Apply position-based separation between overlapping molecules (3D collision)
   * Uses soft constraint resolution - molecules gently push apart over frames
   * @param {number} dt - Delta time (unused, position-based)
   */
  applySeparation(dt) {
    const padding = CONFIG.separationPadding;
    const stiffness = CONFIG.separationStiffness;
    const damping = CONFIG.collisionDamping;

    for (let i = 0; i < this.molecules.length; i++) {
      const m1 = this.molecules[i];
      const r1 = m1.boundingRadius + padding;

      for (let j = i + 1; j < this.molecules.length; j++) {
        const m2 = this.molecules[j];
        const r2 = m2.boundingRadius + padding;

        // Distance between centers
        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dz = m2.z - m1.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = r1 + r2;

        // Check for overlap
        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          
          // Normalized direction from m1 to m2
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          // Position correction - split evenly between both molecules
          const correction = overlap * stiffness * 0.5;
          
          // Push apart (m1 moves opposite to direction, m2 moves along direction)
          m1.baseX -= nx * correction;
          m1.baseY -= ny * correction;
          m1.baseZ -= nz * correction;
          m2.baseX += nx * correction;
          m2.baseY += ny * correction;
          m2.baseZ += nz * correction;

          // Soft velocity damping on collision (prevents molecules from rushing back)
          // Project velocities onto collision normal and dampen
          const v1n = m1.vx * nx + m1.vy * ny + m1.vz * nz; // m1 velocity along normal
          const v2n = m2.vx * nx + m2.vy * ny + m2.vz * nz; // m2 velocity along normal
          
          // Only dampen if molecules are moving toward each other
          if (v1n > v2n) {
            const relVel = v1n - v2n;
            const impulse = relVel * damping;
            
            m1.vx -= nx * impulse * 0.5;
            m1.vy -= ny * impulse * 0.5;
            m1.vz -= nz * impulse * 0.5;
            m2.vx += nx * impulse * 0.5;
            m2.vy += ny * impulse * 0.5;
            m2.vz += nz * impulse * 0.5;
          }
        }
      }
    }
  }

  /**
   * Heat transfer between nearby molecules
   */
  heatTransfer() {
    for (let i = 0; i < this.molecules.length; i++) {
      const m1 = this.molecules[i];
      for (let j = i + 1; j < this.molecules.length; j++) {
        const m2 = this.molecules[j];

        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dz = m2.z - m1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONFIG.heatTransferDist) {
          const delta = heatTransferFalloff(
            m1.temperature,
            m2.temperature,
            dist,
            CONFIG.heatTransferDist,
            CONFIG.heatTransferRate,
            1
          );
          m1.temperature = Math.max(0, Math.min(1, m1.temperature + delta));
          m2.temperature = Math.max(0, Math.min(1, m2.temperature - delta));
        }
      }
    }
  }

  /**
   * Main update loop
   * @param {number} dt - Delta time
   */
  update(dt) {
    super.update(dt);
    this.camera.update(dt);
    this.totalTime += dt;

    // Lightning timer
    this.nextLightning -= dt;
    if (this.nextLightning <= 0) {
      this.lightning();
      this.nextLightning =
        CONFIG.lightningInterval +
        (Math.random() - 0.5) * CONFIG.lightningVariance * 2;
    }

    // Decay lightning flash
    if (this.lightningFlash) {
      this.lightningFlash.intensity -= dt * 3;
      if (this.lightningFlash.intensity <= 0) this.lightningFlash = null;
    }

    // Update bubbles
    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.wobblePhase += b.wobbleSpeed * dt;
      b.x += Math.sin(b.wobblePhase) * 0.5;

      if (b.y < -20) {
        Object.assign(b, this.createBubble(false));
      }
    }

    // Update floating particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.vx +=
        (Math.sin(this.totalTime * 0.5 + p.y * 0.01) * 2 - p.vx * 0.1) * dt;
      p.vy +=
        (Math.cos(this.totalTime * 0.3 + p.x * 0.01) * 1 - p.vy * 0.1) * dt;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }

    // Update molecules
    for (const mol of this.molecules) {
      mol.update(dt);
      
      // Soft boundaries
      const margin = 50;
      if (mol.x < -this.worldWidth / 2 - margin) mol.vx += 50 * dt;
      if (mol.x > this.worldWidth / 2 + margin) mol.vx -= 50 * dt;
      if (mol.y < -this.worldHeight / 2 - margin) mol.vy += 50 * dt;
      if (mol.y > this.worldHeight / 2 + margin) mol.vy -= 50 * dt;
      if (mol.z < -200) mol.vz += 30 * dt;
      if (mol.z > 200) mol.vz -= 30 * dt;
    }

    // Collision separation, heat transfer, and reactions
    this.applySeparation(dt);
    this.heatTransfer();
    this.checkReactions();

    // Decay log
    for (const log of this.reactionLog) log.time -= dt;
    this.reactionLog = this.reactionLog.filter((l) => l.time > 0);
  }

  /**
   * Main render loop
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Pure black background with subtle green vignette
    ctx.fillStyle = CONFIG.bgColor;
    ctx.fillRect(0, 0, w, h);
    
    // Subtle green gradient overlay (very dark)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, 'rgba(0, 15, 5, 0.3)');
    bgGrad.addColorStop(0.5, 'rgba(0, 10, 5, 0.2)');
    bgGrad.addColorStop(1, 'rgba(0, 20, 10, 0.4)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle green light patterns (generative, not realistic)
    ctx.globalAlpha = 0.02;
    const causticScale = 120;
    const t = this.totalTime * CONFIG.causticSpeed;
    for (let i = 0; i < 5; i++) {
      const phase = i * 1.3 + t;
      const cx1 = w * 0.3 + Math.sin(phase) * w * 0.2;
      const cy1 = h * 0.2 + Math.cos(phase * 0.7) * h * 0.1;
      const cx2 = w * 0.7 + Math.sin(phase * 0.8 + 2) * w * 0.2;
      const cy2 = h * 0.3 + Math.cos(phase * 0.5 + 1) * h * 0.1;

      const causticGrad = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, causticScale);
      causticGrad.addColorStop(0, 'rgba(0, 255, 100, 1)');
      causticGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = causticGrad;
      ctx.fillRect(0, 0, w, h);

      const causticGrad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, causticScale * 0.8);
      causticGrad2.addColorStop(0, 'rgba(0, 255, 150, 1)');
      causticGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = causticGrad2;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Energy source glow - green (generative, not realistic vent)
    const ventGrad = ctx.createRadialGradient(cx, h + 50, 0, cx, h + 50, h * 0.7);
    ventGrad.addColorStop(0, `rgba(0, 255, 100, ${CONFIG.ventGlow})`);
    ventGrad.addColorStop(0.3, `rgba(0, 255, 50, ${CONFIG.ventGlow * 0.5})`);
    ventGrad.addColorStop(0.6, `rgba(0, 200, 30, ${CONFIG.ventGlow * 0.2})`);
    ventGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ventGrad;
    ctx.fillRect(0, 0, w, h);

    // Secondary energy hotspots
    const vent2Grad = ctx.createRadialGradient(
      cx - w * 0.2, h + 30, 0,
      cx - w * 0.2, h + 30, h * 0.3
    );
    vent2Grad.addColorStop(0, `rgba(0, 255, 80, ${CONFIG.ventGlow * 0.4})`);
    vent2Grad.addColorStop(1, 'transparent');
    ctx.fillStyle = vent2Grad;
    ctx.fillRect(0, 0, w, h);

    const vent3Grad = ctx.createRadialGradient(
      cx + w * 0.25, h + 40, 0,
      cx + w * 0.25, h + 40, h * 0.35
    );
    vent3Grad.addColorStop(0, `rgba(0, 255, 60, ${CONFIG.ventGlow * 0.3})`);
    vent3Grad.addColorStop(1, 'transparent');
    ctx.fillStyle = vent3Grad;
    ctx.fillRect(0, 0, w, h);

    // Floating particles (behind molecules) - green spectrum
    for (const p of this.particles) {
      const depthScale = 0.5 + ((p.z + 200) / 400) * 0.5;
      // Use the stored green hue variation
      ctx.fillStyle = `hsla(${p.hue}, 50%, 50%, ${p.alpha * depthScale})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * depthScale, 0, TAU);
      ctx.fill();
    }

    // Lightning flash
    if (this.lightningFlash) {
      const proj = this.camera.project(
        this.lightningFlash.x,
        this.lightningFlash.y,
        this.lightningFlash.z
      );
      const lx = cx + proj.x;
      const ly = cy + proj.y;

      const flashGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 250);
      flashGrad.addColorStop(
        0,
        `rgba(0, 255, 150, ${this.lightningFlash.intensity * 0.9})`
      );
      flashGrad.addColorStop(
        0.2,
        `rgba(0, 255, 100, ${this.lightningFlash.intensity * 0.5})`
      );
      flashGrad.addColorStop(
        0.5,
        `rgba(0, 200, 80, ${this.lightningFlash.intensity * 0.2})`
      );
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Render molecules with depth sorting
    const sorted = [...this.molecules].sort((a, b) => {
      const projA = this.camera.project(a.x, a.y, a.z);
      const projB = this.camera.project(b.x, b.y, b.z);
      return projA.z - projB.z;
    });

    for (const mol of sorted) {
      mol.render(cx, cy);
    }

    // Bubbles (in front of molecules) - green glow
    for (const b of this.bubbles) {
      const grad = ctx.createRadialGradient(
        b.x - b.size * 0.3,
        b.y - b.size * 0.3,
        0,
        b.x,
        b.y,
        b.size
      );
      grad.addColorStop(0, `rgba(0, 255, 100, ${b.alpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(0, 255, 80, ${b.alpha * 0.3})`);
      grad.addColorStop(1, `rgba(0, 200, 60, ${b.alpha * 0.1})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, TAU);
      ctx.fill();

      ctx.fillStyle = `rgba(0, 255, 120, ${b.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.25, 0, TAU);
      ctx.fill();
    }

    // Vignette overlay - dark green
    const vignetteGrad = ctx.createRadialGradient(
      cx, cy, Math.min(w, h) * 0.3,
      cx, cy, Math.max(w, h) * 0.8
    );
    vignetteGrad.addColorStop(0, 'transparent');
    vignetteGrad.addColorStop(1, 'rgba(0, 10, 5, 0.6)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);

    // UI - scale for mobile
    const isMobile = Screen.isMobile;
    const fontSize = isMobile ? 9 : 11;
    const lineHeight = isMobile ? 14 : 18;
    const maxLogWidth = isMobile ? w - 30 : w * 0.5;
    
    ctx.font = `${fontSize}px "Fira Code", monospace`;
    ctx.textAlign = 'left';

    // Reaction log (compact on mobile) - terminal green
    let y = 25;
    for (const log of this.reactionLog) {
      const alpha = Math.min(1, log.time);
      ctx.fillStyle = `rgba(0, 255, 100, ${alpha * 0.9})`;
      
      // Truncate if too wide for mobile
      let text = log.text;
      if (isMobile && ctx.measureText(text).width > maxLogWidth) {
        // Truncate with ellipsis
        while (ctx.measureText(text + '…').width > maxLogWidth && text.length > 10) {
          text = text.slice(0, -1);
        }
        text += '…';
      }
      ctx.fillText(text, 15, y);
      y += lineHeight;
    }

    // Stats - terminal green
    ctx.fillStyle = 'rgba(0, 255, 120, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`Molecules: ${this.molecules.length}`, w - 15, 25);
    ctx.fillText(`Reactions: ${this.stats.reactions}`, w - 15, 25 + lineHeight);

    const tierNames = ['Primordial', 'Precursors', 'Amino Acids', 'Peptides'];
    ctx.fillText(`Max tier: ${tierNames[this.stats.maxTier] || '???'}`, w - 15, 25 + lineHeight * 2);
  }
}

/**
 * Create Day 25 visualization
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {PrimordialSoupDemo} returns.game - The game instance
 */
export default function day25(canvas) {
  const game = new PrimordialSoupDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
