precision highp float;

varying vec2 vUv;

// =============================================================================
// Compile-time constants for array sizes
// =============================================================================
#define MAX_BLOBS 6
#define SPECTRUM_BANDS 32

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec2 uDragOffset;
uniform float uDragging;  // -1.0 = none, 0.0+ = blob index
uniform float uIOR;
uniform float uBlurStrength;
uniform float uRadius;
uniform float uSuperellipseN;
uniform float uBlendRadius;

// Dynamic blob data
uniform float uBlobCount;
uniform vec2 uBlobPos[MAX_BLOBS];
uniform float uBlobScale[MAX_BLOBS];   // Spawn scale (0 → 1)
uniform float uBlobHover[MAX_BLOBS];
uniform float uBlobDrag[MAX_BLOBS];
uniform float uBlobRipple[MAX_BLOBS];
uniform float uBlobWobble[MAX_BLOBS];

// Interaction config
uniform float uHoverScale;
uniform float uDragScale;
uniform float uDragSoften;
uniform float uRippleSpeed;
uniform float uRippleDecay;
uniform float uRippleStrength;
uniform float uWobbleFreq;
uniform float uWobbleDecay;

// Audio spectrum data (0-1 per band)
uniform float uSpectrum[SPECTRUM_BANDS];

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
// Fresnel reflectance calculation
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
        return 1.0;
    }
    float cost = sqrt(max(0.0, 1.0 - sint * sint));
    cosi = abs(cosi);
    float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
    float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
    return (Rs * Rs + Rp * Rp) / 2.0;
}

// =============================================================================
// Background pattern
// =============================================================================

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// Get spectrum value for a grid cell
float getSpectrumForCell(vec2 gridID, float aspect) {
    // Map grid X position to spectrum band
    // Grid spans roughly -15 to +15 in X (accounting for wide aspect ratios)
    float xRange = 20.0 * aspect;  // ~34 for 16:9, ~40 for ultrawide
    float normalizedX = (gridID.x + xRange * 0.5) / xRange;  // 0 to 1
    normalizedX = clamp(normalizedX, 0.0, 0.999);
    
    // Calculate band index as float, then clamp
    float bandF = normalizedX * float(SPECTRUM_BANDS);
    bandF = clamp(bandF, 0.0, float(SPECTRUM_BANDS - 1));
    int band = int(bandF);
    
    // Sample the spectrum (manual array indexing for WebGL1 compatibility)
    float value = 0.0;
    for (int i = 0; i < SPECTRUM_BANDS; i++) {
        if (i == band) {
            value = uSpectrum[i];
            break;
        }
    }
    
    return value;
}

