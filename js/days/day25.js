/**
 * Genuary 2026 - Day 25
 * Prompt: "Organic Geometry"
 * Credit: Manuel Larino
 *
 * PRIMORDIAL SOUP
 * The origin of life: simple molecules in a warm ocean,
 * energized by lightning and hydrothermal vents.
 * Watch complexity emerge as molecules combine.
 */

import { Game, Painter, Camera3D, zoneTemperature, thermalBuoyancy, heatTransferFalloff } from '@guinetik/gcanvas';

const TAU = Math.PI * 2;

const CONFIG = {
  // No hard cap - complexity can grow
  initialCount: 20,
  maxMolecules: 100,  // Soft limit for performance

  // Camera
  perspective: 800,

  // Heat zones (normalized y: 0 = top, 1 = bottom)
  heatZone: 0.85,      // Hydrothermal vent at bottom
  coolZone: 0.15,      // Cold surface water at top
  heatRate: 0.008,

  // Thermal physics
  buoyancyStrength: 200,   // Hot rises
  gravity: 80,             // Cold sinks
  neutralTemp: 0.5,

  // Movement
  baseSpeed: 20,
  damping: 0.94,

  // Heat transfer between molecules
  heatTransferDist: 80,
  heatTransferRate: 0.02,

  // Reactions
  reactionDistance: 60,
  reactionCooldown: 0.5,
  baseReactionChance: 0.1,  // Modified by temperature

  // Lightning
  lightningInterval: 4,     // Seconds between strikes
  lightningVariance: 2,
  lightningEnergy: 0.4,     // Temperature boost
  lightningRadius: 150,

  // Visual
  bgColor: '#050510',
  ventGlow: 0.4,

  // Ambient particles
  bubbleCount: 40,
  particleCount: 60,
  causticSpeed: 0.3,
};

// Molecule complexity tiers
const TIERS = {
  PRIMORDIAL: 0,   // H2O, CH4, NH3, H2, CO2, H2S
  PRECURSOR: 1,    // Formaldehyde, HCN
  AMINO_ACID: 2,   // Glycine, Alanine
  PEPTIDE: 3,      // Di/tripeptides
};

// Atom visual properties
const ATOMS = {
  C: { radius: 18, hue: 30, sat: 10, light: 35, name: 'Carbon' },
  H: { radius: 10, hue: 200, sat: 5, light: 90, name: 'Hydrogen' },
  O: { radius: 16, hue: 0, sat: 70, light: 50, name: 'Oxygen' },
  N: { radius: 15, hue: 220, sat: 70, light: 55, name: 'Nitrogen' },
  S: { radius: 20, hue: 55, sat: 75, light: 50, name: 'Sulfur' },
};

