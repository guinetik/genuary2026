precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uCompletion;  // 0-1, how complete the journey is (could animate from 0 to 1)

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// Rotate 2D
vec2 rotate(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    
    // Centered coordinates
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= aspect;
    
    float t = uTime * 0.3;
    
    // Mouse influence
    vec2 mouse = uMouse * vec2(aspect, 1.0);
    float mouseDist = length(p - mouse);
    float mouseInf = smoothstep(1.2, 0.0, mouseDist) * uMouseActive;
    
    // Celebration effect - pulsing rings that expand outward
    float celebration = sin(t * 2.0 + uCompletion * 10.0) * 0.5 + 0.5;
    float centerDist = length(p);
    float ring1 = sin(centerDist * 8.0 - t * 4.0) * 0.5 + 0.5;
    float ring2 = sin(centerDist * 12.0 - t * 6.0 + 1.0) * 0.5 + 0.5;
    float rings = (ring1 + ring2) * 0.5;
    rings *= smoothstep(0.8, 0.0, centerDist) * smoothstep(0.0, 0.3, centerDist);
    
    // Domain warping with celebration boost
    vec2 pp = p;
    pp -= mouse * mouseInf * 0.4;
    
    // Rotating domain warp for dynamic feel
    pp = rotate(pp, t * 0.1);
    
    // Layer 1
    vec2 q = vec2(
        fbm(pp * 2.0 + t * 0.3),
        fbm(pp * 2.0 + vec2(5.2, 1.3) + t * 0.35)
    );
    
    // Layer 2
    vec2 r = vec2(
        fbm(pp + q * 2.5 + vec2(1.7, 9.2) + t * 0.4),
        fbm(pp + q * 2.5 + vec2(8.3, 2.8) + t * 0.38)
    );
    
    // Celebration energy boost
    float celebrationBoost = celebration * uCompletion;
    r += celebrationBoost * vec2(
        sin(t * 3.0 + centerDist * 5.0),
        cos(t * 3.0 + centerDist * 5.0)
    ) * 0.3;
    
    // Mouse energy
    float mouseEnergy = mouseInf * 2.5;
    r += mouseEnergy * vec2(
        sin(t * 6.0 + mouseDist * 10.0),
        cos(t * 6.0 + mouseDist * 10.0)
    ) * 0.4;
    
    // Final pattern
    float f = fbm(pp + q + r * 1.2);
    float f2 = fbm(pp * 1.5 + r * 1.8 + t * 0.25);
    
    // === CELEBRATION COLORS ===
    // Terminal green base with celebration colors
    vec3 col1 = vec3(0.0, 0.0, 0.0);        // Black
    vec3 col2 = vec3(0.0, 0.4, 0.0);       // Dark green
    vec3 col3 = vec3(0.0, 1.0, 0.0);       // Bright green (terminal)
    vec3 col4 = vec3(1.0, 0.5, 0.0);       // Orange (celebration)
    vec3 col5 = vec3(1.0, 0.0, 0.5);       // Pink (celebration)
    vec3 col6 = vec3(0.5, 0.0, 1.0);       // Purple (celebration)
    
    // Color mixing - green base with celebration colors
    vec3 color = col1;
    color = mix(color, col2, smoothstep(0.15, 0.4, f));
    color = mix(color, col3, smoothstep(0.3, 0.6, f) * (0.7 + celebrationBoost * 0.3));
    color = mix(color, col4, smoothstep(0.5, 0.8, q.x) * celebration * 0.6);
    color = mix(color, col5, smoothstep(0.4, 0.7, r.y) * celebration * 0.5);
    color = mix(color, col6, smoothstep(0.6, 0.9, f2) * celebration * 0.4);
    
    // Bright celebration streaks
    float streak = smoothstep(0.6, 0.65, f) * smoothstep(0.7, 0.65, f);
    color += vec3(0.0, 1.0, 0.5) * streak * 2.0 * celebration;
    
    // Celebration rings
    color += vec3(0.0, 1.0, 0.0) * rings * 0.8 * celebration;
    
    // Mouse glow - green terminal style
    vec3 glowCol = vec3(0.0, 1.0, 0.0);
    color += glowCol * mouseInf * 1.2;
    
    // Mouse ripple rings
    float ripple = sin(mouseDist * 20.0 - t * 10.0) * 0.5 + 0.5;
    ripple *= mouseInf * smoothstep(0.0, 1.0, mouseDist);
    color += vec3(0.0, 0.8, 0.4) * ripple * 0.5;
    
    // Overall brightness - brighter when complete
    color *= 1.0 + celebrationBoost * 0.5;
    
    // Vignette
    float vig = 1.0 - length(uv - 0.5) * 0.4;
    color *= vig;
    
    // Clamp
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
}
