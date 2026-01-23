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
  2: 'Origami Murmuration: paper cranes flock together, demonstrating follow-through, overlapping action, and arcs. Move mouse to scatter, click to burst.',
  3: 'Phyllotaxis: the Fibonacci spiral pattern you see in sunflowers and pinecones',
  4: 'Banksy-inspired street art wall: infinite scrolling pixelated patterns on a midnight sidewalk',
  5: 'Hand-coded 5x7 pixel font (no system fonts!) rendered as 3D fingerprint ridges. Particles orbit from G and spring into place. Mouse repels with glow.',
  6: 'A digital lava lamp: toggle the "lights" to fade the heat, glow, and motion in/out',
  7: 'Bitwise fractals: Sierpinski triangles and infinite patterns emerge from simple boolean operations like (x & y) and (x ^ y)',
  8: 'Forge Star: a colonizer ship emerges from a wormhole to build a Dyson swarm to collect energy from the star. They dope the star with heavy elements to forge metals, shifting it from blue to purple.',
  9: 'Fungal Hunger Games: 6 slime mold species battle for territory. Each follows its own trails, avoids enemies. Cross enemy trails = death. Dead become food (3 = 1 agent). Click to reinforce nearest colony.',
  10: 'Hyperbolic Crochet: a polar (r,θ) wireframe mesh with exponential ruffling at the edges. A mathematical coral that crocheters create to visualize negative curvature. Click to excite the fabric.',
  11: 'Matrix rain that fetches and displays its own source code. Hover to slow down and illuminate the text for reading. Click to reset.',
  12: 'Isometric Mondrian: recursive grid subdivision rendered as 3D boxes with primary colors on black. Swipe/drag or Q/E to rotate, tap/click to regenerate.',
  13: 'Pixel Teleporter: pixels fly from your image to reveal a hidden portrait. Layer multiple sources for variations.',
  14: 'Tangram: 7 ancient puzzle pieces spring into cats, birds, runners, and more. Click to transform.',
  15: 'Black Hole: an invisible singularity revealed only by gravitational lensing and its glowing accretion disk. Click to feed matter into the void.',
  16: "Maxwell's Demon: a tiny demon sorts hot and cold gas particles, seemingly violating the second law of thermodynamics. Order emerges from chaos... or does it? 😈",
  17: 'Infinite Poincaré: hyperbolic tessellation that never ends. Zoom in or out forever through nested disks within disks. Click to change pattern, drag to pan, scroll to dive deeper.',
  18: "Langton's Ant × Particle Collider: two ants walk opposing planes (screen & exclusion blend). When paths cross, matter collides in bursts of light. Press [R] to restart.",
  19: 'Grokking: a 16×16 neural network learns modular arithmetic. Watch hidden neurons light up as it trains. If you think nothing is happening, wait. Click to restart.',
  20: 'Ouroboros: the ancient serpent eating its own tail. One continuous line, eternally consuming and regenerating. Click to grow, drag to rotate.',
  21: 'Procedural Bauhaus: Living geometric composition with primary colors and breathing shapes. Parallax layers respond to mouse, click to regenerate.',
  22: 'Etch-a-Sketch: terminal-style drawing toy with rotary knobs. Drag to draw, shake to clear, [S] exports SVG for pen plotters.',
  23: 'Liquid Glass: Apple-inspired metaball blobs with frosted glass refraction, chromatic aberration, and fresnel rim lighting. Move mouse to attract.',
  24: 'Spirograph Nightmare: π (irrational) creates patterns that NEVER close. 3.14 (rational) eventually meets itself. Click to toggle and watch the difference.',
  25: 'Primordial Soup: Simple molecules in a warm ocean, energized by lightning and hydrothermal vents. Watch amino acids and peptides emerge from chaos.',
  26: 'Menger Sponge: 8,000 particles assemble into the 3D recursive fractal, one cube at a time. Double-click to scatter and watch them reform. Drag to orbit, scroll to zoom.',
  27: 'Gaseous Sentience: click to feed it colored nebulae, watch it grow complex. It slowly starves as it radiates.',
  28: 'GENUARY 2006: No canvas, only HTML! What if Genuary existed in 2006? Synthwave sunset, neon grid, VHS scanlines, and maximum vaporwave energy. Click to visit.',
  29: 'SEIR epidemic model with viral mutation. Click agent to infect, watch variants emerge. Hospital zone (cyan) forces mutation pressure. [i] for analytics.',
  30: 'QUIET ANALYZER: The quieter the sound, the CRAZIER the line goes. Loud = calm. Silence = chaos. It\'s not a bug, it\'s a feature!',
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
export const TOTAL_DAYS = 23;
