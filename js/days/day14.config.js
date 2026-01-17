// ============================================
// Tangram Geometry Constants
// ============================================

const SQRT2 = Math.sqrt(2);

// ============================================
// Geometry Utilities
// ============================================

/**
 * Rotate a point around the origin.
 * @param {number} x Local x coordinate
 * @param {number} y Local y coordinate
 * @param {number} angleDeg Rotation angle in degrees (clockwise)
 * @returns {{x:number,y:number}} Rotated point
 */
function rotatePoint(x, y, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  };
}

/**
 * Calculate position for a RightTriangle given where its right angle should be.
 * @param {number} cornerX Normalized x where the right angle should land
 * @param {number} cornerY Normalized y where the right angle should land
 * @param {number} leg Normalized leg length for the triangle
 * @param {number} rotationDeg Rotation angle in degrees
 * @returns {{x:number,y:number,rotation:number}} Transform for the piece
 */
function trianglePosition(cornerX, cornerY, leg, rotationDeg) {
  const localCorner = { x: -leg / 3, y: -leg / 3 };
  const rotated = rotatePoint(localCorner.x, localCorner.y, rotationDeg);
  return {
    x: cornerX - rotated.x,
    y: cornerY - rotated.y,
    rotation: rotationDeg,
  };
}

// ============================================
// Configuration
// ============================================

const CONFIG = {
  animDuration: 0.8,
  staggerDelay: 0.1,
  colors: {
    largeTriangle1: "#2196F3", // Blue
    largeTriangle2: "#E91E63", // Magenta/Pink
    mediumTriangle: "#9C27B0", // Purple
    smallTriangle1: "#FFEB3B", // Yellow
    smallTriangle2: "#4CAF50", // Green
    square: "#E53935", // Red
    parallelogram: "#FF9800", // Orange
  },
  strokeColor: "#FFFFFF",
  strokeWidth: 2,
  trailAlpha: 0.12,
  button: {
    width: 140,
    height: 40,
    spacing: 20,
  },
};

const TANGRAM = {
  LARGE_LEG: 1 / SQRT2, // ≈ 0.7071
  MEDIUM_LEG: 0.5,
  SMALL_LEG: 1 / (2 * SQRT2), // ≈ 0.3536
  SQUARE_SIDE: 1 / (2 * SQRT2), // ≈ 0.3536
  PARA_BASE: 0.5, // Parallelogram base
  PARA_HEIGHT: 0.25, // Parallelogram height (area = 1/8 = 0.5 * 0.25)
};

// ============================================
// Square Configurations (s₀ through s₅)
// ============================================

const Ll = TANGRAM.LARGE_LEG; // 0.7071
const Ml = TANGRAM.MEDIUM_LEG; // 0.5
const Sl = TANGRAM.SMALL_LEG; // 0.3536

/**
 * All 6 canonical square tangram configurations.
 * Piece order: [large1, large2, medium, small1, small2, square, parallelogram]
 */