// Molecule templates - primordial soup ingredients
const MOLECULES = {
  // Tier 0: Primordial
  water: {
    name: 'H₂O', label: 'Water', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0 },
      { element: 'H', x: -20, y: 14, z: 0 },
      { element: 'H', x: 20, y: 14, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }, { from: 0, to: 2, order: 1 }],
  },
  methane: {
    name: 'CH₄', label: 'Methane', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'H', x: 20, y: 20, z: 20 },
      { element: 'H', x: -20, y: -20, z: 20 },
      { element: 'H', x: -20, y: 20, z: -20 },
      { element: 'H', x: 20, y: -20, z: -20 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 }, { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 }, { from: 0, to: 4, order: 1 },
    ],
  },
  ammonia: {
    name: 'NH₃', label: 'Ammonia', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'N', x: 0, y: 0, z: 0 },
      { element: 'H', x: 22, y: 14, z: 0 },
      { element: 'H', x: -11, y: 14, z: 19 },
      { element: 'H', x: -11, y: 14, z: -19 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 }, { from: 0, to: 2, order: 1 }, { from: 0, to: 3, order: 1 },
    ],
  },
  hydrogen: {
    name: 'H₂', label: 'Hydrogen', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'H', x: -12, y: 0, z: 0 },
      { element: 'H', x: 12, y: 0, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
  carbonDioxide: {
    name: 'CO₂', label: 'Carbon Dioxide', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: -28, y: 0, z: 0 },
      { element: 'O', x: 28, y: 0, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 2 }, { from: 0, to: 2, order: 2 }],
  },
  hydrogenSulfide: {
    name: 'H₂S', label: 'Hydrogen Sulfide', tier: TIERS.PRIMORDIAL,
    atoms: [
      { element: 'S', x: 0, y: 0, z: 0 },
      { element: 'H', x: -22, y: 14, z: 0 },
      { element: 'H', x: 22, y: 14, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }, { from: 0, to: 2, order: 1 }],
  },

  // Tier 1: Precursors
  formaldehyde: {
    name: 'CH₂O', label: 'Formaldehyde', tier: TIERS.PRECURSOR,
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: 0, y: -24, z: 0 },
      { element: 'H', x: -18, y: 14, z: 0 },
      { element: 'H', x: 18, y: 14, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 }, { from: 0, to: 2, order: 1 }, { from: 0, to: 3, order: 1 },
    ],
  },
  hydrogenCyanide: {
    name: 'HCN', label: 'Hydrogen Cyanide', tier: TIERS.PRECURSOR,
    atoms: [
      { element: 'H', x: -30, y: 0, z: 0 },
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'N', x: 26, y: 0, z: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 3 }],
  },

  // Tier 2: Amino Acids
  glycine: {
    name: 'Glycine', label: 'Glycine', tier: TIERS.AMINO_ACID,
    atoms: [
      { element: 'N', x: -35, y: 0, z: 0 },
      { element: 'C', x: -5, y: 0, z: 0 },
      { element: 'C', x: 30, y: 0, z: 0 },
      { element: 'O', x: 45, y: -20, z: 0 },
      { element: 'O', x: 45, y: 20, z: 0 },
      { element: 'H', x: -50, y: -12, z: 0 },
      { element: 'H', x: -50, y: 12, z: 0 },
      { element: 'H', x: -5, y: 20, z: 12 },
      { element: 'H', x: -5, y: 20, z: -12 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 }, { from: 2, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 }, { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 }, { from: 1, to: 8, order: 1 },
    ],
  },
  alanine: {
    name: 'Alanine', label: 'Alanine', tier: TIERS.AMINO_ACID,
    atoms: [
      { element: 'N', x: -40, y: 0, z: 0 },
      { element: 'C', x: -10, y: 0, z: 0 },
      { element: 'C', x: 25, y: 0, z: 0 },
      { element: 'O', x: 40, y: -20, z: 0 },
      { element: 'O', x: 40, y: 20, z: 0 },
      { element: 'C', x: -10, y: 30, z: 0 },
      { element: 'H', x: -55, y: -10, z: 0 },
      { element: 'H', x: -55, y: 10, z: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 }, { from: 2, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 }, { from: 0, to: 7, order: 1 },
    ],
  },

  // Tier 3: Simple peptide
  diglycine: {
    name: 'Gly-Gly', label: 'Peptide', tier: TIERS.PEPTIDE,
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
      { from: 0, to: 1, order: 1 }, { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 }, { from: 2, to: 4, order: 1 },
      { from: 4, to: 5, order: 1 }, { from: 5, to: 6, order: 1 },
      { from: 6, to: 7, order: 2 }, { from: 6, to: 8, order: 1 },
    ],
  },
};

// Primordial molecules for initial spawn
const PRIMORDIAL_KEYS = ['water', 'methane', 'ammonia', 'hydrogen', 'carbonDioxide', 'hydrogenSulfide'];

// Reaction rules - complexity increases with energy
const REACTIONS = [
  // Tier 0 → 1: Primordial to precursors
  { reactants: ['methane', 'water'], products: ['formaldehyde', 'hydrogen'], minTemp: 0.5, energy: 0.15 },
  { reactants: ['ammonia', 'methane'], products: ['hydrogenCyanide', 'hydrogen', 'hydrogen'], minTemp: 0.6, energy: 0.2 },
  { reactants: ['carbonDioxide', 'hydrogen'], products: ['formaldehyde'], minTemp: 0.55, energy: 0.15 },

  // Tier 1 → 2: Precursors to amino acids (Strecker synthesis analog)
  { reactants: ['formaldehyde', 'hydrogenCyanide'], products: ['glycine'], minTemp: 0.65, energy: 0.25 },
  { reactants: ['formaldehyde', 'ammonia'], products: ['glycine', 'water'], minTemp: 0.7, energy: 0.3 },
  { reactants: ['hydrogenCyanide', 'ammonia'], products: ['alanine'], minTemp: 0.7, energy: 0.3 },

  // Tier 2 → 3: Amino acids to peptides
  { reactants: ['glycine', 'glycine'], products: ['diglycine', 'water'], minTemp: 0.75, energy: 0.4 },
  { reactants: ['glycine', 'alanine'], products: ['diglycine', 'water'], minTemp: 0.75, energy: 0.4 },
];

