precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec2 uDragOffset;  // Offset from click point to blob center
uniform float uDragging;  // 0 = none, 1 = blob1, 2 = blob2
uniform vec2 uDropPos1;
uniform vec2 uDropPos2;
uniform float uIOR;
uniform float uBlurStrength;
uniform float uRadius;
uniform float uSuperellipseN;
uniform float uBlendRadius;

// Interaction uniforms (per blob)
uniform float uHover1;      // 0-1 hover intensity for blob 1
uniform float uHover2;      // 0-1 hover intensity for blob 2
uniform float uDrag1;       // 0-1 drag intensity for blob 1
uniform float uDrag2;       // 0-1 drag intensity for blob 2
uniform float uRipple1;     // Ripple animation time for blob 1
uniform float uRipple2;     // Ripple animation time for blob 2
uniform float uWobble1;     // Wobble animation time for blob 1
uniform float uWobble2;     // Wobble animation time for blob 2

// Interaction config
uniform float uHoverScale;
uniform float uDragScale;
uniform float uDragSoften;
uniform float uRippleSpeed;
uniform float uRippleDecay;
uniform float uRippleStrength;
uniform float uWobbleFreq;
uniform float uWobbleDecay;

// =============================================================================
// IQ's Superellipse SDF
// =============================================================================

vec3 sdSuperellipse(vec2 p, float r, float n) {
    p = p / r;
    vec2 gs = sign(p);
    vec2 ps = abs(p);
    float gm = pow(ps.x, n) + pow(ps.y, n);
    float gd = pow(gm, 1.0 / n) - 1.0;
    vec2 g = gs * pow(ps, vec2(n - 1.0)) * pow(gm, 1.0 / n - 1.0);
    p = abs(p); 
    if (p.y > p.x) p = p.yx;
    n = 2.0 / n;
    float d = 1e20;
    const int num = 12;
    vec2 oq = vec2(1.0, 0.0);
    for (int i = 1; i < num; i++) {
        float h = float(i) / float(num - 1);
        vec2 q = vec2(pow(cos(h * 3.1415927 / 4.0), n),
                      pow(sin(h * 3.1415927 / 4.0), n));
        vec2 pa = p - oq;
        vec2 ba = q - oq;
        vec2 z = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float d2 = dot(z, z);
        if (d2 < d) {
            d = d2;
        }
        oq = q;
    }
    return vec3(sqrt(d) * sign(gd) * r, g);
}

// =============================================================================
// Smooth minimum for blending SDFs
// =============================================================================

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// =============================================================================
// Fresnel reflectance calculation (physically accurate)
// =============================================================================

float fresnel(vec3 I, vec3 N, float ior) {
    float cosi = clamp(dot(I, N), -1.0, 1.0);
    float etai = 1.0, etat = ior;
    if (cosi > 0.0) {
        float temp = etai;
        etai = etat;
        etat = temp;
    }
    float sint = etai / etat * sqrt(max(0.0, 1.0 - cosi * cosi));
    if (sint >= 1.0) {
        return 1.0; // Total internal reflection
    }
    float cost = sqrt(max(0.0, 1.0 - sint * sint));
    cosi = abs(cosi);
    float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
    float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
    return (Rs * Rs + Rp * Rp) / 2.0;
}

// =============================================================================
// Background pattern (checker + gradient)
// =============================================================================

float checker(vec2 uv, float scale) {
    vec2 c = floor(uv * scale);
    return mod(c.x + c.y, 2.0);
}

// =============================================================================
// Simple geometric background pattern
// =============================================================================

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