const SQUARE_CONFIGS = [
  // s₀ - Two large triangles share vertex at center, pointing to TL and BL corners
  {
    name: "Square #1",
    pieces: [
      trianglePosition(0, 0, Ll, 225), // Large 1 - top, right angle at center
      trianglePosition(0, 0, Ll, 135), // Large 2 - left, right angle at center
      trianglePosition(0.5, 0.5, Ml, 180), // Medium - bottom-right corner
      trianglePosition(0.25, -0.25, Sl, 315), // Small 1 - upper right area
      trianglePosition(0, 0, Sl, 45), // Small 2 - center
      { x: 0.25, y: 0, rotation: 45 }, // Square - center-right
      { x: -0.125, y: 0.375, rotation: 0 }, // Parallelogram - bottom-left
    ],
  },

  // s₁ - s₀ rotated 45° clockwise
  {
    name: "Square #2",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 135), // Large 2
      trianglePosition(0.5, -0.5, Ml, 90), // Medium
      trianglePosition(0, 0, Sl, 315), // Small 1
      trianglePosition(-0.25, -0.25, Sl, 225), // Small 2
      { x: 0, y: -0.25, rotation: 45 }, // Square
      { x: 0.375, y: 0.125, rotation: 90 }, // Parallelogram
    ],
  },

  /* // s₂ - s₁ mirrored horizontally
  {
    name: "Square #3",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, -0.5, Ml, 0), // Medium 
      trianglePosition(0, 0, Sl, 225), // Small 1 
      trianglePosition(-0.25, 0.25, Sl, 135), // Small 2
      { x: -0.25, y: 0, rotation: 45 }, // Square
      { x: 0.125, y: -0.375, rotation: 0 }, // Parallelogram 
    ],
  },

  // s₃ - continuing rotation: medium at bottom-left
  {
    name: "Square #4",
    pieces: [
      trianglePosition(0, 0, Ll, 225), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, 0.5, Ml, 270), // Medium - bottom-left
      trianglePosition(0, 0, Sl, 135), // Small 1
      trianglePosition(0.25, 0.25, Sl, 45), // Small 2
      { x: 0, y: 0.25, rotation: 45 }, // Square - bottom
      { x: -0.375, y: -0.125, rotation: 90 }, // Parallelogram - left side
    ],
  },

  // s₄ - continuing rotation: medium at bottom-right again, different angles
  {
    name: "Square #5",
    pieces: [
      trianglePosition(0, 0, Ll, 135), // Large 1
      trianglePosition(0, 0, Ll, 225), // Large 2
      trianglePosition(0.5, 0.5, Ml, 180),
      trianglePosition(0, 0, Sl, 45), // Small 1
      trianglePosition(0.25, -0.25, Sl, 315), // Small 2
      { x: 0.25, y: 0, rotation: 45 }, // Square - right
      { x: -0.125, y: 0.375, rotation: 0 }, // Parallelogram - left side
    ],
  },

  // s₅ - final variation
  {
    name: "Square #6",
    pieces: [
      trianglePosition(0, 0, Ll, 45), // Large 1
      trianglePosition(0, 0, Ll, 315), // Large 2
      trianglePosition(-0.5, -0.5, Ml, 0), // Medium - top-left
      trianglePosition(-0.25, 0.25, Sl, 135), // Small 1
      trianglePosition(0, 0, Sl, 225), // Small 2
      { x: -0.25, y: 0, rotation: 45 }, // Square
      { x: 0.125, y: -0.375, rotation: 0 }, // Parallelogram - top-right
    ],
  }, */
];

const DOG_CONFIG = {
  name: "Dog",
  view: { offsetX: 0, offsetY: -50, scale: 0.9 },
  pieces: [
    // Large 1
    { x: 0.266, y: 0.153, rotation: 180 },
    // Large 2
    { x: -0.326, y: 0.275, rotation: 0 },
    // Medium
    { x: 0.738, y: 0.389, rotation: 315 },
    // Small 1
    { x: 0.621, y: 0.153, rotation: 0 },
    // Small 2
    { x: 0.752, y: -0.402, rotation: 45 },
    // Square
    { x: 0.679, y: -0.142, rotation: 90 },
    // Parallelogram
    { x: -0.717, y: -0.139, rotation: 225 },
  ],
};

const CAT_CONFIGS = [
  {
    name: "Cat",
    view: { offsetX: -150, offsetY: -50, scale: 0.7 },
    pieces: [
      // Large 1
      { x: 0.416, y: 0.376, rotation: 135 },
      // Large 2
      { x: 0.721, y: 0.641, rotation: 180 },
      // Medium
      { x: 0.132, y: 0.23, rotation: 315 },
      // Small 1
      { x: -0.167, y: -0.375, rotation: 135 },
      // Small 2
      { x: 0.167, y: -0.375, rotation: 315 },
      // Square
      { x: 0.0, y: -0.124, rotation: 45 },
      // Parallelogram
      { x: 1.332, y: 0.751, rotation: 0 },
    ],
  },
  {
    name: "Cat #2",
    view: { offsetX: -50, offsetY: -75, scale: 0.6 },
    pieces: [
      // Large 1
      { x: 0.405, y: 0.958, rotation: 180 },
      // Large 2
      { x: 0.307, y: 0.486, rotation: 135 },
      // Medium
      { x: 0.021, y: 0.217, rotation: 315 },
      // Small 1
      { x: 0.167, y: -0.501, rotation: 315 },
      // Small 2
      { x: -0.167, y: -0.501, rotation: 135 },
      // Square
      { x: 0.0, y: -0.25, rotation: 45 },
      // Parallelogram
      { x: -0.037, y: 0.571, rotation: 225, scaleX: -1 },
    ],
  },
  {
    name: "Sitting Cat",
    view: { offsetX: 0, offsetY: 0, scale: 0.8 },
    pieces: [
      // Large 1
      { x: 0.469, y: 0.292, rotation: 45 },
      // Large 2
      { x: -0.031, y: 0.124, rotation: 225 },
      // Medium
      { x: -0.365, y: 0.292, rotation: 270 },
      // Small 1
      { x: 0.887, y: -0.292, rotation: 315 },
      // Small 2
      { x: 0.552, y: -0.292, rotation: 135 },
      // Square
      { x: 0.719, y: -0.041, rotation: 45 },
      // Parallelogram
      { x: -0.885, y: 0.282, rotation: 225 },
    ],
  },
];

