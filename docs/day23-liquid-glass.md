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

- **Move mouse** - See real-time lighting changes
- **Click & drag** - Move the right glass blob
- **Release** - Blob returns to gentle animation

## Configuration

```javascript
const CONFIG = {
  speed: 0.3,           // Animation speed
  ior: 1.5,             // Index of refraction (glass)
  blurStrength: 1.5,    // Frosted glass blur
  radius: 0.2,          // Blob size
  superellipseN: 4.0,   // Shape (2=circle, 4=squircle)
  blendRadius: 0.15,    // How much blobs merge
};
```

## Visual Effects

1. **Two glass shapes** - One fixed left, one interactive right
2. **Soft drop shadows** - Grounded, realistic shadows
3. **Background distortion** - Checker pattern + gradient seen through glass
4. **Edge highlights** - Diagonal white streaks at glass edges
5. **Fresnel rim** - Brighter edges at glancing angles

## References

- [Inigo Quilez - Superellipse SDF](https://iquilezles.org/articles/superellipse/)
- Apple iOS/macOS "Liquid Glass" design language
- Physical optics: Fresnel equations, Snell's law
- Real-time glass rendering techniques
