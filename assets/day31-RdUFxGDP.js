import{G as f,W as u,C as m}from"./index-B6QQFJuW.js";import{CONFIG as i}from"./day31.config-BSqBXNjO.js";import{BirdFlock as p}from"./day31.birds-DAlUJsD0.js";import{FlyingPoster as v}from"./day31.posters-DZRcjYo7.js";import{Runner as g}from"./day31.runner-4VvprT54.js";import{MatrixRain as y}from"./day31.matrix-BVXyTlXT.js";const b=`precision highp float;\r
\r
attribute vec2 aPosition;\r
attribute vec2 aUv;\r
\r
varying vec2 vUv;\r
\r
void main() {\r
    vUv = aUv;\r
    gl_Position = vec4(aPosition, 0.0, 1.0);\r
}\r
`,w=`/**\r
 * finale.frag - Genuary 2026 Day 31: GLSL Day\r
 * \r
 * Synthwave terrain with Sierpinski fractal sky\r
 * \r
 * Features:\r
 * - Raymarched triangular grid terrain with dramatic peaks\r
 * - Terminal green color palette\r
 * - Sierpinski triangle pattern projected onto the sky dome\r
 * - Mouse-controlled camera rotation (yaw/pitch)\r
 * - Scanline and vignette post-processing\r
 * \r
 * Based on "another synthwave sunset thing" by stduhpf\r
 * Original: https://www.shadertoy.com/view/tsScRK\r
 * \r
 * Adapted for @guinetik/gcanvas WebGL pipeline\r
 * \r
 * @author guinetik\r
 * @project Genuary 2026\r
 * @see https://genuary.art\r
 */\r
precision highp float;\r
\r
varying vec2 vUv;\r
\r
uniform float uTime;\r
uniform vec2 uResolution;\r
uniform vec2 uMouse;\r
uniform float uMouseActive;\r
uniform float uCompletion;\r
uniform float uPulse;      // 0-1 pulse intensity for spawn effect\r
\r
#define speed 10.0\r
\r
float jTime;\r
\r
// ============================================\r
// UTILITY FUNCTIONS\r
// ============================================\r
float amp(vec2 p) {\r
    return smoothstep(1.0, 8.0, abs(p.x));   \r
}\r
\r
float pow512(float a) {\r
    a *= a; // ^2\r
    a *= a; // ^4\r
    a *= a; // ^8\r
    a *= a; // ^16\r
    a *= a; // ^32\r
    a *= a; // ^64\r
    a *= a; // ^128\r
    a *= a; // ^256\r
    return a * a;\r
}\r
\r
float pow1d5(float a) {\r
    return a * sqrt(a);\r
}\r
\r
float hash21(vec2 co) {\r
    return fract(sin(dot(co.xy, vec2(1.9898, 7.233))) * 45758.5433);\r
}\r
\r
float hash(vec2 uv) {\r
    float a = amp(uv);\r
    if (a <= 0.0) return 0.0;\r
    \r
    // Base noise\r
    float h = hash21(uv);\r
    \r
    // Add extra variation layers\r
    float h2 = hash21(uv * 0.5 + vec2(17.3, 31.7));\r
    float h3 = hash21(uv * 0.25 + vec2(53.1, 97.2));\r
    \r
    // Combine for more interesting terrain\r
    float combined = h * 0.5 + h2 * 0.3 + h3 * 0.2;\r
    \r
    // Add some sharper peaks\r
    combined = pow(combined, 0.8);\r
    \r
    return a * pow1d5(combined) * 1.2;\r
}\r
\r
float edgeMin(float dx, vec2 da, vec2 db, vec2 uv) {\r
    uv.x += 5.0;\r
    vec3 c = fract((floor(vec3(uv, uv.x + uv.y) + 0.5)) * (vec3(0, 1, 2) + 0.61803398875));\r
    float a1 = 1.0;\r
    float a2 = 1.0;\r
    float a3 = 1.0;\r
    return min(min((1.0 - dx) * db.y * a3, da.x * a2), da.y * a1);\r
}\r
\r
vec2 trinoise(vec2 uv) {\r
    const float sq = sqrt(3.0 / 2.0);\r
    uv.x *= sq;\r
    uv.y -= 0.5 * uv.x;\r
    vec2 d = fract(uv);\r
    uv -= d;\r
\r
    bool c = dot(d, vec2(1)) > 1.0;\r
\r
    vec2 dd = 1.0 - d;\r
    vec2 da = c ? dd : d;\r
    vec2 db = c ? d : dd;\r
    \r
    float nn = hash(uv + float(c));\r
    float n2 = hash(uv + vec2(1, 0));\r
    float n3 = hash(uv + vec2(0, 1));\r
\r
    float nmid = mix(n2, n3, d.y);\r
    float ns = mix(nn, c ? n2 : n3, da.y);\r
    float dx = da.x / db.y;\r
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv + d));\r
}\r
\r
// ============================================\r
// RAYMARCHING\r
// ============================================\r
vec2 map(vec3 p) {\r
    vec2 n = trinoise(p.xz);\r
    // More dramatic terrain height\r
    return vec2(p.y - 3.0 * n.x, n.y);\r
}\r
\r
vec3 grad(vec3 p) {\r
    const vec2 e = vec2(0.005, 0);\r
    float a = map(p).x;\r
    return vec3(\r
        map(p + e.xyy).x - a,\r
        map(p + e.yxy).x - a,\r
        map(p + e.yyx).x - a\r
    ) / e.x;\r
}\r
\r
vec2 intersect(vec3 ro, vec3 rd) {\r
    float d = 0.0, h = 0.0;\r
    for (int i = 0; i < 500; i++) {\r
        vec3 p = ro + d * rd;\r
        vec2 s = map(p);\r
        h = s.x;\r
        d += h * 0.5;\r
        if (abs(h) < 0.003 * d)\r
            return vec2(d, s.y);\r
        if (d > 150.0 || p.y > 4.0) break;\r
    }\r
    return vec2(-1);\r
}\r
\r
// ============================================\r
// SIERPINSKI SKY PATTERN (GLSL ES compatible)\r
// ============================================\r
\r
// Sierpinski triangle check: pixel is filled if (x AND y) == 0\r
// Emulated without bitwise ops using recursive modulo\r
float sierpinski(vec2 p, float iterations) {\r
    float filled = 1.0;\r
    \r
    // Check each "bit" level - if both coords have a 1 in same position, it's empty\r
    for (float i = 0.0; i < 8.0; i++) {\r
        if (i >= iterations) break;\r
        \r
        float scale = pow(2.0, i);\r
        float mx = mod(floor(p.x / scale), 2.0);\r
        float my = mod(floor(p.y / scale), 2.0);\r
        \r
        // AND operation: if both are 1, this "bit" is set -> hole in Sierpinski\r
        if (mx > 0.5 && my > 0.5) {\r
            filled = 0.0;\r
            break;\r
        }\r
    }\r
    \r
    return filled;\r
}\r
\r
// Multi-scale Sierpinski with animation\r
float sierpinskiSky(vec3 rd, float time) {\r
    // Project ray direction to 2D - creates dome effect\r
    vec2 skyUV = rd.xz / (abs(rd.y) + 0.3);\r
    \r
    // Slow drift animation\r
    vec2 drift = vec2(time * 2.0, time * 1.5);\r
    \r
    // Layer 1: Large scale Sierpinski\r
    vec2 p1 = skyUV * 60.0 + drift;\r
    float s1 = sierpinski(p1, 6.0);\r
    \r
    // Layer 2: Medium scale, offset\r
    vec2 p2 = skyUV * 120.0 - drift * 0.7;\r
    float s2 = sierpinski(p2, 5.0);\r
    \r
    // Layer 3: Small scale, different drift\r
    vec2 p3 = skyUV * 200.0 + vec2(drift.y, -drift.x) * 0.5;\r
    float s3 = sierpinski(p3, 4.0);\r
    \r
    // Combine layers with depth-like blending\r
    // Larger patterns more prominent, smaller ones subtle\r
    float pattern = s1 * 0.5 + s2 * 0.3 + s3 * 0.2;\r
    \r
    // Height-based fade (stronger toward zenith, fades at horizon)\r
    float heightFade = smoothstep(0.05, 0.5, rd.y);\r
    \r
    // Fade near horizon to not compete with terrain\r
    float horizonFade = smoothstep(0.0, 0.12, abs(rd.y));\r
    \r
    // Subtle overall - geometric constellation effect\r
    return pattern * heightFade * horizonFade * 0.38;\r
}\r
\r
// ============================================\r
// SKY (Terminal Green Theme + Sierpinski Pattern)\r
// ============================================\r
vec3 gsky(vec3 rd, vec3 ld, bool mask) {\r
    float haze = exp2(-5.0 * (abs(rd.y) - 0.2 * dot(rd, ld)));\r
    \r
    // Sierpinski pattern - echoes the triangular terrain grid\r
    // Reduce haze attenuation so pattern stays visible\r
    float sierpPattern = mask ? sierpinskiSky(rd, jTime) * (1.0 - min(haze * 0.5, 0.8)) : 0.0;\r
    \r
    // Terminal green sky gradient (dark green to black)\r
    vec3 back = vec3(0.0, 0.10, 0.03) * (1.0 - 0.5 * exp2(-0.1 * abs(length(rd.xz) / rd.y)) * max(sign(rd.y), 0.0));\r
    \r
    // Green-tinted haze toward center\r
    vec3 hazeColor = vec3(0.0, 0.22, 0.07);\r
    \r
    // Sierpinski pattern as geometric "constellations"\r
    vec3 patternColor = vec3(0.1, 0.55, 0.22) * sierpPattern;\r
    \r
    vec3 col = clamp(mix(back, hazeColor, haze) + patternColor, 0.0, 1.0);\r
    \r
    // Black hole rendered as separate composited layer\r
    return col;  \r
}\r
\r
// ============================================\r
// MAIN\r
// ============================================\r
void main() {\r
    vec2 fragCoord = vUv * uResolution;\r
    vec4 fragColor = vec4(0);\r
    \r
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;\r
    \r
    const float shutter_speed = 0.25;\r
    float dt = fract(hash21(fragCoord) + uTime) * shutter_speed;\r
    jTime = mod(uTime - dt * 0.016, 4000.0);\r
    \r
    // Mouse interaction: camera control\r
    // Primarily left/right, minimal vertical\r
    vec2 mouse = uMouse * uMouseActive;\r
    float camYaw = mouse.x * 0.8;      // Strong left/right rotation\r
    float camPitch = mouse.y * 0.08;   // Very subtle up/down (mostly locked)\r
    \r
    // Higher camera for more dramatic view\r
    vec3 ro = vec3(0.0, 1.5, (-20000.0 + jTime * speed));\r
    \r
    // Base ray direction - tilted down slightly for better terrain view\r
    vec2 viewUV = uv;\r
    viewUV.y += 0.15;  // Offset to look slightly down at terrain\r
    vec3 rd = normalize(vec3(viewUV, 4.0 / 3.0));\r
    \r
    // Apply camera rotation from mouse\r
    // Yaw (rotate around Y axis)\r
    float cy = cos(camYaw), sy = sin(camYaw);\r
    rd.xz = mat2(cy, -sy, sy, cy) * rd.xz;\r
    \r
    // Pitch (rotate around X axis)\r
    float cp = cos(camPitch), sp = sin(camPitch);\r
    rd.yz = mat2(cp, -sp, sp, cp) * rd.yz;\r
    \r
    vec2 i = intersect(ro, rd);\r
    float d = i.x;\r
    \r
    // Sun fixed in center\r
    vec3 ld = normalize(vec3(0.0, 0.125 + 0.05 * sin(0.1 * jTime), 1.0));\r
\r
    // Terminal green fog\r
    vec3 fog = d > 0.0 ? exp2(-d * vec3(0.2, 0.08, 0.25)) : vec3(0.0);\r
    vec3 sky = gsky(rd, ld, d < 0.0);\r
    \r
    vec3 p = ro + d * rd;\r
    vec3 n = normalize(grad(p));\r
    \r
    float diff = dot(n, ld) + 0.1 * n.y;\r
    \r
    // Dark terminal green base\r
    vec3 col = vec3(0.0, 0.12, 0.05) * diff;\r
    \r
    vec3 rfd = reflect(rd, n); \r
    vec3 rfcol = gsky(rfd, ld, true);\r
    \r
    col = mix(col, rfcol, 0.05 + 0.95 * pow(max(1.0 + dot(rd, n), 0.0), 5.0));\r
    \r
    // Brighter, more dramatic grid lines with glow\r
    float gridGlow = smoothstep(0.08, 0.0, i.y);\r
    col = mix(col, vec3(0.0, 1.0, 0.3), gridGlow);\r
    col += vec3(0.0, 0.3, 0.1) * gridGlow * gridGlow; // Extra glow\r
    col = mix(sky, col, fog);\r
    \r
    // Slight scanline effect\r
    col *= 0.95 + 0.05 * sin(fragCoord.y * 2.0);\r
    \r
    // Vignette\r
    float vig = 1.0 - length(vUv - 0.5) * 0.5;\r
    col *= vig;\r
    \r
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);\r
    \r
    gl_FragColor = fragColor;\r
}\r
`,k=`attribute vec2 aPosition;\r
varying vec2 vUv;\r
\r
void main() {\r
    vUv = aPosition * 0.5 + 0.5;\r
    gl_Position = vec4(aPosition, 0.0, 1.0);\r
}\r
`,x=`/**\r
 * blackhole.frag - Genuary 2026 Day 31: GLSL Day\r
 * \r
 * A noob's attempt at Raytracing a Black Hole\r
 * ==============================================\r
 * \r
 * This shader simulates how light bends around a black hole due to \r
 * gravitational lensing. Don't worry - we're not solving Einstein's\r
 * field equations! But if you want some of that, check out the gr.js in the GCanvas engine. Anyway....\r
 * We use a simplified Newtonian approximation that\r
 * looks convincing enough for real-time graphics.\r
 * \r
 * WHAT I LEARNED:\r
 * 1. Basic raytracing concepts (shooting rays from camera into scene)\r
 * 2. How gravity bends light (gravitational lensing)\r
 * 3. Signed Distance Functions (SDFs) for simple shapes\r
 * 4. Procedural noise for textures without images\r
 * 5. Alpha compositing for layering effects\r
 * \r
 * The key insight: light doesn't travel in straight lines near \r
 * massive objects. We simulate this by slightly curving our rays\r
 * toward the black hole at each step.\r
 * \r
 * @author guinetik\r
 * @project Genuary 2026\r
 * @see https://genuary.art\r
 */\r
precision highp float;\r
\r
varying vec2 vUv;\r
\r
uniform float uTime;\r
uniform vec2 uResolution;\r
uniform vec2 uMouse;\r
uniform float uMouseActive;\r
uniform float uPulse;\r
uniform vec2 uBHPosition;  // Where to draw the black hole (0-1 coords)\r
uniform float uBHSize;     // How big it appears on screen\r
\r
const float PI = 3.1415927;\r
\r
// ============================================================\r
// PART 1: SIGNED DISTANCE FUNCTIONS (SDFs)\r
// ============================================================\r
// SDFs tell us "how far is this point from the surface?"\r
// Negative = inside, Positive = outside, Zero = on surface\r
// They're incredibly useful for raymarching and collision detection.\r
\r
/**\r
 * Distance from point p to a sphere centered at origin\r
 * This is the simplest SDF - just measure distance and subtract radius\r
 */\r
float sdfSphere(vec3 p, float radius) {\r
    return length(p) - radius;\r
}\r
\r
/**\r
 * Distance from point p to a torus (donut shape)\r
 * t.x = major radius (distance from center to tube center)\r
 * t.y = minor radius (thickness of the tube)\r
 * \r
 * We use this for the accretion disk - it's a flattened torus\r
 */\r
float sdfTorus(vec3 p, vec2 t) {\r
    // Project onto XZ plane, measure distance to ring\r
    vec2 q = vec2(length(p.xz) - t.x, p.y);\r
    return length(q) - t.y;\r
}\r
\r
// ============================================================\r
// PART 2: PROCEDURAL NOISE\r
// ============================================================\r
// Instead of loading texture images, we generate patterns mathematically.\r
// This is faster to load and infinitely scalable!\r
\r
/**\r
 * Simple hash function - turns 2D coordinates into pseudo-random numbers\r
 * The "magic numbers" are chosen to create good distribution\r
 */\r
float hash(vec2 p) {\r
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);\r
}\r
\r
/**\r
 * Fractal Brownian Motion (FBM) - layered noise for natural-looking textures\r
 * \r
 * We add multiple "octaves" of noise at different scales:\r
 * - Large scale noise for overall structure\r
 * - Smaller scales add fine detail\r
 * Each octave has half the amplitude (quieter) and double the frequency\r
 */\r
float fbmNoise(vec2 p) {\r
    float total = 0.0;\r
    float amplitude = 1.0;\r
    \r
    // 4 octaves is a good balance of detail vs performance\r
    for (int i = 0; i < 4; i++) {\r
        total += amplitude * hash(p);\r
        p *= 2.0;           // Double the frequency (smaller features)\r
        amplitude *= 0.5;   // Halve the amplitude (less influence)\r
    }\r
    \r
    return total;\r
}\r
\r
// ============================================================\r
// PART 3: MAIN RENDERING\r
// ============================================================\r
\r
void main() {\r
    // --- STEP 1: SET UP SCREEN COORDINATES ---\r
    // Convert pixel position to centered, aspect-corrected coordinates\r
    // Range: roughly -1 to 1, with (0,0) at center\r
    \r
    vec2 screenPos = vUv * 2.0 - 1.0;  // Convert 0-1 to -1 to 1\r
    screenPos.x *= uResolution.x / uResolution.y;  // Fix aspect ratio\r
    \r
    // Offset to position the black hole where we want it on screen\r
    vec2 bhOffset = (uBHPosition - 0.5) * 2.0;\r
    bhOffset.x *= uResolution.x / uResolution.y;\r
    screenPos -= bhOffset;\r
    \r
    // Scale to control apparent size\r
    screenPos *= 1.0 / (uBHSize * 15.0);\r
    \r
    // --- STEP 2: SET UP THE CAMERA ---\r
    // We position a virtual camera looking at the black hole\r
    // Using spherical coordinates for easy positioning\r
    \r
    float cameraDistance = 2.0;\r
    float cameraAngleH = PI * 0.5;   // Horizontal angle (fixed, looking straight)\r
    float cameraAngleV = PI * 0.48;  // Vertical angle (slightly above, for edge-on disk view)\r
    \r
    // Convert spherical to cartesian coordinates\r
    vec3 cameraPos = vec3(\r
        cameraDistance * cos(cameraAngleH) * sin(cameraAngleV),\r
        cameraDistance * cos(cameraAngleV),\r
        cameraDistance * sin(cameraAngleH) * sin(cameraAngleV)\r
    );\r
    \r
    // Build camera orientation vectors\r
    vec3 target = vec3(0.0);  // Looking at origin (where black hole is)\r
    vec3 forward = normalize(target - cameraPos);\r
    vec3 right = normalize(cross(vec3(0.0, 1.0, -0.1), forward));\r
    vec3 up = normalize(cross(forward, right));\r
    \r
    // Create the ray direction for this pixel\r
    // forward * 1.5 gives us a ~67° field of view\r
    vec3 rayDir = normalize(forward * 1.5 + right * screenPos.x + up * screenPos.y);\r
    \r
    // --- STEP 3: BLACK HOLE PARAMETERS ---\r
    // These control the physics simulation\r
    \r
    vec3 bhPosition = vec3(0.0);      // Black hole at origin\r
    float eventHorizonRadius = 0.1;   // Point of no return for light\r
    float gravityStrength = 0.005;    // How strongly light bends (simplified!)\r
    \r
    // --- STEP 4: RAYTRACE WITH GRAVITATIONAL LENSING ---\r
    // Here's where the magic happens!\r
    // \r
    // Normal raytracing: march in straight lines\r
    // Our raytracing: at each step, bend the ray toward the black hole\r
    //\r
    // This is a HUGE simplification of real physics, but it looks great!\r
    \r
    vec3 rayPos = cameraPos;\r
    vec3 rayVel = rayDir;  // Current direction (will be modified by gravity)\r
    float stepSize = 0.02;\r
    \r
    vec3 finalColor = vec3(0.0);\r
    float notCaptured = 1.0;  // 1.0 = ray is free, 0.0 = fell into black hole\r
    \r
    // Terminal green color palette for the accretion disk\r
    vec3 outerDiskColor = vec3(0.1, 0.5, 0.2);   // Darker green at edges\r
    vec3 innerDiskColor = vec3(0.4, 1.0, 0.6);   // Brighter green near center\r
    \r
    // March the ray through space\r
    // 200 iterations (t goes 0 to 1 in steps of 0.005)\r
    for (float t = 0.0; t < 1.0; t += 0.005) {\r
        \r
        // Move ray forward (but only if not captured)\r
        rayPos += rayVel * stepSize * notCaptured;\r
        \r
        // --- GRAVITY: Bend the ray toward the black hole ---\r
        // Vector pointing from ray to black hole\r
        vec3 toBH = bhPosition - rayPos;\r
        float distanceSquared = dot(toBH, toBH);\r
        \r
        // Acceleration = G * M / r² (Newton's gravity, simplified)\r
        // We add this to our velocity, bending the light path\r
        rayVel += normalize(toBH) * (gravityStrength / distanceSquared);\r
        \r
        // --- CHECK: Did we fall past the event horizon? ---\r
        float distToHorizon = sdfSphere(rayPos - bhPosition, eventHorizonRadius);\r
        notCaptured = smoothstep(0.0, 0.666, distToHorizon);\r
        \r
        // --- ACCRETION DISK: The glowing matter spiral ---\r
        // Real accretion disks are incredibly hot plasma orbiting the black hole\r
        // We fake this with a procedural texture mapped onto a thin torus\r
        \r
        // Calculate polar coordinates for disk texture\r
        float diskRadius = length(toBH.xz);  // Distance from BH in XZ plane\r
        float diskAngle = atan(toBH.x, toBH.z);  // Angle around BH\r
        \r
        // Create scrolling texture coordinates\r
        // The disk rotates slowly (uTime * 0.1)\r
        vec2 diskUV = vec2(\r
            diskRadius,\r
            diskAngle * (0.01 + (diskRadius - eventHorizonRadius) * 0.002) + uTime * 0.1\r
        );\r
        diskUV *= vec2(10.0, 20.0);  // Scale for good texture detail\r
        \r
        // Generate disk texture using our procedural noise\r
        float diskTexture = fbmNoise(diskUV * vec2(0.1, 0.5)) * 0.8 + 0.2;\r
        // Add some swirly pattern\r
        diskTexture += sin(diskUV.x * 3.0 + diskUV.y * 0.5 + uTime * 0.5) * 0.15;\r
        \r
        // Color based on distance from black hole (hotter = brighter near center)\r
        float distFromBH = length(toBH) - eventHorizonRadius;\r
        vec3 diskColor = mix(innerDiskColor, outerDiskColor, pow(distFromBH, 2.0));\r
        diskColor *= max(0.0, diskTexture);\r
        \r
        // Intensity falls off with distance (inverse relationship)\r
        diskColor *= 4.0 / (0.001 + distFromBH * 50.0);\r
        \r
        // --- DISK SHAPE: Use a flattened torus ---\r
        // We squash Y by 40x to make a very thin disk\r
        vec3 flattenedPos = rayPos * vec3(1.0, 40.0, 1.0);\r
        float diskMask = smoothstep(0.0, 1.0, -sdfTorus(flattenedPos - bhPosition, vec2(0.8, 0.99)));\r
        \r
        // Add disk contribution to final color\r
        finalColor += max(vec3(0.0), diskColor * diskMask * notCaptured);\r
        \r
        // --- GLOW: Subtle light around the black hole ---\r
        // Inverse square falloff creates a natural glow\r
        finalColor += vec3(0.3, 1.0, 0.5) * (1.0 / distanceSquared) * 0.002 * notCaptured;\r
    }\r
    \r
    // --- STEP 5: PULSE EFFECT ---\r
    // When posters spawn, we trigger a brief glow from the black hole\r
    if (uPulse > 0.01) {\r
        float pulseIntensity = uPulse * uPulse * 0.5;  // Squared for snappier falloff\r
        finalColor += vec3(0.2, 0.8, 0.4) * pulseIntensity;\r
    }\r
    \r
    // --- STEP 6: OUTPUT WITH ALPHA ---\r
    // We output alpha so this can be composited over other layers\r
    // Alpha is based on how much color we accumulated + whether we hit the event horizon\r
    float alpha = min(1.0, length(finalColor) * 2.0 + (1.0 - notCaptured));\r
    \r
    gl_FragColor = vec4(finalColor, alpha);\r
}\r
`;class P extends f{constructor(r){super(r),this.backgroundColor="#000"}init(){if(super.init(),this.webgl=new u(this.width,this.height),!this.webgl.isAvailable()){console.warn("WebGL not available"),this.useFallback=!0;return}this.webgl.useProgram("finale",b,w),this.webglBH=new u(this.width,this.height),this.webglBH.useProgram("blackhole",k,x),this.bhPosition=[.5,.55],this.bhSize=.04,this.time=0,this.completion=0,this.cameraZ=0,this.mouseX=0,this.mouseY=0,this.mouseActive=0,this.camera=new m({perspective:i.perspective,rotationX:0,rotationY:0}),this.posters=[],this.loadPosters(),this.spawnCooldown=.5,this.nextPosterIndex=0,this.nextSide=1,this.canvas.addEventListener("mousemove",r=>{const e=this.canvas.getBoundingClientRect();this.mouseX=(r.clientX-e.left)/e.width*2-1,this.mouseY=(r.clientY-e.top)/e.height*2-1,this.mouseActive=1}),this.canvas.addEventListener("mouseleave",()=>{this.mouseActive=0}),this.canvas.addEventListener("touchmove",r=>{r.preventDefault();const e=this.canvas.getBoundingClientRect(),n=r.touches[0];this.mouseX=(n.clientX-e.left)/e.width*2-1,this.mouseY=(n.clientY-e.top)/e.height*2-1,this.mouseActive=1}),this.canvas.addEventListener("touchend",()=>{this.mouseActive=0}),this.paintingTexture=null,this.pulse=0,this.pulseDecay=2.5,this.flocks=[],this.nextFlockTime=3+Math.random()*5,this.runner=new g(this),this._loadRunner(),this.matrixRain=new y,this.matrixRain.init(this.width,this.height)}async _loadRunner(){await this.runner.load()}spawnFlock(){const r=this.width,e=this.height,n=i.birdFlockSize.min+Math.floor(Math.random()*(i.birdFlockSize.max-i.birdFlockSize.min+1)),l=Math.floor(Math.random()*4);let s,o,t,c;const a=e*.1,h=e*.45;switch(l){case 0:s=-50,o=a+Math.random()*(h-a),t=r+50,c=a+Math.random()*(h-a);break;case 1:s=r+50,o=a+Math.random()*(h-a),t=-50,c=a+Math.random()*(h-a);break;case 2:s=-50,o=a,t=r+50,c=h;break;default:s=r+50,o=a,t=-50,c=h}this.flocks.push(new p(s,o,t,c,n))}triggerPulse(){this.pulse=1}loadPosters(){for(let r=1;r<=i.posterCount;r++){const e=new Image,n=String(r).padStart(3,"0")+".jpg";e.src=`./${n}`;const l=new v(e,r-1);e.onload=()=>{l.loaded=!0},this.posters.push(l)}}update(r){super.update(r),this.time+=r,this.completion=Math.min(1,this.time/5),this.cameraZ+=i.posterSpeed*r;for(const n of this.posters)n.update(this.cameraZ);const e=this.posters.filter(n=>n.active).length;this.spawnCooldown-=r,this.spawnCooldown<=0&&e<i.maxVisible&&(this.spawnNextPoster(),this.spawnCooldown=i.spawnDelay),this.mouseActive>0?(this.camera.rotationY=this.mouseX*.2,this.camera.rotationX=this.mouseY*.08):(this.camera.rotationY*=.95,this.camera.rotationX*=.95),this.pulse>0&&(this.pulse=Math.max(0,this.pulse-this.pulseDecay*r));for(const n of this.flocks)n.update(r,this.width,this.height);this.flocks=this.flocks.filter(n=>n.active),this.nextFlockTime-=r,this.nextFlockTime<=0&&(this.spawnFlock(),this.nextFlockTime=i.birdFlockInterval.min+Math.random()*(i.birdFlockInterval.max-i.birdFlockInterval.min)),this.runner&&this.runner.update(r),this.matrixRain&&this.matrixRain.update(r)}spawnNextPoster(){let r=null;for(let e=0;e<this.posters.length;e++){const n=(this.nextPosterIndex+e)%this.posters.length;if(!this.posters[n].active&&this.posters[n].loaded){r=this.posters[n],this.nextPosterIndex=(n+1)%this.posters.length;break}}r&&(r.spawn(this.cameraZ,this.nextSide),this.nextSide*=-1,this.triggerPulse())}render(){const r=this.ctx,e=this.width,n=this.height;if(this.useFallback){r.fillStyle="#000",r.fillRect(0,0,e,n);return}this.webgl.setUniforms({uTime:this.time,uResolution:[e,n],uMouse:[this.mouseX,this.mouseY],uMouseActive:this.mouseActive,uCompletion:this.completion,uHasTexture:this.paintingTexture?1:0,uPulse:this.pulse}),this.webgl.clear(0,0,0,1),this.webgl.render(),r.drawImage(this.webgl.getCanvas(),0,0,e,n);const l=this.bhPosition[0]-this.mouseX*this.mouseActive*.35,s=this.bhPosition[1]-this.mouseY*this.mouseActive*.03;this.webglBH.setUniforms({uTime:this.time,uResolution:[e,n],uMouse:[this.mouseX,this.mouseY],uMouseActive:this.mouseActive,uPulse:this.pulse,uBHPosition:[l,s],uBHSize:this.bhSize}),this.webglBH.clear(0,0,0,0),this.webglBH.render(),r.drawImage(this.webglBH.getCanvas(),0,0,e,n);for(const o of this.flocks)o.render(r);this.runner&&this.runner.render(r,e,n),this.renderPosters(r,e,n),this.matrixRain&&this.matrixRain.render(r,e,n)}renderPosters(r,e,n){const l=e/2,s=n/2,o=this.posters.filter(t=>t.active);o.sort((t,c)=>c.z-t.z);for(const t of o)t.render(r,this.cameraZ,l,s,n)}onResize(){this.webgl&&this.webgl.isAvailable()&&this.webgl.resize(this.width,this.height),this.webglBH&&this.webglBH.isAvailable()&&this.webglBH.resize(this.width,this.height)}stop(){this.webgl&&this.webgl.destroy(),this.webglBH&&this.webglBH.destroy(),super.stop()}}function z(d){const r=new P(d);return r.start(),{stop:()=>r.stop(),game:r}}export{z as default};
