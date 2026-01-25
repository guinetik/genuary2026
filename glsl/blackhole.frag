/**
 * blackhole.frag - Genuary 2026 Day 31: GLSL Day
 * 
 * A noob's attempt at Raytracing a Black Hole
 * ==============================================
 * 
 * This shader simulates how light bends around a black hole due to 
 * gravitational lensing. Don't worry - we're not solving Einstein's
 * field equations! But if you want some of that, check out the gr.js in the GCanvas engine. Anyway....
 * We use a simplified Newtonian approximation that
 * looks convincing enough for real-time graphics.
 * 
 * WHAT I LEARNED:
 * 1. Basic raytracing concepts (shooting rays from camera into scene)
 * 2. How gravity bends light (gravitational lensing)
 * 3. Signed Distance Functions (SDFs) for simple shapes
 * 4. Procedural noise for textures without images
 * 5. Alpha compositing for layering effects
 * 
 * The key insight: light doesn't travel in straight lines near 
 * massive objects. We simulate this by slightly curving our rays
 * toward the black hole at each step.
 * 
 * @author guinetik
 * @project Genuary 2026
 * @see https://genuary.art
 */
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uPulse;
uniform vec2 uBHPosition;  // Where to draw the black hole (0-1 coords)
uniform float uBHSize;     // How big it appears on screen

const float PI = 3.1415927;

// ============================================================
// PART 1: SIGNED DISTANCE FUNCTIONS (SDFs)
// ============================================================
// SDFs tell us "how far is this point from the surface?"
// Negative = inside, Positive = outside, Zero = on surface
// They're incredibly useful for raymarching and collision detection.

/**
 * Distance from point p to a sphere centered at origin
 * This is the simplest SDF - just measure distance and subtract radius
 */
float sdfSphere(vec3 p, float radius) {
    return length(p) - radius;
}

/**
 * Distance from point p to a torus (donut shape)
 * t.x = major radius (distance from center to tube center)
 * t.y = minor radius (thickness of the tube)
 * 
 * We use this for the accretion disk - it's a flattened torus
 */
