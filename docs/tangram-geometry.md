# Tangram Geometry Reference

## Overview

The tangram is a dissection puzzle consisting of 7 geometric pieces that together form a square. This document describes the mathematical relationships between the pieces.

## Piece Dimensions

For a unit square (side = 1), the piece dimensions are:

| Piece | Shape | Dimension | Value | Area |
|-------|-------|-----------|-------|------|
| Large Triangle (×2) | Right Isosceles | Leg | 1/√2 ≈ 0.707 | 1/4 each |
| Medium Triangle | Right Isosceles | Leg | 1/2 | 1/8 |
| Small Triangle (×2) | Right Isosceles | Leg | 1/(2√2) ≈ 0.354 | 1/16 each |
| Square | Square | Side | 1/(2√2) ≈ 0.354 | 1/8 |
| Parallelogram | Parallelogram | Base × Height | 1/2 × 1/(2√2) | 1/8 |

**Total Area**: 2×(1/4) + 1/8 + 2×(1/16) + 1/8 + 1/8 = 1 ✓

## Mathematical Relationships

```
SQRT2 = √2 ≈ 1.414

Large Triangle:
  - Leg = 1/√2
  - Hypotenuse = 1 (equals one side of the containing square)
  - Area = leg²/2 = 1/4

Medium Triangle:
  - Leg = 1/2
  - Hypotenuse = 1/√2 (equals large triangle leg)
  - Area = 1/8

Small Triangle:
  - Leg = 1/(2√2) = √2/4
  - Hypotenuse = 1/2 (equals medium triangle leg)
  - Area = 1/16

Square:
  - Side = 1/(2√2) = √2/4 (equals small triangle leg)
  - Area = 1/8

Parallelogram:
  - Base = 1/2 (equals small triangle hypotenuse)
  - Height = 1/(2√2) (equals small triangle leg)
  - Area = base × height = 1/8
```

## Canonical Square Configuration (s0)

The canonical arrangement places both large triangles sharing their right angle at the center of the square:

```
     TL────────────────TR
     │╲                 │
     │  ╲    Large1    │
     │    ╲           ╱│
     │      ╲       ╱  │
     │        ╲   ╱    │
     │  Large2  C──────midR
     │        ╱ ╲      │
     │      ╱    ╲     │
     │    ╱  Sm  Sq    │
     │  ╱    ╲   │╲    │
     │╱   Para  ╲│Med  │
     BL────────midB────BR
```

### Key Vertices (centered coordinates)
- Corners: TL(-0.5,-0.5), TR(0.5,-0.5), BR(0.5,0.5), BL(-0.5,0.5)
- Center: C(0,0)
- Edge Midpoints: midR(0.5,0), midB(0,0.5)

### Piece Placement

| Piece | Right Angle At | Vertices | Rotation |
|-------|---------------|----------|----------|
| Large 1 | C(0,0) | TL, TR, C | 225° |
| Large 2 | C(0,0) | TL, BL, C | 135° |
| Medium | BR(0.5,0.5) | BR, midR, midB | 180° |

## Multiple Solutions

There are 6 known distinct solutions for arranging tangram pieces into a square (s0 through s5). Each involves different rotations and positions while maintaining the mathematical constraints.

## Algorithmic Solving

Several approaches exist for algorithmically solving tangram puzzles:

1. **Heuristic Programming** (Deutsch & Hayes, 1972)
   - Partitions pattern into sub-puzzles using extension lines
   - Limited to 45° rotation increments

2. **Neural Networks** (Oflazer, 1993)
   - Uses Boltzmann machines for placement
   - Grid-based positioning

3. **Genetic Algorithms** (Bartoněk, 2005)
   - String code representation of pieces
   - Cluster analysis for grouping

4. **Algebraic Methods** (Kovalsky et al., 2015)
   - Models puzzle as polynomial equations
   - Discrete rotation sets

## References

- Yamada, F. M., & Batagelo, H. C. "A comparative study on computational methods to solve tangram puzzles"
- Deutsch, E. S., & Hayes, K. C. Jr. "A heuristic solution to the tangram puzzle" (1972)
