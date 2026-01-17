# Day 21: Bauhaus Poster

> **Prompt**: "Bauhaus Poster. Create a poster design inspired by the German art school Bauhaus."

## Overview

An interactive poster inspired by the Bauhaus school of design (1919-1933), featuring multi-layer parallax effects, classic geometric shapes, and the iconic Bauhaus color palette.

## Design Philosophy

### Bauhaus Principles Applied

1. **Form Follows Function**: Each shape serves a compositional purpose
2. **Primary Colors**: Red, Yellow, Blue - the Bauhaus trinity
3. **Geometric Primitives**: Circles, rectangles, triangles as fundamental building blocks
4. **Asymmetric Balance**: Dynamic composition that feels balanced without symmetry
5. **Typography Integration**: Clean, geometric letterforms

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Bauhaus Red | `#E53935` | Primary accent, triangles |
| Bauhaus Yellow | `#FFCA28` | Circles, warm accents |
| Bauhaus Blue | `#1E88E5` | Rectangles, cool accents |
| Near Black | `#1A1A1A` | Lines, borders, contrast |
| Cream | `#F5F0E6` | Background, negative space |

## Implementation

### Parallax System

The poster uses a 5-layer parallax system:

```javascript
layers: {
  background: 0.05,  // Barely moves
  far: 0.15,         // Subtle movement
  mid: 0.35,         // Medium movement
  near: 0.6,         // Noticeable movement
  front: 0.85,       // Strong movement
}
```

Each layer responds to mouse position proportionally to its depth value. Closer elements (higher depth) move more, creating a sense of 3D depth.

### Shape Types

- **circle**: Filled or stroked circles
- **rect**: Rectangles of any proportion
- **triangle**: Equilateral triangles
- **semicircle**: Half circles with configurable arc
- **ring**: Hollow circles (donut shapes)
- **line**: Thin rectangles for horizontal/vertical lines
- **arc**: Curved strokes

### Animation

Elements appear with a staggered `easeOutBack` animation, giving them a playful spring effect as they "pop" into view.

## Interactions

| Action | Effect |
|--------|--------|
| Mouse move | Parallax shifts layers based on cursor position |
| Click/tap | Randomizes element positions and replays entrance animation |
| Mouse leave | Elements smoothly return to center position |

## Technical Details

### Dependencies

- `Game` - Base game class
- `Painter` - Canvas rendering context
- `Circle`, `Rectangle`, `Triangle`, `Ring`, `Arc`, `PieSlice` - gcanvas shape primitives
- `Tweenetik` - Declarative tween animation system
- `Easing` - Animation easing functions (easeOutBack for entrance)

### gcanvas Shapes Used

| Shape | Purpose |
|-------|---------|
| `Circle` | Primary circles, dots |
| `Rectangle` | Rectangles, lines, squares |
| `Triangle` | Triangular accents |
| `Ring` | Hollow circular elements |
| `Arc` | Curved stroke accents |
| `PieSlice` | Semicircles |

### Tweenetik Animation

```javascript
// Entrance animation using Tweenetik
Tweenetik.to(
  shape,
  { scaleX: 1, scaleY: 1 },
  0.6,  // duration
  Easing.easeOutBack,
  { delay: 0.2 }
);
```

### Performance Considerations

- Elements are sorted by depth once at creation (far to near rendering)
- Smooth mouse interpolation prevents jittery movement
- Tweenetik manages animation lifecycle efficiently
- Shape transforms (scaleX, scaleY) handled by gcanvas

## Historical Context

The Bauhaus school (1919-1933) revolutionized design education and aesthetics. Key figures:

- **Walter Gropius** - Founder
- **Wassily Kandinsky** - Color theory
- **Paul Klee** - Form and composition
- **László Moholy-Nagy** - Typography and photography

The school's influence extends to modern graphic design, architecture, and product design. Its emphasis on geometric forms and primary colors became iconic visual shorthand for modernist design.

## References

- [Bauhaus Movement](https://www.bauhaus.de/en/)
- [Bauhaus Typography](https://fontsinuse.com/tags/1048/bauhaus)
- Herbert Bayer's "Universal" typeface
- Joost Schmidt's poster designs
