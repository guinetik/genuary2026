# Day 24: Perfectionist's Nightmare

> Prompt: "Perfectionist's nightmare" (credit: Sophia / fractal kitty)

## Concept

This visualization demonstrates the mathematical difference between **rational** and **irrational** numbers through spirograph patterns:

- **3.14 (rational)**: The pattern will eventually close and repeat. A perfectionist's dream - finite, predictable, complete.
- **π (irrational)**: The pattern **NEVER** closes. No matter how long you wait, the curve will never return to its starting point. A perfectionist's nightmare - infinite imperfection.

## The Mathematics

A spirograph creates patterns by tracing a point on a circle that rolls inside (or outside) another circle. The key parameter is the ratio between the circles' radii.

When this ratio is **rational** (like 3.14 = 314/100), the pattern has a **finite period** - it will eventually repeat.

When this ratio involves **π (irrational)**, the pattern has **no period** - it's quasiperiodic, coming arbitrarily close to previous positions but never exactly repeating.

### Why π Never Closes

π is irrational, meaning it cannot be expressed as a fraction p/q of integers. When we use π as a multiplier in our angle calculations:

```javascript
const angle2 = time * Math.PI * speed;
```

The resulting positions form a sequence that is **equidistributed** modulo 2π - it visits every region of the circle but never returns to exactly the same point twice.

## Implementation Details

### Three Nested Spirograph Circles

Each circle configuration has:
- `outerR`: Radius of the outer circle (orbit around center)
- `innerR`: Radius of the inner circle (secondary orbit)
- `traceR`: Radius of the tracing arm
- `speed`: Animation speed multiplier

```javascript
const circles = [
  { outerR: 140, innerR: 50, traceR: 35, speed: 1.0 },
  { outerR: 100, innerR: 35, traceR: 25, speed: 0.7 },
  { outerR: 180, innerR: 60, traceR: 45, speed: 1.3 },
];
```

### Path Calculation

For each circle, the tracing point position is calculated as:

```javascript
// First circle center (orbits around canvas center)
cx1 = centerX + outerR * cos(angle1);
cy1 = centerY + outerR * sin(angle1);

// Second circle center (orbits around first)
cx2 = cx1 + innerR * cos(angle2);
cy2 = cy1 + innerR * sin(angle2);

// Tracing point (on second circle)
px = cx2 + traceR * cos(angle2 * 2.1);
py = cy2 + traceR * sin(angle2 * 2.1);
```

The key difference: `angle2 = time * piValue * speed` where `piValue` is either `Math.PI` or `3.14`.

### Visual Effects

- **Trail fade**: Semi-transparent overlay creates motion trails
- **Multi-layer glow**: Multiple shadow blur passes for neon effect
- **Color cycling**: Hue shifts over time for each circle
- **Path history**: Up to 3000 points stored for long trails

## Controls

| Input | Action |
|-------|--------|
| Click | Toggle between π and 3.14 modes |
| Space | Pause/resume animation |
| R | Reset animation |

## Easter Eggs

At specific times, messages appear:
- **3.14 mode, t ∈ [20, 25]**: "we will meet again" (the pattern will close)
- **π mode, t ∈ [50, 55]**: "never closing..." (infinite imperfection)

## References

- [Spirograph Mathematics](https://en.wikipedia.org/wiki/Spirograph)
- [Irrational Numbers](https://en.wikipedia.org/wiki/Irrational_number)
- [Quasiperiodic Motion](https://en.wikipedia.org/wiki/Quasiperiodic_motion)
- [Equidistribution Theorem](https://en.wikipedia.org/wiki/Equidistribution_theorem)
