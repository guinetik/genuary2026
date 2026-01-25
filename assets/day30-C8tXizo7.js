import{G as q,d as W,P as R,B as F,k as z,p as X,_ as V,$ as A,X as P,e as x,W as K}from"./index-Cw3cKsir.js";const N=`attribute vec2 aPosition;\r
attribute vec2 aUv;\r
varying vec2 vUv;\r
\r
void main() {\r
  vUv = aUv;\r
  gl_Position = vec4(aPosition, 0.0, 1.0);\r
}\r
`,B=`/**
 * ============================================================================
 * SYNESTHESIA SHADER - Genuary 2026 Day 30
 * ============================================================================
 *
 * "It's not a bug, it's a feature"
 *
 * A bidirectional audio-visual feedback system inspired by 2001: A Space
 * Odyssey's Stargate sequence. Audio distorts video. Video influences audio.
 * The boundary between senses dissolves.
 *
 * TECHNIQUE OVERVIEW:
 * -------------------
 * 1. Domain Warping    - FBM-based UV distortion for organic movement
 * 2. Chromatic Split   - RGB channel separation for psychedelic color bleeding
 * 3. Kaleidoscope      - Iterative polar folding with video texture sampling
 * 4. Raymarched Tunnel - 3D tunnel with video-textured walls
 * 5. Perlin Ripples    - 3D noise creating liquid surface effects
 * 6. Mouse Ripples     - Interactive water-like displacement
 * 7. Glitch Effects    - Controlled chaos through noise-based displacement
 *
 * AUDIO REACTIVITY:
 * -----------------
 * - Bass (20-200Hz)   → Zoom pulse, barrel distortion, blur
 * - Mids (200-2kHz)   → Hue rotation speed, wave frequency
 * - Highs (2k-20kHz)  → Edge detection, chromatic aberration
 * - Amplitude         → Overall intensity, saturation boost
 * - Silence           → Solarization effect
 *
 * VISUAL FEEDBACK:
 * ----------------
 * - Brightness        → Bass frequency boost (via JS audio filters)
 * - Color Saturation  → Mid frequency boost
 * - Motion Detection  → High frequency boost
 * - Dominant Color    → Tints the entire output
 *
 * @author guinetik
 * @license Public Domain
 * @see https://genuary.art
 * @see https://gcanvas.guinetik.com
 */

precision highp float;

// ============================================================================
// VERTEX SHADER INTERFACE
// ============================================================================
varying vec2 vUv;  // Normalized UV coordinates from vertex shader (0-1)

// ============================================================================
// UNIFORMS: VIDEO INPUT
// ============================================================================
uniform sampler2D uVideoTexture;  // Live video feed (webcam or file)
uniform vec2 uResolution;         // Canvas dimensions in pixels
uniform float uTime;              // Time in seconds since start

// ============================================================================
// UNIFORMS: AUDIO ANALYSIS
// Audio data is analyzed in JavaScript and passed as normalized 0-1 values.
// These drive the visual effects creating audio→visual synesthesia.
// ============================================================================
uniform float uBassLevel;    // Low frequencies (20-200Hz), normalized 0-1
uniform float uMidLevel;     // Mid frequencies (200-2kHz), normalized 0-1
uniform float uHighLevel;    // High frequencies (2k-20kHz), normalized 0-1
uniform float uAmplitude;    // Overall volume level, normalized 0-1
uniform float uSilence;      // 1.0 when audio is silent, 0.0 otherwise

// ============================================================================
// UNIFORMS: VIDEO ANALYSIS (Visual→Audio feedback)
// These values are computed from the video frame in JavaScript.
// ============================================================================
uniform vec3 uDominantColor;   // Average RGB color of frame (0-255 range)
uniform float uMotionAmount;   // Frame-to-frame pixel difference, 0-1
uniform float uBrightness;     // Average luminance of frame, 0-1

// ============================================================================
// UNIFORMS: SPECTRUM ANALYZER
// Per-band frequency data for equalizer-style visualization.
// Currently disabled due to WebGL array uniform limitations.
// ============================================================================
uniform float uSpectrumBars;           // Number of frequency bands (as float)
uniform float uAudioFrequencies[64];   // Audio spectrum data per band
uniform float uVideoFrequencies[64];   // Video-derived "frequencies" per band

// ============================================================================
// UNIFORMS: MOUSE INTERACTION
// Enables interactive water ripple effects on click/drag.
// ============================================================================
uniform vec2 uMouse;        // Mouse position, normalized 0-1
uniform float uMouseDown;   // 1.0 if mouse button pressed, 0.0 otherwise
uniform float uRippleTime;  // Seconds since last mouse click

// ============================================================================
// CONSTANTS: MATHEMATICAL
// ============================================================================
#define PI 3.14159265359
#define TAU 6.28318530718
#define SQRT2 1.41421356237

// ============================================================================
// CONSTANTS: EFFECT TUNING
// All magic numbers centralized for easy adjustment and documentation.
// ============================================================================

// Domain Warping - FBM-based organic UV distortion
#define WARP_BASS_INFLUENCE 0.6      // How much bass affects warp intensity
#define WARP_AMPLITUDE_INFLUENCE 0.4 // How much overall volume affects warp
#define WARP_HIGH_INFLUENCE 0.25     // How much highs affect warp
#define WARP_UV_SCALE 0.05           // Maximum UV displacement from warping

// Smooth Wave Distortion - Dali-inspired flowing waves
#define WAVE_BASE_SPEED 1.5          // Base wave animation speed
#define WAVE_MID_SPEED_BOOST 2.0     // Additional speed from mid frequencies
#define WAVE_BASS_STRENGTH 0.015     // Wave amplitude from bass
#define WAVE_AMPLITUDE_STRENGTH 0.012 // Wave amplitude from overall volume

// Mouse Ripples - Interactive water-like displacement
#define RIPPLE_SPEED 2.0             // How fast ripples expand
#define RIPPLE_FREQUENCY 20.0        // Wave density in ripple
#define RIPPLE_DAMPING 0.8           // How quickly ripples fade
#define RIPPLE_STRENGTH 0.04         // Maximum displacement from ripple
#define RIPPLE_RADIUS 0.3            // How far ripples extend
#define RIPPLE_RINGS 3               // Number of concentric rings

// Chromatic Aberration - Trippy RGB channel separation
#define CHROMA_HIGH_SCALE 0.08       // RGB split from high frequencies
#define CHROMA_AMPLITUDE_SCALE 0.05  // RGB split from amplitude
#define CHROMA_BASS_SCALE 0.03       // RGB split from bass
#define CHROMA_THRESHOLD 0.003       // Minimum level to apply effect

// State Machine Timing (seconds)
#define STATE_NO_EFFECT_DURATION 4.0
#define STATE_PERLIN_DURATION 3.0
#define STATE_STARGATE_DURATION 8.0
#define STATE_FADE_TIME 0.8

// Kaleidoscope
#define KALEIDO_ITERATIONS 10        // Number of folding iterations
#define KALEIDO_AMPLITUDE_TRIGGER 0.6 // Volume threshold to trigger
#define KALEIDO_BASS_TRIGGER 0.65    // Bass threshold to trigger
#define KALEIDO_BLINK_PERIOD 0.5     // Seconds between blinks
#define KALEIDO_BLINK_DURATION 0.15  // How long each blink lasts

// Post-Processing
#define VIGNETTE_START 0.9           // Distance from center where vignette starts
#define VIGNETTE_END 1.6             // Distance where vignette is full
#define VIGNETTE_STRENGTH 0.4        // How dark the vignette gets

// UV Safety (prevents sampling outside texture bounds)
#define UV_PADDING 0.001             // Tiny margin to stay within texture
#define UV_MIN UV_PADDING            // Minimum safe UV value
#define UV_MAX (1.0 - UV_PADDING)    // Maximum safe UV value

// ============================================================================
// SECTION 1: PSEUDO-RANDOM NUMBER GENERATION
// ============================================================================
// Hash functions convert continuous inputs into pseudo-random outputs.
// They're the foundation of procedural noise - deterministic chaos.
//
// The classic sin-based hash exploits floating-point precision loss
// in high-frequency sin waves to generate unpredictable values.
// ============================================================================

/**
 * 2D → 1D hash function
 *
 * Takes a 2D coordinate and returns a pseudo-random value in [0,1].
 * Uses the dot product with irrational-ish numbers to spread the input,
 * then sin() to create non-linear mixing, and fract() to wrap to [0,1].
 *
 * @param p  Input 2D coordinate
 * @return   Pseudo-random value in [0,1]
 */
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

/**
 * 3D → 3D hash function
 *
 * Returns a pseudo-random 3D vector in [-1,1] for each input point.
 * Used for gradient noise where we need random directions.
 *
 * @param p  Input 3D coordinate
 * @return   Pseudo-random 3D vector in [-1,1]
 */
vec3 hash3(vec3 p) {
    p = vec3(
        dot(p, vec3(127.1, 311.7, 213.6)),
        dot(p, vec3(327.1, 211.7, 113.6)),
        dot(p, vec3(269.5, 183.3, 351.1))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

/**
 * Alternative 2D hash for tunnel effect
 *
 * Different constants create a different "random" sequence.
 * Returns values in [-1,1] for signed displacement effects.
 *
 * @param p  Input 2D coordinate
 * @return   Pseudo-random value in [-1,1]
 */
float hashSigned(vec2 p) {
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

// ============================================================================
// SECTION 2: NOISE FUNCTIONS
// ============================================================================
// Noise functions create smooth, continuous randomness from discrete hashes.
//
// VALUE NOISE: Interpolate between random values at grid points
// GRADIENT NOISE (Perlin): Interpolate between random gradients (smoother)
// FBM: Layer multiple noise octaves for natural-looking complexity
// ============================================================================

/**
 * 2D Value Noise
 *
 * Interpolates between hash values at integer grid corners.
 * Uses smoothstep (Hermite interpolation) for C1 continuity -
 * meaning the noise and its first derivative are continuous.
 *
 * @param p  Input 2D coordinate
 * @return   Smooth noise value in [0,1]
 */
float noise2D(vec2 p) {
    vec2 i = floor(p);   // Integer part - grid cell
    vec2 f = fract(p);   // Fractional part - position within cell

    // Smoothstep creates smooth interpolation weights
    // f * f * (3 - 2f) is the Hermite basis function
    f = f * f * (3.0 - 2.0 * f);

    // Sample hash at four corners of the cell
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    // Bilinear interpolation with smooth weights
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

/**
 * 3D Gradient Noise (Perlin-style)
 *
 * More sophisticated than value noise: instead of interpolating values,
 * we interpolate gradients (directions). This produces smoother results
 * with fewer grid artifacts.
 *
 * At each grid point, we have a random gradient vector. The noise value
 * is computed by dotting the gradient with the vector from the grid point
 * to our sample point, then interpolating these dot products.
 *
 * @param p  Input 3D coordinate
 * @return   Smooth noise value, roughly in [-1,1]
 */
float noise3D(vec3 p) {
    vec3 i = floor(p);   // Grid cell
    vec3 f = fract(p);   // Position within cell
    vec3 u = f * f * (3.0 - 2.0 * f);  // Smooth interpolation weights

    // Trilinear interpolation of 8 corner gradient dot products
    return mix(
        mix(
            mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x),
            u.y),
        mix(
            mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x),
            u.y),
        u.z);
}

/**
 * 2D Signed Noise (for tunnel)
 *
 * Similar to noise2D but uses hashSigned for [-1,1] output range.
 *
 * @param p  Input 2D coordinate
 * @return   Smooth noise value in [-1,1]
 */
float noise2DSigned(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(hashSigned(i + vec2(0,0)), hashSigned(i + vec2(1,0)), u.x),
        mix(hashSigned(i + vec2(0,1)), hashSigned(i + vec2(1,1)), u.x),
        u.y);
}

/**
 * Fractal Brownian Motion (FBM)
 *
 * Layers multiple octaves of noise at increasing frequencies and
 * decreasing amplitudes. This mimics natural phenomena like clouds,
 * terrain, and turbulence.
 *
 * Each octave: frequency doubles (lacunarity=2), amplitude halves (gain=0.5)
 *
 * Mathematical foundation: Self-similar fractals have detail at all scales.
 * FBM approximates this with a finite sum of scaled noise.
 *
 * @param p  Input 2D coordinate
 * @return   Layered noise value in [0,1]
 */
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    // 4 octaves provides good detail without excessive computation
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise2D(p);
        p *= 2.0;           // Lacunarity: increase frequency
        amplitude *= 0.5;   // Gain: decrease amplitude
    }

    return value;
}

// ============================================================================
// SECTION 3: GEOMETRIC UTILITIES
// ============================================================================
// Transform functions for rotating, scaling, and manipulating coordinates.
// These are the building blocks for all spatial effects.
// ============================================================================

/**
 * 2D Rotation (returns new coordinates)
 *
 * Rotates a 2D point around the origin by the given angle.
 * Uses the standard rotation matrix:
 * | cos(a)  -sin(a) |
 * | sin(a)   cos(a) |
 *
 * @param p      Point to rotate
 * @param angle  Rotation angle in radians
 * @return       Rotated point
 */
vec2 rotate2D(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

/**
 * 2D Rotation Matrix
 *
 * Returns a mat2 for efficient repeated rotations.
 * Useful when rotating many points by the same angle.
 *
 * Note: Offset by PI/4 for aesthetic rotation in kaleidoscope.
 *
 * @param a  Rotation angle in radians
 * @return   2x2 rotation matrix
 */
mat2 rotationMatrix(float a) {
    float c = cos(a + PI * 0.25);
    float s = sin(a + PI * 0.25);
    return mat2(c, -s, s, c);
}

/**
 * Safe UV Clamping
 *
 * Clamps UV coordinates to a safe range to avoid sampling
 * black edges that may exist from video letterboxing.
 *
 * This is critical for effects that push UVs outside [0,1]
 * like domain warping, ripples, and barrel distortion.
 *
 * @param uv  Input UV coordinates (may be outside [0,1])
 * @return    Clamped UV coordinates in [UV_MIN, UV_MAX]
 */
vec2 safeUV(vec2 uv) {
    return clamp(uv, vec2(UV_MIN), vec2(UV_MAX));
}

// ============================================================================
// SECTION 4: COLOR SPACE CONVERSION
// ============================================================================
// HSV (Hue, Saturation, Value) is intuitive for artistic color manipulation.
// Hue rotation, saturation boost, and brightness adjustments are natural in HSV.
// ============================================================================

/**
 * HSV to RGB Conversion
 *
 * Converts Hue-Saturation-Value to Red-Green-Blue color space.
 *
 * H: 0-1 maps to 0-360 degrees on the color wheel
 * S: 0 = grayscale, 1 = fully saturated
 * V: 0 = black, 1 = full brightness
 *
 * The algorithm uses a clever trick with modular arithmetic to compute
 * the piecewise-linear RGB curves from hue angle.
 *
 * @param c  HSV color (h, s, v all in [0,1])
 * @return   RGB color
 */
vec3 hsv2rgb(vec3 c) {
    // K encodes the phase offsets for R, G, B channels
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);

    // Create sawtooth waves offset by K.xyz, scaled to [0,6], shifted by 3
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);

    // Clamp to [0,1] and interpolate between white and colored based on saturation
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/**
 * RGB to HSV Conversion
 *
 * Converts Red-Green-Blue to Hue-Saturation-Value color space.
 *
 * This is the inverse of hsv2rgb, computing:
 * - Hue from the dominant channel and its neighbors
 * - Saturation from the range between min and max channels
 * - Value from the maximum channel
 *
 * @param c  RGB color
 * @return   HSV color (h, s, v all in [0,1])
 */
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);

    // Sort channels to find min/max efficiently
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);    // Chroma (range)
    float e = 1.0e-10;                 // Epsilon to prevent division by zero

    return vec3(
        abs(q.z + (q.w - q.y) / (6.0 * d + e)),  // Hue
        d / (q.x + e),                            // Saturation
        q.x                                       // Value
    );
}

// ============================================================================
// SECTION 4B: BLEND MODES
// ============================================================================
// Shader equivalents of Photoshop/compositor blend modes.
// These determine how effect layers combine with the base video.
//
// Key insight: mix() replaces colors (darkens when effect is dark).
// Screen/overlay ENHANCE colors - the video stays visible underneath.
// ============================================================================

/**
 * Screen Blend Mode
 *
 * Brightens by inverting, multiplying, and inverting again.
 * Result is always >= both inputs. Never darkens.
 * Formula: 1 - (1-a) * (1-b)
 *
 * Perfect for: Glow effects, light overlays, adding energy
 */
vec3 blendScreen(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

/**
 * Overlay Blend Mode
 *
 * Combines multiply and screen based on base luminance.
 * Dark areas get darker, light areas get lighter (contrast boost).
 * Formula: base < 0.5 ? 2*base*blend : 1-2*(1-base)*(1-blend)
 *
 * Perfect for: Adding texture while preserving shadows/highlights
 */
vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend,
        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
        step(0.5, base)
    );
}

/**
 * Soft Light Blend Mode
 *
 * Gentler version of overlay. Dodges/burns based on blend color.
 * Less harsh contrast than overlay.
 *
 * Perfect for: Subtle color grading, gentle effects
 */
vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        step(0.5, blend)
    );
}

/**
 * Additive Blend (Linear Dodge)
 *
 * Simply adds colors together (clamped to 1.0).
 * Very bright, energetic result.
 *
 * Perfect for: Light flares, fire, energy effects
 */
vec3 blendAdd(vec3 base, vec3 blend, float intensity) {
    return min(base + blend * intensity, vec3(1.0));
}

// ============================================================================
// SECTION 5: DOMAIN WARPING
// ============================================================================
// Domain warping distorts the coordinate space before sampling.
// Instead of sampling texture(uv), we sample texture(warp(uv)).
//
// The warp function itself uses noise, creating organic, flowing distortions.
// Layering multiple warps creates complex, unpredictable motion.
// ============================================================================

/**
 * Compute Audio-Reactive Domain Warp
 *
 * Creates organic UV distortion that pulses with the music.
 * Uses two layers of FBM noise for complex, swirling motion.
 *
 * Layer 1 (q): Base warp from position
 * Layer 2 (r): Warp the warp - creates turbulent flow
 *
 * @param uv       Original UV coordinates
 * @param p        Centered coordinates (for rotation)
 * @param t        Time for animation
 * @return         Warped UV coordinates
 */
vec2 computeDomainWarp(vec2 uv, vec2 p, float t) {
    // Audio-reactive warp intensity (clamped to prevent overflow)
    float warpIntensity = uBassLevel * WARP_BASS_INFLUENCE
                        + uAmplitude * WARP_AMPLITUDE_INFLUENCE
                        + uHighLevel * WARP_HIGH_INFLUENCE;
    warpIntensity = min(warpIntensity, 1.0);

    // Slowly rotating coordinate space for evolving patterns
    vec2 pp = rotate2D(p, t * 0.1);

    // First layer: basic FBM displacement
    vec2 q = vec2(
        fbm(pp * 2.0 + t * 0.3),
        fbm(pp * 2.0 + vec2(5.2, 1.3) + t * 0.35)
    );

    // Second layer: warp the warp for more complexity
    vec2 r = vec2(
        fbm(pp + q * 2.5 + vec2(1.7, 9.2) + t * 0.4),
        fbm(pp + q * 2.5 + vec2(8.3, 2.8) + t * 0.38)
    );

    // Apply warp with audio-reactive intensity
    vec2 displaced = uv + (q + r) * warpIntensity * WARP_UV_SCALE;

    // Clamp to safe range
    return clamp(displaced, vec2(UV_MIN), vec2(UV_MAX));
}

/**
 * Apply Barrel Distortion
 *
 * Barrel distortion bends straight lines outward from center.
 * Creates a "fisheye" effect that pulses with bass.
 *
 * The distortion is proportional to distance^2 from center,
 * creating the characteristic barrel curve.
 *
 * @param p       Centered coordinates
 * @param aspect  Aspect ratio for correction
 * @return        Barrel-distorted UV coordinates (clamped to safe range)
 */
vec2 applyBarrelDistortion(vec2 p, float aspect) {
    float dist = length(p);
    // Distortion strength increases quadratically from center (barrel curve)
    float distortion = 1.0 + uBassLevel * dist * dist * 0.08;
    vec2 result = (p * distortion) / vec2(aspect, 1.0) * 0.5 + 0.5;
    return clamp(result, vec2(UV_MIN), vec2(UV_MAX));
}

// ============================================================================
// SECTION 6: MOUSE RIPPLE EFFECT
// ============================================================================
// Interactive water ripple simulation triggered by mouse clicks.
// Creates expanding concentric rings that displace the image radially.
// ============================================================================

/**
 * Compute Mouse Ripple Displacement
 *
 * Simulates water ripples emanating from mouse click position.
 * Multiple rings expand outward, each with decreasing intensity.
 *
 * Physics: Ripples follow wave equation solutions with damping.
 * Displacement is radial (pushes pixels away from center).
 *
 * @param uv        Current UV coordinates
 * @param mousePos  Mouse position (normalized 0-1)
 * @return          Displacement vector to add to UV
 */
vec2 computeMouseRipple(vec2 uv, vec2 mousePos) {
    vec2 toPixel = uv - mousePos;
    float distToMouse = length(toPixel);

    // Skip if too far or mouse not pressed
    if (uMouseDown < 0.5 || distToMouse < 0.001) {
        return vec2(0.0);
    }

    vec2 rippleDir = normalize(toPixel);
    float ripple = 0.0;

    // Create multiple expanding rings
    float rippleAge = uRippleTime * RIPPLE_SPEED;
    float rippleDist = distToMouse - rippleAge;

    for (int i = 0; i < RIPPLE_RINGS; i++) {
        float ringOffset = float(i) * 0.15;
        float ringDist = rippleDist + ringOffset;
        float ringAge = rippleAge - ringOffset;

        // Only compute if ring is active and in range
        if (ringAge > 0.0 && abs(ringDist) < RIPPLE_RADIUS) {
            // Damped sinusoidal wave
            float wave = sin(ringDist * RIPPLE_FREQUENCY)
                       * exp(-ringAge * RIPPLE_DAMPING);

            // Smooth falloff at ripple edges
            wave *= smoothstep(RIPPLE_RADIUS, 0.0, abs(ringDist));

            // Each successive ring is weaker
            ripple += wave * RIPPLE_STRENGTH * (1.0 - float(i) * 0.3);
        }
    }

    // Continuous ripple while dragging
    if (distToMouse < RIPPLE_RADIUS) {
        float continuousWave = sin(distToMouse * RIPPLE_FREQUENCY - uTime * RIPPLE_SPEED * 2.0);
        continuousWave *= exp(-distToMouse * 2.0) * RIPPLE_STRENGTH * 0.3;
        ripple += continuousWave;
    }

    return rippleDir * ripple;
}

// ============================================================================
// SECTION 7: AUDIO-REACTIVE WAVE DISTORTION
// ============================================================================
// Waves that pulse and flow with the music rhythm.
// Frequency affects wave speed, amplitude affects wave height.
// ============================================================================

/**
 * Smooth Wave Distortion (Dali-inspired)
 *
 * Creates smooth, flowing waves across the image that pulse with audio.
 * Inspired by Salvador Dali's melting clocks - continuous sine waves
 * layered at different frequencies create a liquid, dreamy quality.
 *
 * Three wave layers respond to different frequency bands:
 * - Bass (20-200Hz):  Large, slow diagonal waves (breathing effect)
 * - Mids (200-2kHz):  Medium flowing waves (melody response)
 * - Highs (2k-20kHz): Small, fast ripples (percussion/detail)
 *
 * The diagonal wave pattern (sin(x*4 + y*6 + t)) creates organic motion
 * that feels natural rather than mechanical.
 *
 * @param uv  Current UV coordinates
 * @param t   Time for animation
 * @return    Wave-distorted UV coordinates (clamped to safe range)
 */
vec2 applySmoothWaves(vec2 uv, float t) {
    // Audio-reactive intensity
    // Bass creates slower, larger waves; highs create faster, smaller ones
    float bassWave = uBassLevel * uAmplitude;
    float midWave = uMidLevel * uAmplitude;
    float highWave = uHighLevel * uAmplitude;

    // Wave speed tied to audio intensity
    float waveSpeed = 1.5 + uAmplitude * 2.0;

    // === LAYER 1: Bass waves (large, slow, diagonal) ===
    // Creates the "breathing" effect - image expands/contracts with bass hits
    float wave1 = sin(uv.x * 4.0 + uv.y * 6.0 + t * waveSpeed) * bassWave * 0.035;
    float wave2 = sin(uv.x * 5.0 - uv.y * 4.0 + t * waveSpeed * 0.8) * bassWave * 0.025;

    // === LAYER 2: Mid waves (medium, flowing) ===
    // Responds to melody and harmonic content
    float wave3 = sin(uv.y * 10.0 + t * waveSpeed * 1.2) * midWave * 0.02;
    float wave4 = cos(uv.x * 8.0 + uv.y * 3.0 + t * waveSpeed * 1.5) * midWave * 0.015;

    // === LAYER 3: High waves (small, fast ripples) ===
    // Responds to percussion, hi-hats, vocal sibilance
    float wave5 = sin(uv.x * 15.0 + uv.y * 12.0 + t * waveSpeed * 2.0) * highWave * 0.012;

    // Combine waves for organic motion
    // Y displacement: vertical "breathing" effect
    float yDisplace = wave1 + wave3 + wave5;

    // X displacement: horizontal flowing effect
    float xDisplace = wave2 + wave4;

    // Apply distortion
    vec2 displaced = uv + vec2(xDisplace, yDisplace);

    // Clamp to safe UV range
    return clamp(displaced, vec2(UV_MIN), vec2(UV_MAX));
}

/**
 * Compute Audio-Reactive Wave Displacement
 *
 * Adds rhythmic wave distortion that syncs with music.
 * - Mids control wave speed (faster during melodic sections)
 * - Bass and amplitude control wave intensity
 *
 * IMPORTANT: Wave strength is kept very subtle to work WITH
 * spectrum distortion without causing combined overflow.
 *
 * @param uv  Current UV coordinates
 * @param t   Time for animation
 * @return    Wave-distorted UV coordinates (clamped to safe range)
 */
vec2 applyAudioWaves(vec2 uv, float t) {
    float rhythmPulse = uAmplitude;
    float waveSpeed = WAVE_BASE_SPEED + uMidLevel * WAVE_MID_SPEED_BOOST;
    float waveStrength = uBassLevel * WAVE_BASS_STRENGTH
                       + uAmplitude * WAVE_AMPLITUDE_STRENGTH;

    // Perpendicular waves create organic, non-uniform motion
    // X and Y displace independently for complex flow patterns
    float waveX = sin(uv.y * 10.0 + t * waveSpeed) * waveStrength * rhythmPulse * 0.35;
    float waveY = cos(uv.x * 10.0 + t * waveSpeed * 1.2) * waveStrength * rhythmPulse * 0.35;

    vec2 displaced = uv + vec2(waveX, waveY);

    // Clamp to safe range
    return clamp(displaced, vec2(UV_MIN), vec2(UV_MAX));
}

// ============================================================================
// SECTION 8: PERLIN RIPPLE EFFECT (Stargate-Inspired)
// ============================================================================
// 3D Perlin noise creates a liquid metal surface effect.
// Inspired by the Stargate sequence in 2001: A Space Odyssey.
// ============================================================================

/**
 * Perlin Ripple Effect
 *
 * Creates flowing, liquid-like patterns using 3D noise.
 * The third dimension (time) makes the pattern animate smoothly.
 *
 * Taking sin() of noise creates distinct ripple rings from
 * the smooth noise gradients - like interference patterns.
 *
 * @param uv        Screen UV coordinates
 * @param time      Animation time
 * @param videoTex  Video texture to sample
 * @param videoUV   Distorted UV for video sampling
 * @param aspect    Screen aspect ratio
 * @return          Blended color with ripple effect
 */
vec3 perlinRippleEffect(vec2 uv, float time, sampler2D videoTex, vec2 videoUV, float aspect) {
    // Use UV directly for full-screen coverage
    vec2 scaledUV = uv * 8.0;  // Scale for nice pattern density
    scaledUV.x *= aspect;      // Correct for aspect ratio

    // Create 3D position from 2D UV + time
    // The direction vectors create diagonal motion through noise space
    vec3 pos = vec3(time * 0.5);  // Slower time for smoother animation
    pos += scaledUV.x * vec3(-0.816496581, 0.40824829, 0.40824829);
    pos += scaledUV.y * vec3(0.0, 0.707106781, -0.707106781);

    // sin(noise) creates ripple rings across the WHOLE screen
    // No center falloff - full coverage
    float n = smoothstep(-0.4, 0.6, sin(15.0 * noise3D(pos)));

    // Tonemapping for ethereal color
    vec3 rippleColor = pow(vec3(n), vec3(0.5, 0.3, 0.8));

    // Get base video
    vec3 videoColor = texture2D(videoTex, safeUV(videoUV)).rgb;

    // Use SCREEN blend mode - adds light without darkening video
    // Subtle ripple overlay
    vec3 blended = blendScreen(videoColor, rippleColor * 0.4);

    // Gentle mix so video stays visible
    return mix(videoColor, blended, n * 0.35);
}

// ============================================================================
// SECTION 9: RAYMARCHED TUNNEL EFFECT
// ============================================================================
// A 3D tunnel rendered via raymarching (sphere tracing).
// The tunnel walls sample from the video texture for psychedelic visuals.
//
// Raymarching: March along ray in steps, checking distance to geometry.
// When close enough to surface, we've found an intersection.
// ============================================================================

/**
 * Raymarch a Tunnel and Sample Video Texture
 *
 * Creates an infinite tunnel effect by raymarching through a corridor.
 * The walls are textured with the video feed, creating a kaleidoscopic
 * tunnel-of-video effect.
 *
 * @param uv           Centered screen coordinates
 * @param time         Animation time
 * @param videoTex     Video texture for wall sampling
 * @param videoUV      Base video UV for fallback
 * @param isVertical   0.0 = horizontal tunnel, 1.0 = vertical tunnel
 * @return             Rendered tunnel color
 */
vec3 raymarchTunnel(vec2 uv, float time, sampler2D videoTex, vec2 videoUV, float isVertical) {
    const float FOV_ZOOM = 0.4;

    // Camera oscillation for motion feel
    float oscillation = 0.1 * sin(time * 1.137) * (1.0 + 0.1 * cos(time * 0.37));

    // Camera rotation based on time
    float rot = smoothstep(-0.005, 0.005, sin(0.1 * time + 4.0)) * PI * 0.5;
    float c = cos(rot), s = sin(rot);
    uv = uv * mat2(c, -s, s, c);

    // Camera setup
    vec3 camPos = vec3(oscillation, sin(time * 17.39) * oscillation * oscillation, -1.0);
    vec3 forward = normalize(mix(-camPos, vec3(0.0, 0.0, 1.0), 0.6));
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = cross(forward, up);

    // Ray direction
    vec3 screenPoint = camPos + forward * FOV_ZOOM + uv.x * right + uv.y * up;
    vec3 rayDir = normalize(screenPoint - camPos);

    // Raymarch loop
    vec3 rayPos;
    float rayLength = 0.0;
    float stepDist = 0.0;

    for (int i = 0; i < 250; i++) {
        rayPos = camPos + rayDir * rayLength;

        // Distance to walls (horizontal or vertical corridor)
        float vertStep = min(abs(rayPos.y - 1.0), abs(rayPos.y + 1.0));
        float horizStep = min(abs(rayPos.x - 1.0), abs(rayPos.x + 1.0));
        stepDist = mix(horizStep, vertStep, isVertical);

        if (stepDist < 0.001) break;
        rayLength += stepDist;
    }

    // Base color (will be replaced if we hit a wall)
    vec3 col = vec3(0.7) + 0.5 * cos(time + uv.xyx + vec3(0.0, 2.0, 4.0));

    // If we hit a wall, sample video texture
    if (stepDist < 0.001) {
        // Compute wall UVs based on orientation
        vec2 wallUV_horiz = vec2(rayPos.z, rayPos.y + step(rayPos.x, 0.0) * 33.1 + time * 0.097);
        vec2 wallUV_vert = vec2(rayPos.z, rayPos.x + step(rayPos.y, 0.0) * 33.1 + time * 0.097);
        vec2 wallUV = mix(wallUV_horiz, wallUV_vert, isVertical);
        wallUV.x += time * 7.0;

        // Map to video texture coordinates (use safe UV)
        vec2 sampleUV = clamp(fract(wallUV * 0.1) * 0.5 + 0.25, UV_MIN, UV_MAX);
        vec3 wallColor = texture2D(videoTex, sampleUV).rgb;

        // Add noise variation (use safe UV)
        float noiseVal = noise2DSigned(wallUV * 2.2);
        vec3 noiseColor = texture2D(videoTex, safeUV(fract(sampleUV + noiseVal * 0.1))).rgb;

        // Animated mix between noise and clean
        float mixFactor = 0.6 + 0.35 * sin(0.253 * time);
        wallColor = mix(noiseColor, wallColor, mixFactor);

        // Perspective fade
        float fade = mix(
            min(7.0 * abs(uv.x), 1.0),
            min(7.0 * abs(uv.y), 1.0),
            isVertical
        );
        wallColor *= fade;

        col = mix(col, wallColor, fade);
    }

    return col;
}

// ============================================================================
// SECTION 10: KALEIDOSCOPE EFFECT
// ============================================================================
// Creates symmetrical, mandala-like patterns through iterative folding.
// Each iteration: rotate, fold around axes, translate, sample video.
// The accumulated samples create complex interference patterns.
// ============================================================================

/**
 * Render Kaleidoscope Effect
 *
 * Iterative polar folding creates the classic kaleidoscope look.
 * At each iteration:
 * 1. Rotate the coordinate space
 * 2. Fold into a 60-degree wedge (mirror symmetry)
 * 3. Add time-based translation
 * 4. Sample video and accumulate color
 *
 * @param uv        Centered screen coordinates
 * @param aspect    Screen aspect ratio
 * @param t         Animation time
 * @param videoTex  Video texture to sample
 * @return          Kaleidoscope color
 */
vec3 renderKaleidoscope(vec2 uv, float aspect, float t, sampler2D videoTex, vec3 baseVideo) {
    // Setup: center and scale
    vec2 kaleidoUV = uv;
    kaleidoUV.x *= aspect;
    kaleidoUV *= (cos(t * 0.5) + 1.5) * 1.2;  // Breathing scale

    vec3 color = vec3(0.0);
    float scale = PI / 3.0;  // 60 degrees for hexagonal symmetry
    float intensity = 0.65;  // Starting intensity (decays per iteration)

    for (int i = 0; i < KALEIDO_ITERATIONS; i++) {
        float iterF = float(i);
        float scaleFactor = iterF + (sin(t * 0.05) + 1.5);

        // Rotate coordinate space
        kaleidoUV *= rotationMatrix(t * scaleFactor * 0.01);

        // Fold into 60-degree wedge
        float theta = atan(kaleidoUV.x, kaleidoUV.y) + PI;
        theta = (floor(theta / scale) + 0.5) * scale;
        vec2 dir = vec2(sin(theta), cos(theta));
        vec2 codir = dir.yx * vec2(-1.0, 1.0);
        kaleidoUV = vec2(dot(dir, kaleidoUV), dot(codir, kaleidoUV));

        // Animated translation
        kaleidoUV.xy += vec2(sin(t), cos(t * 1.1)) * scaleFactor * 0.035;

        // Fold and scale
        kaleidoUV = abs(fract(kaleidoUV + 0.5) * 2.0 - 1.0) * 0.7;

        // Sample video at folded coordinates (use safe UV)
        vec2 sampleUV = clamp(kaleidoUV / vec2(aspect, 1.0) * 0.5 + 0.5, UV_MIN, UV_MAX);
        vec4 sampleColor = texture2D(videoTex, sampleUV);

        // Color cycling: each iteration shifts RGB phase for rainbow effect
        vec3 colorMod = (cos(vec3(1.0, 5.0, 9.0) * iterF + t * 0.5) * 0.5 + 0.5) * intensity;
        // Edge pattern fades toward fold boundaries
        float pattern = exp(-min(kaleidoUV.x, kaleidoUV.y) * 12.0);
        color += sampleColor.rgb * pattern * colorMod;

        intensity *= 0.9;  // Each iteration contributes less (depth fade)
    }

    // Soft light preserves video while adding kaleidoscope pattern
    vec3 blended = blendSoftLight(baseVideo, color);

    // Screen blend adds luminosity from kaleidoscope colors
    blended = blendScreen(blended, color * 0.35);

    return blended;
}

// ============================================================================
// SECTION 11: CHROMATIC ABERRATION
// ============================================================================
// Simulates lens imperfection where different wavelengths focus differently.
// Creates the characteristic RGB fringing seen in cheap lenses and VHS.
// ============================================================================

/**
 * Apply Chromatic Aberration
 *
 * Samples R, G, B channels at slightly offset positions.
 * The offset amount is driven by audio levels.
 *
 * @param color     Current pixel color
 * @param uv        UV coordinates for sampling
 * @param videoTex  Video texture
 * @return          Color with chromatic aberration applied
 */
vec3 applyChromaticAberration(vec3 color, vec2 uv, sampler2D videoTex) {
    float amount = uHighLevel * CHROMA_HIGH_SCALE
                 + uAmplitude * CHROMA_AMPLITUDE_SCALE
                 + uBassLevel * CHROMA_BASS_SCALE;

    // Only apply if above threshold
    if (amount < CHROMA_THRESHOLD) {
        return color;
    }

    vec2 offsetX = vec2(amount * 2.5, 0.0);
    vec2 offsetY = vec2(0.0, amount * 0.4);

    // Sample each channel at offset positions (use safe UV)
    float r = texture2D(videoTex, safeUV(uv - offsetX - offsetY)).r;
    float g = texture2D(videoTex, safeUV(uv)).g;
    float b = texture2D(videoTex, safeUV(uv + offsetX + offsetY)).b;

    vec3 chromaColor = vec3(r, g, b);
    return mix(color, chromaColor, amount * 1.2);
}

// ============================================================================
// SECTION 12: POST-PROCESSING EFFECTS
// ============================================================================
// Final pass effects that shape the overall look:
// - Bass blur: Soft focus pulse with bass hits
// - Hue rotation: Colors shift with mid frequencies
// - Edge detection: Highs reveal edges
// - Saturation: Amplitude boosts color intensity
// - Glitch: Random displacement artifacts
// - Scanlines: CRT-style horizontal lines
// ============================================================================

/**
 * Apply Bass-Reactive Blur
 *
 * Simple box blur that pulses with bass frequencies.
 * Creates a dreamy, pulsing focus effect.
 */
vec3 applyBassBlur(vec3 color, vec2 uv, sampler2D videoTex) {
    if (uBassLevel <= 0.2) return color;

    float blur = uBassLevel * 0.3;
    vec2 texelSize = 1.0 / uResolution;
    vec2 offset = vec2(blur * texelSize.x * 2.0, 0.0);

    // 4-tap box blur (use safe UV)
    vec4 blurred = (
        texture2D(videoTex, safeUV(uv + offset)) +
        texture2D(videoTex, safeUV(uv - offset)) +
        texture2D(videoTex, safeUV(uv + offset.yx)) +
        texture2D(videoTex, safeUV(uv - offset.yx))
    ) * 0.25;

    return mix(color, blurred.rgb, blur * 0.5);
}

/**
 * Apply Mid-Frequency Hue Rotation
 *
 * Shifts hues based on mid-frequency levels.
 * Creates a color-cycling effect tied to melody.
 */
vec3 applyHueRotation(vec3 color, vec2 uv, float t) {
    if (uMidLevel <= 0.1) return color;

    vec3 hsv = rgb2hsv(color);

    // Rotation speed scales with mid level - creates rainbow cycling
    float rotSpeed = uMidLevel * 1.2;
    float hueShift = rotSpeed * t * 1.5;

    // Spatial variation creates psychedelic color banding
    hueShift += fbm(uv * 3.0 + t * 0.5) * uMidLevel * 0.5;

    hsv.x = mod(hsv.x + hueShift, 1.0);

    vec3 rotated = hsv2rgb(hsv);
    return mix(color, rotated, uMidLevel * 0.9);
}

/**
 * Apply High-Frequency Edge Detection
 *
 * Enhances edges when high frequencies are present.
 * Creates a sharpening/outline effect.
 */
vec3 applyEdgeDetection(vec3 color, vec2 uv, sampler2D videoTex, float t) {
    if (uHighLevel <= 0.2) return color;

    vec2 texelSize = 1.0 / uResolution;

    // Sample 4 neighbors for Sobel-like edge detection
    vec4 top = texture2D(videoTex, safeUV(uv + vec2(0.0, texelSize.y)));
    vec4 bottom = texture2D(videoTex, safeUV(uv - vec2(0.0, texelSize.y)));
    vec4 left = texture2D(videoTex, safeUV(uv - vec2(texelSize.x, 0.0)));
    vec4 right = texture2D(videoTex, safeUV(uv + vec2(texelSize.x, 0.0)));

    // Edge magnitude from difference with neighbors
    vec4 edge = abs(vec4(color, 1.0) - top) + abs(vec4(color, 1.0) - bottom)
              + abs(vec4(color, 1.0) - left) + abs(vec4(color, 1.0) - right);
    float edgeStrength = length(edge.rgb) * uHighLevel * 0.8;

    // Noise adds organic variation to edge glow
    edgeStrength += fbm(uv * 20.0 + t) * uHighLevel * 0.3;

    return mix(color, color * (1.0 + edgeStrength), uHighLevel * 0.6);
}

/**
 * Apply Amplitude-Based Saturation Boost
 *
 * Louder audio = more vivid, saturated colors.
 * Creates that "turned up to 11" visual intensity.
 */
vec3 applySaturationBoost(vec3 color) {
    if (uAmplitude <= 0.2) return color;

    // Saturation multiplier scales with volume
    float satBoost = 1.0 + (uAmplitude * 1.5);
    vec3 hsv = rgb2hsv(color);
    hsv.y = min(1.0, hsv.y * satBoost);
    return hsv2rgb(hsv);
}

/**
 * Apply Silence Solarization
 *
 * When audio is silent, apply a solarization effect.
 * Solarization inverts mid-tones while preserving highlights and shadows.
 */
vec3 applySolarization(vec3 color) {
    if (uSilence < 0.5) return color;

    float intensity = uSilence * 0.8;
    vec3 solarized = vec3(1.0) - abs(color - vec3(0.5)) * 2.0;
    return mix(color, solarized, intensity);
}

/**
 * Apply Motion-Reactive Particles
 *
 * Spawn green particles where motion is detected.
 */
vec3 applyMotionParticles(vec3 color, vec2 uv, float t) {
    if (uMotionAmount <= 0.1) return color;

    // Hash-based particle spawning
    float particle = step(0.98, fract(sin(dot(uv, vec2(12.9898, 78.233)) + t) * 43758.5453));

    // Noise-based particles
    float noiseParticle = step(0.95, fbm(uv * 30.0 + t * 2.0)) * uMotionAmount;
    particle = max(particle, noiseParticle);

    return color + vec3(0.0, 1.0, 0.0) * particle * uMotionAmount * 0.3;
}

/**
 * Apply Amplitude-Triggered Glitch
 */
vec3 applyGlitch(vec3 color, vec2 uv, sampler2D videoTex, float t) {
    if (uAmplitude <= 0.7) return color;

    float glitch = step(0.98, fbm(uv * vec2(100.0, 1.0) + t * 10.0));
    vec2 glitchUV = uv + vec2(glitch * 0.05, 0.0);
    vec3 glitchColor = texture2D(videoTex, safeUV(glitchUV)).rgb;

    return mix(color, glitchColor, glitch * uAmplitude * 0.5);
}

/**
 * Apply Scanlines
 */
vec3 applyScanlines(vec3 color, vec2 uv) {
    if (uHighLevel <= 0.4) return color;

    float scanline = sin(uv.y * uResolution.y * 0.5) * 0.5 + 0.5;
    scanline = pow(scanline, 10.0);
    return color * (1.0 - scanline * uHighLevel * 0.1);
}

/**
 * Apply TV Static Effect
 */
vec3 applyTVStatic(vec3 color, vec2 uv, float t) {
    // Generate high-frequency noise
    float staticNoise = fbm(uv * vec2(200.0, 150.0) + t * 5.0);
    staticNoise = fract(staticNoise * 1000.0);

    // Periodic static bursts
    float staticChance = smoothstep(0.7, 1.0, sin(t * 0.5) * 0.5 + 0.5);
    float staticIntensity = staticChance * 0.3;

    // Random burst overlay
    staticIntensity += step(0.95, fbm(uv * vec2(50.0, 1.0) + t * 2.0)) * 0.5;

    return mix(color, vec3(staticNoise), staticIntensity);
}

/**
 * Apply TV-Style Glitch Transition
 */
vec3 applyGlitchTransition(vec3 color, vec2 uv, sampler2D videoTex, float t) {
    float glitchTime = mod(t, 8.0);
    float glitchPhase = smoothstep(0.0, 0.1, glitchTime) * smoothstep(0.3, 0.2, glitchTime);

    if (glitchPhase < 0.01) return color;

    // Horizontal scanline glitch (use safe UV)
    float scanGlitch = step(0.98, fbm(uv * vec2(1.0, 200.0) + t * 10.0));
    if (scanGlitch > 0.5) {
        vec2 glitchUV = uv + vec2(0.0, sin(uv.y * 50.0 + t * 20.0) * 0.02);
        color = mix(color, texture2D(videoTex, safeUV(glitchUV)).rgb, glitchPhase * 0.8);
    }

    // Chromatic separation (use safe UV)
    float chromaGlitch = glitchPhase * 0.05;
    color.r = mix(color.r, texture2D(videoTex, safeUV(uv + vec2(chromaGlitch, 0.0))).r, glitchPhase);
    color.b = mix(color.b, texture2D(videoTex, safeUV(uv - vec2(chromaGlitch, 0.0))).b, glitchPhase);

    // Vertical slice displacement (use safe UV)
    float sliceGlitch = step(0.95, fbm(uv * vec2(200.0, 1.0) + t * 15.0));
    if (sliceGlitch > 0.5) {
        vec2 sliceUV = uv + vec2(sin(uv.x * 100.0 + t * 30.0) * 0.03, 0.0);
        color = mix(color, texture2D(videoTex, safeUV(sliceUV)).rgb, glitchPhase * 0.6);
    }

    return color;
}

/**
 * Apply Vignette
 *
 * Darkens edges of the frame for a cinematic look.
 * Uses elliptical distance to handle wide aspect ratios properly -
 * without this, 16:9 screens would have much darker corners than 4:3.
 *
 * @param color   Input color
 * @param p       Aspect-corrected centered coordinates
 * @param aspect  Screen aspect ratio (width/height)
 * @return        Color with vignette applied
 */
vec3 applyVignette(vec3 color, vec2 p, float aspect) {
    // Normalize distance so edges are equidistant from center regardless of aspect
    // This creates an elliptical vignette that matches the screen shape
    vec2 normalizedP = p / vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
    float dist = length(normalizedP);

    float vignette = 1.0 - smoothstep(VIGNETTE_START, VIGNETTE_END, dist);
    vignette += uAmplitude * 0.1;  // Audio-reactive brightness
    vignette = mix(1.0, vignette, VIGNETTE_STRENGTH);
    return color * vignette;
}

/**
 * Apply Dominant Color Tint
 *
 * Tints the output based on the video's dominant color.
 * Part of the visual→audio feedback loop visualization.
 */
vec3 applyDominantColorTint(vec3 color) {
    return mix(color, color * (uDominantColor / 255.0), 0.3);
}

// ============================================================================
// SECTION 13: EFFECT STATE MACHINE
// ============================================================================
// Cycles through different visual effects over time.
// Audio levels can override the state for reactive transitions.
//
// States:
// 0 = No Effect (base video with distortion)
// 1 = Kaleidoscope (triggered by loud bass)
// 2 = Stargate/Tunnel (during quiet sections)
// 3 = Perlin Ripple (organic flowing effect)
// ============================================================================

#define STATE_NO_EFFECT  0.0
#define STATE_KALEIDO    1.0
#define STATE_STARGATE   2.0
#define STATE_PERLIN     3.0

/**
 * Determine Current Effect State
 *
 * Computes which effect should be active based on time and audio.
 * Time-based cycling provides variety; audio overrides for reactivity.
 *
 * @param t  Current time
 * @return   State ID (0-3)
 */
float determineState(float t) {
    // Calculate cycle position
    float cycleDuration = STATE_NO_EFFECT_DURATION * 2.0
                        + STATE_PERLIN_DURATION
                        + STATE_STARGATE_DURATION;
    float cycleTime = mod(t, cycleDuration);

    // Default state based on cycle position
    float state = STATE_NO_EFFECT;

    if (cycleTime < STATE_NO_EFFECT_DURATION) {
        state = STATE_NO_EFFECT;
    } else if (cycleTime < STATE_NO_EFFECT_DURATION + STATE_PERLIN_DURATION) {
        state = STATE_PERLIN;
    } else if (cycleTime < STATE_NO_EFFECT_DURATION + STATE_PERLIN_DURATION + STATE_STARGATE_DURATION) {
        state = STATE_STARGATE;
    } else {
        state = STATE_NO_EFFECT;
    }

    // Audio overrides
    // Kaleidoscope: Brief blink when loud
    float kaleidoTrigger = step(KALEIDO_AMPLITUDE_TRIGGER, uAmplitude)
                         * step(KALEIDO_BASS_TRIGGER, uBassLevel);
    float kaleidoPulse = mod(t, KALEIDO_BLINK_PERIOD);
    float kaleidoBlink = step(kaleidoPulse, KALEIDO_BLINK_DURATION);

    if (kaleidoTrigger > 0.5 && kaleidoBlink > 0.5) {
        state = STATE_KALEIDO;
    }
    // Stargate also triggers during moderate audio (not just silence)
    // This makes it appear more frequently
    else if (uAmplitude < 0.5 && uBassLevel < 0.5) {
        state = STATE_STARGATE;
    }

    return state;
}

/**
 * Calculate Transition Factor
 *
 * Smooth fade between states at boundaries.
 */
float calculateTransition(float t) {
    float cycleDuration = STATE_NO_EFFECT_DURATION * 2.0
                        + STATE_PERLIN_DURATION
                        + STATE_STARGATE_DURATION;
    float cycleProgress = mod(t, cycleDuration) / cycleDuration;

    float fadeIn = smoothstep(0.0, STATE_FADE_TIME / cycleDuration, cycleProgress);
    float fadeOut = smoothstep(1.0, 1.0 - STATE_FADE_TIME / cycleDuration, cycleProgress);

    return max(fadeIn * fadeOut, 0.95);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
// Orchestrates all effects in a clean, readable pipeline.
// Each stage is clearly separated for debugging and modification.
// ============================================================================

void main() {
    // ------------------------------------------------------------------------
    // STAGE 1: COORDINATE SETUP
    // ------------------------------------------------------------------------
    // Flip Y (WebGL video textures are typically upside-down)
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

    // COVER SCALE: Zoom in slightly so distortion effects have margin
    // Without this, distortion can push UVs outside [0,1] causing edge artifacts
    // 0.94 means we use 94% of the texture, centered (3% margin each side)
    const float COVER_SCALE = 0.94;
    uv = (uv - 0.5) * COVER_SCALE + 0.5;

    // Centered coordinates for radial effects (-1 to 1, aspect-corrected)
    vec2 p = (uv - 0.5) * 2.0;
    float aspect = uResolution.x / uResolution.y;
    p.x *= aspect;

    float t = uTime * 0.5;  // Slower animation time base

    // ------------------------------------------------------------------------
    // STAGE 2: UV DISTORTION PIPELINE
    // ------------------------------------------------------------------------
    // Layer multiple distortion effects onto the UV coordinates.
    // Order matters: each effect builds on the previous.

    // 2a. Domain warping (organic FBM-based distortion)
    vec2 warpedUV = computeDomainWarp(uv, p, t);

    // 2b. Barrel distortion (bass-reactive fisheye)
    vec2 barrelUV = applyBarrelDistortion(p, aspect);

    // 2c. Blend warping and barrel based on bass level
    vec2 distortedUV = mix(warpedUV, barrelUV, uBassLevel * 0.4);

    // 2d. Smooth wave distortion (Dali-inspired liquid effect)
    distortedUV = applySmoothWaves(distortedUV, t);

    // 2e. Audio-reactive waves
    distortedUV = applyAudioWaves(distortedUV, t);

    // 2f. Mouse ripple effect (add displacement then clamp)
    vec2 rippleDisplacement = computeMouseRipple(distortedUV, uMouse);
    distortedUV = clamp(distortedUV + rippleDisplacement, vec2(UV_MIN), vec2(UV_MAX));

    // Final UV for consistent sampling
    // Each distortion function above already clamps internally,
    // this is a safety net for any accumulated numerical error
    vec2 finalUV = safeUV(distortedUV);

    // ------------------------------------------------------------------------
    // STAGE 3: BASE VIDEO SAMPLE
    // ------------------------------------------------------------------------
    vec4 baseColor = texture2D(uVideoTexture, finalUV);

    // EDGE FADE: Smoothly fade to black near edges to hide any artifacts
    // This handles both out-of-bounds AND white letterboxing in the video
    float edgeMargin = 0.03;  // 3% margin for fade
    float edgeFade = smoothstep(0.0, edgeMargin, finalUV.x)
                   * smoothstep(1.0, 1.0 - edgeMargin, finalUV.x)
                   * smoothstep(0.0, edgeMargin, finalUV.y)
                   * smoothstep(1.0, 1.0 - edgeMargin, finalUV.y);
    baseColor.rgb *= edgeFade;

    vec4 color = baseColor;

    // ------------------------------------------------------------------------
    // STAGE 4: EFFECT STATE MACHINE
    // ------------------------------------------------------------------------
    // Apply the current major effect (kaleidoscope, tunnel, perlin, or none)

    float state = determineState(uTime);
    float transition = calculateTransition(uTime);

    if (state > 0.5 && state < 1.5) {
        // KALEIDOSCOPE
        // Pass base video for soft light blending (preserves video visibility)
        vec3 kaleidoColor = renderKaleidoscope((uv - 0.5) * 2.0, aspect, t, uVideoTexture, baseColor.rgb);

        // Full intensity kaleidoscope effect
        float intensity = transition * 0.95;
        color.rgb = mix(baseColor.rgb, kaleidoColor, intensity);

    } else if (state > 1.5 && state < 2.5) {
        // STARGATE TUNNEL
        float tunnelOrientation = mod(floor(uTime / 4.0), 2.0);
        vec2 tunnelUV = (uv - 0.5) * 2.0;
        tunnelUV.x *= aspect;

        vec3 tunnelColor = raymarchTunnel(tunnelUV, uTime, uVideoTexture, finalUV, tunnelOrientation);

        // Use screen blend to add tunnel light on top of video - stronger mix
        vec3 blendedTunnel = blendScreen(baseColor.rgb, tunnelColor * 0.8);
        color.rgb = mix(baseColor.rgb, blendedTunnel, transition * 0.9);

    } else if (state > 2.5) {
        // PERLIN RIPPLE
        vec3 rippleColor = perlinRippleEffect(uv, uTime, uVideoTexture, finalUV, aspect);
        color.rgb = mix(color.rgb, rippleColor, transition * 0.85);
    }
    // else: STATE_NO_EFFECT - base color with distortion only

    // ------------------------------------------------------------------------
    // STAGE 5: POST-PROCESSING CHAIN
    // ------------------------------------------------------------------------
    // Apply audio-reactive effects in a consistent order.
    // Each effect preserves the work of previous effects.

    // 5a. Chromatic aberration
    color.rgb = applyChromaticAberration(color.rgb, finalUV, uVideoTexture);

    // 5b. Bass blur
    color.rgb = applyBassBlur(color.rgb, finalUV, uVideoTexture);

    // 5c. Hue rotation
    color.rgb = applyHueRotation(color.rgb, finalUV, t);

    // 5d. Edge detection
    color.rgb = applyEdgeDetection(color.rgb, finalUV, uVideoTexture, t);

    // 5e. Saturation boost
    color.rgb = applySaturationBoost(color.rgb);

    // 5f. Solarization (silence effect)
    color.rgb = applySolarization(color.rgb);

    // 5g. Dominant color tint (visual→audio feedback visualization)
    color.rgb = applyDominantColorTint(color.rgb);

    // 5h. Motion particles
    color.rgb = applyMotionParticles(color.rgb, finalUV, t);

    // 5i. Glitch effects
    color.rgb = applyGlitch(color.rgb, finalUV, uVideoTexture, t);
    color.rgb = applyScanlines(color.rgb, finalUV);
    color.rgb = applyTVStatic(color.rgb, finalUV, t);
    color.rgb = applyGlitchTransition(color.rgb, finalUV, uVideoTexture, t);

    // 5j. Vignette (always last before output)
    color.rgb = applyVignette(color.rgb, p, aspect);

    // ------------------------------------------------------------------------
    // OUTPUT
    // ------------------------------------------------------------------------
    gl_FragColor = color;
}
`,b={lineWidth:3,glowAmount:15,wave:{colorSpeed:1.5},hue:135,hueRange:60,maxTextureWidth:640,maxTextureHeight:480};class Y extends q{constructor(e){super(e),this.backgroundColor="#000"}init(){super.init(),W.init(this),R.init(this.ctx),this.time=0,this.idlePhase=0,this.colorPhase=0,this.webgl=null,this.webglAvailable=!1,this.videoTexture=null,this.videoStream=null,this.videoElement=null,this.audioContext=null,this.analyser=null,this.audioSource=null,this.audioBuffer=null,this.isPlaying=!1,this.videoCanvas=null,this.videoCtx=null,this.currentFrame=null,this.textureCanvas=null,this.textureCtx=null,this.textureWidth=0,this.textureHeight=0,this.frequencyData=null,this.bassLevel=0,this.midLevel=0,this.highLevel=0,this.amplitude=0,this.dominantColor={r:0,g:255,b:0},this.motionAmount=0,this.brightness=.5,this.prevFrame=null,this.videoFrequencyData=null,this.videoBrightnessData=null,this.videoColorData=null,this.videoMotionData=null,this.spectrumBars=64,this.smoothedAudioFreq=new Float32Array(64),this.smoothedVideoFreq=new Float32Array(64),this.mouseX=.5,this.mouseY=.5,this.mouseDown=!1,this.rippleTime=0,this.videoSource="camera",this.audioSource="mic",this.settingsScene=null,this.selectedVideoFile=null,this.selectedAudioFile=null,this.videoFileInput=null,this.audioFileInput=null,this.startButton=new F(this,{text:"start synesthesia",width:200,height:50,font:'16px "Fira Code", monospace',onClick:()=>this.fsm.setState("settings")}),this.startButton.x=this.width/2,this.startButton.y=this.height/2+100,this.pipeline.add(this.startButton),this.backButton=new F(this,{x:80,y:30,width:100,height:30,text:"← Back",onClick:()=>this.fsm.setState("intro")}),this.pipeline.add(this.backButton),this.initStateMachine()}initStateMachine(){this.fsm=new z({initial:"intro",context:this,states:{intro:{enter:()=>{this.startButton.visible=!0,this.startButton.interactive=!0,this.backButton.visible=!1,this.backButton.interactive=!1,this.settingsScene&&(this.pipeline.remove(this.settingsScene),this.settingsScene=null)}},settings:{enter:()=>{this.startButton.visible=!1,this.startButton.interactive=!1,this.backButton.visible=!0,this.backButton.interactive=!0,this.createSettingsUI()},exit:()=>{this.settingsScene&&(this.pipeline.remove(this.settingsScene),this.settingsScene=null)}},synesthesia:{enter:()=>{this.startButton.visible=!1,this.startButton.interactive=!1,this.backButton.visible=!0,this.backButton.interactive=!0,this.startSynesthesia()},exit:()=>{this.cleanupSynesthesia()}}}})}createSettingsUI(){this.settingsScene=new X(this,{width:this.width,height:this.height,anchor:"center"}),this.settingsScene.x=this.width/2,this.settingsScene.y=this.height/2;const e=new V(this,{spacing:30,padding:20});this.settingsScene.add(e);const t=new A(this,"--- VIDEO ---",{font:'18px "Fira Code", monospace',color:"#0f0",align:"center",baseline:"middle"});e.add(t);const n=new V(this,{spacing:8,padding:0});e.add(n);const o=new P(this,{spacing:20,padding:10});n.add(o);const r=new x(this,{text:"Camera",width:120,height:40,font:'14px "Fira Code", monospace',startToggled:this.videoSource==="camera",onToggle:l=>{l&&(this.videoSource="camera",this.videoFileBtn.toggle(!1),this.videoFileBtn.text="File",this.selectedVideoFile=null,this.videoFileNameLabel&&(this.videoFileNameLabel.text=""))}});o.add(r),this.videoFileBtn=new x(this,{text:"File",width:120,height:40,font:'14px "Fira Code", monospace',startToggled:this.videoSource==="file",onToggle:l=>{l&&(this.videoSource="file",r.toggle(!1),this.selectVideoFile())}}),o.add(this.videoFileBtn),this.videoFileNameLabel=new A(this,"",{font:'11px "Fira Code", monospace',color:"#0f0",align:"center",baseline:"top"}),n.add(this.videoFileNameLabel);const h=new A(this,"--- AUDIO ---",{font:'18px "Fira Code", monospace',color:"#0f0",align:"center",baseline:"middle"});e.add(h);const a=new V(this,{spacing:8,padding:0});e.add(a);const s=new P(this,{spacing:20,padding:10});a.add(s);const i=new x(this,{text:"MIC",width:120,height:40,font:'14px "Fira Code", monospace',startToggled:this.audioSource==="mic",onToggle:l=>{l&&(this.audioSource="mic",this.audioFileBtn.toggle(!1),this.audioFileBtn.text="FILE",this.selectedAudioFile=null,this.audioFileNameLabel&&(this.audioFileNameLabel.text=""))}});s.add(i),this.audioFileBtn=new x(this,{text:"FILE",width:120,height:40,font:'14px "Fira Code", monospace',startToggled:this.audioSource==="file",onToggle:l=>{l&&(this.audioSource="file",i.toggle(!1),this.selectAudioFile())}}),s.add(this.audioFileBtn),this.audioFileNameLabel=new A(this,"",{font:'11px "Fira Code", monospace',color:"#0f0",align:"center",baseline:"top"}),a.add(this.audioFileNameLabel);const d=new F(this,{text:"start",width:200,height:50,font:'16px "Fira Code", monospace',onClick:()=>this.fsm.setState("synesthesia")});e.add(d),this.pipeline.add(this.settingsScene),this.createFileInputs(),this.selectedVideoFile&&(this.updateVideoFileName(this.selectedVideoFile.name),this.videoFileBtn.text="File ✓"),this.selectedAudioFile&&(this.updateAudioFileName(this.selectedAudioFile.name),this.audioFileBtn.text="FILE ✓")}createFileInputs(){this.videoFileInput=document.createElement("input"),this.videoFileInput.type="file",this.videoFileInput.accept="video/*",this.videoFileInput.style.display="none",this.videoFileInput.addEventListener("change",e=>{const t=e.target.files[0];t&&(this.selectedVideoFile=t,this.updateVideoFileName(t.name),this.videoFileBtn.text="File ✓")}),document.body.appendChild(this.videoFileInput),this.audioFileInput=document.createElement("input"),this.audioFileInput.type="file",this.audioFileInput.accept="audio/*",this.audioFileInput.style.display="none",this.audioFileInput.addEventListener("change",e=>{const t=e.target.files[0];t&&(this.selectedAudioFile=t,this.updateAudioFileName(t.name),this.audioFileBtn.text="FILE ✓")}),document.body.appendChild(this.audioFileInput)}updateVideoFileName(e){if(!this.videoFileNameLabel)return;const t=25;let n=e;e.length>t&&(n=e.substring(0,t-1)+"…"),this.videoFileNameLabel.text=n,this.videoFileNameLabel.color="#0f0"}updateAudioFileName(e){if(!this.audioFileNameLabel)return;const t=25;let n=e;e.length>t&&(n=e.substring(0,t-1)+"…"),this.audioFileNameLabel.text=n,this.audioFileNameLabel.color="#0f0"}selectVideoFile(){this.videoFileInput&&this.videoFileInput.click()}selectAudioFile(){this.audioFileInput&&this.audioFileInput.click()}async startSynesthesia(){try{if(this.videoSource==="file"&&!this.selectedVideoFile){alert("Please select a video file first."),this.videoSource="camera",this.videoFileBtn&&this.videoFileBtn.toggle(!1);return}if(this.audioSource==="file"&&!this.selectedAudioFile){alert("Please select an audio file first."),this.audioSource="mic",this.audioFileBtn&&this.audioFileBtn.toggle(!1);return}if(this.videoElement=document.createElement("video"),this.videoElement.autoplay=!0,this.videoElement.playsInline=!0,this.videoElement.muted=!0,this.videoElement.width=this.width,this.videoElement.height=this.height,this.videoElement.loop=!0,this.videoSource==="camera"){const t=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:this.width},height:{ideal:this.height}}});this.videoStream=t.getVideoTracks()[0],this.videoElement.srcObject=t}else{const t=URL.createObjectURL(this.selectedVideoFile);this.videoElement.src=t,this.videoElement.addEventListener("loadedmetadata",()=>{this.videoElement.play().then(()=>{this.processVideo()}).catch(n=>{console.error("Video play failed:",n),this.processVideo()})})}if(this.videoCanvas=document.createElement("canvas"),this.videoCanvas.width=this.width,this.videoCanvas.height=this.height,this.videoCtx=this.videoCanvas.getContext("2d",{willReadFrequently:!0}),this.textureCanvas=document.createElement("canvas"),this.textureCtx=this.textureCanvas.getContext("2d",{willReadFrequently:!1}),this.webgl=new K(this.width,this.height),!this.webgl.isAvailable())console.warn("WebGL not available, falling back to canvas 2D"),this.webglAvailable=!1;else{this.webglAvailable=!0,this.webgl.useProgram("synesthesia",N,B);const t=this.webgl.gl;this.videoTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.videoTexture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR)}this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=2048,this.analyser.smoothingTimeConstant=.8,this.frequencyData=new Uint8Array(this.analyser.frequencyBinCount),this.videoFrequencyData=new Float32Array(this.spectrumBars),this.videoBrightnessData=new Float32Array(this.spectrumBars),this.videoColorData=new Float32Array(this.spectrumBars),this.videoMotionData=new Float32Array(this.spectrumBars),this.smoothedAudioFreq=new Float32Array(this.spectrumBars),this.smoothedVideoFreq=new Float32Array(this.spectrumBars),this.setupMouseHandlers(),this.audioFilters=[];const e=Math.min(this.spectrumBars,16);for(let t=0;t<e;t++){const n=this.audioContext.createBiquadFilter();n.type="peaking";const o=60,r=8e3,h=e>1?o*Math.pow(r/o,t/(e-1)):(o+r)/2;n.frequency.value=h,n.Q.value=2,n.gain.value=0,this.audioFilters.push(n)}if(this.audioSource==="mic"){const t=await navigator.mediaDevices.getUserMedia({audio:!0}),n=this.audioContext.createMediaStreamSource(t);this.connectAudioWithFilters(n)}else await this.loadAudioFile(this.selectedAudioFile);this.videoSource==="camera"&&this.processVideo()}catch(e){console.error("Error starting synesthesia:",e),this.videoSource==="camera"?alert("Could not access webcam. Please allow permissions."):this.audioSource==="mic"?alert("Could not access microphone. Please allow permissions."):alert("Error starting synesthesia: "+e.message)}}cleanupSynesthesia(){if(this.videoStream&&(this.videoStream.getTracks().forEach(e=>e.stop()),this.videoStream=null),this.audioSource){try{this.audioSource.stop&&this.audioSource.stop(),this.audioSource.disconnect&&this.audioSource.disconnect()}catch{}this.audioSource=null}this.audioContext&&this.audioContext.state!=="closed"&&(this.audioContext.close().catch(()=>{}),this.audioContext=null),this.videoElement&&(this.videoElement.pause(),this.videoElement.src&&this.videoElement.src.startsWith("blob:")&&URL.revokeObjectURL(this.videoElement.src),this.videoElement.srcObject=null,this.videoElement.src="",this.videoElement=null),this.currentFrame=null,this.videoCanvas=null,this.videoCtx=null,this.textureCanvas=null,this.textureCtx=null,this.textureWidth=0,this.textureHeight=0,this.rawAnalysisCanvas=null,this.rawAnalysisCtx=null,this.frequencyData=null,this.webglAvailable&&this.webgl&&this.videoTexture&&(this.webgl.gl.deleteTexture(this.videoTexture),this.videoTexture=null)}createAudioFileInput(){const e=document.createElement("input");e.type="file",e.accept="audio/*",e.style.display="none",document.body.appendChild(e),e.addEventListener("change",async t=>{t.target.files.length>0&&(await this.loadAudioFile(t.target.files[0]),e.remove())}),e.click()}async loadAudioFile(e){try{const t=await e.arrayBuffer();this.audioBuffer=await this.audioContext.decodeAudioData(t),this.audioSource=this.audioContext.createBufferSource(),this.audioSource.buffer=this.audioBuffer,this.connectAudioWithFilters(this.audioSource),this.audioSource.onended=()=>{this.isPlaying=!1,this.startAudioPlayback()},this.startAudioPlayback()}catch(t){console.error("Error loading audio file:",t),alert("Could not load audio file.")}}startAudioPlayback(){!this.audioBuffer||!this.audioContext||(this.audioSource=this.audioContext.createBufferSource(),this.audioSource.buffer=this.audioBuffer,this.connectAudioWithFilters(this.audioSource),this.audioSource.onended=()=>{this.isPlaying=!1,this.startAudioPlayback()},this.audioSource.start(0),this.isPlaying=!0)}processVideo(){if(!this.fsm.is("synesthesia")||!this.videoElement)return;const e=this.videoElement.videoWidth||this.width,t=this.videoElement.videoHeight||this.height,n=e/t;let o=b.maxTextureWidth,r=b.maxTextureHeight;o/n>r?o=Math.floor(r*n):r=Math.floor(o/n),(this.textureCanvas.width!==o||this.textureCanvas.height!==r)&&(this.textureCanvas.width=o,this.textureCanvas.height=r,this.textureWidth=o,this.textureHeight=r,console.log(`[Day30] Texture undersampled: ${e}x${t} → ${o}x${r}`)),(this.videoCanvas.width!==this.width||this.videoCanvas.height!==this.height)&&(this.videoCanvas.width=this.width,this.videoCanvas.height=this.height),this.textureCtx.drawImage(this.videoElement,0,0,o,r);const h=this.width/this.height;let a,s,i,d;h>n?(a=this.width,s=this.width/n,i=0,d=(this.height-s)/2):(s=this.height,a=this.height*n,i=(this.width-a)/2,d=0),this.videoCtx.fillStyle="#000",this.videoCtx.fillRect(0,0,this.width,this.height),this.videoCtx.drawImage(this.videoElement,i,d,a,s),this.rawAnalysisCanvas||(this.rawAnalysisCanvas=document.createElement("canvas"),this.rawAnalysisCtx=this.rawAnalysisCanvas.getContext("2d",{willReadFrequently:!0})),(this.rawAnalysisCanvas.width!==o||this.rawAnalysisCanvas.height!==r)&&(this.rawAnalysisCanvas.width=o,this.rawAnalysisCanvas.height=r),this.rawAnalysisCtx.drawImage(this.textureCanvas,0,0,o,r);const l=this.rawAnalysisCtx.getImageData(0,0,o,r);if(this.analyzeVisual(l),this.prevFrame=new Uint8Array(l.data),this.webglAvailable&&this.videoTexture&&this.webgl){const u=this.webgl.gl;u.isTexture(this.videoTexture)&&(u.bindTexture(u.TEXTURE_2D,this.videoTexture),u.texImage2D(u.TEXTURE_2D,0,u.RGBA,u.RGBA,u.UNSIGNED_BYTE,this.textureCanvas))}requestAnimationFrame(()=>this.processVideo())}analyzeVisual(e){const t=e.data,n=e.width,o=e.height;let r=0,h=0,a=0,s=0,i=0;const d=t.length/4;this.videoFrequencyData||(this.videoFrequencyData=new Float32Array(this.spectrumBars),this.videoBrightnessData=new Float32Array(this.spectrumBars),this.videoColorData=new Float32Array(this.spectrumBars),this.videoMotionData=new Float32Array(this.spectrumBars));for(let c=0;c<this.videoFrequencyData.length;c++)this.videoFrequencyData[c]=0,this.videoBrightnessData[c]=0,this.videoColorData[c]=0,this.videoMotionData[c]=0;const l=this.videoFrequencyData.length,u=Math.floor(n/l);for(let c=0;c<l;c++){let f=0,y=0,T=0,v=0;const C=c*u,D=Math.min((c+1)*u,n);for(let m=0;m<o;m+=2)for(let g=C;g<D;g+=2){const p=(m*n+g)*4;if(p+2<t.length){const E=t[p],S=t[p+1],w=t[p+2],L=(E*.299+S*.587+w*.114)/255;f+=L;const I=Math.max(E,S,w),_=Math.min(E,S,w),M=I>0?(I-_)/I:0;if(y+=M,this.prevFrame&&p<this.prevFrame.length){const O=this.prevFrame[p],k=this.prevFrame[p+1],G=this.prevFrame[p+2],H=Math.abs(E-O)+Math.abs(S-k)+Math.abs(w-G);T+=H/765}v++}}if(v>0){const m=f/v,g=y/v,p=v>0?T/v:0;this.videoBrightnessData[c]=m,this.videoColorData[c]=g,this.videoMotionData[c]=p,this.videoFrequencyData[c]=m*.5+g*.3+p*.2}}for(let c=0;c<t.length;c+=4){const f=t[c],y=t[c+1],T=t[c+2];r+=f,h+=y,a+=T;const v=(f*.299+y*.587+T*.114)/255;if(s+=v,this.prevFrame){const C=this.prevFrame[c],D=this.prevFrame[c+1],m=this.prevFrame[c+2],g=Math.abs(f-C)+Math.abs(y-D)+Math.abs(T-m);i+=g/765}}this.dominantColor={r:Math.floor(r/d),g:Math.floor(h/d),b:Math.floor(a/d)},this.brightness=s/d,this.motionAmount=i/d}analyzeAudio(){if(!this.analyser||!this.frequencyData){this.bassLevel=0,this.midLevel=0,this.highLevel=0,this.amplitude=0;return}this.analyser.getByteFrequencyData(this.frequencyData),this.updateAudioFilters();const e=.85;if(this.smoothedAudioFreq&&this.smoothedVideoFreq)for(let i=0;i<this.spectrumBars;i++){const d=Math.floor(i/this.spectrumBars*this.frequencyData.length),l=this.frequencyData[d]/255;this.smoothedAudioFreq[i]=this.smoothedAudioFreq[i]*e+l*(1-e);const u=this.videoFrequencyData[i]||0;this.smoothedVideoFreq[i]=this.smoothedVideoFreq[i]*e+u*(1-e)}const t=Math.floor(this.frequencyData.length*.1),n=Math.floor(this.frequencyData.length*.1),o=Math.floor(this.frequencyData.length*.5),r=Math.floor(this.frequencyData.length*.5);let h=0,a=0,s=0;for(let i=0;i<t;i++)h+=this.frequencyData[i];for(let i=n;i<o;i++)a+=this.frequencyData[i];for(let i=r;i<this.frequencyData.length;i++)s+=this.frequencyData[i];this.bassLevel=h/(t*255),this.midLevel=a/((o-n)*255),this.highLevel=s/((this.frequencyData.length-r)*255),this.amplitude=this.bassLevel*.5+this.midLevel*.3+this.highLevel*.2}connectAudioWithFilters(e){if(!this.audioFilters||this.audioFilters.length===0){e.connect(this.analyser),this.analyser.connect(this.audioContext.destination);return}let t=e;for(let n=0;n<this.audioFilters.length;n++)t.connect(this.audioFilters[n]),t=this.audioFilters[n];t.connect(this.analyser),this.analyser.connect(this.audioContext.destination)}updateAudioFilters(){if(!this.videoFrequencyData||!this.audioFilters||this.audioFilters.length===0||!this.videoBrightnessData||!this.videoColorData||!this.videoMotionData)return;const e=this.audioFilters.length,t=this.videoFrequencyData.length,n=Math.floor(e*.3),o=n,r=Math.floor(e*.7),h=r;for(let a=0;a<e;a++){const s=Math.floor(a/e*t);let i=0;a<n?i=(this.videoBrightnessData[s]||0)*12:a>=o&&a<r?i=(this.videoColorData[s]||0)*15:a>=h&&(i=(this.videoMotionData[s]||0)*18);const d=this.audioFilters[a].gain.value,l=i,u=d*.85+l*.15;this.audioFilters[a].gain.value=u}}mix(e,t,n){return e+(t-e)*n}setupMouseHandlers(){this.canvas.addEventListener("mousemove",e=>{const t=this.canvas.getBoundingClientRect();this.mouseX=(e.clientX-t.left)/t.width,this.mouseY=(e.clientY-t.top)/t.height}),this.canvas.addEventListener("mousedown",e=>{this.mouseDown=!0,this.rippleTime=0;const t=this.canvas.getBoundingClientRect();this.mouseX=(e.clientX-t.left)/t.width,this.mouseY=(e.clientY-t.top)/t.height}),this.canvas.addEventListener("mouseup",()=>{this.mouseDown=!1}),this.canvas.addEventListener("mouseleave",()=>{this.mouseDown=!1})}update(e){super.update(e),this.fsm&&this.fsm.update(e),this.time+=e,this.idlePhase+=e*.5,this.fsm&&this.fsm.is("synesthesia")&&(this.rippleTime+=e),this.colorPhase+=e*b.wave.colorSpeed,this.fsm&&this.fsm.is("synesthesia")&&this.analyzeAudio(),this.startButton&&this.fsm&&this.fsm.is("intro")&&(this.startButton.x=this.width/2,this.startButton.y=this.height/2+100),this.settingsScene&&this.fsm&&this.fsm.is("settings"),this.webglAvailable&&this.webgl&&(this.webgl.width!==this.width||this.webgl.height!==this.height)&&this.webgl.resize(this.width,this.height)}render(){var o,r,h,a;const e=this.ctx,t=this.width,n=this.height;if(R.setContext(e),this.fsm&&this.fsm.is("synesthesia")){if(this.webglAvailable&&this.webgl&&this.videoTexture){const s=this.webgl.gl;if(s.isTexture(this.videoTexture)){this.webgl.useProgram("synesthesia",N,B),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,this.videoTexture);const i=(o=this.webgl.programs)==null?void 0:o.get("synesthesia");if(i){const l=s.getUniformLocation(i,"uVideoTexture");l&&s.uniform1i(l,0)}const d={uResolution:[t,n],uTime:this.time,uBassLevel:this.bassLevel||0,uMidLevel:this.midLevel||0,uHighLevel:this.highLevel||0,uAmplitude:this.amplitude||0,uSilence:(this.amplitude||0)<.1?1:0,uDominantColor:[((r=this.dominantColor)==null?void 0:r.r)||0,((h=this.dominantColor)==null?void 0:h.g)||0,((a=this.dominantColor)==null?void 0:a.b)||0],uMotionAmount:this.motionAmount||0,uBrightness:this.brightness||.5,uSpectrumBars:0,uMouse:[this.mouseX||0,this.mouseY||0],uMouseDown:this.mouseDown?1:0,uRippleTime:this.rippleTime||0};this.webgl.setUniforms(d),this.webgl.clear(0,0,0,1),this.webgl.render(),e.drawImage(this.webgl.getCanvas(),0,0,t,n)}}else this.currentFrame&&e.drawImage(this.currentFrame,0,0,t,n);this.backButton&&this.backButton.visible&&(e.save(),e.globalAlpha=1,e.shadowBlur=0,e.shadowColor="transparent",this.backButton.render(),e.restore())}else{const s=n/2;e.fillStyle="rgba(0, 0, 0, 0.15)",e.fillRect(0,0,t,n);const i=this.generateWavePoints(t,n,s);i.length>=2&&this.drawWave(e,i,t,n,s),this.fsm&&this.fsm.is("intro")&&this.startButton&&(e.save(),e.globalAlpha=1,e.shadowBlur=0,e.shadowColor="transparent",this.startButton.render(),e.restore()),this.pipeline.render(e),this.fsm&&this.fsm.is("settings")&&this.backButton&&this.backButton.visible&&(e.save(),e.globalAlpha=1,e.shadowBlur=0,e.shadowColor="transparent",this.backButton.render(),e.restore())}}generateWavePoints(e,t,n){const o=[];for(let a=0;a<200;a++){const s=a/200*e,i=this.idlePhase,d=Math.sin(a*.05+i*.8)*.5*.3+Math.sin(a*.12-i*1.2)*.5*.2+Math.sin(a*.03+i*.3)*.05+(Math.random()-.5)*.5*.1,l=n+d*t*.4;o.push({x:s,y:l,v:d})}return o}drawWave(e,t,n,o,r){e.save();const h=b.hue+Math.sin(this.colorPhase)*b.hueRange,a=70,s=50;e.shadowColor=`hsl(${h}, ${a}%, ${s}%)`,e.shadowBlur=b.glowAmount,e.lineWidth=b.lineWidth,e.lineCap="round",e.lineJoin="round",e.strokeStyle=`hsl(${h}, ${a}%, ${s}%)`,e.beginPath(),e.moveTo(t[0].x,t[0].y);for(let d=1;d<t.length-1;d++){const l=t[d],u=t[d+1],c=l.x+(u.x-l.x)*.5,f=l.y+(u.y-l.y)*.5;e.quadraticCurveTo(l.x,l.y,c,f)}const i=t[t.length-1];e.lineTo(i.x,i.y),e.stroke(),e.globalAlpha=.6,e.lineWidth=b.lineWidth*.5,e.strokeStyle=`hsl(${h}, 100%, 90%)`,e.stroke(),e.restore()}stop(){if(this.cleanupSynesthesia(),this.videoElement&&(this.videoElement.pause(),this.videoElement.srcObject=null,this.videoElement.src=""),this.videoStream&&(this.videoStream.getTracks().forEach(e=>e.stop()),this.videoStream=null),this.audioSource){try{this.audioSource.stop&&this.audioSource.stop(),this.audioSource.disconnect&&this.audioSource.disconnect()}catch{}this.audioSource=null}this.audioContext&&this.audioContext.state!=="closed"&&(this.audioContext.close().catch(()=>{}),this.audioContext=null),this.webglAvailable&&this.webgl&&(this.videoTexture&&(this.webgl.gl.deleteTexture(this.videoTexture),this.videoTexture=null),this.webgl.destroy(),this.webgl=null),this.videoFileInput&&this.videoFileInput.parentNode&&(this.videoFileInput.parentNode.removeChild(this.videoFileInput),this.videoFileInput=null),this.audioFileInput&&this.audioFileInput.parentNode&&(this.audioFileInput.parentNode.removeChild(this.audioFileInput),this.audioFileInput=null),super.stop()}}function j(U){const e=new Y(U);return e.start(),{stop:()=>e.stop(),game:e}}export{j as default};