const BEAR_CONFIG = {
  name: "Bear",
  view: { offsetX: 0, offsetY: -20, scale: 0.95 },
  pieces: [
    // Large 1
    { x: -0.736, y: -0.076, rotation: 315 },
    // Large 2
    { x: -0.334, y: -0.34, rotation: 0 },
    // Medium
    { x: -0.03, y: -0.243, rotation: 180 },
    // Small 1
    { x: 0.61, y: -0.34, rotation: 270 },
    // Small 2
    { x: -0.736, y: 0.424, rotation: 135 },
    // Square
    { x: 0.314, y: -0.399, rotation: 0 },
    // Parallelogram
    { x: 0.135, y: 0.1, rotation: 225 },
  ],
};

const SHARK_CONFIG = {
  name: "Shark",
  view: { offsetX: 0, offsetY: -75, scale: 0.8 },
  pieces: [
    // Large 1
    { x: -0.501, y: 0.333, rotation: 45 },
    // Large 2
    { x: -0.026, y: 0.236, rotation: 90 },
    // Medium
    { x: 1.083, y: -0.167, rotation: 270 },
    // Small 1
    { x: -0.25, y: 0.584, rotation: 225 },
    // Small 2
    { x: 0.182, y: -0.117, rotation: 180 },
    // Square
    { x: 0.388, y: 0.177, rotation: 0 },
    // Parallelogram
    { x: 0.739, y: 0.0, rotation: 135 },
  ],
};

const CAMEL_CONFIG = {
  name: "Camel",
  view: { offsetX: -175, offsetY: -50, scale: 0.75 },
  pieces: [
    // Large 1
    { x: 0.411, y: 0.413, rotation: 135 },
    // Large 2
    { x: 0.963, y: 0.396, rotation: 90 },
    // Medium
    { x: 0.845, y: 0.042, rotation: 45 },
    // Small 1
    { x: 0.16, y: -0.338, rotation: 315 },
    // Small 2
    { x: -0.006, y: -0.504, rotation: 225 },
    // Square
    { x: 0.492, y: -0.089, rotation: 45 },
    // Parallelogram
    { x: 0.117, y: 0.036, rotation: 90 },
  ],
};

const HOUSE_CONFIGS = [
  {
    name: "House #1",
    view: { offsetX: 0, offsetY: 0, scale: 0.9 },
    pieces: [
      // Large 1
      { x: 0.222, y: -0.026, rotation: 45 },
      // Large 2
      { x: -0.024, y: 0.473, rotation: 45 },
      // Medium
      { x: -0.358, y: 0.307, rotation: 0 },
      // Small 1
      { x: 0.392, y: 0.39, rotation: 315 },
      // Small 2
      { x: 0.227, y: 0.225, rotation: 225 },
      // Square
      { x: -0.206, y: -0.287, rotation: 0 },
      // Parallelogram
      { x: -0.398, y: 0.016, rotation: 0 },
    ],
  },
  {
    name: "House #2",
    view: { offsetX: 0, offsetY: 105, scale: 0.9 },
    pieces: [
      // Large 1
      { x: 0.22, y: -0.153, rotation: 270 },
      // Large 2
      { x: -0.252, y: -0.153, rotation: 180 },
      // Medium
      { x: 0.16, y: 0.319, rotation: 45 },
      // Small 1
      { x: -0.076, y: 0.202, rotation: 0 },
      // Small 2
      { x: 0.396, y: 0.202, rotation: 90 },
      // Square
      { x: -0.37, y: 0.26, rotation: 90 },
      // Parallelogram
      { x: 0.442, y: -0.416, rotation: 90 },
    ],
  },
];