vec3 sampleBackground(vec2 uv) {
    float time = uTime * 0.3;
    float aspect = uResolution.x / uResolution.y;
    
    vec3 col1 = vec3(0.02, 0.02, 0.05);
    vec3 col2 = vec3(0.05, 0.02, 0.08);
    float t = length(uv) * 0.5;
    vec3 gradient = mix(col1, col2, t);
    
    float gridSize = 0.15;
    vec2 gridUV = mod(uv + gridSize * 0.5, gridSize) - gridSize * 0.5;
    vec2 gridID = floor((uv + gridSize * 0.5) / gridSize);
    
    // Get spectrum intensity for this column (X = frequency band)
    float spectrum = getSpectrumForCell(gridID, aspect);
    
    // Map grid Y to height threshold (bottom = -5, top = +5 roughly)
    // Normalize Y position to 0-1 range (bottom to top)
    float normalizedY = (gridID.y + 5.0) / 10.0;
    normalizedY = clamp(normalizedY, 0.0, 1.0);
    
    // Circle lights up if spectrum level exceeds this row's threshold
    // spectrum = 1.0 means full bar, spectrum = 0.0 means nothing lit
    float isLit = step(normalizedY, spectrum);
    
    // Smooth falloff near the "top" of the bar for nicer look
    float barEdge = smoothstep(spectrum - 0.1, spectrum, normalizedY);
    float intensity = isLit * (1.0 - barEdge * 0.5);
    
    // Base circle (always visible but dim)
    float baseRadius = 0.04;
    float circleR = baseRadius * (1.0 + intensity * 0.3);
    float circle = sdCircle(gridUV, circleR);
    
    // Hue based on column (frequency) - low freq = red, high = blue/purple
    float hue = mod(gridID.x * 0.08 + 0.0, 1.0);
    
    // Brightness: dim base + bright when lit by spectrum
    float baseBrightness = 0.25;
    float litBrightness = 1.8;
    float brightness = mix(baseBrightness, litBrightness, intensity);
    
    vec3 circleColor = vec3(
        0.5 + 0.5 * sin(hue * 6.28),
        0.5 + 0.5 * sin(hue * 6.28 + 2.09),
        0.5 + 0.5 * sin(hue * 6.28 + 4.18)
    ) * brightness;
    
    float circleMask = smoothstep(0.005, -0.005, circle);
    gradient = mix(gradient, circleColor, circleMask);
    
    float lineW = 0.003;
    float gridLineX = smoothstep(lineW, 0.0, abs(gridUV.x));
    float gridLineY = smoothstep(lineW, 0.0, abs(gridUV.y));
    gradient += vec3(0.08) * max(gridLineX, gridLineY);
    
    // "26" text
    vec2 p = uv;
    
    float two = 1e10;
    two = min(two, sdBox(p - vec2(-0.18, 0.06), vec2(0.08, 0.015)));
    two = min(two, sdBox(p - vec2(-0.13, 0.03), vec2(0.015, 0.045)));
    two = min(two, sdBox(p - vec2(-0.18, 0.0), vec2(0.08, 0.015)));
    two = min(two, sdBox(p - vec2(-0.23, -0.03), vec2(0.015, 0.045)));
    two = min(two, sdBox(p - vec2(-0.18, -0.06), vec2(0.08, 0.015)));
    
    float six = 1e10;
    six = min(six, sdBox(p - vec2(0.18, 0.06), vec2(0.08, 0.015)));
    six = min(six, sdBox(p - vec2(0.13, 0.03), vec2(0.015, 0.045)));
    six = min(six, sdBox(p - vec2(0.18, 0.0), vec2(0.08, 0.015)));
    six = min(six, sdBox(p - vec2(0.13, -0.03), vec2(0.015, 0.045)));
    six = min(six, sdBox(p - vec2(0.23, -0.03), vec2(0.015, 0.045)));
    six = min(six, sdBox(p - vec2(0.18, -0.06), vec2(0.08, 0.015)));
    
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
    
    // Mouse adjusted for drag offset
    vec2 dragOffset = uDragOffset;
    dragOffset.x *= aspect;
    vec2 mouse = uMouse;
    mouse.x *= aspect;
    vec2 adjustedMouse = mouse - dragOffset;
    
    // Early exit if no blobs
    if (uBlobCount < 0.5) {
        vec3 bg = sampleBackground(uv);
        float vig = 1.0 - smoothstep(0.6, 1.4, length(uv / aspect));
        bg *= 0.9 + vig * 0.1;
        bg = pow(bg, vec3(0.95));
        gl_FragColor = vec4(bg, 1.0);
        return;
    }
    
    // Convert blob count to int for loop comparisons
    int blobCount = int(uBlobCount);
    
    // =============================================================================
    // Calculate SDF for all blobs
    // =============================================================================
    
    float d = 1e10;
    float shadowD = 1e10;
    
    // Store per-blob data for interaction effects
    float blobDistances[MAX_BLOBS];
    vec2 blobPositions[MAX_BLOBS];
    float blobRadii[MAX_BLOBS];
    
    // Calculate weighted center for lens effect
    float totalCenterWeight = 0.0;
    vec2 weightedCenter = vec2(0.0);
    
    // Combined interaction state
    float maxDrag = 0.0;
    float maxHover = 0.0;
    
    for (int i = 0; i < MAX_BLOBS; i++) {
        if (i >= blobCount) break;
        
        // Get blob position (apply aspect + check if being dragged)
        vec2 pos = uBlobPos[i];
        pos.x *= aspect;
        
        // If this blob is being dragged, use mouse position
        if (abs(uDragging - float(i)) < 0.5) {
            pos = adjustedMouse;
        }
        
        blobPositions[i] = pos;
        
        // Per-blob radius based on spawn scale + interaction
        float scale = uBlobScale[i];
        float hover = uBlobHover[i];
        float drag = uBlobDrag[i];
        float radius = uRadius * scale * (1.0 + hover * uHoverScale + drag * uDragScale);
        float n = mix(uSuperellipseN, uSuperellipseN * uDragSoften, drag);
        blobRadii[i] = radius;
        
        // Skip nearly invisible blobs (scale < 0.01)
        if (scale < 0.01) continue;
        
        // Calculate SDF
        float blobD = sdSuperellipse(uv - pos, radius, n).x;
        
        // Wobble effect (jiggly during drag)
        if (drag > 0.0 || uBlobWobble[i] > 0.0) {
            vec2 offset = uv - pos;
            float angle = atan(offset.y, offset.x);
            float wobbleAmount = drag * 0.5 + exp(-uBlobWobble[i] * uWobbleDecay) * 0.3;
            float wobble = sin(angle * 4.0 + uTime * uWobbleFreq) * wobbleAmount * 0.015;
            wobble += sin(angle * 7.0 - uTime * uWobbleFreq * 1.3) * wobbleAmount * 0.008;
            blobD += wobble;
        }
        
        blobDistances[i] = blobD;
        
        // Blend with smooth minimum
        d = smin(d, blobD, uBlendRadius);
        
        // Shadow SDF (scales with blob)
        vec2 shadowPos = pos + vec2(0.0, -0.02 * scale);
        float shadowBlobD = sdSuperellipse(uv - shadowPos, uRadius * scale, uSuperellipseN).x;
        shadowD = smin(shadowD, shadowBlobD, uBlendRadius);
        
        // Weighted center calculation
        float w = exp(-blobD * blobD * 8.0);
        weightedCenter += pos * w;
        totalCenterWeight += w;
        
        // Track max interaction states
        maxDrag = max(maxDrag, drag);
        maxHover = max(maxHover, hover);
    }
    
    weightedCenter /= (totalCenterWeight + 1e-6);
    
    // Shadow
    float shadowMask = (1.0 - smoothstep(0.0, 0.06, shadowD)) * 0.15;
    
    // Base background
    vec3 baseColor = sampleBackground(uv);
    baseColor = mix(baseColor, vec3(0.0), shadowMask);
    
    vec3 finalColor = baseColor;
    
    // =============================================================================
    // Inside the glass
    // =============================================================================
    
    if (d < 0.0) {
        vec2 center = weightedCenter;
        vec2 offset = uv - center;
        float distFromCenter = length(offset);
        
        float depthInShape = abs(d);
        float normalizedDepth = clamp(depthInShape / (uRadius * 0.8), 0.0, 1.0);
        float edgeFactor = 1.0 - normalizedDepth;
        float exponentialDistortion = exp(edgeFactor * 3.0) - 1.0;
        
        float baseMagnification = 0.75;
        float lensStrength = 0.4;
        float distortionAmount = exponentialDistortion * lensStrength;
        
        // =================================================================
        // WATER RIPPLE EFFECT - Concentric waves inside the glass
        // =================================================================
        
        vec2 rippleOffset = vec2(0.0);
        
        for (int i = 0; i < MAX_BLOBS; i++) {
            if (i >= blobCount) break;
            
            float ripple = uBlobRipple[i];
            if (ripple > 0.0) {
                float dist = length(uv - blobPositions[i]);
                float rippleWave = ripple * uRippleSpeed;
                float rippleFade = exp(-ripple * uRippleDecay);
                
                // Fade ripples only at very edge
                float edgeMask = smoothstep(blobRadii[i] * 0.95, blobRadii[i] * 0.5, dist);
                
                // Concentric wave pattern
                float phase = dist * 35.0 - rippleWave;
                float wave = sin(phase) * 0.6 + sin(phase * 1.8 + 0.3) * 0.4;
                
                vec2 dir = normalize(uv - blobPositions[i] + vec2(0.001));
                rippleOffset += dir * wave * rippleFade * edgeMask * uRippleStrength;
            }
        }
        
        vec2 rippleAdjustedOffset = offset + rippleOffset;
        
        // Chromatic aberration
        float aberrationBoost = 1.0 + maxDrag * 0.5;
        float baseDistortion = baseMagnification + distortionAmount * distFromCenter;
        
        float redDistortion = baseDistortion * (1.0 - 0.08 * aberrationBoost);
        float greenDistortion = baseDistortion * 1.0;
        float blueDistortion = baseDistortion * (1.0 + 0.08 * aberrationBoost);
        
        vec2 redUV = center + rippleAdjustedOffset * redDistortion;
        vec2 greenUV = center + rippleAdjustedOffset * greenDistortion;
        vec2 blueUV = center + rippleAdjustedOffset * blueDistortion;
        
        float blur = uBlurStrength * (edgeFactor * 0.5 + 0.5);
        
        vec3 redBlur = efficientBlur(redUV, blur);
        vec3 greenBlur = efficientBlur(greenUV, blur);
        vec3 blueBlur = efficientBlur(blueUV, blur);
        
        vec3 refractedColor = vec3(redBlur.r, greenBlur.g, blueBlur.b);
        refractedColor *= vec3(0.95, 0.98, 1.0);
        refractedColor += vec3(0.15);
        
        // Fresnel (simplified for performance with many blobs)
        vec2 eps = vec2(0.01, 0.0);
        float dxp = 1e10, dxn = 1e10, dyp = 1e10, dyn = 1e10;
        
        for (int i = 0; i < MAX_BLOBS; i++) {
            if (i >= blobCount) break;
            dxp = smin(dxp, sdSuperellipse(uv + eps.xy - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);
            dxn = smin(dxn, sdSuperellipse(uv - eps.xy - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);
            dyp = smin(dyp, sdSuperellipse(uv + eps.yx - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);
            dyn = smin(dyn, sdSuperellipse(uv - eps.yx - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);
        }
        
        vec2 gradient = vec2(dxp - dxn, dyp - dyn);
        vec3 normal = normalize(vec3(gradient, 0.5));
        vec3 viewDir = vec3(0.0, 0.0, -1.0);
        float fresnelAmount = fresnel(viewDir, normal, uIOR);
        
        float hoverGlow = maxHover * 0.3;
        vec3 fresnelColor = vec3(1.0, 0.98, 0.95);
        float fresnelStrength = 0.35 + hoverGlow;
        finalColor = mix(refractedColor, fresnelColor, fresnelAmount * fresnelStrength);
        finalColor += vec3(1.0) * hoverGlow * fresnelAmount * 0.2;
    }
    
    // Edge highlight
    float edgeThickness = 0.008;
    float edgeMask = smoothstep(edgeThickness, 0.0, abs(d));
    
    if (edgeMask > 0.0) {
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
    
    // Post processing
    float vig = 1.0 - smoothstep(0.6, 1.4, length(uv / aspect));
    finalColor *= 0.9 + vig * 0.1;
    finalColor = pow(finalColor, vec3(0.95));
    
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
