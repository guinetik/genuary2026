/**
 * Day 9: Crazy Automaton
 * Building block: Feynman class for particle physics math
 *
 * Phase 1: Simple collision test with stateless physics
 */

import {
  Game,
  Camera3D,
  Painter,
  ParticleSystem,
  ParticleEmitter,
  Scene3D,
} from "@guinetik/gcanvas";

/**
 * Particle types for Big Bang nucleosynthesis
 */
const ParticleType = {
  QUARK: 'quark',         // Fundamental (simplified - no color charge)
  PROTON: 'proton',       // uud quarks bound
  NEUTRON: 'neutron',     // udd quarks bound
  HYDROGEN: 'hydrogen',   // H-1 (proton + electron, but we simplify)
  DEUTERIUM: 'deuterium', // H-2 (p + n)
  HELIUM3: 'helium3',     // He-3 (2p + n)
  HELIUM4: 'helium4',     // He-4 (2p + 2n)
  PHOTON: 'photon',       // Energy carrier
};

/**
 * Reactions - Feynman-style (simplified, no QCD)
 *
 * Phase 1: Hadronization (quarks → hadrons)
 * Phase 2: Nucleosynthesis (hadrons → nuclei)
 */
const REACTIONS = {
  // ========== HADRONIZATION (Quark confinement) ==========
  // 3 quarks → Proton + photon (binding energy released)
  QUARK_TO_PROTON: {
    reactants: [ParticleType.QUARK, ParticleType.QUARK, ParticleType.QUARK],
    products: [ParticleType.PROTON],
    photonEnergy: 0.94,   // ~938 MeV mass-energy, scaled down
    probability: 0.95,    // High probability once close
    minEnergy: 0.001,     // Very low threshold - quarks want to bind
    tripleCollision: true,
  },
  // 3 quarks → Neutron + photon
  QUARK_TO_NEUTRON: {
    reactants: [ParticleType.QUARK, ParticleType.QUARK, ParticleType.QUARK],
    products: [ParticleType.NEUTRON],
    photonEnergy: 0.94,
    probability: 0.95,
    minEnergy: 0.001,
    tripleCollision: true,
  },

  // ========== NUCLEOSYNTHESIS ==========
  // The "deuterium bottleneck": D forms easily but is quickly processed into He
  // Only ~2.6% of D survives (D/H ≈ 26/1000)

  // Proton + Neutron → Deuterium + Photon (2.22 MeV)
  PROTON_NEUTRON_FUSION: {
    reactants: [ParticleType.PROTON, ParticleType.NEUTRON],
    products: [ParticleType.DEUTERIUM],
    photonEnergy: 2.22,
    probability: 0.7,    // D/H ratio is the limiter now, not probability
    minEnergy: 0.05,
  },
  // Deuterium + Proton → Helium-3 + Photon (5.49 MeV)
  DEUTERIUM_PROTON_FUSION: {
    reactants: [ParticleType.DEUTERIUM, ParticleType.PROTON],
    products: [ParticleType.HELIUM3],
    photonEnergy: 5.49,
    probability: 0.04,   // VERY LOW - D must survive! (target D/H = 26/1000)
    minEnergy: 0.15,
  },
  // Deuterium + Neutron → Helium-3 + Photon (different path)
  DEUTERIUM_NEUTRON_FUSION: {
    reactants: [ParticleType.DEUTERIUM, ParticleType.NEUTRON],
    products: [ParticleType.HELIUM3],
    photonEnergy: 6.26,
    probability: 0.04,   // Match D+p rate
    minEnergy: 0.15,
  },
  // Helium-3 + Neutron → Helium-4 + Photon (20.58 MeV)
  HELIUM3_NEUTRON_FUSION: {
    reactants: [ParticleType.HELIUM3, ParticleType.NEUTRON],
    products: [ParticleType.HELIUM4],
    photonEnergy: 20.58,
    probability: 0.4,    // He-3 readily captures neutrons
    minEnergy: 0.1,
  },
  // Helium-3 + Proton → Helium-4 + Photon (different path)
  HELIUM3_PROTON_FUSION: {
    reactants: [ParticleType.HELIUM3, ParticleType.PROTON],
    products: [ParticleType.HELIUM4],
    photonEnergy: 19.8,
    probability: 0.05,   // Very rare in Big Bang
    minEnergy: 0.4,
  },
  // Deuterium + Deuterium → Helium-3 + Neutron
  DEUTERIUM_DEUTERIUM_FUSION_A: {
    reactants: [ParticleType.DEUTERIUM, ParticleType.DEUTERIUM],
    products: [ParticleType.HELIUM3, ParticleType.NEUTRON],
    photonEnergy: 3.27,
    probability: 0.02,   // Very rare - D is precious, must survive
    minEnergy: 0.25,
  },
  // Deuterium + Deuterium → Helium-4 + Photon (rare but bright!)
  DEUTERIUM_DEUTERIUM_FUSION_B: {
    reactants: [ParticleType.DEUTERIUM, ParticleType.DEUTERIUM],
    products: [ParticleType.HELIUM4],
    photonEnergy: 23.8,
    probability: 0.01,   // Extremely rare
    minEnergy: 0.35,
  },
};

/**
 * Feynman - Stateless particle physics calculations
 * Designed to work with ParticleSystem updaters
 *
 * All methods are static and pure - no internal state
 * Input: particle data, dt, optional params
 * Output: modifications to particle or new values
 */