const HORSERIDER_CONFIG = {
  name: "Horse Rider",
  view: { offsetX: -50, offsetY: -55, scale: 0.7 },
  pieces: [
    // Large 1
    { x: 0.034, y: 0.617, rotation: 0 },
    // Large 2
    { x: 0.647, y: 0.481, rotation: 180 },
    // Medium
    { x: 0.172, y: 0.214, rotation: 270 },
    // Small 1
    { x: 1.0, y: 0.244, rotation: 270 },
    // Small 2
    { x: 0.765, y: 0.833, rotation: 90 },
    // Square
    { x: 0.006, y: -0.369, rotation: 45 },
    // Parallelogram
    { x: -0.58, y: 0.507, rotation: 0 },
  ],
};

const HORSE_CONFIG = {
  name: "Horse",
  view: { offsetX: 0, offsetY: -105, scale: 0.65 },
  pieces: [
    // Large 1
    { x: 0.167, y: 0.482, rotation: 135 },
    // Large 2
    { x: -0.235, y: 0.217, rotation: 90 },
    // Medium
    { x: -0.353, y: -0.489, rotation: 45 },
    // Small 1
    { x: -0.707, y: 0.149, rotation: 45 },
    // Small 2
    { x: -0.117, y: 0.924, rotation: 180 },
    // Square
    { x: -0.176, y: -0.195, rotation: 0 },
    // Parallelogram
    { x: 0.678, y: 0.835, rotation: 225, scaleY: -1 },
  ],
};

const HELICOPTER_CONFIG = {
  name: "Helicopter",
  view: { offsetX: -200, offsetY: 75, scale: 0.85 },
  pieces: [
    // Large 1
    { x: 0.167, y: 0.0, rotation: 135 },
    // Large 2
    { x: -0.167, y: 0.0, rotation: 315 },
    // Medium
    { x: -0.355, y: -0.618, rotation: 45 },
    // Small 1
    { x: 0.501, y: 0.167, rotation: 45 },
    // Small 2
    { x: 0.751, y: 0.083, rotation: 225 },
    // Square
    { x: 1.136, y: -0.12, rotation: 45 },
    // Parallelogram
    { x: 0.373, y: -0.625, rotation: 0, scaleX: -1, scaleY: -1 },
  ],
};

const PLANE_CONFIG = {
  name: "Airplane",
  view: { offsetX: 0, offsetY: 0, scale: 0.8 },
  pieces: [
    // Large 1
    { x: 0.481, y: -0.216, rotation: 180 },
    // Large 2
    { x: -0.245, y: -0.061, rotation: 225 },
    // Medium
    { x: 0.092, y: 0.439, rotation: 90 },
    // Small 1
    { x: -0.495, y: 0.189, rotation: 45 },
    // Small 2
    { x: -0.223, y: -0.312, rotation: 45 },
    // Square
    { x: -0.745, y: 0.021, rotation: 45 },
    // Parallelogram
    { x: 0.133, y: 0.147, rotation: 180 },
  ],
};

const BOAT_CONFIG = {
  name: "Boat",
  view: { offsetX: 0, offsetY: 140, scale: 0.7 },
  pieces: [
    // Large 1
    { x: 0.157, y: -0.166, rotation: 135 },
    // Large 2
    { x: -0.245, y: 0.006, rotation: 180 },
    // Medium
    { x: 0.157, y: -0.832, rotation: 270 },
    // Small 1
    { x: 0.24, y: 0.25, rotation: 45 },
    // Small 2
    { x: 0.24, y: 0.418, rotation: 225 },
    // Square
    { x: 0.491, y: 0.083, rotation: 45 },
    // Parallelogram
    { x: -0.134, y: 0.459, rotation: 0, scaleY: -1 },
  ],
};

