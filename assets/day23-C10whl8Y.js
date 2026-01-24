import{G as S,W as w}from"./index-ACZeJgrc.js";const x=`precision highp float;\r
\r
attribute vec2 aPosition;\r
attribute vec2 aUv;\r
\r
varying vec2 vUv;\r
\r
void main() {\r
    vUv = aUv;\r
    gl_Position = vec4(aPosition, 0.0, 1.0);\r
}`,B=`precision highp float;\r
\r
varying vec2 vUv;\r
\r
// =============================================================================\r
// Compile-time constants for array sizes\r
// =============================================================================\r
#define MAX_BLOBS 6\r
#define SPECTRUM_BANDS 32\r
\r
uniform float uTime;\r
uniform vec2 uResolution;\r
uniform vec2 uMouse;\r
uniform vec2 uDragOffset;\r
uniform float uDragging;  // -1.0 = none, 0.0+ = blob index\r
uniform float uIOR;\r
uniform float uBlurStrength;\r
uniform float uRadius;\r
uniform float uSuperellipseN;\r
uniform float uBlendRadius;\r
\r
// Dynamic blob data\r
uniform float uBlobCount;\r
uniform vec2 uBlobPos[MAX_BLOBS];\r
uniform float uBlobScale[MAX_BLOBS];   // Spawn scale (0 → 1)\r
uniform float uBlobHover[MAX_BLOBS];\r
uniform float uBlobDrag[MAX_BLOBS];\r
uniform float uBlobRipple[MAX_BLOBS];\r
uniform float uBlobWobble[MAX_BLOBS];\r
\r
// Interaction config\r
uniform float uHoverScale;\r
uniform float uDragScale;\r
uniform float uDragSoften;\r
uniform float uRippleSpeed;\r
uniform float uRippleDecay;\r
uniform float uRippleStrength;\r
uniform float uWobbleFreq;\r
uniform float uWobbleDecay;\r
\r
// Audio spectrum data (0-1 per band)\r
uniform float uSpectrum[SPECTRUM_BANDS];\r
\r
// =============================================================================\r
// IQ's Superellipse SDF\r
// =============================================================================\r
\r
vec3 sdSuperellipse(vec2 p, float r, float n) {\r
    p = p / r;\r
    vec2 gs = sign(p);\r
    vec2 ps = abs(p);\r
    float gm = pow(ps.x, n) + pow(ps.y, n);\r
    float gd = pow(gm, 1.0 / n) - 1.0;\r
    vec2 g = gs * pow(ps, vec2(n - 1.0)) * pow(gm, 1.0 / n - 1.0);\r
    p = abs(p); \r
    if (p.y > p.x) p = p.yx;\r
    n = 2.0 / n;\r
    float d = 1e20;\r
    const int num = 12;\r
    vec2 oq = vec2(1.0, 0.0);\r
    for (int i = 1; i < num; i++) {\r
        float h = float(i) / float(num - 1);\r
        vec2 q = vec2(pow(cos(h * 3.1415927 / 4.0), n),\r
                      pow(sin(h * 3.1415927 / 4.0), n));\r
        vec2 pa = p - oq;\r
        vec2 ba = q - oq;\r
        vec2 z = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);\r
        float d2 = dot(z, z);\r
        if (d2 < d) {\r
            d = d2;\r
        }\r
        oq = q;\r
    }\r
    return vec3(sqrt(d) * sign(gd) * r, g);\r
}\r
\r
// =============================================================================\r
// Smooth minimum for blending SDFs\r
// =============================================================================\r
\r
float smin(float a, float b, float k) {\r
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\r
    return mix(b, a, h) - k * h * (1.0 - h);\r
}\r
\r
// =============================================================================\r
// Fresnel reflectance calculation\r
// =============================================================================\r
\r
float fresnel(vec3 I, vec3 N, float ior) {\r
    float cosi = clamp(dot(I, N), -1.0, 1.0);\r
    float etai = 1.0, etat = ior;\r
    if (cosi > 0.0) {\r
        float temp = etai;\r
        etai = etat;\r
        etat = temp;\r
    }\r
    float sint = etai / etat * sqrt(max(0.0, 1.0 - cosi * cosi));\r
    if (sint >= 1.0) {\r
        return 1.0;\r
    }\r
    float cost = sqrt(max(0.0, 1.0 - sint * sint));\r
    cosi = abs(cosi);\r
    float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));\r
    float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));\r
    return (Rs * Rs + Rp * Rp) / 2.0;\r
}\r
\r
// =============================================================================\r
// Background pattern\r
// =============================================================================\r
\r
float sdBox(vec2 p, vec2 b) {\r
    vec2 d = abs(p) - b;\r
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);\r
}\r
\r
float sdCircle(vec2 p, float r) {\r
    return length(p) - r;\r
}\r
\r
// Get spectrum value for a grid cell\r
float getSpectrumForCell(vec2 gridID, float aspect) {\r
    // Map grid X position to spectrum band\r
    // Grid spans roughly -15 to +15 in X (accounting for wide aspect ratios)\r
    float xRange = 20.0 * aspect;  // ~34 for 16:9, ~40 for ultrawide\r
    float normalizedX = (gridID.x + xRange * 0.5) / xRange;  // 0 to 1\r
    normalizedX = clamp(normalizedX, 0.0, 0.999);\r
    \r
    // Calculate band index as float, then clamp\r
    float bandF = normalizedX * float(SPECTRUM_BANDS);\r
    bandF = clamp(bandF, 0.0, float(SPECTRUM_BANDS - 1));\r
    int band = int(bandF);\r
    \r
    // Sample the spectrum (manual array indexing for WebGL1 compatibility)\r
    float value = 0.0;\r
    for (int i = 0; i < SPECTRUM_BANDS; i++) {\r
        if (i == band) {\r
            value = uSpectrum[i];\r
            break;\r
        }\r
    }\r
    \r
    return value;\r
}\r
\r
vec3 sampleBackground(vec2 uv) {\r
    float time = uTime * 0.3;\r
    float aspect = uResolution.x / uResolution.y;\r
    \r
    vec3 col1 = vec3(0.02, 0.02, 0.05);\r
    vec3 col2 = vec3(0.05, 0.02, 0.08);\r
    float t = length(uv) * 0.5;\r
    vec3 gradient = mix(col1, col2, t);\r
    \r
    float gridSize = 0.15;\r
    vec2 gridUV = mod(uv + gridSize * 0.5, gridSize) - gridSize * 0.5;\r
    vec2 gridID = floor((uv + gridSize * 0.5) / gridSize);\r
    \r
    // Get spectrum intensity for this column (X = frequency band)\r
    float spectrum = getSpectrumForCell(gridID, aspect);\r
    \r
    // Map grid Y to height threshold (bottom = -5, top = +5 roughly)\r
    // Normalize Y position to 0-1 range (bottom to top)\r
    float normalizedY = (gridID.y + 5.0) / 10.0;\r
    normalizedY = clamp(normalizedY, 0.0, 1.0);\r
    \r
    // Circle lights up if spectrum level exceeds this row's threshold\r
    // spectrum = 1.0 means full bar, spectrum = 0.0 means nothing lit\r
    float isLit = step(normalizedY, spectrum);\r
    \r
    // Smooth falloff near the "top" of the bar for nicer look\r
    float barEdge = smoothstep(spectrum - 0.1, spectrum, normalizedY);\r
    float intensity = isLit * (1.0 - barEdge * 0.5);\r
    \r
    // Base circle (always visible but dim)\r
    float baseRadius = 0.04;\r
    float circleR = baseRadius * (1.0 + intensity * 0.3);\r
    float circle = sdCircle(gridUV, circleR);\r
    \r
    // Hue based on column (frequency) - low freq = red, high = blue/purple\r
    float hue = mod(gridID.x * 0.08 + 0.0, 1.0);\r
    \r
    // Brightness: dim base + bright when lit by spectrum\r
    float baseBrightness = 0.25;\r
    float litBrightness = 1.8;\r
    float brightness = mix(baseBrightness, litBrightness, intensity);\r
    \r
    vec3 circleColor = vec3(\r
        0.5 + 0.5 * sin(hue * 6.28),\r
        0.5 + 0.5 * sin(hue * 6.28 + 2.09),\r
        0.5 + 0.5 * sin(hue * 6.28 + 4.18)\r
    ) * brightness;\r
    \r
    float circleMask = smoothstep(0.005, -0.005, circle);\r
    gradient = mix(gradient, circleColor, circleMask);\r
    \r
    float lineW = 0.003;\r
    float gridLineX = smoothstep(lineW, 0.0, abs(gridUV.x));\r
    float gridLineY = smoothstep(lineW, 0.0, abs(gridUV.y));\r
    gradient += vec3(0.08) * max(gridLineX, gridLineY);\r
    \r
    // "26" text\r
    vec2 p = uv;\r
    \r
    float two = 1e10;\r
    two = min(two, sdBox(p - vec2(-0.18, 0.06), vec2(0.08, 0.015)));\r
    two = min(two, sdBox(p - vec2(-0.13, 0.03), vec2(0.015, 0.045)));\r
    two = min(two, sdBox(p - vec2(-0.18, 0.0), vec2(0.08, 0.015)));\r
    two = min(two, sdBox(p - vec2(-0.23, -0.03), vec2(0.015, 0.045)));\r
    two = min(two, sdBox(p - vec2(-0.18, -0.06), vec2(0.08, 0.015)));\r
    \r
    float six = 1e10;\r
    six = min(six, sdBox(p - vec2(0.18, 0.06), vec2(0.08, 0.015)));\r
    six = min(six, sdBox(p - vec2(0.13, 0.03), vec2(0.015, 0.045)));\r
    six = min(six, sdBox(p - vec2(0.18, 0.0), vec2(0.08, 0.015)));\r
    six = min(six, sdBox(p - vec2(0.13, -0.03), vec2(0.015, 0.045)));\r
    six = min(six, sdBox(p - vec2(0.23, -0.03), vec2(0.015, 0.045)));\r
    six = min(six, sdBox(p - vec2(0.18, -0.06), vec2(0.08, 0.015)));\r
    \r
    float numbers = min(two, six);\r
    float numMask = smoothstep(0.003, -0.003, numbers);\r
    gradient = mix(gradient, vec3(0.95), numMask);\r
    \r
    return gradient;\r
}\r
\r
// =============================================================================\r
// Gaussian blur\r
// =============================================================================\r
\r
const int samples = 16;\r
const float sigma = float(samples) * 0.25;\r
\r
float gaussian(vec2 i) {\r
    return exp(-0.5 * dot(i / sigma, i / sigma)) / (6.28 * sigma * sigma);\r
}\r
\r
vec3 efficientBlur(vec2 uv, float blurStrength) {\r
    vec3 O = vec3(0.0);\r
    float totalWeight = 0.0;\r
    int s = samples / 2;\r
    \r
    for (int i = 0; i < 64; i++) {\r
        if (i >= s * s) break;\r
        vec2 d = vec2(mod(float(i), float(s)), floor(float(i) / float(s))) * 2.0 - float(s) / 2.0;\r
        vec2 offset = d * blurStrength * 0.002;\r
        float weight = gaussian(d);\r
        \r
        vec3 sampleColor = sampleBackground(uv + offset);\r
        O += sampleColor * weight;\r
        totalWeight += weight;\r
    }\r
    \r
    return O / totalWeight;\r
}\r
\r
// =============================================================================\r
// Main\r
// =============================================================================\r
\r
void main() {\r
    vec2 uv = (vUv - 0.5) * 2.0;\r
    float aspect = uResolution.x / uResolution.y;\r
    uv.x *= aspect;\r
    \r
    // Mouse adjusted for drag offset\r
    vec2 dragOffset = uDragOffset;\r
    dragOffset.x *= aspect;\r
    vec2 mouse = uMouse;\r
    mouse.x *= aspect;\r
    vec2 adjustedMouse = mouse - dragOffset;\r
    \r
    // Early exit if no blobs\r
    if (uBlobCount < 0.5) {\r
        vec3 bg = sampleBackground(uv);\r
        float vig = 1.0 - smoothstep(0.6, 1.4, length(uv / aspect));\r
        bg *= 0.9 + vig * 0.1;\r
        bg = pow(bg, vec3(0.95));\r
        gl_FragColor = vec4(bg, 1.0);\r
        return;\r
    }\r
    \r
    // Convert blob count to int for loop comparisons\r
    int blobCount = int(uBlobCount);\r
    \r
    // =============================================================================\r
    // Calculate SDF for all blobs\r
    // =============================================================================\r
    \r
    float d = 1e10;\r
    float shadowD = 1e10;\r
    \r
    // Store per-blob data for interaction effects\r
    float blobDistances[MAX_BLOBS];\r
    vec2 blobPositions[MAX_BLOBS];\r
    float blobRadii[MAX_BLOBS];\r
    \r
    // Calculate weighted center for lens effect\r
    float totalCenterWeight = 0.0;\r
    vec2 weightedCenter = vec2(0.0);\r
    \r
    // Combined interaction state\r
    float maxDrag = 0.0;\r
    float maxHover = 0.0;\r
    \r
    for (int i = 0; i < MAX_BLOBS; i++) {\r
        if (i >= blobCount) break;\r
        \r
        // Get blob position (apply aspect + check if being dragged)\r
        vec2 pos = uBlobPos[i];\r
        pos.x *= aspect;\r
        \r
        // If this blob is being dragged, use mouse position\r
        if (abs(uDragging - float(i)) < 0.5) {\r
            pos = adjustedMouse;\r
        }\r
        \r
        blobPositions[i] = pos;\r
        \r
        // Per-blob radius based on spawn scale + interaction\r
        float scale = uBlobScale[i];\r
        float hover = uBlobHover[i];\r
        float drag = uBlobDrag[i];\r
        float radius = uRadius * scale * (1.0 + hover * uHoverScale + drag * uDragScale);\r
        float n = mix(uSuperellipseN, uSuperellipseN * uDragSoften, drag);\r
        blobRadii[i] = radius;\r
        \r
        // Skip nearly invisible blobs (scale < 0.01)\r
        if (scale < 0.01) continue;\r
        \r
        // Calculate SDF\r
        float blobD = sdSuperellipse(uv - pos, radius, n).x;\r
        \r
        // Wobble effect (jiggly during drag)\r
        if (drag > 0.0 || uBlobWobble[i] > 0.0) {\r
            vec2 offset = uv - pos;\r
            float angle = atan(offset.y, offset.x);\r
            float wobbleAmount = drag * 0.5 + exp(-uBlobWobble[i] * uWobbleDecay) * 0.3;\r
            float wobble = sin(angle * 4.0 + uTime * uWobbleFreq) * wobbleAmount * 0.015;\r
            wobble += sin(angle * 7.0 - uTime * uWobbleFreq * 1.3) * wobbleAmount * 0.008;\r
            blobD += wobble;\r
        }\r
        \r
        blobDistances[i] = blobD;\r
        \r
        // Blend with smooth minimum\r
        d = smin(d, blobD, uBlendRadius);\r
        \r
        // Shadow SDF (scales with blob)\r
        vec2 shadowPos = pos + vec2(0.0, -0.02 * scale);\r
        float shadowBlobD = sdSuperellipse(uv - shadowPos, uRadius * scale, uSuperellipseN).x;\r
        shadowD = smin(shadowD, shadowBlobD, uBlendRadius);\r
        \r
        // Weighted center calculation\r
        float w = exp(-blobD * blobD * 8.0);\r
        weightedCenter += pos * w;\r
        totalCenterWeight += w;\r
        \r
        // Track max interaction states\r
        maxDrag = max(maxDrag, drag);\r
        maxHover = max(maxHover, hover);\r
    }\r
    \r
    weightedCenter /= (totalCenterWeight + 1e-6);\r
    \r
    // Shadow\r
    float shadowMask = (1.0 - smoothstep(0.0, 0.06, shadowD)) * 0.15;\r
    \r
    // Base background\r
    vec3 baseColor = sampleBackground(uv);\r
    baseColor = mix(baseColor, vec3(0.0), shadowMask);\r
    \r
    vec3 finalColor = baseColor;\r
    \r
    // =============================================================================\r
    // Inside the glass\r
    // =============================================================================\r
    \r
    if (d < 0.0) {\r
        vec2 center = weightedCenter;\r
        vec2 offset = uv - center;\r
        float distFromCenter = length(offset);\r
        \r
        float depthInShape = abs(d);\r
        float normalizedDepth = clamp(depthInShape / (uRadius * 0.8), 0.0, 1.0);\r
        float edgeFactor = 1.0 - normalizedDepth;\r
        float exponentialDistortion = exp(edgeFactor * 3.0) - 1.0;\r
        \r
        float baseMagnification = 0.75;\r
        float lensStrength = 0.4;\r
        float distortionAmount = exponentialDistortion * lensStrength;\r
        \r
        // =================================================================\r
        // WATER RIPPLE EFFECT - Concentric waves inside the glass\r
        // =================================================================\r
        \r
        vec2 rippleOffset = vec2(0.0);\r
        \r
        for (int i = 0; i < MAX_BLOBS; i++) {\r
            if (i >= blobCount) break;\r
            \r
            float ripple = uBlobRipple[i];\r
            if (ripple > 0.0) {\r
                float dist = length(uv - blobPositions[i]);\r
                float rippleWave = ripple * uRippleSpeed;\r
                float rippleFade = exp(-ripple * uRippleDecay);\r
                \r
                // Fade ripples only at very edge\r
                float edgeMask = smoothstep(blobRadii[i] * 0.95, blobRadii[i] * 0.5, dist);\r
                \r
                // Concentric wave pattern\r
                float phase = dist * 35.0 - rippleWave;\r
                float wave = sin(phase) * 0.6 + sin(phase * 1.8 + 0.3) * 0.4;\r
                \r
                vec2 dir = normalize(uv - blobPositions[i] + vec2(0.001));\r
                rippleOffset += dir * wave * rippleFade * edgeMask * uRippleStrength;\r
            }\r
        }\r
        \r
        vec2 rippleAdjustedOffset = offset + rippleOffset;\r
        \r
        // Chromatic aberration\r
        float aberrationBoost = 1.0 + maxDrag * 0.5;\r
        float baseDistortion = baseMagnification + distortionAmount * distFromCenter;\r
        \r
        float redDistortion = baseDistortion * (1.0 - 0.08 * aberrationBoost);\r
        float greenDistortion = baseDistortion * 1.0;\r
        float blueDistortion = baseDistortion * (1.0 + 0.08 * aberrationBoost);\r
        \r
        vec2 redUV = center + rippleAdjustedOffset * redDistortion;\r
        vec2 greenUV = center + rippleAdjustedOffset * greenDistortion;\r
        vec2 blueUV = center + rippleAdjustedOffset * blueDistortion;\r
        \r
        float blur = uBlurStrength * (edgeFactor * 0.5 + 0.5);\r
        \r
        vec3 redBlur = efficientBlur(redUV, blur);\r
        vec3 greenBlur = efficientBlur(greenUV, blur);\r
        vec3 blueBlur = efficientBlur(blueUV, blur);\r
        \r
        vec3 refractedColor = vec3(redBlur.r, greenBlur.g, blueBlur.b);\r
        refractedColor *= vec3(0.95, 0.98, 1.0);\r
        refractedColor += vec3(0.15);\r
        \r
        // Fresnel (simplified for performance with many blobs)\r
        vec2 eps = vec2(0.01, 0.0);\r
        float dxp = 1e10, dxn = 1e10, dyp = 1e10, dyn = 1e10;\r
        \r
        for (int i = 0; i < MAX_BLOBS; i++) {\r
            if (i >= blobCount) break;\r
            dxp = smin(dxp, sdSuperellipse(uv + eps.xy - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);\r
            dxn = smin(dxn, sdSuperellipse(uv - eps.xy - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);\r
            dyp = smin(dyp, sdSuperellipse(uv + eps.yx - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);\r
            dyn = smin(dyn, sdSuperellipse(uv - eps.yx - blobPositions[i], uRadius, uSuperellipseN).x, uBlendRadius);\r
        }\r
        \r
        vec2 gradient = vec2(dxp - dxn, dyp - dyn);\r
        vec3 normal = normalize(vec3(gradient, 0.5));\r
        vec3 viewDir = vec3(0.0, 0.0, -1.0);\r
        float fresnelAmount = fresnel(viewDir, normal, uIOR);\r
        \r
        float hoverGlow = maxHover * 0.3;\r
        vec3 fresnelColor = vec3(1.0, 0.98, 0.95);\r
        float fresnelStrength = 0.35 + hoverGlow;\r
        finalColor = mix(refractedColor, fresnelColor, fresnelAmount * fresnelStrength);\r
        finalColor += vec3(1.0) * hoverGlow * fresnelAmount * 0.2;\r
    }\r
    \r
    // Edge highlight\r
    float edgeThickness = 0.008;\r
    float edgeMask = smoothstep(edgeThickness, 0.0, abs(d));\r
    \r
    if (edgeMask > 0.0) {\r
        vec2 normalizedPos = uv * 1.5;\r
        float diagonal1 = abs(normalizedPos.x + normalizedPos.y);\r
        float diagonal2 = abs(normalizedPos.x - normalizedPos.y);\r
        float diagonalFactor = max(\r
            smoothstep(1.0, 0.1, diagonal1),\r
            smoothstep(1.0, 0.5, diagonal2)\r
        );\r
        diagonalFactor = pow(diagonalFactor, 1.8);\r
        \r
        vec3 edgeWhite = vec3(1.2);\r
        vec3 internalColor = finalColor * 0.5;\r
        vec3 edgeColor = mix(internalColor, edgeWhite, diagonalFactor);\r
        finalColor = mix(finalColor, edgeColor, edgeMask);\r
    }\r
    \r
    // Post processing\r
    float vig = 1.0 - smoothstep(0.6, 1.4, length(uv / aspect));\r
    finalColor *= 0.9 + vig * 0.1;\r
    finalColor = pow(finalColor, vec3(0.95));\r
    \r
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);\r
}\r
`,m=6,g=32,u={speed:.3,ior:1.5,blurStrength:1.5,radius:.22,superellipseN:4,blendRadius:.12,hoverScale:.08,dragScale:.2,dragSoften:.8,rippleSpeed:18,rippleDecay:1.2,rippleStrength:.18,wobbleFreq:12,wobbleDecay:3,elasticDuration:.6,friction:.995,boundsX:.88,boundsY:.78,maxVel:4};function v(p,e){return{x:p,y:e,vx:0,vy:0,scale:0,scaleAnimTime:0,hover:0,drag:0,ripple:0,wobble:0,targetHover:0,targetDrag:0,hoverAnimTime:0,dragAnimTime:0,rippleActive:!1,wobbleActive:!1}}class y extends S{constructor(e){super(e),this.backgroundColor="#0a0812"}init(){if(super.init(),this.webgl=new w(this.width,this.height),!this.webgl.isAvailable()){console.warn("WebGL not available, showing fallback"),this.useFallback=!0;return}this.webgl.useProgram("liquidGlass",x,B),this.time=0,this.mouseX=0,this.mouseY=0,this.targetMouseX=0,this.targetMouseY=0,this.dragging=-1,this.dragOffsetX=0,this.dragOffsetY=0,this.dragSamples=[],this.lastDragX=0,this.lastDragY=0,this.hoveredBlob=-1,this.blobs=[],this.startDelay=0,this.initialBlobSpawned=!1,this.audioEnabled=!1,this.audioContext=null,this.analyser=null,this.frequencyData=null,this.spectrum=new Float32Array(g),this.spectrumSmooth=new Float32Array(g),this.canvas.addEventListener("mousemove",e=>{const t=this.canvas.getBoundingClientRect();this.targetMouseX=((e.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((e.clientY-t.top)/t.height-.5)*2,this.dragging===-1&&this.updateHoverState(this.targetMouseX,this.targetMouseY)}),this.canvas.addEventListener("mouseleave",()=>{this.dragging===-1&&(this.hoveredBlob=-1,this.blobs.forEach(e=>e.targetHover=0))}),this.canvas.addEventListener("mousedown",e=>{const t=this.canvas.getBoundingClientRect(),o=((e.clientX-t.left)/t.width-.5)*2,a=-((e.clientY-t.top)/t.height-.5)*2;this.handleClick(o,a)}),this.canvas.addEventListener("mouseup",()=>{this.handleRelease()}),window.addEventListener("mouseup",()=>{this.dragging!==-1&&this.handleRelease()}),this.canvas.addEventListener("touchstart",e=>{const t=this.canvas.getBoundingClientRect(),o=e.touches[0],a=((o.clientX-t.left)/t.width-.5)*2,n=-((o.clientY-t.top)/t.height-.5)*2;this.handleClick(a,n)},{passive:!0}),this.canvas.addEventListener("touchmove",e=>{const t=this.canvas.getBoundingClientRect(),o=e.touches[0];this.targetMouseX=((o.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((o.clientY-t.top)/t.height-.5)*2},{passive:!0}),this.canvas.addEventListener("touchend",()=>{this.handleRelease()}),window.addEventListener("keydown",e=>{(e.key==="r"||e.key==="R")&&this.restartSimulation()})}restartSimulation(){this.blobs=[],this.startDelay=0,this.initialBlobSpawned=!1,this.dragging=-1,this.hoveredBlob=-1}handleClick(e,t){this.audioEnabled||this.initAudio();const o=this.width/this.height,a=e*o;let n=-1,i=1/0;const s=u.radius*1.2;for(let r=0;r<this.blobs.length;r++){const l=this.blobs[r],c=a-l.x*o,d=t-l.y,h=Math.sqrt(c*c+d*d);h<s&&h<i&&(i=h,n=r)}if(n!==-1){const r=this.blobs[n];this.dragging=n,r.vx=0,r.vy=0,this.dragOffsetX=e-r.x,this.dragOffsetY=t-r.y,this.mouseX=e,this.mouseY=t,this.targetMouseX=e,this.targetMouseY=t,this.dragSamples=[],this.lastDragX=e,this.lastDragY=t,r.targetDrag=1,r.dragAnimTime=0,r.targetHover=0,r.rippleActive=!1,r.ripple=0,this.hoveredBlob=-1,this.blobs.forEach(l=>l.targetHover=0)}else if(this.blobs.length<m){const r=v(e,t);r.ripple=0,r.rippleActive=!0,r.wobble=0,r.wobbleActive=!0,this.blobs.push(r)}}handleRelease(){if(this.dragging===-1)return;const e=this.blobs[this.dragging];let t=0,o=0;if(this.dragSamples.length>0){for(const a of this.dragSamples)t+=a.vx,o+=a.vy;t/=this.dragSamples.length,o/=this.dragSamples.length}e.x=this.mouseX-this.dragOffsetX,e.y=this.mouseY-this.dragOffsetY,e.vx=t,e.vy=o,e.targetDrag=0,e.dragAnimTime=0,e.ripple=0,e.rippleActive=!0,e.wobble=0,e.wobbleActive=!0,this.dragging=-1}updateHoverState(e,t){const o=this.width/this.height,a=e*o;let n=-1,i=1/0;const s=u.radius*1.1;for(let r=0;r<this.blobs.length;r++){const l=this.blobs[r],c=a-l.x*o,d=t-l.y,h=Math.sqrt(c*c+d*d);h<s&&h<i&&(i=h,n=r)}n!==this.hoveredBlob&&(this.hoveredBlob!==-1&&this.hoveredBlob<this.blobs.length&&(this.blobs[this.hoveredBlob].targetHover=0,this.blobs[this.hoveredBlob].hoverAnimTime=0),this.hoveredBlob=n,n!==-1&&(this.blobs[n].targetHover=1,this.blobs[n].hoverAnimTime=0))}easeOutElastic(e){if(e===0||e===1)return e;const t=.4;return Math.pow(2,-10*e)*Math.sin((e-t/4)*(2*Math.PI)/t)+1}async initAudio(){if(!this.audioEnabled)try{const e=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}});this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=256,this.analyser.smoothingTimeConstant=.6,this.analyser.minDecibels=-90,this.analyser.maxDecibels=-10,this.audioContext.createMediaStreamSource(e).connect(this.analyser),this.frequencyData=new Uint8Array(this.analyser.frequencyBinCount),this.audioEnabled=!0,console.log("🎤 Audio spectrum analyzer enabled!")}catch(e){console.warn("Could not access microphone:",e.message)}}updateSpectrum(){if(!this.audioEnabled||!this.analyser)return;this.analyser.getByteFrequencyData(this.frequencyData);const e=this.frequencyData.length;for(let t=0;t<g;t++){let o=0;const a=Math.floor(t*e/g),n=Math.floor((t+1)*e/g);for(let c=a;c<n;c++)o+=this.frequencyData[c];let i=o/(n-a)/255;const s=t/g,r=1+s*s*8;i*=r,i*=2,this.spectrum[t]=Math.min(i,1);const l=i>this.spectrumSmooth[t]?.4:.1;this.spectrumSmooth[t]+=(i-this.spectrumSmooth[t])*l}}update(e){if(super.update(e),this.time+=e*u.speed,this.updateSpectrum(),this.startDelay+=e,!this.initialBlobSpawned&&this.startDelay>=1){this.initialBlobSpawned=!0;const s=v(0,0);s.ripple=0,s.rippleActive=!0,s.wobble=0,s.wobbleActive=!0,this.blobs.push(s)}const t=Math.pow(u.friction,e*60),o=u.boundsX,a=u.boundsY,n=u.maxVel,i=u.elasticDuration;if(this.dragging!==-1){this.mouseX=this.targetMouseX,this.mouseY=this.targetMouseY;const s=this.mouseX-this.lastDragX,r=this.mouseY-this.lastDragY;if(e>0){const l=s/e,c=r/e;this.dragSamples.push({vx:l,vy:c}),this.dragSamples.length>5&&this.dragSamples.shift()}this.lastDragX=this.mouseX,this.lastDragY=this.mouseY}else{const s=1-Math.pow(.1,e);this.mouseX+=(this.targetMouseX-this.mouseX)*s,this.mouseY+=(this.targetMouseY-this.mouseY)*s}for(let s=0;s<this.blobs.length;s++){const r=this.blobs[s];if(this.dragging!==s){r.x+=r.vx*e,r.y+=r.vy*e,r.vx*=t,r.vy*=t;const l=Math.sqrt(r.vx*r.vx+r.vy*r.vy);l>n&&(r.vx=r.vx/l*n,r.vy=r.vy/l*n),r.x>o?(r.x=o,r.vx*=-.85):r.x<-o&&(r.x=-o,r.vx*=-.85),r.y>a?(r.y=a,r.vy*=-.85):r.y<-a&&(r.y=-a,r.vy*=-.85)}if(r.scale<1){r.scaleAnimTime+=e;const l=Math.min(r.scaleAnimTime/(i*4),1);r.scale=this.easeOutElastic(l)}if(r.hoverAnimTime+=e,r.targetHover!==r.hover){const l=Math.min(r.hoverAnimTime/i,1),c=this.easeOutElastic(l),d=r.targetHover===1?0:1;r.hover=d+(r.targetHover-d)*c}if(r.dragAnimTime+=e,r.targetDrag!==r.drag){const l=Math.min(r.dragAnimTime/i,1),c=this.easeOutElastic(l),d=r.targetDrag===1?0:1;r.drag=d+(r.targetDrag-d)*c}r.rippleActive&&(r.ripple+=e,r.ripple>2&&(r.rippleActive=!1)),r.wobbleActive&&(r.wobble+=e,r.wobble>1.5&&(r.wobbleActive=!1))}}render(){const e=this.ctx,t=this.width,o=this.height;if(this.useFallback){this.renderFallback(e,t,o);return}const a={uTime:this.time,uResolution:[t,o],uMouse:[this.mouseX,this.mouseY],uDragOffset:[this.dragOffsetX,this.dragOffsetY],uDragging:this.dragging,uIOR:u.ior,uBlurStrength:u.blurStrength,uRadius:u.radius,uSuperellipseN:u.superellipseN,uBlendRadius:u.blendRadius,uBlobCount:this.blobs.length,uHoverScale:u.hoverScale,uDragScale:u.dragScale,uDragSoften:u.dragSoften,uRippleSpeed:u.rippleSpeed,uRippleDecay:u.rippleDecay,uRippleStrength:u.rippleStrength,uWobbleFreq:u.wobbleFreq,uWobbleDecay:u.wobbleDecay};for(let n=0;n<m;n++){const i=n<this.blobs.length?this.blobs[n]:null;a[`uBlobPos[${n}]`]=i?[i.x,i.y]:[0,0],a[`uBlobScale[${n}]`]=i?i.scale:0,a[`uBlobHover[${n}]`]=i?i.hover:0,a[`uBlobDrag[${n}]`]=i?i.drag:0,a[`uBlobRipple[${n}]`]=i?i.ripple:0,a[`uBlobWobble[${n}]`]=i?i.wobble:0}for(let n=0;n<g;n++)a[`uSpectrum[${n}]`]=this.spectrumSmooth[n];this.webgl.setUniforms(a),this.webgl.clear(0,0,0,1),this.webgl.render(),e.drawImage(this.webgl.getCanvas(),0,0,t,o)}renderFallback(e,t,o){e.fillStyle=this.backgroundColor,e.fillRect(0,0,t,o);const a=t/2,n=o/2,i=40;for(let s=0;s<o;s+=i)for(let r=0;r<t;r+=i){const l=(r/i+s/i)%2===0;e.fillStyle=l?"#1a1520":"#12101a",e.fillRect(r,s,i,i)}this.blobs.forEach((s,r)=>{const l=this.dragging===r?this.mouseX-this.dragOffsetX:s.x,c=this.dragging===r?this.mouseY-this.dragOffsetY:s.y,d=a+l*200,h=n-c*200,f=60;e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(d,h+15,f*1.1,f*.3,0,0,Math.PI*2),e.fill();const b=e.createRadialGradient(d-f*.3,h-f*.3,0,d,h,f);b.addColorStop(0,"rgba(255, 255, 255, 0.4)"),b.addColorStop(.3,"rgba(200, 220, 255, 0.25)"),b.addColorStop(.7,"rgba(150, 180, 220, 0.15)"),b.addColorStop(1,"rgba(200, 220, 255, 0.35)"),e.fillStyle=b,e.beginPath(),e.arc(d,h,f,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.5)",e.lineWidth=2,e.beginPath(),e.arc(d,h,f-2,-.8,.8,!1),e.stroke()})}onResize(){this.webgl&&this.webgl.isAvailable()&&this.webgl.resize(this.width,this.height)}stop(){this.webgl&&this.webgl.destroy(),super.stop()}}function C(p){const e=new y(p);return e.start(),{stop:()=>e.stop(),game:e}}export{C as default};