float sdfTorus(vec3 p, vec2 t) {
    // Project onto XZ plane, measure distance to ring
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// ============================================================
// PART 2: PROCEDURAL NOISE
// ============================================================
// Instead of loading texture images, we generate patterns mathematically.
// This is faster to load and infinitely scalable!

/**
 * Simple hash function - turns 2D coordinates into pseudo-random numbers
 * The "magic numbers" are chosen to create good distribution
 */
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

/**
 * Fractal Brownian Motion (FBM) - layered noise for natural-looking textures
 * 
 * We add multiple "octaves" of noise at different scales:
 * - Large scale noise for overall structure
 * - Smaller scales add fine detail
 * Each octave has half the amplitude (quieter) and double the frequency
 */
float fbmNoise(vec2 p) {
    float total = 0.0;
    float amplitude = 1.0;
    
    // 4 octaves is a good balance of detail vs performance
    for (int i = 0; i < 4; i++) {
        total += amplitude * hash(p);
        p *= 2.0;           // Double the frequency (smaller features)
        amplitude *= 0.5;   // Halve the amplitude (less influence)
    }
    
    return total;
}

// ============================================================
// PART 3: MAIN RENDERING
// ============================================================

void main() {
    // --- STEP 1: SET UP SCREEN COORDINATES ---
    // Convert pixel position to centered, aspect-corrected coordinates
    // Range: roughly -1 to 1, with (0,0) at center
    
    vec2 screenPos = vUv * 2.0 - 1.0;  // Convert 0-1 to -1 to 1
    screenPos.x *= uResolution.x / uResolution.y;  // Fix aspect ratio
    
    // Offset to position the black hole where we want it on screen
    vec2 bhOffset = (uBHPosition - 0.5) * 2.0;
    bhOffset.x *= uResolution.x / uResolution.y;
    screenPos -= bhOffset;
    
    // Scale to control apparent size
    screenPos *= 1.0 / (uBHSize * 15.0);
    
    // --- STEP 2: SET UP THE CAMERA ---
    // We position a virtual camera looking at the black hole
    // Using spherical coordinates for easy positioning
    
    float cameraDistance = 2.0;
    float cameraAngleH = PI * 0.5;   // Horizontal angle (fixed, looking straight)
    float cameraAngleV = PI * 0.48;  // Vertical angle (slightly above, for edge-on disk view)
    
    // Convert spherical to cartesian coordinates
    vec3 cameraPos = vec3(
        cameraDistance * cos(cameraAngleH) * sin(cameraAngleV),
        cameraDistance * cos(cameraAngleV),
        cameraDistance * sin(cameraAngleH) * sin(cameraAngleV)
    );
    
    // Build camera orientation vectors
    vec3 target = vec3(0.0);  // Looking at origin (where black hole is)
    vec3 forward = normalize(target - cameraPos);
    vec3 right = normalize(cross(vec3(0.0, 1.0, -0.1), forward));
    vec3 up = normalize(cross(forward, right));
    
    // Create the ray direction for this pixel
    // forward * 1.5 gives us a ~67° field of view
    vec3 rayDir = normalize(forward * 1.5 + right * screenPos.x + up * screenPos.y);
    
    // --- STEP 3: BLACK HOLE PARAMETERS ---
    // These control the physics simulation
    
    vec3 bhPosition = vec3(0.0);      // Black hole at origin
    float eventHorizonRadius = 0.1;   // Point of no return for light
    float gravityStrength = 0.005;    // How strongly light bends (simplified!)
    
    // --- STEP 4: RAYTRACE WITH GRAVITATIONAL LENSING ---
    // Here's where the magic happens!
    // 
    // Normal raytracing: march in straight lines
    // Our raytracing: at each step, bend the ray toward the black hole
    //
    // This is a HUGE simplification of real physics, but it looks great!
    
    vec3 rayPos = cameraPos;
    vec3 rayVel = rayDir;  // Current direction (will be modified by gravity)
    float stepSize = 0.02;
    
    vec3 finalColor = vec3(0.0);
    float notCaptured = 1.0;  // 1.0 = ray is free, 0.0 = fell into black hole
    
    // Terminal green color palette for the accretion disk
    vec3 outerDiskColor = vec3(0.1, 0.5, 0.2);   // Darker green at edges
    vec3 innerDiskColor = vec3(0.4, 1.0, 0.6);   // Brighter green near center
    
    // March the ray through space
    // 200 iterations (t goes 0 to 1 in steps of 0.005)
    for (float t = 0.0; t < 1.0; t += 0.005) {
        
        // Move ray forward (but only if not captured)
        rayPos += rayVel * stepSize * notCaptured;
        
        // --- GRAVITY: Bend the ray toward the black hole ---
        // Vector pointing from ray to black hole
        vec3 toBH = bhPosition - rayPos;
        float distanceSquared = dot(toBH, toBH);
        
        // Acceleration = G * M / r² (Newton's gravity, simplified)
        // We add this to our velocity, bending the light path
        rayVel += normalize(toBH) * (gravityStrength / distanceSquared);
        
        // --- CHECK: Did we fall past the event horizon? ---
        float distToHorizon = sdfSphere(rayPos - bhPosition, eventHorizonRadius);
        notCaptured = smoothstep(0.0, 0.666, distToHorizon);
        
        // --- ACCRETION DISK: The glowing matter spiral ---
        // Real accretion disks are incredibly hot plasma orbiting the black hole
        // We fake this with a procedural texture mapped onto a thin torus
        
        // Calculate polar coordinates for disk texture
        float diskRadius = length(toBH.xz);  // Distance from BH in XZ plane
        float diskAngle = atan(toBH.x, toBH.z);  // Angle around BH
        
        // Create scrolling texture coordinates
        // The disk rotates slowly (uTime * 0.1)
        vec2 diskUV = vec2(
            diskRadius,
            diskAngle * (0.01 + (diskRadius - eventHorizonRadius) * 0.002) + uTime * 0.1
        );
        diskUV *= vec2(10.0, 20.0);  // Scale for good texture detail
        
        // Generate disk texture using our procedural noise
        float diskTexture = fbmNoise(diskUV * vec2(0.1, 0.5)) * 0.8 + 0.2;
        // Add some swirly pattern
        diskTexture += sin(diskUV.x * 3.0 + diskUV.y * 0.5 + uTime * 0.5) * 0.15;
        
        // Color based on distance from black hole (hotter = brighter near center)
        float distFromBH = length(toBH) - eventHorizonRadius;
        vec3 diskColor = mix(innerDiskColor, outerDiskColor, pow(distFromBH, 2.0));
        diskColor *= max(0.0, diskTexture);
        
        // Intensity falls off with distance (inverse relationship)
        diskColor *= 4.0 / (0.001 + distFromBH * 50.0);
        
        // --- DISK SHAPE: Use a flattened torus ---
        // We squash Y by 40x to make a very thin disk
        vec3 flattenedPos = rayPos * vec3(1.0, 40.0, 1.0);
        float diskMask = smoothstep(0.0, 1.0, -sdfTorus(flattenedPos - bhPosition, vec2(0.8, 0.99)));
        
        // Add disk contribution to final color
        finalColor += max(vec3(0.0), diskColor * diskMask * notCaptured);
        
        // --- GLOW: Subtle light around the black hole ---
        // Inverse square falloff creates a natural glow
        finalColor += vec3(0.3, 1.0, 0.5) * (1.0 / distanceSquared) * 0.002 * notCaptured;
    }
    
    // --- STEP 5: PULSE EFFECT ---
    // When posters spawn, we trigger a brief glow from the black hole
    if (uPulse > 0.01) {
        float pulseIntensity = uPulse * uPulse * 0.5;  // Squared for snappier falloff
        finalColor += vec3(0.2, 0.8, 0.4) * pulseIntensity;
    }
    
    // --- STEP 6: OUTPUT WITH ALPHA ---
    // We output alpha so this can be composited over other layers
    // Alpha is based on how much color we accumulated + whether we hit the event horizon
    float alpha = min(1.0, length(finalColor) * 2.0 + (1.0 - notCaptured));
    
    gl_FragColor = vec4(finalColor, alpha);
}
