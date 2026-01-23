# Day 23: Liquid Glass

**Prompt:** "Transparency. Explore the concept of transparency."  
**Credit:** PaoloCurtoni

## Concept

Interactive glass lens shader with proper fresnel and refraction physics. Uses IQ's superellipse SDF for smooth organic shapes that can merge and blend.

## Key Features

- **IQ's Superellipse SDF** - Sophisticated signed distance function for squircle shapes
- **Proper Fresnel Reflectance** - Physically accurate IOR-based calculations
- **Gaussian Blur** - Efficient frosted glass sampling
- **Chromatic Aberration** - Per-channel lens distortion
- **Drop Shadows** - Soft shadows beneath glass shapes
- **SDF Blending** - Smooth minimum for organic merging
- **Edge Highlights** - Diagonal specular patterns

## Technical Implementation

### IQ's Superellipse SDF

The superellipse creates squircle-like shapes (between circle and square):

```glsl
vec3 sdSuperellipse(vec2 p, float r, float n) {
    // n = 2: circle
    // n = 4: squircle  
    // higher: more square
    ...
}
```

### Physically Accurate Fresnel

Real Fresnel equations with index of refraction:

```glsl
float fresnel(vec3 I, vec3 N, float ior) {
    float cosi = clamp(dot(I, N), -1.0, 1.0);
    float etai = 1.0, etat = ior;
    // Handle total internal reflection
    float sint = etai / etat * sqrt(max(0.0, 1.0 - cosi * cosi));
    if (sint >= 1.0) return 1.0;
    // Schlick's approximation alternative
    float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
    float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
    return (Rs * Rs + Rp * Rp) / 2.0;
}
```

### Lens Distortion

Exponential distortion from edge creates realistic magnification:

```glsl
float edgeFactor = 1.0 - normalizedDepth;
float exponentialDistortion = exp(edgeFactor * 3.0) - 1.0;
float baseMagnification = 0.75;
```

### Chromatic Aberration

Different distortion per color channel:

```glsl
float redDistortion = baseDistortion * 0.92;
float greenDistortion = baseDistortion * 1.0;
float blueDistortion = baseDistortion * 1.08;
```

### Smooth SDF Blending

Smooth minimum for organic blob merging:

```glsl
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
```

## Interactivity

### Three Interaction States

1. **Hover** - "Curious blob notices you"
   - Blob scales up slightly with elastic bounce
   - Fresnel glow intensifies (lifted toward you)
   - Surface shimmers subtly

2. **Drag** - "Blob is being pulled/stretched"
   - Larger elastic scale-up (feels like pulling taffy)
   - Superellipse softens (more organic/gooey shape)
   - Surface wobbles with liquid-like undulation
   - Chromatic aberration increases (stressed glass)
   - Shadow grows (lifted higher)

3. **Release** - "Blob snaps back with a splash"
   - Elastic bounce back to normal size
   - Ripple waves propagate outward (pebble drop effect)
   - Surface wobbles then settles
   - All effects decay smoothly

### Controls

- **Hover over blob** - See glow and subtle scale
- **Click & drag** - Stretch and wobble the blob
- **Release** - Watch the ripple splash
- **Throw** - Billiard-style physics with wall bouncing

## Configuration

```javascript
const CONFIG = {
  // Animation
  speed: 0.3,              // Animation speed
  
  // Glass properties
  ior: 1.5,                // Index of refraction (glass)
  blurStrength: 1.5,       // Frosted glass blur
  
  // Shape
  radius: 0.28,            // Blob size
  superellipseN: 4.0,      // Shape (2=circle, 4=squircle)
  blendRadius: 0.15,       // How much blobs merge
  
  // Interaction effects
  hoverScale: 0.08,        // +8% scale on hover
  dragScale: 0.20,         // +20% scale on drag
  hoverGlow: 0.3,          // Extra glow intensity on hover
  dragSoften: 0.8,         // Superellipse N multiplier during drag
  rippleSpeed: 8.0,        // How fast ripples propagate
  rippleDecay: 2.5,        // How fast ripples fade
  rippleStrength: 0.025,   // Amplitude of ripple displacement
  wobbleFreq: 12.0,        // Wobble frequency
  wobbleDecay: 3.0,        // How fast wobble settles
  elasticDuration: 0.6,    // Duration of elastic animations
};
```

## Visual Effects

### Static Effects
1. **Two draggable glass blobs** - Both interactive with billiard physics
2. **Soft drop shadows** - Grounded, realistic shadows
3. **Background distortion** - Grid pattern + "26" text seen through glass
4. **Edge highlights** - Diagonal white streaks at glass edges
5. **Fresnel rim** - Brighter edges at glancing angles
6. **Chromatic aberration** - RGB channel separation through lens

### Dynamic Interaction Effects
7. **Elastic scale** - Bouncy scale changes on hover/drag/release
8. **Shape softening** - Superellipse becomes more circular when dragged
9. **Surface wobble** - Liquid-like undulation while dragging
10. **Ripple waves** - Concentric waves on release (pebble drop effect)
11. **Stress chromatic aberration** - Enhanced CA while dragging
12. **Hover glow** - Intensified fresnel when mouse hovers

## References

- [Inigo Quilez - Superellipse SDF](https://iquilezles.org/articles/superellipse/)
- Apple iOS/macOS "Liquid Glass" design language
- Physical optics: Fresnel equations, Snell's law
- Real-time glass rendering techniques