class Feynman {
  /**
   * Calculate attraction force between two points
   * @param {Object} p1 - {x, y, z} position 1
   * @param {Object} p2 - {x, y, z} position 2
   * @param {number} strength - force multiplier
   * @param {number} minDist - minimum distance (prevents infinite force)
   * @returns {Object} {fx, fy, fz, dist} - force vector and distance
   */
  static attract(p1, p2, strength = 100, minDist = 1) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z || 0) - (p1.z || 0);

    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq) || minDist;
    const safeDist = Math.max(dist, minDist);

    // Inverse square law: F = strength / dist^2
    const force = strength / (safeDist * safeDist);

    // Normalize direction and apply force
    return {
      fx: (dx / dist) * force,
      fy: (dy / dist) * force,
      fz: (dz / dist) * force,
      dist: dist,
    };
  }

  /**
   * Check if two particles are colliding
   * @param {Object} p1 - particle 1 with {x, y, z, size}
   * @param {Object} p2 - particle 2 with {x, y, z, size}
   * @param {number} threshold - collision distance multiplier
   * @returns {Object|null} - {dist, overlap} if colliding, null otherwise
   */
  static checkCollision(p1, p2, threshold = 1.0) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z || 0) - (p1.z || 0);

    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const collisionDist = ((p1.size || 1) + (p2.size || 1)) * threshold;

    if (dist < collisionDist) {
      return {
        dist: dist,
        overlap: collisionDist - dist,
        dx: dx,
        dy: dy,
        dz: dz,
      };
    }
    return null;
  }

  /**
   * Calculate elastic collision response (conservation of momentum)
   * @param {Object} p1 - particle 1 with {vx, vy, vz, mass}
   * @param {Object} p2 - particle 2 with {vx, vy, vz, mass}
   * @param {Object} collision - collision data from checkCollision
   * @param {number} restitution - bounciness (0-1)
   * @returns {Object} {v1: {vx,vy,vz}, v2: {vx,vy,vz}} new velocities
   */
  static elasticCollision(p1, p2, collision, restitution = 0.9) {
    const m1 = p1.mass || 1;
    const m2 = p2.mass || 1;
    const totalMass = m1 + m2;

    // Normalize collision axis
    const dist = collision.dist || 1;
    const nx = collision.dx / dist;
    const ny = collision.dy / dist;
    const nz = collision.dz / dist;

    // Relative velocity along collision axis
    const dvx = p1.vx - p2.vx;
    const dvy = p1.vy - p2.vy;
    const dvz = (p1.vz || 0) - (p2.vz || 0);
    const relVel = dvx * nx + dvy * ny + dvz * nz;

    // Don't resolve if moving apart
    if (relVel < 0) {
      return null;
    }

    // Impulse magnitude
    const impulse = (-(1 + restitution) * relVel) / totalMass;

    return {
      v1: {
        vx: p1.vx + impulse * m2 * nx,
        vy: p1.vy + impulse * m2 * ny,
        vz: (p1.vz || 0) + impulse * m2 * nz,
      },
      v2: {
        vx: p2.vx - impulse * m1 * nx,
        vy: p2.vy - impulse * m1 * ny,
        vz: (p2.vz || 0) - impulse * m1 * nz,
      },
    };
  }

  /**
   * Check and respond to boundary collision
   * @param {Object} p - particle with {x, y, vx, vy, size}
   * @param {Object} bounds - {minX, maxX, minY, maxY}
   * @param {number} restitution - bounciness (0-1)
   * @returns {boolean} true if collision occurred
   */
  static boundsCollision(p, bounds, restitution = 0.9) {
    const radius = (p.size || 1) / 2;
    let collided = false;

    const minX = bounds.minX + radius;
    const maxX = bounds.maxX - radius;
    const minY = bounds.minY + radius;
    const maxY = bounds.maxY - radius;

    // Hard clamp X position
    if (p.x < minX) {
      p.x = minX;
      if (p.vx < 0) p.vx = -p.vx * restitution;
      collided = true;
    } else if (p.x > maxX) {
      p.x = maxX;
      if (p.vx > 0) p.vx = -p.vx * restitution;
      collided = true;
    }

    // Hard clamp Y position
    if (p.y < minY) {
      p.y = minY;
      if (p.vy < 0) p.vy = -p.vy * restitution;
      collided = true;
    } else if (p.y > maxY) {
      p.y = maxY;
      if (p.vy > 0) p.vy = -p.vy * restitution;
      collided = true;
    }

    return collided;
  }

  /**
   * Create a ParticleSystem updater for attraction to a point
   * @param {Object} target - {x, y, z} target point
   * @param {number} strength - attraction strength
   * @returns {Function} updater function
   */
  static createAttractUpdater(target, strength = 100) {
    return (particle, dt) => {
      const force = Feynman.attract(particle, target, strength);
      particle.vx += force.fx * dt;
      particle.vy += force.fy * dt;
      particle.vz = (particle.vz || 0) + force.fz * dt;
    };
  }

  /**
   * Create a ParticleSystem updater for mutual attraction between particles
   * @param {Function} getParticles - function that returns array of particles
   * @param {number} strength - attraction strength
   * @returns {Function} updater function
   */
  static createMutualAttractionUpdater(getParticles, strength = 100) {
    return (particle, dt) => {
      const particles = getParticles();
      for (const other of particles) {
        if (other === particle || other.dead) continue;

        const force = Feynman.attract(particle, other, strength);
        particle.vx += force.fx * dt;
        particle.vy += force.fy * dt;
        particle.vz = (particle.vz || 0) + force.fz * dt;
      }
    };
  }

  /**
   * Calculate kinetic energy of a particle (normalized)
   * @param {Object} p - particle with {vx, vy, vz, mass}
   * @returns {number} kinetic energy
   */
  static kineticEnergy(p) {
    const vSq = (p.vx || 0) ** 2 + (p.vy || 0) ** 2 + (p.vz || 0) ** 2;
    return 0.5 * (p.mass || 1) * vSq;
  }

  /**
   * Find matching reaction for two particle types
   * @param {string} type1 - first particle type
   * @param {string} type2 - second particle type
   * @returns {Object|null} reaction definition or null
   */
  static findReaction(type1, type2) {
    for (const [name, reaction] of Object.entries(REACTIONS)) {
      const [r1, r2] = reaction.reactants;
      if ((type1 === r1 && type2 === r2) || (type1 === r2 && type2 === r1)) {
        return { name, ...reaction };
      }
    }
    return null;
  }

  /**
   * Check if fusion can occur between two particles
   * Feynman conditions: proximity, energy threshold, probability
   * @param {Object} p1 - first particle
   * @param {Object} p2 - second particle
   * @param {Object} collision - collision data from checkCollision
   * @returns {Object|null} { reaction, probability } or null if no fusion possible
   */
  static checkFusion(p1, p2, collision) {
    if (!p1.type || !p2.type) return null;

    // Find matching reaction
    const reaction = Feynman.findReaction(p1.type, p2.type);
    if (!reaction) return null;

    // Check energy threshold (combined kinetic energy)
    const totalEnergy = Feynman.kineticEnergy(p1) + Feynman.kineticEnergy(p2);
    const normalizedEnergy = totalEnergy / 10000; // Normalize for our scale

    if (normalizedEnergy < reaction.minEnergy) {
      return null; // Not enough energy to overcome barrier
    }

    // Probability increases with energy (up to a point)
    const energyBonus = Math.min(1, normalizedEnergy / reaction.minEnergy - 1) * 0.2;
    const finalProbability = Math.min(0.95, reaction.probability + energyBonus);

    return {
      reaction,
      probability: finalProbability,
      totalEnergy: normalizedEnergy,
    };
  }

  /**
   * Perform fusion reaction - returns new particles to spawn
   * Conservation of momentum: p_products + p_photon = p1 + p2
   * @param {Object} p1 - first particle (will be marked dead)
   * @param {Object} p2 - second particle (will be marked dead)
   * @param {Object} fusionData - from checkFusion
   * @returns {Array} array of new particle definitions to spawn
   */
  static performFusion(p1, p2, fusionData) {
    const { reaction } = fusionData;
    const newParticles = [];

    const m1 = p1.mass || 1;
    const m2 = p2.mass || 1;

    // Total momentum (conserved!)
    const totalPx = m1 * p1.vx + m2 * p2.vx;
    const totalPy = m1 * p1.vy + m2 * p2.vy;
    const totalPz = m1 * (p1.vz || 0) + m2 * (p2.vz || 0);

    // Center of mass position
    const totalMass = m1 + m2;
    const comX = (p1.x * m1 + p2.x * m2) / totalMass;
    const comY = (p1.y * m1 + p2.y * m2) / totalMass;
    const comZ = ((p1.z || 0) * m1 + (p2.z || 0) * m2) / totalMass;

    // Photon carries away some momentum
    const photonAngle = Math.random() * Math.PI * 2;
    const photonSpeed = 200 + reaction.photonEnergy * 20;
    const photonPx = Math.cos(photonAngle) * photonSpeed * 0.1;
    const photonPy = Math.sin(photonAngle) * photonSpeed * 0.1;

    // Products get remaining momentum
    const productPx = totalPx - photonPx;
    const productPy = totalPy - photonPy;
    const productPz = totalPz;

    // Create product particles with conserved momentum
    for (const productType of reaction.products) {
      const mass = Feynman.getMass(productType);
      newParticles.push({
        type: productType,
        x: comX,
        y: comY,
        z: comZ,
        vx: productPx / mass,  // v = p / m
        vy: productPy / mass,
        vz: productPz / mass,
        mass: mass,
        size: Feynman.getSize(productType),
        isNew: true,
        lifetime: 99999,  // Stable! Deuterium doesn't decay
        stable: true,     // Mark as stable particle
      });
    }

    // Create photon (short-lived for performance)
    newParticles.push({
      type: ParticleType.PHOTON,
      x: comX,
      y: comY,
      z: comZ,
      originX: comX,
      originY: comY,
      originZ: comZ,
      vx: Math.cos(photonAngle) * photonSpeed,
      vy: Math.sin(photonAngle) * photonSpeed,
      vz: 0,
      mass: 0,
      size: 2 + reaction.photonEnergy * 0.3,
      energy: reaction.photonEnergy,
      isPhoton: true,
      lifetime: 0.4,  // Short lifetime for performance
    });

    return newParticles;
  }

  /**
   * Get mass for particle type (relative units)
   */
  static getMass(type) {
    const masses = {
      [ParticleType.QUARK]: 0.33,      // ~1/3 of proton
      [ParticleType.PROTON]: 1,
      [ParticleType.NEUTRON]: 1,
      [ParticleType.HYDROGEN]: 1,      // Same as proton
      [ParticleType.DEUTERIUM]: 2,
      [ParticleType.HELIUM3]: 3,
      [ParticleType.HELIUM4]: 4,
      [ParticleType.PHOTON]: 0,
    };
    return masses[type] || 1;
  }

  /**
   * Get visual size for particle type
   */
  static getSize(type) {
    const sizes = {
      [ParticleType.QUARK]: 3,         // Small
      [ParticleType.PROTON]: 5,
      [ParticleType.NEUTRON]: 5,
      [ParticleType.HYDROGEN]: 6,      // Slightly bigger (has electron cloud)
      [ParticleType.DEUTERIUM]: 7,
      [ParticleType.HELIUM3]: 8,
      [ParticleType.HELIUM4]: 9,
      [ParticleType.PHOTON]: 2,
    };
    return sizes[type] || 5;
  }

  /**
   * Get color for particle type - distinct colors!
   */
  static getColor(type) {
    const colors = {
      [ParticleType.QUARK]: { r: 255, g: 255, b: 255, a: 1 },     // White (hot primordial)
      [ParticleType.PROTON]: { r: 255, g: 80, b: 80, a: 1 },      // Red
      [ParticleType.NEUTRON]: { r: 80, g: 140, b: 255, a: 1 },    // Blue
      [ParticleType.HYDROGEN]: { r: 255, g: 200, b: 100, a: 1 },  // Orange (H-1)
      [ParticleType.DEUTERIUM]: { r: 100, g: 255, b: 100, a: 1 }, // Green (H-2)
      [ParticleType.HELIUM3]: { r: 255, g: 100, b: 255, a: 1 },   // Magenta (He-3)
      [ParticleType.HELIUM4]: { r: 255, g: 255, b: 100, a: 1 },   // Yellow (He-4)
      [ParticleType.PHOTON]: { r: 255, g: 220, b: 80, a: 1 },     // Golden yellow (gamma ray)
    };
    return colors[type] || { r: 255, g: 255, b: 255, a: 1 };
  }

  /**
   * Find triple collision reaction (for quarks → hadrons)
   * @param {Array} particles - array of 3 particles
   * @returns {Object|null} reaction or null
   */
  static findTripleReaction(particles) {
    if (particles.length !== 3) return null;

    const types = particles.map(p => p.type).sort();

    for (const [name, reaction] of Object.entries(REACTIONS)) {
      if (!reaction.tripleCollision) continue;

      const reactantTypes = [...reaction.reactants].sort();
      if (types.every((t, i) => t === reactantTypes[i])) {
        return { name, ...reaction };
      }
    }
    return null;
  }

  /**
   * Check for triple collision (3 particles close together)
   * @param {Object} p - center particle
   * @param {Array} nearby - nearby particles from collision check
   * @param {number} threshold - distance threshold multiplier
   * @returns {Array|null} array of 3 colliding particles or null
   */
  static checkTripleCollision(p, nearby, threshold = 1.5) {
    // Need at least 2 other particles nearby
    if (nearby.length < 2) return null;

    // Sort by distance and take the 2 closest
    nearby.sort((a, b) => a.dist - b.dist);
    const p2 = nearby[0].p;
    const p3 = nearby[1].p;

    // Check if all three are within clustering distance
    const clusterRadius = 30 * threshold;  // Generous clustering radius

    const d12 = nearby[0].dist;
    const d13 = nearby[1].dist;
    const d23 = Math.sqrt(
      (p3.x - p2.x) ** 2 +
      (p3.y - p2.y) ** 2 +
      ((p3.z || 0) - (p2.z || 0)) ** 2
    );

    // All three must be within cluster radius of each other
    if (d12 < clusterRadius && d13 < clusterRadius && d23 < clusterRadius) {
      return [p, p2, p3];
    }
    return null;
  }

  /**
   * Perform triple fusion (quark → hadron)
   * Conservation of momentum: p_hadron + p_photon = p_quark1 + p_quark2 + p_quark3
   */
  static performTripleFusion(particles, reaction) {
    const newParticles = [];

    // Calculate total momentum (sum of all quark momenta)
    let totalPx = 0, totalPy = 0, totalPz = 0;
    let comX = 0, comY = 0, comZ = 0;
    let totalMass = 0;

    for (const p of particles) {
      const m = p.mass || 1;
      totalMass += m;
      // Momentum = mass * velocity
      totalPx += m * p.vx;
      totalPy += m * p.vy;
      totalPz += m * (p.vz || 0);
      // Position (mass-weighted center)
      comX += p.x * m;
      comY += p.y * m;
      comZ += (p.z || 0) * m;
    }

    comX /= totalMass;
    comY /= totalMass;
    comZ /= totalMass;

    // Photon carries away some momentum (small fraction, random direction)
    const photonAngle = Math.random() * Math.PI * 2;
    const photonSpeed = 150 + reaction.photonEnergy * 30;
    const photonPx = Math.cos(photonAngle) * photonSpeed * 0.1; // Photon momentum (small)
    const photonPy = Math.sin(photonAngle) * photonSpeed * 0.1;

    // Hadron gets remaining momentum (conservation!)
    const hadronMass = Feynman.getMass(reaction.products[0]);
    const hadronPx = totalPx - photonPx;
    const hadronPy = totalPy - photonPy;
    const hadronPz = totalPz;

    // Create hadron with conserved momentum
    for (const productType of reaction.products) {
      const mass = Feynman.getMass(productType);
      newParticles.push({
        type: productType,
        x: comX,
        y: comY,
        z: comZ,
        vx: hadronPx / mass,  // v = p / m
        vy: hadronPy / mass,
        vz: hadronPz / mass,
        mass: mass,
        size: Feynman.getSize(productType),
        isNew: true,
        lifetime: 99999,  // Stable hadrons
        stable: true,
      });
    }

    // Photon flies off (short-lived for performance)
    newParticles.push({
      type: ParticleType.PHOTON,
      x: comX,
      y: comY,
      z: comZ,
      originX: comX,
      originY: comY,
      originZ: comZ,
      vx: Math.cos(photonAngle) * photonSpeed,
      vy: Math.sin(photonAngle) * photonSpeed,
      vz: 0,
      mass: 0,
      size: 2 + reaction.photonEnergy * 0.3,
      energy: reaction.photonEnergy,
      isPhoton: true,
      lifetime: 0.4,  // Short lifetime for performance
    });

    return newParticles;
  }

  /**
   * Draw a squiggly photon line (Feynman diagram style)
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1 - start x
   * @param {number} y1 - start y
   * @param {number} x2 - end x
   * @param {number} y2 - end y
   * @param {number} amplitude - wave amplitude
   * @param {number} frequency - number of waves
   * @param {number} alpha - opacity
   */
  static drawSquigglyLine(ctx, x1, y1, x2, y2, amplitude = 1.5, frequency = 12, alpha = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) return; // Too short to draw

    // Cap the length - only draw near the tip
    const maxLen = 25;
    if (dist > maxLen) {
      const ratio = maxLen / dist;
      x1 = x2 - dx * ratio;
      y1 = y2 - dy * ratio;
    }

    const newDx = x2 - x1;
    const newDy = y2 - y1;
    const newDist = Math.sqrt(newDx * newDx + newDy * newDy);

    // Perpendicular direction for wave
    const px = -newDy / newDist;
    const py = newDx / newDist;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 255, 150, ${alpha * 0.6})`;
    ctx.lineWidth = 0.8;

    const steps = Math.max(8, Math.floor(newDist / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const baseX = x1 + newDx * t;
      const baseY = y1 + newDy * t;

      // Sine wave perpendicular to line direction
      const wave = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
      const x = baseX + px * wave;
      const y = baseY + py * wave;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }
}

// ============================================================
// Fusion Test Demo - Quarks → Hadrons → Nuclei
// Full nucleosynthesis chain starting from quarks
// ============================================================

const CONFIG = {
  bgColor: "#000",
  quarkDensity: 0.0015,     // Quarks per pixel² (scales with canvas size)
  minQuarks: 60,            // Minimum quarks (small screens)
  maxQuarks: 3000,          // Maximum quarks (large screens)
  quarkSpeed: 600,          // VERY high initial velocity (Big Bang momentum)
  expansionTime: 2.0,       // Seconds before physics enables (expansion phase)

  // Space expansion - universe starts as singularity
  initialSpaceSize: 0.05,   // Start at 5% of canvas (tiny singularity)
  finalSpaceSize: 0.95,     // Expand to 95% of canvas

  // Heat dynamics - early universe is SUPER HOT
  initialTemp: 1.0,         // Starting temperature (max)
  coolingRate: 0.05,        // Universe cooling rate
  minTemp: 0.1,             // Minimum temperature (never fully cold)

  // Primordial abundance targets - these are the LIMITS
  targetDHRatio: 26 / 1000, // D/H = 26 per 1000 (once reached, no more D forms)

  // Realistic nucleosynthesis - more protons than neutrons!
  protonRatio: 0.88,        // 88% protons, 12% neutrons
  thermalJitter: 80,        // Thermal vibration strength at max temp
  heatTransferRate: 0.1,    // Heat transfer between nearby particles
  heatTransferRange: 30,    // Range for heat transfer
};

class CollisionTestDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null;  // We handle background in renderCosmicBackground()
    this.nextParticleId = 0;
    this.elapsedTime = 0;
    this.physicsEnabled = false;  // Disabled during expansion phase
    this.universeTemp = CONFIG.initialTemp;  // Universe temperature (cools over time)
    this.spaceSize = CONFIG.initialSpaceSize;  // Current size of space (0-1)
    this.cleanupTimer = 0;  // Timer for periodic dead particle cleanup
    this.currentDHRatio = 0;  // Current deuterium/hydrogen ratio
    this.dhLimitReached = false;  // True when D/H target is hit
  }

  /**
   * Calculate current D/H ratio from particle counts
   */
  updateDHRatio() {
    const particles = this.particles.particles;
    let hydrogen = 0;
    let deuterium = 0;

    for (const p of particles) {
      if (p.dead) continue;
      if (p.type === ParticleType.PROTON) hydrogen++;
      else if (p.type === ParticleType.DEUTERIUM) deuterium++;
    }

    this.currentDHRatio = hydrogen > 0 ? deuterium / hydrogen : 0;
    this.dhLimitReached = this.currentDHRatio >= CONFIG.targetDHRatio;
  }

  /**
   * Get current bounds based on space expansion
   */
  getCurrentBounds() {
    const halfW = (this.width / 2) * this.spaceSize;
    const halfH = (this.height / 2) * this.spaceSize;
    return {
      minX: -halfW,
      maxX: halfW,
      minY: -halfH,
      maxY: halfH,
    };
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;
    super.init();
    Painter.init(this.ctx);

    // Camera for 3D projection
    this.camera = new Camera3D({
      perspective: 800,
      rotationX: 0,
      rotationY: 0,
    });

    // Scene3D MUST be centered at canvas center for proper 3D projection
    this.scene3d = new Scene3D(this, {
      x: this.width / 2,
      y: this.height / 2,
      camera: this.camera,
    });

    // Bounds for collision (centered coordinate system)
    this.bounds = {
      minX: -this.width / 2 + 20,
      maxX: this.width / 2 - 20,
      minY: -this.height / 2 + 20,
      maxY: this.height / 2 - 20,
    };

    // Queue for particles to spawn (fusion products)
    this.spawnQueue = [];

    // Track processed triple collisions to avoid duplicates
    this.processedTriples = new Set();

    // Calculate max particles based on canvas area
    const canvasArea = this.width * this.height;
    const estimatedQuarks = Math.min(CONFIG.maxQuarks,
      Math.max(CONFIG.minQuarks, canvasArea * CONFIG.quarkDensity));
    const maxParticles = Math.floor(estimatedQuarks * 1.5);  // Room for hadrons + photons

    // Particle system for rendering (inside Scene3D)
    this.particles = new ParticleSystem(this, {
      camera: this.camera,
      maxParticles: maxParticles,
      depthSort: false,
      updaters: [
        // Velocity integration
        (p, dt) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z = (p.z || 0) + (p.vz || 0) * dt;
        },
        // Photon lifetime decay (only photons decay, everything else is stable)
        (p, dt) => {
          if (p.isPhoton && !p.stable) {
            p.lifetime -= dt;
            p.alpha = Math.max(0, p.lifetime / 2.0);
            if (p.lifetime <= 0) p.dead = true;
          }
          // Track age for all particles (for debugging)
          p.age = (p.age || 0) + dt;

          // IMPORTANT: Hide dead particles (ParticleSystem doesn't auto-hide them)
          if (p.dead) {
            p.alpha = 0;
            p.size = 0;
          }
        },
        // Mutual attraction (not for photons, quarks attract strongly)
        // Only enabled after expansion phase
        (p, dt, system) => {
          if (!this.physicsEnabled) return;  // Skip during expansion
          if (p.isPhoton) return;
          const others = system.particles;
          // Quarks have MUCH stronger attraction (strong force / confinement)
          const strength = p.type === ParticleType.QUARK ? 5000 : 800;
          for (const other of others) {
            if (other === p || other.dead || other.isPhoton) continue;
            // Quarks only attract other quarks strongly
            const effectiveStrength = (p.type === ParticleType.QUARK && other.type === ParticleType.QUARK)
              ? strength : 800;
            const force = Feynman.attract(p, other, effectiveStrength, 3);
            p.vx += force.fx * dt;
            p.vy += force.fy * dt;
          }
        },
        // TRIPLE COLLISION - Quark hadronization (3 quarks → hadron)
        (p, dt, system) => {
          if (!this.physicsEnabled) return;  // Skip during expansion
          if (p.dead || p.type !== ParticleType.QUARK) return;

          const others = system.particles.filter(
            o => o !== p && !o.dead && o.type === ParticleType.QUARK
          );

          // Find nearby quarks - use larger detection radius
          const nearby = [];
          const detectionRadius = 25;  // Fixed radius for quark clustering
          for (const other of others) {
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dz = (other.z || 0) - (p.z || 0);
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < detectionRadius) {
              nearby.push({ p: other, dist });
            }
          }

          // Check for triple collision - wider threshold
          const tripleParticles = Feynman.checkTripleCollision(p, nearby, 4.0);
          if (tripleParticles) {
            // Create unique ID for this triple to avoid duplicate processing
            const ids = tripleParticles.map(q => q.id || system.particles.indexOf(q)).sort();
            const tripleId = ids.join('-');

            if (!this.processedTriples.has(tripleId)) {
              this.processedTriples.add(tripleId);

              // Universe is HOT - hadronization happens when quarks cluster
              // Protons are MORE COMMON than neutrons (realistic n:p ratio ~1:7)
              const actualReaction = Math.random() < CONFIG.protonRatio
                ? REACTIONS.QUARK_TO_PROTON
                : REACTIONS.QUARK_TO_NEUTRON;

              // HADRONIZATION! (no energy check - universe is super hot)
              const newParticles = Feynman.performTripleFusion(tripleParticles, actualReaction);
              this.spawnQueue.push(...newParticles);

              // Mark quarks as dead
              tripleParticles.forEach(q => q.dead = true);

              const productName = actualReaction.products[0];
              console.log(`HADRONIZATION: 3 quarks → ${productName} + photon`);
            }
          }
        },
        // TWO-PARTICLE Collision detection, response, and FUSION
        (p, dt, system) => {
          if (!this.physicsEnabled) return;  // Skip during expansion
          if (p.isPhoton || p.dead) return;
          // Skip quarks for binary fusion (they need triple collision)
          if (p.type === ParticleType.QUARK) return;

          const others = system.particles;

          for (const other of others) {
            if (other === p || other.dead || other.isPhoton) continue;
            if (other.type === ParticleType.QUARK) continue; // Skip quarks

            const collision = Feynman.checkCollision(p, other, 1.0);
            if (collision) {
              // Check for fusion reaction
              const fusionData = Feynman.checkFusion(p, other, collision);

              // D/H RATIO LIMIT: Block p+n→D if we've hit the target ratio
              const isDeuteriumFormation = fusionData &&
                fusionData.reaction.products.includes(ParticleType.DEUTERIUM);
              if (isDeuteriumFormation && this.dhLimitReached) {
                // D/H limit reached - no more deuterium can form!
                // Just do elastic collision instead
                const response = Feynman.elasticCollision(p, other, collision, 0.9);
                if (response) {
                  p.vx = response.v1.vx;
                  p.vy = response.v1.vy;
                  other.vx = response.v2.vx;
                  other.vy = response.v2.vy;
                }
                continue;
              }

              if (fusionData && Math.random() < fusionData.probability) {
                // FUSION! Create new particles
                const newParticles = Feynman.performFusion(p, other, fusionData);
                this.spawnQueue.push(...newParticles);

                // Mark reactants as dead
                p.dead = true;
                other.dead = true;

                console.log(`FUSION: ${p.type} + ${other.type} → ${fusionData.reaction.products.join(' + ')} + photon`);
                return;
              }

              // No fusion - elastic collision
              const response = Feynman.elasticCollision(p, other, collision, 0.9);
              if (response) {
                p.vx = response.v1.vx;
                p.vy = response.v1.vy;
                other.vx = response.v2.vx;
                other.vy = response.v2.vy;

                // Separate particles
                const separationForce = collision.overlap * 0.5;
                const dist = collision.dist || 1;
                p.x -= (collision.dx / dist) * separationForce;
                p.y -= (collision.dy / dist) * separationForce;
                other.x += (collision.dx / dist) * separationForce;
                other.y += (collision.dy / dist) * separationForce;
              }
            }
          }
        },
        // Bounds collision - bounce off expanding space walls!
        (p, dt) => {
          if (!p.isPhoton) {
            // Get current expanding bounds
            const bounds = this.getCurrentBounds();
            // Restitution based on universe temp - hot walls = elastic bounce
            const restitution = 0.95 + this.universeTemp * 0.05;  // 0.95-1.0
            Feynman.boundsCollision(p, bounds, restitution);
          }
        },
        // THERMAL DYNAMICS - particles are excited by hot universe
        (p, dt, system) => {
          if (p.isPhoton || p.dead) return;

          // Initialize particle temperature if not set
          if (p.temperature === undefined) {
            p.temperature = this.universeTemp;
          }

          // Particle temperature approaches universe temperature (heat bath)
          const tempDiff = this.universeTemp - p.temperature;
          p.temperature += tempDiff * 0.1;  // Equilibrate with environment

          // THERMAL JITTER - particles twitch based on temperature!
          // Higher temp = more violent twitching
          const jitterStrength = CONFIG.thermalJitter * p.temperature;
          p.vx += (Math.random() - 0.5) * jitterStrength * dt * 60;
          p.vy += (Math.random() - 0.5) * jitterStrength * dt * 60;

          // Heat transfer with nearby particles
          if (this.physicsEnabled) {
            const others = system.particles;
            for (const other of others) {
              if (other === p || other.dead || other.isPhoton) continue;
              if (other.temperature === undefined) continue;

              const dx = other.x - p.x;
              const dy = other.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < CONFIG.heatTransferRange) {
                // Heat flows from hot to cold
                const transfer = (other.temperature - p.temperature) * CONFIG.heatTransferRate * dt;
                p.temperature += transfer;
              }
            }
          }
        },
        // Velocity clamping and post-freeze-out damping
        (p, dt) => {
          if (!p.isPhoton) {
            // Clamp max velocity to prevent tunneling through bounds
            const maxVel = 800;
            p.vx = Math.max(-maxVel, Math.min(maxVel, p.vx));
            p.vy = Math.max(-maxVel, Math.min(maxVel, p.vy));

            // After D/H limit: light damping so clusters stabilize
            if (this.dhLimitReached) {
              const damping = 0.995;  // Very light damping
              p.vx *= damping;
              p.vy *= damping;
            }
          }
        },
        // POST D/H LIMIT: Gravitational clustering (structure formation)
        // Same-type particles attract more strongly (chemical affinity)
        (p, dt, system) => {
          if (p.isPhoton || p.dead) return;
          // Only enable after D/H target is reached
          if (!this.dhLimitReached) return;

          const others = system.particles;
          const universalGravity = 50;    // Weak universal attraction
          const sameTypeBonus = 150;       // Stronger same-type attraction
          const minDist = 15;

          for (const other of others) {
            if (other === p || other.dead || other.isPhoton) continue;

            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || minDist;

            if (dist < minDist || dist > 200) continue;  // Skip if too close or too far

            // Attraction strength: universal + bonus for same type
            const sameType = p.type === other.type;
            const strength = universalGravity + (sameType ? sameTypeBonus : 0);

            // Heavier particles attract more (mass-based gravity)
            const massProduct = (p.mass || 1) * (other.mass || 1);
            const force = (strength * massProduct) / (distSq);

            // Apply force
            p.vx += (dx / dist) * force * dt;
            p.vy += (dy / dist) * force * dt;
          }
        },
      ],
    });

    // Emitter for QUARKS - all start from singularity (0,0,0)
    const quarkColor = Feynman.getColor(ParticleType.QUARK);
    const quarkSize = Feynman.getSize(ParticleType.QUARK);
    this.particles.addEmitter(
      "quark",
      new ParticleEmitter({
        rate: 0,
        position: { x: 0, y: 0, z: 0 },  // Singularity - single point
        spread: { x: 0, y: 0, z: 0 },    // No spread - all from same point
        velocity: { x: 0, y: 0, z: 0 },
        velocitySpread: { x: 1, y: 1, z: 0 },  // Will override below
        lifetime: { min: 999, max: 999 },
        size: { min: quarkSize, max: quarkSize },
        color: quarkColor,
        shape: "circle",
      })
    );

    // Calculate quark count (reuse canvasArea from above)
    const quarkCount = Math.floor(estimatedQuarks);
    console.log(`Canvas: ${this.width}x${this.height}, spawning ${quarkCount} quarks`);

    // Spawn quarks
    this.particles.burst(quarkCount, "quark");

    // Set particle properties - give each quark random direction with high speed
    const allParticles = this.particles.particles;
    this.nextParticleId = allParticles.length;
    for (let i = 0; i < allParticles.length; i++) {
      const p = allParticles[i];
      p.type = ParticleType.QUARK;
      p.mass = Feynman.getMass(ParticleType.QUARK);
      p.id = i;
      p.temperature = CONFIG.initialTemp;  // Start HOT!
      p.stable = true;  // Quarks don't decay (in our simplified model)
      p.lifetime = 99999;
      p.age = 0;

      // Random direction, high speed (Big Bang momentum)
      const angle = Math.random() * Math.PI * 2;
      const speed = CONFIG.quarkSpeed * (0.7 + Math.random() * 0.6);  // Some variation
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.x = 0;  // Ensure starting at origin
      p.y = 0;
      p.z = 0;
    }

    // Generic emitter for spawning fusion products
    this.particles.addEmitter(
      "spawn",
      new ParticleEmitter({
        rate: 0,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        velocitySpread: { x: 0, y: 0, z: 0 },
        lifetime: { min: 999, max: 999 },
        size: { min: 8, max: 8 },
        color: { r: 255, g: 255, b: 255, a: 1 },
        shape: "circle",
      })
    );

    // Add ParticleSystem to Scene3D, then Scene3D to pipeline
    this.scene3d.add(this.particles);
    this.pipeline.add(this.scene3d);
  }

  /**
   * Remove dead particles from the pool - proper cleanup for performance
   */
  cleanupDeadParticles() {
    const pool = this.particles.particles;
    const before = pool.length;

    // Filter out dead particles
    let writeIdx = 0;
    for (let readIdx = 0; readIdx < pool.length; readIdx++) {
      const p = pool[readIdx];
      if (!p.dead) {
        if (writeIdx !== readIdx) {
          pool[writeIdx] = p;
        }
        writeIdx++;
      }
    }

    // Truncate array to remove dead particles
    pool.length = writeIdx;

    const removed = before - writeIdx;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} dead particles`);
    }
  }

  /**
   * Spawn a particle from a definition (from fusion)
   */
  spawnParticle(def) {
    // Update emitter position/velocity
    const emitter = this.particles.emitters.get("spawn");
    if (!emitter) return;

    emitter.position = { x: def.x, y: def.y, z: def.z || 0 };
    emitter.velocity = { x: def.vx, y: def.vy, z: def.vz || 0 };
    emitter.size = { min: def.size, max: def.size };
    emitter.color = Feynman.getColor(def.type);
    emitter.lifetime = { min: def.lifetime || 999, max: def.lifetime || 999 };

    // Burst one particle
    this.particles.burst(1, "spawn");

    // Set properties on the new particle
    const newParticle = this.particles.particles[this.particles.particles.length - 1];
    if (newParticle) {
      newParticle.type = def.type;
      newParticle.mass = def.mass;
      newParticle.isPhoton = def.isPhoton || false;
      newParticle.lifetime = def.lifetime || 99999;  // Very long lifetime by default
      newParticle.age = 0;  // Reset age
      newParticle.energy = def.energy || 0;
      newParticle.isNew = def.isNew || false;
      newParticle.stable = def.stable || !def.isPhoton;  // All non-photons are stable
      newParticle.id = this.nextParticleId++;
      newParticle.temperature = this.universeTemp;  // Inherit universe temp

      // Copy photon origin for squiggly line rendering
      if (def.originX !== undefined) {
        newParticle.originX = def.originX;
        newParticle.originY = def.originY;
        newParticle.originZ = def.originZ || 0;
      }
    }
  }

  update(dt) {
    super.update(dt);

    // Track elapsed time
    this.elapsedTime += dt;

    // SPACE EXPANSION during expansion phase
    if (!this.physicsEnabled) {
      // Ease out expansion (fast at first, slows down)
      const t = Math.min(1, this.elapsedTime / CONFIG.expansionTime);
      const eased = 1 - Math.pow(1 - t, 3);  // Ease out cubic
      this.spaceSize = CONFIG.initialSpaceSize +
        (CONFIG.finalSpaceSize - CONFIG.initialSpaceSize) * eased;
    }

    // Enable physics after expansion phase
    if (!this.physicsEnabled && this.elapsedTime >= CONFIG.expansionTime) {
      this.physicsEnabled = true;
      this.spaceSize = CONFIG.finalSpaceSize;
      console.log("Physics enabled! Hadronization can begin.");
    }

    // Universe cools over time (but never below minimum)
    if (this.physicsEnabled) {
      this.universeTemp = Math.max(
        CONFIG.minTemp,
        this.universeTemp - CONFIG.coolingRate * dt
      );
    }

    // Clear processed triples at start of frame (they were processed last frame)
    this.processedTriples.clear();

    // Process spawn queue (fusion products)
    while (this.spawnQueue.length > 0) {
      const def = this.spawnQueue.shift();
      this.spawnParticle(def);
    }

    // Periodic cleanup of dead particles (every 0.5 seconds)
    this.cleanupTimer += dt;
    if (this.cleanupTimer >= 0.5) {
      this.cleanupTimer = 0;
      this.cleanupDeadParticles();
    }

    // Update D/H ratio (used to limit deuterium formation)
    this.updateDHRatio();

    // Safety net: hard clamp ALL particles to expanding bounds
    const bounds = this.getCurrentBounds();
    const restitution = 0.95 + this.universeTemp * 0.05;  // Hot walls
    for (const p of this.particles.particles) {
      if (p.dead || p.isPhoton) continue;
      if (p.x < bounds.minX) { p.x = bounds.minX; p.vx = Math.abs(p.vx) * restitution; }
      if (p.x > bounds.maxX) { p.x = bounds.maxX; p.vx = -Math.abs(p.vx) * restitution; }
      if (p.y < bounds.minY) { p.y = bounds.minY; p.vy = Math.abs(p.vy) * restitution; }
      if (p.y > bounds.maxY) { p.y = bounds.maxY; p.vy = -Math.abs(p.vy) * restitution; }
    }
  }

  /**
   * Render simple temperature-based background gradient
   * Contained within the expanding space bounds (red border)
   */
  renderCosmicBackground() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const temp = this.universeTemp;

    // Get current space bounds
    const bounds = this.getCurrentBounds();
    const spaceWidth = bounds.maxX - bounds.minX;
    const spaceHeight = bounds.maxY - bounds.minY;
    const radius = Math.max(spaceWidth, spaceHeight) / 2;

    // Clear whole canvas to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Clip to space bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + bounds.minX, cy + bounds.minY, spaceWidth, spaceHeight);
    ctx.clip();

    // Radial glow from center - contained in space
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    // CORRECT blackbody: blue-white (hot) → yellow → orange → red (cool)
    let r, g, b;
    if (temp > 0.7) {
      // Hot: blue-white
      const t = (temp - 0.7) / 0.3;
      r = 200 + 55 * (1 - t);  // less red when hottest
      g = 220 + 35 * (1 - t);
      b = 255;                  // max blue
    } else if (temp > 0.4) {
      // Medium: white to yellow
      const t = (temp - 0.4) / 0.3;
      r = 255;
      g = 180 + 40 * t;
      b = 100 * t;
    } else if (temp > 0.2) {
      // Cool: yellow to orange
      const t = (temp - 0.2) / 0.2;
      r = 255;
      g = 100 + 80 * t;
      b = 0;
    } else {
      // Cold: orange to red to dark
      const t = temp / 0.2;
      r = 150 + 105 * t;
      g = 30 * t;
      b = 0;
    }

    const centerAlpha = 0.6 * Math.max(0.1, temp);

    gradient.addColorStop(0, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${centerAlpha})`);
    gradient.addColorStop(0.5, `rgba(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.3)}, ${centerAlpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.1)}, 0, ${centerAlpha * 0.1})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();

    // Motion blur trail (whole canvas)
    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + (1 - temp) * 0.12})`;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  render() {
    // DON'T call super.render() - it clears the canvas
    // Instead, render cosmic background then pipeline manually

    // Cosmic temperature background
    this.renderCosmicBackground();

    // Render pipeline manually (particles, scene3d, etc)
    this.pipeline.render(this.ctx);

    // Draw squiggly photon lines (Feynman diagram style)
    const photons = this.particles.particles.filter(p => p.isPhoton && !p.dead);
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (const photon of photons) {
      if (photon.originX !== undefined) {
        // Convert local coords to screen coords
        const x1 = centerX + photon.originX;
        const y1 = centerY + photon.originY;
        const x2 = centerX + photon.x;
        const y2 = centerY + photon.y;

        const alpha = photon.alpha !== undefined ? photon.alpha : 1;
        Feynman.drawSquigglyLine(this.ctx, x1, y1, x2, y2, 3, 6, alpha);
      }
    }

    // Debug info
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "14px monospace";
    this.ctx.fillText("Feynman Nucleosynthesis", 20, 30);

    // Show current phase
    if (!this.physicsEnabled) {
      const remaining = (CONFIG.expansionTime - this.elapsedTime).toFixed(1);
      this.ctx.fillStyle = "#ff0";
      this.ctx.fillText(`EXPANSION PHASE (${remaining}s)`, 20, 50);
    } else if (!this.dhLimitReached) {
      this.ctx.fillStyle = "#0f0";
      this.ctx.fillText("NUCLEOSYNTHESIS ACTIVE", 20, 50);
    } else {
      this.ctx.fillStyle = "#08f";
      this.ctx.fillText("D/H LIMIT REACHED (clustering)", 20, 50);
    }

    // Universe temperature indicator
    const tempPercent = (this.universeTemp * 100).toFixed(0);
    const tempColor = `rgb(255, ${Math.floor(100 + this.universeTemp * 155)}, ${Math.floor(this.universeTemp * 100)})`;
    this.ctx.fillStyle = tempColor;
    this.ctx.fillText(`Universe Temp: ${tempPercent}%`, 20, 70);

    const active = this.particles.particles.filter(p => !p.dead);

    // Count particle types
    const counts = {};
    for (const p of active) {
      const type = p.type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
    }

    // Display order for particle types (evolution chain)
    const displayOrder = [
      ParticleType.QUARK,
      ParticleType.PROTON,
      ParticleType.NEUTRON,
      ParticleType.DEUTERIUM,
      ParticleType.HELIUM3,
      ParticleType.HELIUM4,
      ParticleType.PHOTON,
    ];

    let y = 80;
    this.ctx.fillText("Particles:", 20, y);
    y += 20;

    for (const type of displayOrder) {
      if (counts[type]) {
        const color = Feynman.getColor(type);
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.fillText(`  ${type}: ${counts[type]}`, 20, y);
        y += 18;
      }
    }

    this.ctx.fillStyle = "#fff";
    y += 10;
    this.ctx.fillText(`Total: ${active.length}`, 20, y);

    // D/H ratio indicator (primordial target: 26/1000 = 0.026)
    const hydrogen = counts[ParticleType.PROTON] || 0;  // Free protons = hydrogen
    const deuterium = counts[ParticleType.DEUTERIUM] || 0;
    if (hydrogen > 0) {
      const dhRatio = deuterium / hydrogen;
      const dhPer1000 = (dhRatio * 1000).toFixed(1);
      y += 25;
      this.ctx.fillStyle = "#0ff";
      this.ctx.fillText(`D/H ratio: ${dhPer1000}/1000`, 20, y);
      this.ctx.fillStyle = "rgba(255,255,255,0.5)";
      this.ctx.fillText(`(target: 26/1000)`, 20, y + 16);
    }

    // Legend
    this.ctx.fillStyle = "rgba(255,255,255,0.7)";
    const legendY = this.height - 60;
    this.ctx.fillText("Chain: quark(white) → proton(red)/neutron(blue)", 20, legendY);
    this.ctx.fillText("       → deuterium(green) → helium(yellow)", 20, legendY + 18);
    this.ctx.fillText("       Each fusion releases a photon (white flash)", 20, legendY + 36);

    // Draw expanding space bounds
    const bounds = this.getCurrentBounds();

    // Convert bounds to screen coords (centerX/Y already defined above)
    const bx = centerX + bounds.minX;
    const by = centerY + bounds.minY;
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;

    // Color based on expansion phase
    const alpha = this.physicsEnabled ? 0.2 : 0.5;
    this.ctx.strokeStyle = `rgba(255, ${this.physicsEnabled ? 100 : 50}, 50, ${alpha})`;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(bx, by, bw, bh);

    // Show space size during expansion
    if (!this.physicsEnabled) {
      this.ctx.fillStyle = "rgba(255,100,100,0.7)";
      this.ctx.fillText(`Space: ${(this.spaceSize * 100).toFixed(0)}%`, this.width - 100, 30);
    }
  }

  stop() {
    this._initialized = false;
    super.stop();
  }
}

export default function day09(canvas) {
  const game = new CollisionTestDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