const GOOSE_CONFIG = {
  name: "Goose",
  view: { offsetX: 0, offsetY: -80, scale: 0.72 },
  pieces: [
    // Large 1
    { x: 0.403, y: 0.447, rotation: 225 },
    // Large 2
    { x: 0.138, y: 0.751, rotation: 270 },
    // Medium
    { x: -0.214, y: 0.633, rotation: 315 },
    // Small 1
    { x: -0.317, y: -0.385, rotation: 180 },
    // Small 2
    { x: -0.367, y: 0.383, rotation: 135 },
    // Square
    { x: -0.2, y: 0.132, rotation: 45 },
    // Parallelogram
    { x: -0.074, y: -0.244, rotation: 90 },
  ],
};

const RABBIT_CONFIG = {
  name: "Rabbit",
  view: { offsetX: 0, offsetY: -100, scale: 0.6 },
  pieces: [
    // Large 1
    { x: -0.306, y: 0.483, rotation: 315 },
    // Large 2
    { x: 0.094, y: 0.954, rotation: 270 },
    // Medium
    { x: 0.026, y: 0.315, rotation: 270 },
    // Small 1
    { x: 0.595, y: -0.136, rotation: 180 },
    // Small 2
    { x: 0.242, y: 0.599, rotation: 90 },
    // Square
    { x: 0.11, y: -0.018, rotation: 45 },
    // Parallelogram
    { x: -0.242, y: -0.445, rotation: 45 },
  ],
};

const ROCKET_CONFIG = {
  name: "Rocket",
  view: { offsetX: 50, offsetY: 0, scale: 0.6 },
  pieces: [
    // Large 1
    { x: -0.054, y: 0.267, rotation: 315 },
    // Large 2
    { x: -0.222, y: -0.233, rotation: 135 },
    // Medium
    { x: -0.054, y: -0.566, rotation: 90 },
    // Small 1
    { x: -0.556, y: 0.767, rotation: 135 },
    // Small 2
    { x: -0.137, y: -0.817, rotation: 45 },
    // Square
    { x: -0.389, y: 0.516, rotation: 45 },
    // Parallelogram
    { x: 0.237, y: 0.642, rotation: 270 },
  ],
};

const TURTLE_CONFIG = {
  name: "Turtle",
  view: { offsetX: 0, offsetY: -90, scale: 0.7 },
  pieces: [
    // Large 1
    { x: 0.167, y: 0.326, rotation: 135 },
    // Large 2
    { x: -0.166, y: 0.326, rotation: 315 },
    // Medium
    { x: -0.539, y: -0.11, rotation: 45 },
    // Small 1
    { x: 0.36, y: 0.82, rotation: 90 },
    // Small 2
    { x: -0.36, y: 0.82, rotation: 0 },
    // Square
    { x: 0.0, y: -0.423, rotation: 45 },
    // Parallelogram
    { x: 0.542, y: -0.162, rotation: 315, scaleY: -1 },
  ],
};

const CHICKEN_CONFIG = {
  name: "Chicken",
  view: { offsetX: 0, offsetY: -120, scale: 0.7 },
  pieces: [
    // Large 1
    { x: -0.106, y: 0.253, rotation: 90 },
    // Large 2
    { x: 0.366, y: 0.253, rotation: 0 },
    // Medium
    { x: -0.41, y: -0.149, rotation: 270 },
    // Small 1
    { x: 0.38, y: 0.641, rotation: 45 },
    // Small 2
    { x: 0.734, y: -0.419, rotation: 45 },
    // Square
    { x: 0.661, y: -0.159, rotation: 90 },
    // Parallelogram
    { x: -0.049, y: 0.724, rotation: 45, scaleY: -1 },
  ],
};

const PYRAMID_CONFIG = {
  name: "Pyramid",
  view: { offsetX: 0, offsetY: -50, scale: 0.95 },
  pieces: [
    // Large 1
    { x: 0.489, y: 0.373, rotation: 45 },
    // Large 2
    { x: -0.511, y: 0.373, rotation: 45 },
    // Medium
    { x: -0.177, y: 0.206, rotation: 90 },
    // Small 1
    { x: 0.073, y: 0.289, rotation: 135 },
    // Small 2
    { x: -0.011, y: -0.293, rotation: 45 },
    // Square
    { x: 0.239, y: 0.04, rotation: 45 },
    // Parallelogram
    { x: -0.136, y: -0.084, rotation: 0 },
  ],
};

