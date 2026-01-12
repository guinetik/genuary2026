/**
 * Genuary 2026 Prompts
 * Official prompts from genuary.art
 */

export const PROMPTS = {
  1: 'One color, one shape',
  2: 'Twelve principles of animation',
  3: 'Fibonacci forever',
  4: 'Lowres',
  5: 'Write "Genuary" (no fonts)',
  6: 'Lights on/off',
  7: 'Boolean algebra',
  8: 'A City',
  9: 'Crazy automaton',
  10: 'Polar coordinates',
  11: 'Quine',
  12: 'Boxes only',
  13: 'Self portrait',
  14: 'Everything fits perfectly',
  15: 'Invisible object (shadows)',
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
  5: 'Pixel-art letters defined in code, rendered as 3D particles. Inspired by the title sequence from the TV show "Pluribus".',
  6: 'A digital lava lamp: toggle the "lights" to fade the heat, glow, and motion in/out',
  7: 'Bitwise fractals: Sierpinski triangles and infinite patterns emerge from simple boolean operations like (x & y) and (x ^ y)',
  8: 'Forge Star: a colonizer ship emerges from a wormhole to build a Dyson swarm to collect energy from the star. They dope the star with heavy elements to forge metals, shifting it from blue to purple.',
  9: 'Cellular automata gone wild - rules that create unexpected emergent behavior.',
  10: 'Hyperbolic Crochet: a polar (r,θ) wireframe mesh with exponential ruffling at the edges. A mathematical coral that crocheters create to visualize negative curvature. Click to excite the fabric.',
  11: 'Matrix rain that fetches and displays its own source code. Hover to slow down and illuminate the text for reading. Click to reset.',
  12: 'Isometric Mondrian: recursive grid subdivision rendered as 3D boxes with primary colors on black. Swipe/drag or Q/E to rotate, tap/click to regenerate.',
  13: 'Pixel Teleporter: pixels fly from your image to reveal a hidden portrait. Layer multiple sources for variations.',
  14: 'Tangram: 7 ancient puzzle pieces spring into cats, birds, runners, and more. Click to transform.',
  15: 'An invisible object revealed only by the shadows it casts',
  16: "Maxwell's Demon: a tiny demon sorts hot and cold gas particles, seemingly violating the second law of thermodynamics. Order emerges from chaos... or does it? 😈",
  17: 'One of 17 ways to tile a plane with repeating patterns (or 35 if you count symmetries)',
  18: 'Draw a route that changes direction based on one simple rule',
  19: 'Create something within a 16×16 pixel constraint',
  20: 'An artwork made from a single continuous line',
  21: 'Poster design inspired by the German Bauhaus art school aesthetic',
  22: 'Vector art suitable for pen plotter output - clean lines, no fills',
  23: 'Explore layering, alpha, and the concept of see-through',
  24: 'Imperfection, asymmetry, and controlled chaos',
  25: 'Forms that look organic but are constructed from geometric shapes',
  26: 'Split the canvas into a grid and recurse on each cell again and again',
  27: 'A shape or structure that behaves as if alive or growing',
  28: 'No canvas, no libraries - only HTML elements like <div>. Can you do it?',
  29: 'Genetic algorithms: selection, crossover, and mutation',
  30: 'Embrace the glitch - make unexpected behavior into art',
  31: 'Pure shader art - create using only GLSL'
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
export const TOTAL_DAYS = 14;
