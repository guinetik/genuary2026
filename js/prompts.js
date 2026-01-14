/**
 * Genuary 2026 Prompts
 * Official prompts from genuary.art
 */

export const PROMPTS = {
  1: 'One color, one shape',
  2: 'Twelve principles of animation',
  3: 'Fibonacci forever',
  4: 'Lowres',
  5: 'Write "Genuary"',
  6: 'Lights on/off',
  7: 'Boolean algebra',
  8: 'A City',
  9: 'Crazy automaton',
  10: 'Polar coordinates',
  11: 'Quine',
  12: 'Boxes only',
  13: 'Self portrait',
  14: 'Everything fits perfectly',
  15: 'Invisible object',
  16: 'Order and disorder',
  17: 'Wallpaper group',
  18: 'Unexpected path',
  19: '16x16',
  20: 'One line',
  21: 'Bauhaus Poster',
  22: 'Pen plotter ready',
  23: 'Transparency',
  24: "Perfectionist's nightmare",
  25: 'Organic Geometry',
  26: 'Recursive Grids',
  27: 'Lifeform',
  28: 'No libraries, only HTML',
  29: 'Genetic evolution',
  30: "It's not a bug, it's a feature",
  31: 'GLSL day'
};

/**
 * Creative interpretations for each day
 * One-liner descriptions of our visualization approach
 */
export const INTERPRETATIONS = {
  1: 'Infinite green circles form a twisting wormhole through space',
  2: 'Follow-through and overlapping action: how motion ripples through a chain',
  3: 'Phyllotaxis: the Fibonacci spiral pattern you see in sunflowers and pinecones',
  4: 'Banksy-inspired street art wall: infinite scrolling pixelated patterns on a midnight sidewalk',
  5: 'Hand-coded 5x7 pixel font (no system fonts!) rendered as 3D fingerprint ridges. Particles orbit from G and spring into place. Mouse repels with glow.',
  6: 'A digital lava lamp: toggle the "lights" to fade the heat, glow, and motion in/out',
  7: 'Bitwise fractals: Sierpinski triangles and infinite patterns emerge from simple boolean operations like (x & y) and (x ^ y)',
  8: 'Forge Star: a colonizer ship emerges from a wormhole to build a Dyson swarm to collect energy from the star. They dope the star with heavy elements to forge metals, shifting it from blue to purple.',
  9: 'Physarum: slime mold agents leave pheromone trails, forming organic networks. Click to spawn food—watch tendrils grow toward it.',
  10: 'Hyperbolic Crochet: a polar (r,θ) wireframe mesh with exponential ruffling at the edges. A mathematical coral that crocheters create to visualize negative curvature. Click to excite the fabric.',
  11: 'Matrix rain that fetches and displays its own source code. Hover to slow down and illuminate the text for reading. Click to reset.',
  12: 'Isometric Mondrian: recursive grid subdivision rendered as 3D boxes with primary colors on black. Swipe/drag or Q/E to rotate, tap/click to regenerate.',
  13: 'Pixel Teleporter: pixels fly from your image to reveal a hidden portrait. Layer multiple sources for variations.',
  14: 'Tangram: 7 ancient puzzle pieces spring into cats, birds, runners, and more. Click to transform.',
  15: 'Black Hole: an invisible singularity revealed only by gravitational lensing and its glowing accretion disk. Click to feed matter into the void.',
  16: "Maxwell's Demon: a tiny demon sorts hot and cold gas particles, seemingly violating the second law of thermodynamics. Order emerges from chaos... or does it? 😈",
  17: 'p6m Wallpaper Group: hexagonal symmetry with 6-fold rotation and mirrors. The pattern zooms infinitely while colors shift through the spectrum.',
  18: "Langton's Ant: one rule (turn right on light, left on dark) creates chaos, then suddenly builds a highway. Emergence from simplicity.",
  19: 'Something imprisoned in geometry wants you to free it. 16 clicks until the universe screams apart. An Homage to No Man\'s Sky.',
  20: 'An artwork made from a single continuous line',
  21: 'Bauhaus Poster: Living geometric composition with cycling colors, breathing shapes, and a wandering cursor that leaves trails. Move mouse for parallax, click to regenerate.',
  22: 'Vector art suitable for pen plotter output - clean lines, no fills',
  23: 'Liquid Glass: Apple-inspired metaball blobs with frosted glass refraction, chromatic aberration, and fresnel rim lighting. Move mouse to attract.',
  24: 'Spirograph Nightmare: π (irrational) creates patterns that NEVER close. 3.14 (rational) eventually meets itself. Click to toggle and watch the difference.',
  25: 'Primordial Soup: Simple molecules in a warm ocean, energized by lightning and hydrothermal vents. Watch amino acids and peptides emerge from chaos.',
  26: 'Split the canvas into a grid and recurse on each cell again and again',
  27: 'Gaseous Sentience: click to feed it colored nebulae, watch it grow complex. It slowly starves as it radiates.',
  28: 'GENUARY 2006: No canvas, only HTML! What if Genuary existed in 2006? Synthwave sunset, neon grid, VHS scanlines, and maximum vaporwave energy. Click to visit.',
  29: 'SEIR epidemic model with viral mutation. Click agent to infect, watch variants emerge. Hospital zone (cyan) forces mutation pressure. [i] for analytics.',
  30: 'Embrace the glitch - make unexpected behavior into art',
  31: 'Domain Warping: psychedelic flowing patterns created entirely in GLSL. Layers of noise distort space itself, creating organic fluid motion. Move mouse to disturb.'
};

/**
 * Get prompt for a specific day
 * @param {number} day - Day number (1-31)
 * @returns {string} The prompt text
 */
export function getPrompt(day) {
  return PROMPTS[day] || 'Coming soon...';
}

/**
 * Get interpretation for a specific day
 * @param {number} day - Day number (1-31)
 * @returns {string} The interpretation text
 */
export function getInterpretation(day) {
  return INTERPRETATIONS[day] || 'Coming soon...';
}

/**
 * Total number of Genuary days to display
 * (Expand as implementations are added)
 */
export const TOTAL_DAYS = 31;
