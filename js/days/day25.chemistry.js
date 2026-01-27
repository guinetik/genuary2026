// Molecule complexity tiers
export const TIERS = {
    PRIMORDIAL: 0, // H2O, CH4, NH3, H2, CO2, H2S
    PRECURSOR: 1, // Formaldehyde, HCN
    AMINO_ACID: 2, // Glycine, Alanine, Serine, Cysteine, Aspartic Acid
    PEPTIDE: 3, // Di/tripeptides
    NUCLEOBASE: 4, // Adenine, Guanine, Cytosine, Uracil
};

// Atom visual properties - CPK coloring (standard chemistry convention)
// Adjusted for visibility on black background
export const ATOMS = {
    C: { radius: 16, hue: 80, sat: 20, light: 35, name: 'Carbon' },      // Dark olive-gray
    H: { radius: 8, hue: 0, sat: 0, light: 85, name: 'Hydrogen' },       // White
    O: { radius: 14, hue: 0, sat: 90, light: 50, name: 'Oxygen' },       // Bright red
    N: { radius: 13, hue: 210, sat: 85, light: 55, name: 'Nitrogen' },   // Bright blue
    S: { radius: 17, hue: 55, sat: 95, light: 55, name: 'Sulfur' },      // Bright yellow
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
    serine: {
        name: 'Ser',
        label: 'Serine',
        tier: TIERS.AMINO_ACID,
        // NH₂-CH(CH₂OH)-COOH - hydroxyl side chain
        atoms: [
            { element: 'N', x: -22, y: 0, z: 0 },      // 0: Amino N
            { element: 'C', x: -5, y: 0, z: 0 },       // 1: Alpha C
            { element: 'C', x: 14, y: 0, z: 0 },       // 2: Carboxyl C
            { element: 'O', x: 24, y: -10, z: 0 },     // 3: C=O
            { element: 'O', x: 24, y: 10, z: 0 },      // 4: C-OH
            { element: 'C', x: -5, y: 0, z: 12 },      // 5: CH₂
            { element: 'O', x: -5, y: 0, z: 24 },      // 6: OH (hydroxyl)
            { element: 'H', x: -32, y: -6, z: 0 },     // 7: NH₂ H
            { element: 'H', x: -32, y: 6, z: 0 },      // 8: NH₂ H
            { element: 'H', x: -5, y: 10, z: 0 },      // 9: Alpha C-H
            { element: 'H', x: 32, y: 14, z: 0 },      // 10: COOH H
            { element: 'H', x: -5, y: 0, z: 32 },      // 11: Side OH H
        ],
        bonds: [
            { from: 0, to: 1, order: 1 },
            { from: 1, to: 2, order: 1 },
            { from: 2, to: 3, order: 2 },
            { from: 2, to: 4, order: 1 },
            { from: 1, to: 5, order: 1 },
            { from: 5, to: 6, order: 1 },
            { from: 0, to: 7, order: 1 },
            { from: 0, to: 8, order: 1 },
            { from: 1, to: 9, order: 1 },
            { from: 4, to: 10, order: 1 },
            { from: 6, to: 11, order: 1 },
        ],
    },
    asparticAcid: {
        name: 'Asp',
        label: 'Aspartic Acid',
        tier: TIERS.AMINO_ACID,
        // NH₂-CH(CH₂COOH)-COOH - acidic side chain
        atoms: [
            { element: 'N', x: -22, y: 0, z: 0 },      // 0: Amino N
            { element: 'C', x: -6, y: 0, z: 0 },       // 1: Alpha C
            { element: 'C', x: 12, y: 0, z: 0 },       // 2: Carboxyl C
            { element: 'O', x: 20, y: -9, z: 0 },      // 3: C=O
            { element: 'O', x: 20, y: 9, z: 0 },       // 4: C-OH
            { element: 'C', x: -6, y: 0, z: 12 },      // 5: CH₂
            { element: 'C', x: -6, y: 0, z: 24 },      // 6: Side COOH
            { element: 'O', x: -14, y: 0, z: 32 },     // 7: Side C=O
            { element: 'O', x: 2, y: 0, z: 32 },       // 8: Side C-OH
            { element: 'H', x: -32, y: -6, z: 0 },     // 9: NH₂ H
            { element: 'H', x: -32, y: 6, z: 0 },      // 10: NH₂ H
            { element: 'H', x: -6, y: 10, z: 0 },      // 11: Alpha C-H
            { element: 'H', x: 28, y: 13, z: 0 },      // 12: Main COOH H
            { element: 'H', x: 8, y: 0, z: 38 },       // 13: Side COOH H
        ],
        bonds: [
            { from: 0, to: 1, order: 1 },
            { from: 1, to: 2, order: 1 },
            { from: 2, to: 3, order: 2 },
            { from: 2, to: 4, order: 1 },
            { from: 1, to: 5, order: 1 },
            { from: 5, to: 6, order: 1 },
            { from: 6, to: 7, order: 2 },
            { from: 6, to: 8, order: 1 },
            { from: 0, to: 9, order: 1 },
            { from: 0, to: 10, order: 1 },
            { from: 1, to: 11, order: 1 },
            { from: 4, to: 12, order: 1 },
            { from: 8, to: 13, order: 1 },
        ],
    },
    cysteine: {
        name: 'Cys',
        label: 'Cysteine',
        tier: TIERS.AMINO_ACID,
        // NH₂-CH(CH₂SH)-COOH - thiol (SULFUR!) side chain
        atoms: [
            { element: 'N', x: -22, y: 0, z: 0 },      // 0: Amino N
            { element: 'C', x: -5, y: 0, z: 0 },       // 1: Alpha C
            { element: 'C', x: 14, y: 0, z: 0 },       // 2: Carboxyl C
            { element: 'O', x: 24, y: -10, z: 0 },     // 3: C=O
            { element: 'O', x: 24, y: 10, z: 0 },      // 4: C-OH
            { element: 'C', x: -5, y: 0, z: 12 },      // 5: CH₂
            { element: 'S', x: -5, y: 0, z: 26 },      // 6: SH (YELLOW!)
            { element: 'H', x: -32, y: -6, z: 0 },     // 7: NH₂ H
            { element: 'H', x: -32, y: 6, z: 0 },      // 8: NH₂ H
            { element: 'H', x: -5, y: 10, z: 0 },      // 9: Alpha C-H
            { element: 'H', x: 32, y: 14, z: 0 },      // 10: COOH H
            { element: 'H', x: -5, y: 0, z: 36 },      // 11: SH H
        ],
        bonds: [
            { from: 0, to: 1, order: 1 },
            { from: 1, to: 2, order: 1 },
            { from: 2, to: 3, order: 2 },
            { from: 2, to: 4, order: 1 },
            { from: 1, to: 5, order: 1 },
            { from: 5, to: 6, order: 1 },
            { from: 0, to: 7, order: 1 },
            { from: 0, to: 8, order: 1 },
            { from: 1, to: 9, order: 1 },
            { from: 4, to: 10, order: 1 },
            { from: 6, to: 11, order: 1 },
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

    // Tier 4: Nucleobases - building blocks of RNA/DNA
    // Purines have fused 6+5 rings, pyrimidines have single 6-ring

    adenine: {
        name: 'A',
        label: 'Adenine',
        tier: TIERS.NUCLEOBASE,
        // Purine: fused 6-membered + 5-membered rings with NH2
        // The famous one - forms from 5 HCN molecules!
        atoms: [
            // 6-membered ring (pyrimidine portion)
            { element: 'N', x: -18, y: 10, z: 0 },    // 0: N1
            { element: 'C', x: -18, y: -5, z: 0 },    // 1: C2
            { element: 'N', x: -6, y: -14, z: 0 },    // 2: N3
            { element: 'C', x: 6, y: -6, z: 0 },      // 3: C4 (fusion)
            { element: 'C', x: 6, y: 10, z: 0 },      // 4: C5 (fusion)
            { element: 'C', x: -6, y: 18, z: 0 },     // 5: C6
            // 5-membered ring (imidazole portion)
            { element: 'N', x: 18, y: 12, z: 0 },     // 6: N7
            { element: 'C', x: 24, y: -2, z: 0 },     // 7: C8
            { element: 'N', x: 16, y: -12, z: 0 },    // 8: N9
            // Amino group on C6
            { element: 'N', x: -6, y: 32, z: 0 },     // 9: NH2
            // Hydrogens
            { element: 'H', x: -28, y: -10, z: 0 },   // 10: H on C2
            { element: 'H', x: 34, y: -4, z: 0 },     // 11: H on C8
            { element: 'H', x: 18, y: -22, z: 0 },    // 12: H on N9
            { element: 'H', x: -14, y: 40, z: 0 },    // 13: NH2 H
            { element: 'H', x: 4, y: 40, z: 0 },      // 14: NH2 H
        ],
        bonds: [
            // 6-ring
            { from: 0, to: 1, order: 2 },  // N1=C2
            { from: 1, to: 2, order: 1 },  // C2-N3
            { from: 2, to: 3, order: 2 },  // N3=C4
            { from: 3, to: 4, order: 1 },  // C4-C5 (fusion)
            { from: 4, to: 5, order: 2 },  // C5=C6
            { from: 5, to: 0, order: 1 },  // C6-N1
            // 5-ring
            { from: 4, to: 6, order: 1 },  // C5-N7
            { from: 6, to: 7, order: 2 },  // N7=C8
            { from: 7, to: 8, order: 1 },  // C8-N9
            { from: 8, to: 3, order: 1 },  // N9-C4
            // Amino group
            { from: 5, to: 9, order: 1 },  // C6-NH2
            // Hydrogens
            { from: 1, to: 10, order: 1 },
            { from: 7, to: 11, order: 1 },
            { from: 8, to: 12, order: 1 },
            { from: 9, to: 13, order: 1 },
            { from: 9, to: 14, order: 1 },
        ],
    },

    cytosine: {
        name: 'C',
        label: 'Cytosine',
        tier: TIERS.NUCLEOBASE,
        // Pyrimidine: single 6-membered ring with NH2 and C=O
        atoms: [
            // 6-membered ring
            { element: 'N', x: 0, y: 16, z: 0 },      // 0: N1
            { element: 'C', x: 14, y: 8, z: 0 },      // 1: C2 (C=O)
            { element: 'N', x: 14, y: -8, z: 0 },     // 2: N3
            { element: 'C', x: 0, y: -16, z: 0 },     // 3: C4 (NH2)
            { element: 'C', x: -14, y: -8, z: 0 },    // 4: C5
            { element: 'C', x: -14, y: 8, z: 0 },     // 5: C6
            // Functional groups
            { element: 'O', x: 26, y: 14, z: 0 },     // 6: C=O
            { element: 'N', x: 0, y: -30, z: 0 },     // 7: NH2
            // Hydrogens
            { element: 'H', x: 24, y: -14, z: 0 },    // 8: H on N3
            { element: 'H', x: -24, y: -14, z: 0 },   // 9: H on C5
            { element: 'H', x: -24, y: 14, z: 0 },    // 10: H on C6
            { element: 'H', x: -8, y: -38, z: 0 },    // 11: NH2 H
            { element: 'H', x: 8, y: -38, z: 0 },     // 12: NH2 H
        ],
        bonds: [
            { from: 0, to: 1, order: 1 },  // N1-C2
            { from: 1, to: 2, order: 1 },  // C2-N3
            { from: 2, to: 3, order: 2 },  // N3=C4
            { from: 3, to: 4, order: 1 },  // C4-C5
            { from: 4, to: 5, order: 2 },  // C5=C6
            { from: 5, to: 0, order: 1 },  // C6-N1
            { from: 1, to: 6, order: 2 },  // C2=O
            { from: 3, to: 7, order: 1 },  // C4-NH2
            { from: 2, to: 8, order: 1 },
            { from: 4, to: 9, order: 1 },
            { from: 5, to: 10, order: 1 },
            { from: 7, to: 11, order: 1 },
            { from: 7, to: 12, order: 1 },
        ],
    },

    uracil: {
        name: 'U',
        label: 'Uracil',
        tier: TIERS.NUCLEOBASE,
        // Pyrimidine: single 6-membered ring with two C=O groups
        atoms: [
            // 6-membered ring
            { element: 'N', x: 0, y: 16, z: 0 },      // 0: N1
            { element: 'C', x: 14, y: 8, z: 0 },      // 1: C2 (C=O)
            { element: 'N', x: 14, y: -8, z: 0 },     // 2: N3
            { element: 'C', x: 0, y: -16, z: 0 },     // 3: C4 (C=O)
            { element: 'C', x: -14, y: -8, z: 0 },    // 4: C5
            { element: 'C', x: -14, y: 8, z: 0 },     // 5: C6
            // Carbonyl oxygens
            { element: 'O', x: 26, y: 14, z: 0 },     // 6: C2=O
            { element: 'O', x: 0, y: -30, z: 0 },     // 7: C4=O
            // Hydrogens
            { element: 'H', x: 0, y: 28, z: 0 },      // 8: H on N1
            { element: 'H', x: 24, y: -14, z: 0 },    // 9: H on N3
            { element: 'H', x: -24, y: -14, z: 0 },   // 10: H on C5
            { element: 'H', x: -24, y: 14, z: 0 },    // 11: H on C6
        ],
        bonds: [
            { from: 0, to: 1, order: 1 },  // N1-C2
            { from: 1, to: 2, order: 1 },  // C2-N3
            { from: 2, to: 3, order: 1 },  // N3-C4
            { from: 3, to: 4, order: 1 },  // C4-C5
            { from: 4, to: 5, order: 2 },  // C5=C6
            { from: 5, to: 0, order: 1 },  // C6-N1
            { from: 1, to: 6, order: 2 },  // C2=O
            { from: 3, to: 7, order: 2 },  // C4=O
            { from: 0, to: 8, order: 1 },
            { from: 2, to: 9, order: 1 },
            { from: 4, to: 10, order: 1 },
            { from: 5, to: 11, order: 1 },
        ],
    },

    guanine: {
        name: 'G',
        label: 'Guanine',
        tier: TIERS.NUCLEOBASE,
        // Purine: fused 6+5 rings with C=O and NH2
        atoms: [
            // 6-membered ring
            { element: 'N', x: -18, y: 10, z: 0 },    // 0: N1
            { element: 'C', x: -18, y: -5, z: 0 },    // 1: C2 (NH2)
            { element: 'N', x: -6, y: -14, z: 0 },    // 2: N3
            { element: 'C', x: 6, y: -6, z: 0 },      // 3: C4 (fusion)
            { element: 'C', x: 6, y: 10, z: 0 },      // 4: C5 (fusion)
            { element: 'C', x: -6, y: 18, z: 0 },     // 5: C6 (C=O)
            // 5-membered ring
            { element: 'N', x: 18, y: 12, z: 0 },     // 6: N7
            { element: 'C', x: 24, y: -2, z: 0 },     // 7: C8
            { element: 'N', x: 16, y: -12, z: 0 },    // 8: N9
            // Functional groups
            { element: 'O', x: -6, y: 32, z: 0 },     // 9: C6=O
            { element: 'N', x: -30, y: -10, z: 0 },   // 10: C2-NH2
            // Hydrogens
            { element: 'H', x: -28, y: 16, z: 0 },    // 11: H on N1
            { element: 'H', x: 34, y: -4, z: 0 },     // 12: H on C8
            { element: 'H', x: 18, y: -22, z: 0 },    // 13: H on N9
            { element: 'H', x: -38, y: -2, z: 0 },    // 14: NH2 H
            { element: 'H', x: -34, y: -20, z: 0 },   // 15: NH2 H
        ],
        bonds: [
            // 6-ring
            { from: 0, to: 1, order: 1 },  // N1-C2
            { from: 1, to: 2, order: 2 },  // C2=N3
            { from: 2, to: 3, order: 1 },  // N3-C4
            { from: 3, to: 4, order: 2 },  // C4=C5 (fusion)
            { from: 4, to: 5, order: 1 },  // C5-C6
            { from: 5, to: 0, order: 1 },  // C6-N1
            // 5-ring
            { from: 4, to: 6, order: 1 },  // C5-N7
            { from: 6, to: 7, order: 2 },  // N7=C8
            { from: 7, to: 8, order: 1 },  // C8-N9
            { from: 8, to: 3, order: 1 },  // N9-C4
            // Functional groups
            { from: 5, to: 9, order: 2 },  // C6=O
            { from: 1, to: 10, order: 1 }, // C2-NH2
            // Hydrogens
            { from: 0, to: 11, order: 1 },
            { from: 7, to: 12, order: 1 },
            { from: 8, to: 13, order: 1 },
            { from: 10, to: 14, order: 1 },
            { from: 10, to: 15, order: 1 },
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
// ALL temps lowered to allow reactions at cooler temperatures
export const REACTIONS = [
    // Tier 0 → 1: Primordial to precursors - LOW temps for easy precursor generation
    {
        reactants: ['methane', 'water'],
        products: ['formaldehyde', 'hydrogen'],
        minTemp: 0.2,
        energy: 0.1,
    },
    {
        reactants: ['ammonia', 'methane'],
        products: ['hydrogenCyanide', 'hydrogen', 'hydrogen'],
        minTemp: 0.25,
        energy: 0.15,
    },
    {
        reactants: ['carbonDioxide', 'hydrogen'],
        products: ['formaldehyde'],
        minTemp: 0.2,
        energy: 0.1,
    },
    // Extra formaldehyde pathway - ammonia + CO2
    {
        reactants: ['ammonia', 'carbonDioxide'],
        products: ['formaldehyde', 'water'],
        minTemp: 0.2,
        energy: 0.1,
    },

    // Tier 1 → 2: Precursors to amino acids (Strecker synthesis analog)
    // LOW temps for easy amino acid formation
    {
        reactants: ['formaldehyde', 'hydrogenCyanide'],
        products: ['glycine'],
        minTemp: 0.2,
        energy: 0.15,
    },
    {
        reactants: ['formaldehyde', 'ammonia'],
        products: ['glycine', 'water'],
        minTemp: 0.2,
        energy: 0.2,
    },
    {
        // Extra glycine pathway
        reactants: ['hydrogenCyanide', 'water'],
        products: ['glycine'],
        minTemp: 0.2,
        energy: 0.15,
    },
    {
        reactants: ['hydrogenCyanide', 'ammonia'],
        products: ['alanine'],
        minTemp: 0.2,
        energy: 0.2,
    },
    // New amino acid synthesis pathways - LOW temps for easier formation
    {
        // Serine: formaldehyde adds -CH2OH to glycine
        reactants: ['formaldehyde', 'glycine'],
        products: ['serine'],
        minTemp: 0.2,
        energy: 0.15,
    },
    {
        // Aspartic acid: CO2 adds carboxyl group to glycine
        reactants: ['glycine', 'carbonDioxide'],
        products: ['asparticAcid'],
        minTemp: 0.2,
        energy: 0.2,
    },
    {
        // Cysteine: H2S provides sulfur to glycine
        reactants: ['glycine', 'hydrogenSulfide'],
        products: ['cysteine', 'water'],
        minTemp: 0.2,
        energy: 0.15,
    },

    // Tier 2 → 3: Amino acids to peptides - LOW temps
    {
        reactants: ['glycine', 'glycine'],
        products: ['diglycine', 'water'],
        minTemp: 0.15,
        energy: 0.25,
    },
    {
        reactants: ['glycine', 'alanine'],
        products: ['diglycine', 'water'],
        minTemp: 0.15,
        energy: 0.25,
    },

    // Tier 1 → 4: Precursors to nucleobases
    // LOW temps for easier nucleobase formation
    // The famous adenine synthesis - HCN polymerization!
    {
        reactants: ['hydrogenCyanide', 'hydrogenCyanide'],
        products: ['adenine'],
        minTemp: 0.25,
        energy: 0.3,
    },
    // Alternative adenine pathway
    {
        reactants: ['hydrogenCyanide', 'ammonia'],
        products: ['adenine', 'water'],
        minTemp: 0.25,
        energy: 0.25,
    },
    // Cytosine from HCN + formaldehyde
    {
        reactants: ['hydrogenCyanide', 'formaldehyde'],
        products: ['cytosine'],
        minTemp: 0.2,
        energy: 0.2,
    },
    // Alternative cytosine pathway - ammonia + CO2
    {
        reactants: ['ammonia', 'carbonDioxide'],
        products: ['cytosine'],
        minTemp: 0.2,
        energy: 0.25,
    },
    // Alternative cytosine from water + HCN
    {
        reactants: ['water', 'hydrogenCyanide'],
        products: ['cytosine'],
        minTemp: 0.25,
        energy: 0.25,
    },
    // Uracil from cytosine hydrolysis (deamination)
    {
        reactants: ['cytosine', 'water'],
        products: ['uracil', 'ammonia'],
        minTemp: 0.15,
        energy: 0.15,
    },
    // Direct uracil pathway - doesn't need cytosine first
    {
        reactants: ['formaldehyde', 'ammonia'],
        products: ['uracil'],
        minTemp: 0.2,
        energy: 0.2,
    },
    // Alternative uracil from CO2 + water
    {
        reactants: ['carbonDioxide', 'water'],
        products: ['uracil'],
        minTemp: 0.25,
        energy: 0.25,
    },
    // Guanine - FIXED to 2 reactants (was 3, which never worked!)
    {
        reactants: ['hydrogenCyanide', 'formaldehyde'],
        products: ['guanine'],
        minTemp: 0.3,
        energy: 0.35,
    },
    // Alternative guanine pathway
    {
        reactants: ['adenine', 'water'],
        products: ['guanine', 'ammonia'],
        minTemp: 0.25,
        energy: 0.2,
    },
];