const FROG_CONFIG = {
  name: "Frog",
  view: { offsetX: 0, offsetY: -100, scale: 0.75 },
  pieces: [
    // Large 1
    { x: 0.169, y: 0.579, rotation: 45 },
    // Large 2
    { x: -0.033, y: 0.113, rotation: 225 },
    // Medium
    { x: -0.027, y: -0.173, rotation: 45 },
    // Small 1
    { x: 0.386, y: -0.472, rotation: 90 },
    // Small 2
    { x: 0.269, y: -0.355, rotation: 270 },
    // Square
    { x: -0.379, y: -0.413, rotation: 180 },
    // Parallelogram
    { x: 0.044, y: 0.871, rotation: 180 },
  ],
};

const SEAL_CONFIG = {
  name: "Seal",
  view: { offsetX: -100, offsetY: -100, scale: 0.85 },
  pieces: [
    // Large 1
    { x: 0.335, y: 0.286, rotation: 180 },
    // Large 2
    { x: -0.329, y: 0.38, rotation: 225 },
    // Medium
    { x: 0.924, y: -0.303, rotation: 45 },
    // Small 1
    { x: 0.688, y: 0.286, rotation: 0 },
    // Small 2
    { x: -0.711, y: 0.096, rotation: 270 },
    // Square
    { x: 0.747, y: -0.009, rotation: 90 },
    // Parallelogram
    { x: 0.747, y: 0.522, rotation: 135 },
  ],
};

const CRAB_CONFIG = {
  name: "Crab",
  view: { offsetX: 0, offsetY: 0, scale: 0.8 },
  pieces: [
    // Large 1
    { x: 0.292, y: 0.044, rotation: 180 },
    // Large 2
    { x: -0.295, y: 0.16, rotation: 0 },
    // Medium
    { x: 0.646, y: -0.369, rotation: 135 },
    // Small 1
    { x: -0.648, y: -0.546, rotation: 180 },
    // Small 2
    { x: 0.409, y: 0.398, rotation: 90 },
    // Square
    { x: 0.0, y: -0.25, rotation: 90 },
    // Parallelogram
    { x: -0.531, y: -0.25, rotation: 225 },
  ],
};

const GIRAFFE_CONFIG = {
  name: "Giraffe",
  view: { offsetX: 0, offsetY: -200, scale: 0.53 },
  pieces: [
    // Large 1
    { x: 0.086, y: 1.127, rotation: 315 },
    // Large 2
    { x: -0.415, y: 1.127, rotation: 315 },
    // Medium
    { x: 0.419, y: -0.29, rotation: 270 },
    // Small 1
    { x: 0.169, y: -0.124, rotation: 315 },
    // Small 2
    { x: -0.164, y: 0.877, rotation: 135 },
    // Square
    { x: 0.003, y: 0.626, rotation: 45 },
    // Parallelogram
    { x: 0.127, y: 0.252, rotation: 270 },
  ],
};

const CROW_CONFIG = {
  name: "Crow",
  view: { offsetX: -275, offsetY: -125, scale: 0.8 },
  pieces: [
    // Large 1
    { x: 0.765, y: 0.236, rotation: 90 },
    // Large 2
    { x: 0.501, y: -0.166, rotation: 45 },
    // Medium
    { x: 1.167, y: 0.333, rotation: 270 },
    // Small 1
    { x: 0.931, y: 0.804, rotation: 45 },
    // Small 2
    { x: -0.249, y: -0.083, rotation: 45 },
    // Square
    { x: 0.0, y: -0.25, rotation: 45 },
    // Parallelogram
    { x: 1.376, y: 0.625, rotation: 180, scaleY: -1 },
  ],
};

