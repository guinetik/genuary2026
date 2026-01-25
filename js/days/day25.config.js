export const TAU = Math.PI * 2;

export const CONFIG = {
  // Molecule counts - scaled by canvas size
  baseMolecules: 40,    // Base count for 1920x1080
  minMolecules: 20,     // Minimum for small screens
  maxMolecules: 200,    // Maximum for 4K screens (soft limit for performance)

  // Camera
  perspective: 800,

  // Heat zones (normalized y: 0 = top, 1 = bottom)
  heatZone: 0.85, // Hydrothermal vent at bottom
  coolZone: 0.15, // Cold surface water at top
  heatRate: 0.06, // Was 0.008 - much faster temperature changes

  // Thermal physics (buoyancy handles both rise AND sink)
  buoyancyStrength: 150, // Gentler vertical movement
  neutralTemp: 0.5,

  // Movement
  baseSpeed: 25, // Was 15
  damping: 0.985, // Was 0.97 - less friction for more visible motion

  // Convection currents (replaces Motion.float/oscillate)
  convectionCurrentX: 80, // Horizontal circulation force
  convectionTurbulence: 40, // Random jitter for organic feel

  // Spatial bounds
  worldWidthRatio: 0.95, // Was implicit 0.8
  worldHeightRatio: 0.95, // Was implicit 0.9
  worldDepth: 400, // Was 200

  // Heat transfer between molecules
  heatTransferDist: 80,
  heatTransferRate: 0.02,

  // Reactions
  reactionDistance: 100, // Increased range for more collisions
  reactionCooldown: 0.3,
  baseReactionChance: 0.4, // Much higher base chance

  // Collision / separation - stronger for bouncy molecules
  separationPadding: 5, // Buffer zone around molecules
  separationStiffness: 0.85, // Was 0.5 - faster separation
  collisionDamping: 0.6, // Was 0.25 - bouncier collisions

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

  // Bond rendering
  bondDepthClamp: 10,         // Max depth light adjustment (+/-)
  bondDepthDivisor: 40,       // Depth-to-light conversion factor
  bondBaseLightness: 40,      // Base bond lightness %
  bondTempLightMult: 15,      // Temperature -> lightness multiplier
  bondBaseSaturation: 50,     // Base bond saturation %
  bondTempSatMult: 30,        // Temperature -> saturation multiplier
  bondSingleWidth: 3,         // Single bond line width
  bondMultiWidth: 2,          // Double/triple bond line width
  bondMultiGap: 4,            // Gap between parallel bonds

  // Atom rendering
  atomDepthClampMin: -15,     // Depth light clamp (darker)
  atomDepthClampMax: 10,      // Depth light clamp (brighter)
  atomDepthDivisor: 30,       // Depth-to-light conversion factor
  atomTempLightMult: 12,      // Temperature -> lightness multiplier
  atomLightMin: 20,           // Minimum lightness %
  atomLightMax: 90,           // Maximum lightness %
  atomHighlightOffset: 0.4,   // Highlight position offset ratio
  atomGradientStops: [0, 0.3, 0.7, 1], // Gradient stop positions
  atomHighlightSatBoost: 20,  // Saturation boost for highlight
  atomHighlightLightBoost: 30,// Lightness boost for highlight
  atomMidLightDrop: 15,       // Lightness drop for mid-tone
  atomEdgeSatBoost: 10,       // Saturation boost for edge
  atomEdgeLightDrop: 25,      // Lightness drop for edge
  atomOutlineAlpha: 0.3,      // Normal outline opacity
  atomOutlineWidth: 0.5,      // Normal outline width

  // Reaction flash effect
  flashColor: [0, 255, 100],  // RGB for reaction outline
  flashAlphaMult: 1.5,        // Flash alpha multiplier
  flashWidthBase: 2,          // Flash outline base width
  flashWidthMin: 0.5,         // Flash width at fade end
  flashWidthRange: 0.5,       // Flash width scaling with flash value

  // Ambient particles
  bubbleCount: 40,
  particleCount: 60,
  causticSpeed: 0.3,

  debugLegend:true
};
