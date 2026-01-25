// Molecule complexity tiers
export const TIERS = {
    PRIMORDIAL: 0, // H2O, CH4, NH3, H2, CO2, H2S
    PRECURSOR: 1, // Formaldehyde, HCN
    AMINO_ACID: 2, // Glycine, Alanine
    PEPTIDE: 3, // Di/tripeptides
};

// Atom visual properties - CPK coloring (standard chemistry convention)
// Adjusted for visibility on black background
export const ATOMS = {
    C: { radius: 18, hue: 0, sat: 0, light: 40, name: 'Carbon' },     // Dark gray
    H: { radius: 10, hue: 0, sat: 0, light: 90, name: 'Hydrogen' },   // White/light gray
    O: { radius: 16, hue: 0, sat: 85, light: 55, name: 'Oxygen' },     // Red
    N: { radius: 15, hue: 220, sat: 80, light: 55, name: 'Nitrogen' },   // Blue
    S: { radius: 20, hue: 50, sat: 90, light: 55, name: 'Sulfur' },     // Yellow
};

// Molecule templates - primordial soup ingredients
export const MOLECULES = {
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
export const PRIMORDIAL_KEYS = [
    'water',
    'methane',
    'ammonia',
    'hydrogen',
    'carbonDioxide',
    'hydrogenSulfide',
];

// Reaction rules - complexity increases with energy
export const REACTIONS = [
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