vec3 sampleBackground(vec2 uv) {
    float time = uTime * 0.3;
    
    // Dark gradient base
    vec3 col1 = vec3(0.02, 0.02, 0.05);
    vec3 col2 = vec3(0.05, 0.02, 0.08);
    float t = length(uv) * 0.5;
    vec3 gradient = mix(col1, col2, t);
    
    // Grid of circles - creates nice magnification demo
    float gridSize = 0.15;
    vec2 gridUV = mod(uv + gridSize * 0.5, gridSize) - gridSize * 0.5;
    vec2 gridID = floor((uv + gridSize * 0.5) / gridSize);
    
    // Alternating colored circles
    float circleR = 0.04;
    float circle = sdCircle(gridUV, circleR);
    
    // Color based on grid position
    float hue = mod(gridID.x * 0.1 + gridID.y * 0.15 + time * 0.1, 1.0);
    vec3 circleColor = vec3(
        0.5 + 0.5 * sin(hue * 6.28),
        0.5 + 0.5 * sin(hue * 6.28 + 2.09),
        0.5 + 0.5 * sin(hue * 6.28 + 4.18)
    ) * 0.7;
    
    float circleMask = smoothstep(0.005, -0.005, circle);
    gradient = mix(gradient, circleColor, circleMask);
    
    // Thin grid lines
    float lineW = 0.003;
    float gridLineX = smoothstep(lineW, 0.0, abs(gridUV.x));
    float gridLineY = smoothstep(lineW, 0.0, abs(gridUV.y));
    gradient += vec3(0.08) * max(gridLineX, gridLineY);
    
    // Central "26" text area - simple boxes
    vec2 p = uv;
    
    // Number 2
    float two = 1e10;
    two = min(two, sdBox(p - vec2(-0.18, 0.06), vec2(0.08, 0.015)));  // top
    two = min(two, sdBox(p - vec2(-0.13, 0.03), vec2(0.015, 0.045))); // right top
    two = min(two, sdBox(p - vec2(-0.18, 0.0), vec2(0.08, 0.015)));   // middle
    two = min(two, sdBox(p - vec2(-0.23, -0.03), vec2(0.015, 0.045)));// left bottom
    two = min(two, sdBox(p - vec2(-0.18, -0.06), vec2(0.08, 0.015))); // bottom
    
    // Number 6
    float six = 1e10;
    six = min(six, sdBox(p - vec2(0.18, 0.06), vec2(0.08, 0.015)));   // top
    six = min(six, sdBox(p - vec2(0.13, 0.03), vec2(0.015, 0.045)));  // left top
    six = min(six, sdBox(p - vec2(0.18, 0.0), vec2(0.08, 0.015)));    // middle
    six = min(six, sdBox(p - vec2(0.13, -0.03), vec2(0.015, 0.045))); // left bottom
    six = min(six, sdBox(p - vec2(0.23, -0.03), vec2(0.015, 0.045))); // right bottom
    six = min(six, sdBox(p - vec2(0.18, -0.06), vec2(0.08, 0.015)));  // bottom
    
    float numbers = min(two, six);
    float numMask = smoothstep(0.003, -0.003, numbers);
    gradient = mix(gradient, vec3(0.95), numMask);
    
    return gradient;
}

// =============================================================================
// Gaussian blur
// =============================================================================

const int samples = 16;
const float sigma = float(samples) * 0.25;

float gaussian(vec2 i) {
    return exp(-0.5 * dot(i / sigma, i / sigma)) / (6.28 * sigma * sigma);
}

vec3 efficientBlur(vec2 uv, float blurStrength) {
    vec3 O = vec3(0.0);
    float totalWeight = 0.0;
    int s = samples / 2;
    
    for (int i = 0; i < 64; i++) {
        if (i >= s * s) break;
        vec2 d = vec2(mod(float(i), float(s)), floor(float(i) / float(s))) * 2.0 - float(s) / 2.0;
        vec2 offset = d * blurStrength * 0.002;
        float weight = gaussian(d);
        
        vec3 sampleColor = sampleBackground(uv + offset);
        O += sampleColor * weight;
        totalWeight += weight;
    }
    
    return O / totalWeight;
}