/**
 * Molecule class with temperature and thermal physics
 */
class Molecule {
  constructor(x, y, z, templateKey) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.vx = (Math.random() - 0.5) * CONFIG.baseSpeed;
    this.vy = (Math.random() - 0.5) * CONFIG.baseSpeed;
    this.vz = (Math.random() - 0.5) * CONFIG.baseSpeed;

    this.templateKey = templateKey;
    this.template = MOLECULES[templateKey];
    this.name = this.template.name;
    this.label = this.template.label;
    this.tier = this.template.tier;

    // Temperature: 0 = cold, 1 = hot
    this.temperature = 0.5;
    this.reactionCooldown = 0;
    this.flash = 0;  // Visual flash on reaction

    // Copy atoms
    this.atoms = this.template.atoms.map(a => ({
      element: a.element,
      localX: a.x,
      localY: a.y,
      localZ: a.z,
      screenX: 0,
      screenY: 0,
      screenScale: 1,
      worldZ: 0,
    }));
    this.bonds = this.template.bonds;

    // Calculate bounding radius
    let maxDist = 0;
    for (const a of this.atoms) {
      const dist = Math.sqrt(a.localX ** 2 + a.localY ** 2 + a.localZ ** 2);
      maxDist = Math.max(maxDist, dist + ATOMS[a.element].radius);
    }
    this.boundingRadius = maxDist;

    // Random rotation for tumbling
    this.rotX = Math.random() * TAU;
    this.rotY = Math.random() * TAU;
    this.rotZ = Math.random() * TAU;
    this.rotSpeedX = (Math.random() - 0.5) * 0.5;
    this.rotSpeedY = (Math.random() - 0.5) * 0.5;
    this.rotSpeedZ = (Math.random() - 0.5) * 0.2;

