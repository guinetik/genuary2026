/**
 * finale.frag - Genuary 2026 Day 31: GLSL Day
 * 
 * Synthwave terrain with Sierpinski fractal sky
 * 
 * Features:
 * - Raymarched triangular grid terrain with dramatic peaks
 * - Terminal green color palette
 * - Sierpinski triangle pattern projected onto the sky dome
 * - Mouse-controlled camera rotation (yaw/pitch)
 * - Scanline and vignette post-processing
 * 
 * Based on "another synthwave sunset thing" by stduhpf
 * Original: https://www.shadertoy.com/view/tsScRK
 * 
 * Adapted for @guinetik/gcanvas WebGL pipeline
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
uniform float uCompletion;
uniform float uPulse;      // 0-1 pulse intensity for spawn effect

#define speed 10.0

float jTime;

// ============================================
// UTILITY FUNCTIONS
// ============================================
float amp(vec2 p) {
    return smoothstep(1.0, 8.0, abs(p.x));   
}

float pow512(float a) {
    a *= a; // ^2
    a *= a; // ^4
    a *= a; // ^8
    a *= a; // ^16
    a *= a; // ^32
    a *= a; // ^64
    a *= a; // ^128
    a *= a; // ^256
    return a * a;
}

float pow1d5(float a) {
    return a * sqrt(a);
}

float hash21(vec2 co) {
    return fract(sin(dot(co.xy, vec2(1.9898, 7.233))) * 45758.5433);
}

float hash(vec2 uv) {
    float a = amp(uv);
    if (a <= 0.0) return 0.0;
    
    // Base noise
    float h = hash21(uv);
    
    // Add extra variation layers
    float h2 = hash21(uv * 0.5 + vec2(17.3, 31.7));
    float h3 = hash21(uv * 0.25 + vec2(53.1, 97.2));
    
    // Combine for more interesting terrain
    float combined = h * 0.5 + h2 * 0.3 + h3 * 0.2;
    
    // Add some sharper peaks
    combined = pow(combined, 0.8);
    
    return a * pow1d5(combined) * 1.2;
}

float edgeMin(float dx, vec2 da, vec2 db, vec2 uv) {
    uv.x += 5.0;
    vec3 c = fract((floor(vec3(uv, uv.x + uv.y) + 0.5)) * (vec3(0, 1, 2) + 0.61803398875));
    float a1 = 1.0;
    float a2 = 1.0;
    float a3 = 1.0;
    return min(min((1.0 - dx) * db.y * a3, da.x * a2), da.y * a1);
}

vec2 trinoise(vec2 uv) {
    const float sq = sqrt(3.0 / 2.0);
    uv.x *= sq;
    uv.y -= 0.5 * uv.x;
    vec2 d = fract(uv);
    uv -= d;

    bool c = dot(d, vec2(1)) > 1.0;

    vec2 dd = 1.0 - d;
    vec2 da = c ? dd : d;
    vec2 db = c ? d : dd;
    
    float nn = hash(uv + float(c));
    float n2 = hash(uv + vec2(1, 0));
    float n3 = hash(uv + vec2(0, 1));

    float nmid = mix(n2, n3, d.y);
    float ns = mix(nn, c ? n2 : n3, da.y);
    float dx = da.x / db.y;
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv + d));
}

// ============================================
// RAYMARCHING
// ============================================
vec2 map(vec3 p) {
    vec2 n = trinoise(p.xz);
    // More dramatic terrain height
    return vec2(p.y - 3.0 * n.x, n.y);
}

vec3 grad(vec3 p) {
    const vec2 e = vec2(0.005, 0);
    float a = map(p).x;
    return vec3(
        map(p + e.xyy).x - a,
        map(p + e.yxy).x - a,
        map(p + e.yyx).x - a
    ) / e.x;
}

vec2 intersect(vec3 ro, vec3 rd) {
    float d = 0.0, h = 0.0;
    for (int i = 0; i < 500; i++) {
        vec3 p = ro + d * rd;
        vec2 s = map(p);
        h = s.x;
        d += h * 0.5;
        if (abs(h) < 0.003 * d)
            return vec2(d, s.y);
        if (d > 150.0 || p.y > 4.0) break;
    }
    return vec2(-1);
}

// ============================================
// SIERPINSKI SKY PATTERN (GLSL ES compatible)
// ============================================

// Sierpinski triangle check: pixel is filled if (x AND y) == 0
// Emulated without bitwise ops using recursive modulo
float sierpinski(vec2 p, float iterations) {
    float filled = 1.0;
    
    // Check each "bit" level - if both coords have a 1 in same position, it's empty
    for (float i = 0.0; i < 8.0; i++) {
        if (i >= iterations) break;
        
        float scale = pow(2.0, i);
        float mx = mod(floor(p.x / scale), 2.0);
        float my = mod(floor(p.y / scale), 2.0);
        
        // AND operation: if both are 1, this "bit" is set -> hole in Sierpinski
        if (mx > 0.5 && my > 0.5) {
            filled = 0.0;
            break;
        }
    }
    
    return filled;
}

// Multi-scale Sierpinski with animation
float sierpinskiSky(vec3 rd, float time) {
    // Project ray direction to 2D - creates dome effect
    vec2 skyUV = rd.xz / (abs(rd.y) + 0.3);
    
    // Slow drift animation
    vec2 drift = vec2(time * 2.0, time * 1.5);
    
    // Layer 1: Large scale Sierpinski
    vec2 p1 = skyUV * 60.0 + drift;
    float s1 = sierpinski(p1, 6.0);
    
    // Layer 2: Medium scale, offset
    vec2 p2 = skyUV * 120.0 - drift * 0.7;
    float s2 = sierpinski(p2, 5.0);
    
    // Layer 3: Small scale, different drift
    vec2 p3 = skyUV * 200.0 + vec2(drift.y, -drift.x) * 0.5;
    float s3 = sierpinski(p3, 4.0);
    
    // Combine layers with depth-like blending
    // Larger patterns more prominent, smaller ones subtle
    float pattern = s1 * 0.5 + s2 * 0.3 + s3 * 0.2;
    
    // Height-based fade (stronger toward zenith, fades at horizon)
    float heightFade = smoothstep(0.05, 0.5, rd.y);
    
    // Fade near horizon to not compete with terrain
    float horizonFade = smoothstep(0.0, 0.12, abs(rd.y));
    
    // Subtle overall - geometric constellation effect
    return pattern * heightFade * horizonFade * 0.38;
}

// ============================================
// SKY (Terminal Green Theme + Sierpinski Pattern)
// ============================================
vec3 gsky(vec3 rd, vec3 ld, bool mask) {
    float haze = exp2(-5.0 * (abs(rd.y) - 0.2 * dot(rd, ld)));
    
    // Sierpinski pattern - echoes the triangular terrain grid
    // Reduce haze attenuation so pattern stays visible
    float sierpPattern = mask ? sierpinskiSky(rd, jTime) * (1.0 - min(haze * 0.5, 0.8)) : 0.0;
    
    // Terminal green sky gradient (dark green to black)
    vec3 back = vec3(0.0, 0.10, 0.03) * (1.0 - 0.5 * exp2(-0.1 * abs(length(rd.xz) / rd.y)) * max(sign(rd.y), 0.0));
    
    // Green-tinted haze toward center
    vec3 hazeColor = vec3(0.0, 0.22, 0.07);
    
    // Sierpinski pattern as geometric "constellations"
    vec3 patternColor = vec3(0.1, 0.55, 0.22) * sierpPattern;
    
    vec3 col = clamp(mix(back, hazeColor, haze) + patternColor, 0.0, 1.0);
    
    // Black hole rendered as separate composited layer
    return col;  
}

// ============================================
// MAIN
// ============================================
void main() {
    vec2 fragCoord = vUv * uResolution;
    vec4 fragColor = vec4(0);
    
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;
    
    const float shutter_speed = 0.25;
    float dt = fract(hash21(fragCoord) + uTime) * shutter_speed;
    jTime = mod(uTime - dt * 0.016, 4000.0);
    
    // Mouse interaction: camera control
    // Primarily left/right, minimal vertical
    vec2 mouse = uMouse * uMouseActive;
    float camYaw = mouse.x * 0.8;      // Strong left/right rotation
    float camPitch = mouse.y * 0.08;   // Very subtle up/down (mostly locked)
    
    // Higher camera for more dramatic view
    vec3 ro = vec3(0.0, 1.5, (-20000.0 + jTime * speed));
    
    // Base ray direction - tilted down slightly for better terrain view
    vec2 viewUV = uv;
    viewUV.y += 0.15;  // Offset to look slightly down at terrain
    vec3 rd = normalize(vec3(viewUV, 4.0 / 3.0));
    
    // Apply camera rotation from mouse
    // Yaw (rotate around Y axis)
    float cy = cos(camYaw), sy = sin(camYaw);
    rd.xz = mat2(cy, -sy, sy, cy) * rd.xz;
    
    // Pitch (rotate around X axis)
    float cp = cos(camPitch), sp = sin(camPitch);
    rd.yz = mat2(cp, -sp, sp, cp) * rd.yz;
    
    vec2 i = intersect(ro, rd);
    float d = i.x;
    
    // Sun fixed in center
    vec3 ld = normalize(vec3(0.0, 0.125 + 0.05 * sin(0.1 * jTime), 1.0));

    // Terminal green fog
    vec3 fog = d > 0.0 ? exp2(-d * vec3(0.2, 0.08, 0.25)) : vec3(0.0);
    vec3 sky = gsky(rd, ld, d < 0.0);
    
    vec3 p = ro + d * rd;
    vec3 n = normalize(grad(p));
    
    float diff = dot(n, ld) + 0.1 * n.y;
    
    // Dark terminal green base
    vec3 col = vec3(0.0, 0.12, 0.05) * diff;
    
    vec3 rfd = reflect(rd, n); 
    vec3 rfcol = gsky(rfd, ld, true);
    
    col = mix(col, rfcol, 0.05 + 0.95 * pow(max(1.0 + dot(rd, n), 0.0), 5.0));
    
    // Brighter, more dramatic grid lines with glow
    float gridGlow = smoothstep(0.08, 0.0, i.y);
    col = mix(col, vec3(0.0, 1.0, 0.3), gridGlow);
    col += vec3(0.0, 0.3, 0.1) * gridGlow * gridGlow; // Extra glow
    col = mix(sky, col, fog);
    
    // Slight scanline effect
    col *= 0.95 + 0.05 * sin(fragCoord.y * 2.0);
    
    // Vignette
    float vig = 1.0 - length(vUv - 0.5) * 0.5;
    col *= vig;
    
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    
    gl_FragColor = fragColor;
}