// =============================================================================
// Main
// =============================================================================

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;
    
    // Mouse position adjusted by drag offset (so blob doesn't jump to cursor)
    vec2 dragOffset = uDragOffset;
    dragOffset.x *= aspect;
    vec2 mouse = uMouse;
    mouse.x *= aspect;
    vec2 adjustedMouse = mouse - dragOffset;
    
    // Both blobs are draggable
    // Apply aspect ratio to drop positions to match mouse coordinate space
    vec2 dropPos1 = uDropPos1;
    dropPos1.x *= aspect;
    vec2 dropPos2 = uDropPos2;
    dropPos2.x *= aspect;
    
    // pos1: follows adjusted mouse if dragging blob 1, otherwise stays at drop position
    vec2 pos1 = (uDragging > 0.5 && uDragging < 1.5) ? adjustedMouse : dropPos1;
    
    // pos2: follows adjusted mouse if dragging blob 2, otherwise stays at drop position
    vec2 pos2 = (uDragging > 1.5) ? adjustedMouse : dropPos2;
    
    // =============================================================================
    // INTERACTION EFFECTS - Scale, soften, ripple, wobble per blob
    // =============================================================================
    
    // Effective radius per blob (grows on hover/drag)
    float radius1 = uRadius * (1.0 + uHover1 * uHoverScale + uDrag1 * uDragScale);
    float radius2 = uRadius * (1.0 + uHover2 * uHoverScale + uDrag2 * uDragScale);
    
    // Effective superellipse N (softens during drag - more organic/gooey)
    float n1 = mix(uSuperellipseN, uSuperellipseN * uDragSoften, uDrag1);
    float n2 = mix(uSuperellipseN, uSuperellipseN * uDragSoften, uDrag2);
    
    // Calculate base distances to both superellipses
    vec3 dg1 = sdSuperellipse(uv - pos1, radius1, n1);
    vec3 dg2 = sdSuperellipse(uv - pos2, radius2, n2);
    float d1 = dg1.x;
    float d2 = dg2.x;
    
    // NOTE: Ripple effect is applied INSIDE the glass as a visual distortion,
    // not here at the SDF level. The glass edge stays perfectly static.
    // See the "INSIDE THE GLASS" section below for ripple implementation.
    
    // =============================================================================
    // WOBBLE EFFECT - Jiggly surface during drag
    // =============================================================================
    
    // Wobble for blob 1 (active during drag, decays on release)
    if (uDrag1 > 0.0 || uWobble1 > 0.0) {
        vec2 offset1 = uv - pos1;
        float angle1 = atan(offset1.y, offset1.x);
        float wobbleAmount1 = uDrag1 * 0.5 + exp(-uWobble1 * uWobbleDecay) * 0.3;
        float wobble1 = sin(angle1 * 4.0 + uTime * uWobbleFreq) * wobbleAmount1 * 0.015;
        wobble1 += sin(angle1 * 7.0 - uTime * uWobbleFreq * 1.3) * wobbleAmount1 * 0.008;
        d1 += wobble1;
    }
    
    // Wobble for blob 2
    if (uDrag2 > 0.0 || uWobble2 > 0.0) {
        vec2 offset2 = uv - pos2;
        float angle2 = atan(offset2.y, offset2.x);
        float wobbleAmount2 = uDrag2 * 0.5 + exp(-uWobble2 * uWobbleDecay) * 0.3;
        float wobble2 = sin(angle2 * 4.0 + uTime * uWobbleFreq) * wobbleAmount2 * 0.015;
        wobble2 += sin(angle2 * 7.0 - uTime * uWobbleFreq * 1.3) * wobbleAmount2 * 0.008;
        d2 += wobble2;
    }
    
    // Blend the two SDFs together
    float d = smin(d1, d2, uBlendRadius);
    
    // === DROP SHADOW ===
    vec2 shadowOffset = vec2(0.0, -0.02);
    float shadowBlur = 0.06;
    
    float shadow1 = sdSuperellipse(uv - pos1 - shadowOffset, uRadius, uSuperellipseN).x;
    float shadow2 = sdSuperellipse(uv - pos2 - shadowOffset, uRadius, uSuperellipseN).x;
    float shadowSDF = smin(shadow1, shadow2, uBlendRadius);
    
    float shadowMask = 1.0 - smoothstep(0.0, shadowBlur, shadowSDF);
    shadowMask *= 0.15;
    
    // Base background
    vec3 baseColor = sampleBackground(uv);
    
    // Apply shadow
    baseColor = mix(baseColor, vec3(0.0), shadowMask);
    
    vec3 finalColor = baseColor;
    
    // === INSIDE THE GLASS ===
    if (d < 0.0) {
        // Blend weights for smooth center interpolation
        float w1 = exp(-d1 * d1 * 8.0);
        float w2 = exp(-d2 * d2 * 8.0);
        float totalWeight = w1 + w2 + 1e-6;
        
        // Blended center position
        vec2 center = (pos1 * w1 + pos2 * w2) / totalWeight;
        
        // Offset from center
        vec2 offset = uv - center;
        float distFromCenter = length(offset);
        
        // Depth in shape
        float depthInShape = abs(d);
        float normalizedDepth = clamp(depthInShape / (uRadius * 0.8), 0.0, 1.0);
        
        // Exponential distortion for lens effect
        float edgeFactor = 1.0 - normalizedDepth;
        float exponentialDistortion = exp(edgeFactor * 3.0) - 1.0;
        
        // Lens distortion
        float baseMagnification = 0.75;
        float lensStrength = 0.4;
        float distortionAmount = exponentialDistortion * lensStrength;
        
        // =================================================================
        // WATER RIPPLE EFFECT - Concentric waves inside the glass
        // Distorts the view through the glass, but edge stays static
        // =================================================================
        
        vec2 rippleOffset = vec2(0.0);
        
        // Ripple for blob 1
        if (uRipple1 > 0.0) {
            float dist1 = length(uv - pos1);
            float rippleWave1 = uRipple1 * uRippleSpeed;
            float rippleFade1 = exp(-uRipple1 * uRippleDecay);
            
            // Fade ripples only at very edge (ripples fill most of the blob)
            float edgeMask1 = smoothstep(radius1 * 0.95, radius1 * 0.5, dist1);
            
            // Concentric wave pattern - tighter rings
            float phase1 = dist1 * 35.0 - rippleWave1;
            float wave1 = sin(phase1) * 0.6 + sin(phase1 * 1.8 + 0.3) * 0.4;
            
            // Direction from center (for displacement)
            vec2 dir1 = normalize(uv - pos1 + vec2(0.001));
            
            rippleOffset += dir1 * wave1 * rippleFade1 * edgeMask1 * uRippleStrength;
        }
        
        // Ripple for blob 2
        if (uRipple2 > 0.0) {
            float dist2 = length(uv - pos2);
            float rippleWave2 = uRipple2 * uRippleSpeed;
            float rippleFade2 = exp(-uRipple2 * uRippleDecay);
            
            // Fade ripples only at very edge
            float edgeMask2 = smoothstep(radius2 * 0.95, radius2 * 0.5, dist2);
            
            // Concentric wave pattern - tighter rings
            float phase2 = dist2 * 35.0 - rippleWave2;
            float wave2 = sin(phase2) * 0.6 + sin(phase2 * 1.8 + 0.3) * 0.4;
            
            vec2 dir2 = normalize(uv - pos2 + vec2(0.001));
            
            rippleOffset += dir2 * wave2 * rippleFade2 * edgeMask2 * uRippleStrength;
        }
        
        // Apply ripple to the offset used for refraction
        vec2 rippleAdjustedOffset = offset + rippleOffset;
        
        // Chromatic aberration - different distortion per channel
        // Boost aberration when either blob is being dragged (stressed glass)
        float dragStress = max(uDrag1, uDrag2);
        float aberrationBoost = 1.0 + dragStress * 0.5;  // +50% CA when dragged
        
        float baseDistortion = baseMagnification + distortionAmount * distFromCenter;
        
        float redDistortion = baseDistortion * (1.0 - 0.08 * aberrationBoost);
        float greenDistortion = baseDistortion * 1.0;
        float blueDistortion = baseDistortion * (1.0 + 0.08 * aberrationBoost);
        
        vec2 redUV = center + rippleAdjustedOffset * redDistortion;
        vec2 greenUV = center + rippleAdjustedOffset * greenDistortion;
        vec2 blueUV = center + rippleAdjustedOffset * blueDistortion;
        
        // Apply blur with chromatic aberration
        float blur = uBlurStrength * (edgeFactor * 0.5 + 0.5);
        
        vec3 redBlur = efficientBlur(redUV, blur);
        vec3 greenBlur = efficientBlur(greenUV, blur);
        vec3 blueBlur = efficientBlur(blueUV, blur);
        
        vec3 refractedColor = vec3(redBlur.r, greenBlur.g, blueBlur.b);
        
        // Glass tint and brightness boost
        refractedColor *= vec3(0.95, 0.98, 1.0);
        refractedColor += vec3(0.15);
        
        // === FRESNEL ===
        vec2 eps = vec2(0.01, 0.0);
        vec2 gradient = vec2(
            smin(sdSuperellipse(uv + eps.xy - pos1, uRadius, uSuperellipseN).x, 
                 sdSuperellipse(uv + eps.xy - pos2, uRadius, uSuperellipseN).x, uBlendRadius) -
            smin(sdSuperellipse(uv - eps.xy - pos1, uRadius, uSuperellipseN).x, 
                 sdSuperellipse(uv - eps.xy - pos2, uRadius, uSuperellipseN).x, uBlendRadius),
            smin(sdSuperellipse(uv + eps.yx - pos1, uRadius, uSuperellipseN).x, 
                 sdSuperellipse(uv + eps.yx - pos2, uRadius, uSuperellipseN).x, uBlendRadius) -
            smin(sdSuperellipse(uv - eps.yx - pos1, uRadius, uSuperellipseN).x, 
                 sdSuperellipse(uv - eps.yx - pos2, uRadius, uSuperellipseN).x, uBlendRadius)
        );
        vec3 normal = normalize(vec3(gradient, 0.5));
        vec3 viewDir = vec3(0.0, 0.0, -1.0);
        float fresnelAmount = fresnel(viewDir, normal, uIOR);
        
        // Fresnel reflection - boost on hover for that "lifted" glow
        float hoverGlow = max(uHover1, uHover2) * 0.3;
        vec3 fresnelColor = vec3(1.0, 0.98, 0.95);
        float fresnelStrength = 0.35 + hoverGlow;
        finalColor = mix(refractedColor, fresnelColor, fresnelAmount * fresnelStrength);
        
        // Additional rim glow on hover
        finalColor += vec3(1.0) * hoverGlow * fresnelAmount * 0.2;
    }
    
    // === EDGE HIGHLIGHT ===
    float edgeThickness = 0.008;
    float edgeMask = smoothstep(edgeThickness, 0.0, abs(d));
    
    if (edgeMask > 0.0) {
        // Diagonal highlight pattern
        vec2 normalizedPos = uv * 1.5;
        
        float diagonal1 = abs(normalizedPos.x + normalizedPos.y);
        float diagonal2 = abs(normalizedPos.x - normalizedPos.y);
        
        float diagonalFactor = max(
            smoothstep(1.0, 0.1, diagonal1),
            smoothstep(1.0, 0.5, diagonal2)
        );
        diagonalFactor = pow(diagonalFactor, 1.8);
        
        vec3 edgeWhite = vec3(1.2);
        vec3 internalColor = finalColor * 0.5;
        
        vec3 edgeColor = mix(internalColor, edgeWhite, diagonalFactor);
        finalColor = mix(finalColor, edgeColor, edgeMask);
    }
    
    // === POST PROCESSING ===
    
    // Subtle vignette
    float vig = 1.0 - smoothstep(0.6, 1.4, length(uv / aspect));
    finalColor *= 0.9 + vig * 0.1;
    
    // Gamma
    finalColor = pow(finalColor, vec3(0.95));
    
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}