    // Ocean current phase (unique per molecule, evolves over time)
    this.currentPhase = Math.random() * TAU;
    this.currentSpeed = 0.3 + Math.random() * 0.4;
  }

  update(dt, normalizedY) {
    // Update temperature based on zone
    this.temperature = zoneTemperature(normalizedY, this.temperature, {
      heatZone: CONFIG.heatZone,
      coolZone: CONFIG.coolZone,
      rate: CONFIG.heatRate,
    });

    // Thermal buoyancy - hot rises (negative Y = up)
    const buoyancy = thermalBuoyancy(this.temperature, CONFIG.neutralTemp, CONFIG.buoyancyStrength);
    this.vy -= buoyancy * dt;

    // Gravity - pulls everything down, stronger when cold
    const coldness = 1 - this.temperature;
    this.vy += CONFIG.gravity * coldness * dt;

    // Ocean current - gentle horizontal waves
    this.currentPhase += this.currentSpeed * dt;
    const currentStrength = 12 + Math.sin(this.y * 0.008) * 6;
    this.vx += Math.sin(this.currentPhase) * currentStrength * dt;

    // Apply velocity with damping
    this.vx *= CONFIG.damping;
    this.vy *= CONFIG.damping;
    this.vz *= CONFIG.damping;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // Tumble based on temperature (hotter = faster)
    const tumbleSpeed = 0.5 + this.temperature * 0.5;
    this.rotX += this.rotSpeedX * tumbleSpeed * dt;
    this.rotY += this.rotSpeedY * tumbleSpeed * dt;
    this.rotZ += this.rotSpeedZ * tumbleSpeed * dt;

    // Decay cooldown and flash
    if (this.reactionCooldown > 0) this.reactionCooldown -= dt;
    if (this.flash > 0) this.flash -= dt * 2;
  }

  project(camera, cx, cy) {
    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
    const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);

    for (const atom of this.atoms) {
      // Local rotation
      let x = atom.localX, y = atom.localY, z = atom.localZ;

      // Rotate X
      let ty = y * cosX - z * sinX;
      let tz = y * sinX + z * cosX;
      y = ty; z = tz;

      // Rotate Y
      let tx = x * cosY + z * sinY;
      tz = -x * sinY + z * cosY;
      x = tx; z = tz;

      // Rotate Z
      tx = x * cosZ - y * sinZ;
      ty = x * sinZ + y * cosZ;
      x = tx; y = ty;

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
  }

  render(ctx, camera, cx, cy) {
    this.project(camera, cx, cy);

    // Sort atoms by depth
    const sortedIndices = this.atoms
      .map((a, i) => ({ z: a.worldZ, i }))
      .sort((a, b) => a.z - b.z)
      .map(item => item.i);

    this.renderBonds(ctx);

    for (const i of sortedIndices) {
      this.renderAtom(ctx, this.atoms[i]);
    }
  }

  renderBonds(ctx) {
    for (const bond of this.bonds) {
      const a1 = this.atoms[bond.from];
      const a2 = this.atoms[bond.to];
      if (a1.screenScale <= 0 || a2.screenScale <= 0) continue;

      const avgScale = (a1.screenScale + a2.screenScale) / 2;

      // Depth affects lightness, not opacity
      const avgZ = (a1.worldZ + a2.worldZ) / 2;
      const depthLightMod = Math.max(-10, Math.min(10, avgZ / 40));

      // Temperature affects bond color
      const tempHue = 200 - this.temperature * 180; // Blue (cold) to red (hot)
      const bondLight = 45 + depthLightMod;
      ctx.strokeStyle = `hsl(${tempHue}, 35%, ${bondLight}%)`;
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
        const nx = -dy / len * gap;
        const ny = dx / len * gap;

        ctx.lineWidth = 2 * avgScale;
        for (let i = 0; i < bond.order; i++) {
          const offset = (i - (bond.order - 1) / 2);
          ctx.beginPath();
          ctx.moveTo(a1.screenX + nx * offset, a1.screenY + ny * offset);
          ctx.lineTo(a2.screenX + nx * offset, a2.screenY + ny * offset);
          ctx.stroke();
        }
      }
    }
  }

  renderAtom(ctx, atom) {
    if (atom.screenScale <= 0) return;

    const props = ATOMS[atom.element];
    const radius = props.radius * atom.screenScale;

    // Depth affects lightness, not opacity (further = darker)
    const depthLightMod = Math.max(-15, Math.min(10, atom.worldZ / 30));

    // Temperature-shifted hue
    const tempShift = (this.temperature - 0.5) * 40;
    const hue = props.hue + tempShift;
    const sat = props.sat + this.temperature * 20;
    const light = props.light + depthLightMod;

    // Reaction flash
    if (this.flash > 0) {
      const flashRadius = radius * (2 + this.flash);
      const flashGrad = ctx.createRadialGradient(
        atom.screenX, atom.screenY, 0,
        atom.screenX, atom.screenY, flashRadius
      );
      flashGrad.addColorStop(0, `rgba(255, 255, 200, ${this.flash * 0.9})`);
      flashGrad.addColorStop(0.4, `rgba(255, 180, 80, ${this.flash * 0.5})`);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(atom.screenX, atom.screenY, flashRadius, 0, TAU);
      ctx.fill();
    }

    // Atom sphere - fully opaque
    const grad = ctx.createRadialGradient(
      atom.screenX - radius * 0.3, atom.screenY - radius * 0.3, 0,
      atom.screenX, atom.screenY, radius
    );
    grad.addColorStop(0, `hsl(${hue}, ${sat * 0.3}%, ${Math.min(light + 35, 95)}%)`);
    grad.addColorStop(0.4, `hsl(${hue}, ${sat}%, ${light}%)`);
    grad.addColorStop(1, `hsl(${hue}, ${sat + 10}%, ${Math.max(light - 20, 10)}%)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(atom.screenX, atom.screenY, radius, 0, TAU);
    ctx.fill();
  }
}

/**
 * Primordial Soup Demo
 */
class PrimordialSoupDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.bgColor;
  }

  init() {
    super.init();
    Painter.init(this.ctx);

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

    // Disable double-click reset by removing the handler
    this.canvas.removeEventListener('dblclick', this.camera._boundHandlers.dblclick);

    this.molecules = [];
    this.reactionLog = [];
    this.totalTime = 0;
    this.nextLightning = CONFIG.lightningInterval;

    // Stats
    this.stats = { reactions: 0, maxTier: 0 };

    // World bounds - spread out more
    this.worldWidth = this.width * 0.8;
    this.worldHeight = this.height * 0.9;

    // Ambient bubbles rising from vent
    this.bubbles = [];
    for (let i = 0; i < CONFIG.bubbleCount; i++) {
      this.bubbles.push(this.createBubble(true));
    }

    // Floating particles/sediment
    this.particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      this.particles.push(this.createParticle());
    }

    // Spawn primordial molecules
    for (let i = 0; i < CONFIG.initialCount; i++) {
      this.spawnMolecule(true);
    }

    // Track drag vs click
    let dragStart = null;
    this.canvas.addEventListener('mousedown', (e) => {
      dragStart = { x: e.clientX, y: e.clientY };
    });

    // Click spawns new primordial molecule at click position (no limit)
    this.canvas.addEventListener('mouseup', (e) => {
      // Only spawn if it wasn't a drag
      if (dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragStart = null;
          return; // Was a drag, don't spawn
        }
      }
      dragStart = null;

      const rect = this.canvas.getBoundingClientRect();
      const screenX = (e.clientX - rect.left - this.width / 2);
      const screenY = (e.clientY - rect.top - this.height / 2);

      // Unproject through camera rotation (inverse rotation)
      const cosX = Math.cos(-this.camera.rotationX);
      const sinX = Math.sin(-this.camera.rotationX);
      const cosY = Math.cos(-this.camera.rotationY);
      const sinY = Math.sin(-this.camera.rotationY);

      // Start with screen coords as a point on the view plane
      let x = screenX;
      let y = screenY;
      let z = (Math.random() - 0.5) * 100;

      // Inverse Y rotation
      const tx = x * cosY - z * sinY;
      const tz = x * sinY + z * cosY;
      x = tx;
      z = tz;

      // Inverse X rotation
      const ty = y * cosX - z * sinX;
      const tz2 = y * sinX + z * cosX;
      y = ty;
      z = tz2;

      const mol = this.spawnMolecule(true, x, y, z, undefined, true);
      if (mol) {
        this.reactionLog.unshift({ text: `+ ${mol.label} (${mol.name})`, time: 2 });
        if (this.reactionLog.length > 5) this.reactionLog.pop();
      }
    });
  }

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

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: (Math.random() - 0.5) * 400,
      size: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 5,
      alpha: 0.05 + Math.random() * 0.15,
      hue: Math.random() < 0.3 ? 30 : 200, // Orange or blue tint
    };
  }

  spawnMolecule(primordialOnly = false, x, y, z, templateKey, ignoreLimit = false) {
    if (!ignoreLimit && this.molecules.length >= CONFIG.maxMolecules) return null;

    const key = templateKey || (primordialOnly
      ? PRIMORDIAL_KEYS[Math.floor(Math.random() * PRIMORDIAL_KEYS.length)]
      : Object.keys(MOLECULES)[Math.floor(Math.random() * Object.keys(MOLECULES).length)]);

    const px = x ?? (Math.random() - 0.5) * this.worldWidth;
    const py = y ?? (Math.random() - 0.5) * this.worldHeight;
    const pz = z ?? (Math.random() - 0.5) * 200;

    const mol = new Molecule(px, py, pz, key);
    this.molecules.push(mol);
    return mol;
  }

  lightning() {
    // Random position for strike
    const lx = (Math.random() - 0.5) * this.worldWidth;
    const ly = (Math.random() - 0.5) * this.worldHeight * 0.5; // Upper half more likely
    const lz = (Math.random() - 0.5) * 150;

    // Heat up nearby molecules
    for (const mol of this.molecules) {
      const dx = mol.x - lx;
      const dy = mol.y - ly;
      const dz = mol.z - lz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < CONFIG.lightningRadius) {
        const intensity = 1 - dist / CONFIG.lightningRadius;
        mol.temperature = Math.min(1, mol.temperature + CONFIG.lightningEnergy * intensity);
        mol.flash = Math.max(mol.flash, intensity * 0.5);
      }
    }

    this.lightningFlash = { x: lx, y: ly, z: lz, intensity: 1 };
  }

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

        // Average temperature for reaction
        const avgTemp = (mol1.temperature + mol2.temperature) / 2;

        for (const reaction of REACTIONS) {
          const [r1, r2] = reaction.reactants;
          const matches = (mol1.templateKey === r1 && mol2.templateKey === r2) ||
                         (mol1.templateKey === r2 && mol2.templateKey === r1);

          if (!matches) continue;

          // Temperature threshold + random chance scaled by temperature
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
            const product = new Molecule(midX + offset, midY + offset, midZ + offset, productKey);
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
          const productLabels = reaction.products.map(k => {
            const m = MOLECULES[k];
            return m ? `${m.label} (${m.name})` : k;
          }).join(' + ');
          this.reactionLog.unshift({ text: `${reactantLabels} → ${productLabels}`, time: 4 });
          if (this.reactionLog.length > 5) this.reactionLog.pop();

          break;
        }
      }
    }

    this.molecules = this.molecules.filter((_, i) => !toRemove.has(i));
    for (const p of toAdd) this.molecules.push(p);
  }

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
            m1.temperature, m2.temperature,
            dist, CONFIG.heatTransferDist, CONFIG.heatTransferRate, 1
          );
          m1.temperature = Math.max(0, Math.min(1, m1.temperature + delta));
          m2.temperature = Math.max(0, Math.min(1, m2.temperature - delta));
        }
      }
    }
  }

  update(dt) {
    super.update(dt);
    this.camera.update(dt);
    this.totalTime += dt;

    // Lightning timer
    this.nextLightning -= dt;
    if (this.nextLightning <= 0) {
      this.lightning();
      this.nextLightning = CONFIG.lightningInterval + (Math.random() - 0.5) * CONFIG.lightningVariance * 2;
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

      // Reset when off screen
      if (b.y < -20) {
        Object.assign(b, this.createBubble(false));
      }
    }

    // Update floating particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Gentle drift influenced by "current"
      p.vx += (Math.sin(this.totalTime * 0.5 + p.y * 0.01) * 2 - p.vx * 0.1) * dt;
      p.vy += (Math.cos(this.totalTime * 0.3 + p.x * 0.01) * 1 - p.vy * 0.1) * dt;

      // Wrap around
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }

    // Update molecules
    const halfHeight = this.worldHeight / 2;
    for (const mol of this.molecules) {
      // Normalized Y for heat zones (0 = top, 1 = bottom)
      const normalizedY = (mol.y + halfHeight) / this.worldHeight;
      mol.update(dt, Math.max(0, Math.min(1, normalizedY)));

      // Soft boundaries
      const margin = 50;
      if (mol.x < -this.worldWidth / 2 - margin) mol.vx += 50 * dt;
      if (mol.x > this.worldWidth / 2 + margin) mol.vx -= 50 * dt;
      if (mol.y < -this.worldHeight / 2 - margin) mol.vy += 50 * dt;
      if (mol.y > this.worldHeight / 2 + margin) mol.vy -= 50 * dt;
      if (mol.z < -200) mol.vz += 30 * dt;
      if (mol.z > 200) mol.vz -= 30 * dt;
    }

    // Heat transfer between nearby molecules
    this.heatTransfer();

    // Check reactions
    this.checkReactions();

    // Decay log
    for (const log of this.reactionLog) log.time -= dt;
    this.reactionLog = this.reactionLog.filter(l => l.time > 0);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Gradient background: warm at bottom, cool at top
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#030612');  // Deep ocean blue-black top
    bgGrad.addColorStop(0.5, '#050510');
    bgGrad.addColorStop(0.8, '#0a0508');
    bgGrad.addColorStop(1, '#1a0505');  // Warm red-black bottom (vent)
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Caustic light patterns (surface light filtering through water)
    ctx.globalAlpha = 0.03;
    const causticScale = 120;
    const t = this.totalTime * CONFIG.causticSpeed;
    for (let i = 0; i < 5; i++) {
      const phase = i * 1.3 + t;
      const cx1 = w * 0.3 + Math.sin(phase) * w * 0.2;
      const cy1 = h * 0.2 + Math.cos(phase * 0.7) * h * 0.1;
      const cx2 = w * 0.7 + Math.sin(phase * 0.8 + 2) * w * 0.2;
      const cy2 = h * 0.3 + Math.cos(phase * 0.5 + 1) * h * 0.1;

      const causticGrad = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, causticScale);
      causticGrad.addColorStop(0, 'rgba(100, 180, 255, 1)');
      causticGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = causticGrad;
      ctx.fillRect(0, 0, w, h);

      const causticGrad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, causticScale * 0.8);
      causticGrad2.addColorStop(0, 'rgba(150, 200, 255, 1)');
      causticGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = causticGrad2;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Hydrothermal vent glow at bottom
    const ventGrad = ctx.createRadialGradient(cx, h + 50, 0, cx, h + 50, h * 0.7);
    ventGrad.addColorStop(0, `rgba(255, 100, 30, ${CONFIG.ventGlow})`);
    ventGrad.addColorStop(0.3, `rgba(255, 60, 10, ${CONFIG.ventGlow * 0.5})`);
    ventGrad.addColorStop(0.6, `rgba(200, 30, 5, ${CONFIG.ventGlow * 0.2})`);
    ventGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ventGrad;
    ctx.fillRect(0, 0, w, h);

    // Secondary vent hotspots
    const vent2Grad = ctx.createRadialGradient(cx - w * 0.2, h + 30, 0, cx - w * 0.2, h + 30, h * 0.3);
    vent2Grad.addColorStop(0, `rgba(255, 80, 20, ${CONFIG.ventGlow * 0.4})`);
    vent2Grad.addColorStop(1, 'transparent');
    ctx.fillStyle = vent2Grad;
    ctx.fillRect(0, 0, w, h);

    const vent3Grad = ctx.createRadialGradient(cx + w * 0.25, h + 40, 0, cx + w * 0.25, h + 40, h * 0.35);
    vent3Grad.addColorStop(0, `rgba(255, 60, 10, ${CONFIG.ventGlow * 0.3})`);
    vent3Grad.addColorStop(1, 'transparent');
    ctx.fillStyle = vent3Grad;
    ctx.fillRect(0, 0, w, h);

    // Floating particles (behind molecules)
    for (const p of this.particles) {
      const depthScale = 0.5 + (p.z + 200) / 400 * 0.5;
      ctx.fillStyle = `hsla(${p.hue}, 30%, 60%, ${p.alpha * depthScale})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * depthScale, 0, TAU);
      ctx.fill();
    }

    // Lightning flash
    if (this.lightningFlash) {
      const proj = this.camera.project(this.lightningFlash.x, this.lightningFlash.y, this.lightningFlash.z);
      const lx = cx + proj.x;
      const ly = cy + proj.y;

      const flashGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 250);
      flashGrad.addColorStop(0, `rgba(220, 240, 255, ${this.lightningFlash.intensity * 0.9})`);
      flashGrad.addColorStop(0.2, `rgba(180, 210, 255, ${this.lightningFlash.intensity * 0.5})`);
      flashGrad.addColorStop(0.5, `rgba(100, 150, 255, ${this.lightningFlash.intensity * 0.2})`);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Sort all molecules by depth
    const sorted = [...this.molecules].sort((a, b) => {
      const projA = this.camera.project(a.x, a.y, a.z);
      const projB = this.camera.project(b.x, b.y, b.z);
      return projA.z - projB.z;
    });

    // Render molecules
    for (const mol of sorted) {
      mol.render(ctx, this.camera, cx, cy);
    }

    // Bubbles (in front of molecules)
    for (const b of this.bubbles) {
      const grad = ctx.createRadialGradient(
        b.x - b.size * 0.3, b.y - b.size * 0.3, 0,
        b.x, b.y, b.size
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${b.alpha * 0.8})`);
      grad.addColorStop(0.5, `rgba(200, 220, 255, ${b.alpha * 0.3})`);
      grad.addColorStop(1, `rgba(150, 180, 220, ${b.alpha * 0.1})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, TAU);
      ctx.fill();

      // Bubble highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.25, 0, TAU);
      ctx.fill();
    }

    // Vignette overlay
    const vignetteGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.8);
    vignetteGrad.addColorStop(0, 'transparent');
    vignetteGrad.addColorStop(1, 'rgba(0, 5, 15, 0.6)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);

    // UI
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'left';

    // Reaction log
    let y = 25;
    for (const log of this.reactionLog) {
      const alpha = Math.min(1, log.time);
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.9})`;
      ctx.fillText(log.text, 15, y);
      y += 18;
    }

    // Stats
    ctx.fillStyle = 'rgba(150, 180, 200, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(`Molecules: ${this.molecules.length}`, w - 15, 25);
    ctx.fillText(`Reactions: ${this.stats.reactions}`, w - 15, 43);

    const tierNames = ['Primordial', 'Precursors', 'Amino Acids', 'Peptides'];
    ctx.fillText(`Max tier: ${tierNames[this.stats.maxTier] || '???'}`, w - 15, 61);

    // Instructions
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    ctx.fillText('Click to add molecules. Drag to orbit. Watch complexity emerge.', cx, h - 15);
  }
}

export default function day25(canvas) {
  const game = new PrimordialSoupDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