const DONKEY_CONFIG = {
  name: "Donkey",
  view: { offsetX: 85, offsetY: -25, scale: 0.7 },
  pieces: [
    // Large 1
    { x: 0.265, y: 0.43, rotation: 90 },
    // Large 2
    { x: -0.678, y: 0.43, rotation: 0 },
    // Medium
    { x: -0.206, y: 0.43, rotation: 45 },
    // Small 1
    { x: 0.265, y: -0.276, rotation: 270 },
    // Small 2
    { x: 1.088, y: -0.276, rotation: 180 },
    // Square
    { x: 0.676, y: 0.019, rotation: 90 },
    // Parallelogram
    { x: -1.264, y: 0.02, rotation: 45 },
  ],
};

const DINO_CONFIG = {
  name: "Dino",
  view: { offsetX: 0, offsetY: 0, scale: 0.9 },
  pieces: [
    // Large 1
    { x: -0.174, y: -0.142, rotation: 0 },
    // Large 2
    { x: 0.061, y: 0.094, rotation: 180 },
    // Medium
    { x: -0.528, y: -0.024, rotation: 315 },
    // Small 1
    { x: 0.297, y: 0.496, rotation: 45 },
    // Small 2
    { x: -0.41, y: 0.496, rotation: 45 },
    // Square
    { x: 0.831, y: -0.377, rotation: 90 },
    // Parallelogram
    { x: 0.476, y: -0.2, rotation: 135 },
  ],
};

const HELIX_CONFIG = {
  name: "Helix",
  view: { offsetX: 0, offsetY: 0, scale: 0.6 },
  pieces: [
    // Large 1
    { x: 0.167, y: 0.499, rotation: 135 },
    // Large 2
    { x: -0.166, y: -0.501, rotation: 315 },
    // Medium
    { x: -0.353, y: 0.117, rotation: 225 },
    // Small 1
    { x: 0.236, y: -0.119, rotation: 180 },
    // Small 2
    { x: 0.825, y: -0.119, rotation: 270 },
    // Square
    { x: 0.531, y: -0.177, rotation: 90 },
    // Parallelogram
    { x: -0.707, y: 0.176, rotation: 45 },
  ],
};

const TREE_CONFIG = {
  name: "Tree",
  view: { offsetX: 30, offsetY: 110, scale: 0.85 },
  pieces: [
    // Large 1
    { x: -0.292, y: -0.089, rotation: 180 },
    // Large 2
    { x: 0.18, y: -0.089, rotation: 270 },
    // Medium
    { x: -0.056, y: -0.678, rotation: 45 },
    // Small 1
    { x: -0.523, y: -0.328, rotation: 180 },
    // Small 2
    { x: -0.292, y: -0.442, rotation: 0 },
    // Square
    { x: -0.046, y: 0.323, rotation: 90 },
    // Parallelogram
    { x: 0.297, y: -0.383, rotation: 45 },
  ],
};

const MOUNTAIN_CONFIG = {
  name: "Mountains",
  view: { offsetX: -75, offsetY: 0, scale: 0.9 },
  pieces: [
    // Large 1
    { x: 0.263, y: 0.265, rotation: 180 },
    // Large 2
    { x: 0.735, y: 0.265, rotation: 270 },
    // Medium
    { x: -0.634, y: 0.092, rotation: 180 },
    // Small 1
    { x: 0.033, y: -0.074, rotation: 45 },
    // Small 2
    { x: -0.383, y: 0.01, rotation: 135 },
    // Square
    { x: -0.217, y: -0.242, rotation: 45 },
    // Parallelogram
    { x: -0.092, y: 0.134, rotation: 0 },
  ],
};

const KITE_CONFIG = {
  name: "Kite",
  view: { offsetX: 0, offsetY: -100, scale: 0.45 },
  pieces: [
    // Large 1
    { x: -0.001, y: -0.546, rotation: 45 },
    // Large 2
    { x: -0.001, y: -0.213, rotation: 225 },
    // Medium
    { x: -0.877, y: 0.807, rotation: 180 },
    // Small 1
    { x: -1.329, y: 1.545, rotation: 180 },
    // Small 2
    { x: -1.093, y: 1.091, rotation: 0 },
    // Square
    { x: -0.533, y: 0.651, rotation: 90 },
    // Parallelogram
    { x: -0.179, y: 0.473, rotation: 135 },
  ],
};

const ELEPHANT_CONFIG = {
  name: "Elephant",
  view: { offsetX: 50, offsetY: 0, scale: 0.95 },
  pieces: [
    // Large 1
    { x: -0.542, y: -0.047, rotation: 0 },
    // Large 2
    { x: -0.09, y: -0.029, rotation: 180 },
    // Medium
    { x: 0.262, y: -0.144, rotation: 135 },
    // Small 1
    { x: 0.618, y: -0.265, rotation: 270 },
    // Small 2
    { x: -0.861, y: 0.34, rotation: 315 },
    // Square
    { x: -0.031, y: 0.383, rotation: 90 },
    // Parallelogram
    { x: 0.501, y: 0.03, rotation: 135, scaleY: -1 },
  ],
};

const HEART_CONFIG = {
  name: "Heart",
  view: { offsetX: 150, offsetY: -85, scale: 0.95 },
  pieces: [
    // Large 1
    { x: 0.0, y: 0.164, rotation: 225 },
    // Large 2
    { x: -0.499, y: -0.167, rotation: 45 },
    // Medium
    { x: -0.666, y: 0.166, rotation: 90 },
    // Small 1
    { x: -0.003, y: -0.338, rotation: 45 },
    // Small 2
    { x: -0.416, y: 0.247, rotation: 135 },
    // Square
    { x: -0.25, y: 0.498, rotation: 45 },
    // Parallelogram
    { x: 0.124, y: -0.127, rotation: 180, scaleY: -1 },
  ],
};

const RECT_CONFIG = {
  name: "Rectangle",
  view: { offsetX: -318, offsetY: 100, scale: 1.0 },
  pieces: [
    // Large 1
    { x: 0.97, y: -0.267, rotation: 90 },
    // Large 2
    { x: 0.734, y: -0.0312, rotation: 270 },
    // Medium
    { x: 0.144, y: -0.385, rotation: 225 },
    // Small 1
    { x: -0.0917, y: 0.08646, rotation: 270 },
    // Small 2
    { x: 0.38, y: -0.267, rotation: 180 },
    // Square
    { x: 0.3210, y: 0.02745, rotation: 90 },
    // Parallelogram
    { x: -0.033, y: -0.149, rotation: 225, scaleY: -1 },
  ],
};

//const ALL_CONFIGS = [RECT_CONFIG];

const ALL_CONFIGS = [
  ...SQUARE_CONFIGS,
  ...CAT_CONFIGS,
  ...HOUSE_CONFIGS,
  RECT_CONFIG,
  MOUNTAIN_CONFIG,
  KITE_CONFIG,
  HEART_CONFIG,
  ELEPHANT_CONFIG,
  TREE_CONFIG,
  HELIX_CONFIG,
  DONKEY_CONFIG,
  DINO_CONFIG,
  ROCKET_CONFIG,
  RABBIT_CONFIG,
  GOOSE_CONFIG,
  BOAT_CONFIG,
  HORSERIDER_CONFIG,
  CAMEL_CONFIG,
  BEAR_CONFIG,
  SHARK_CONFIG,
  CROW_CONFIG,
  GIRAFFE_CONFIG,
  CRAB_CONFIG,
  TURTLE_CONFIG,
  PYRAMID_CONFIG,
  FROG_CONFIG,
  SEAL_CONFIG,
  HORSE_CONFIG,
  HELICOPTER_CONFIG,
  PLANE_CONFIG,
];

/**
 * Starting configuration for design mode.
 * Set to null to scatter pieces, or paste a config to start from it.
 */
const DESIGN_START_CONFIG = SQUARE_CONFIGS[0]; // Set to a config like HOUSE_CONFIG to start from it

/**
 * Default framing for configurations (centered, no scaling).
 * @type {{offsetX:number, offsetY:number, scale:number}}
 */
const DEFAULT_VIEW = { offsetX: 0, offsetY: 0, scale: 1 };

// ============================================
// Exports
// ============================================

export {
  CONFIG,
  TANGRAM,
  ALL_CONFIGS,
  DESIGN_START_CONFIG,
  DEFAULT_VIEW,
  trianglePosition,
  rotatePoint,
};
