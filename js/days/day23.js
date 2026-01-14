/**
 * Genuary 2026 - Day 23
 * Prompt: "Transparency"
 * Credit: PaoloCurtoni
 *
 * LIQUID GLASS
 * Interactive glass lens shader with proper fresnel and refraction physics.
 * Uses IQ's superellipse SDF for smooth organic shapes.
 *
 * Features:
 * - IQ's superellipse SDF design
 * - Proper Fresnel reflectance with IOR
 * - Gaussian blur for frosted glass
 * - Chromatic aberration with lens distortion
 * - Drop shadows
 * - Mouse-controlled blob merging
 */

import { Game, WebGLRenderer } from '@guinetik/gcanvas';

const CONFIG = {
  // Animation
  speed: 0.3,
  
  // Glass properties
  ior: 1.5,  // Index of refraction (glass ~1.5)
  blurStrength: 1.5,
  
  // Shape
  radius: 0.28,
  superellipseN: 4.0,  // Squareness (2=circle, 4=squircle, higher=more square)
  blendRadius: 0.15,
};

// Vertex shader - simple passthrough
const VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment shader - Liquid Glass with proper physics
const FRAGMENT_SHADER = `
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
    
    float radius = uRadius;
    float n = uSuperellipseN;
    
    // Calculate distances to both superellipses
    vec3 dg1 = sdSuperellipse(uv - pos1, radius, n);
    vec3 dg2 = sdSuperellipse(uv - pos2, radius, n);
    float d1 = dg1.x;
    float d2 = dg2.x;
    
    // Blend the two SDFs together
    float d = smin(d1, d2, uBlendRadius);
    
    // === DROP SHADOW ===
    vec2 shadowOffset = vec2(0.0, -0.02);
    float shadowBlur = 0.06;
    
    float shadow1 = sdSuperellipse(uv - pos1 - shadowOffset, radius, n).x;
    float shadow2 = sdSuperellipse(uv - pos2 - shadowOffset, radius, n).x;
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
        float normalizedDepth = clamp(depthInShape / (radius * 0.8), 0.0, 1.0);
        
        // Exponential distortion for lens effect
        float edgeFactor = 1.0 - normalizedDepth;
        float exponentialDistortion = exp(edgeFactor * 3.0) - 1.0;
        
        // Lens distortion
        float baseMagnification = 0.75;
        float lensStrength = 0.4;
        float distortionAmount = exponentialDistortion * lensStrength;
        
        // Chromatic aberration - different distortion per channel
        float baseDistortion = baseMagnification + distortionAmount * distFromCenter;
        
        float redDistortion = baseDistortion * 0.92;
        float greenDistortion = baseDistortion * 1.0;
        float blueDistortion = baseDistortion * 1.08;
        
        vec2 redUV = center + offset * redDistortion;
        vec2 greenUV = center + offset * greenDistortion;
        vec2 blueUV = center + offset * blueDistortion;
        
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
            smin(sdSuperellipse(uv + eps.xy - pos1, radius, n).x, 
                 sdSuperellipse(uv + eps.xy - pos2, radius, n).x, uBlendRadius) -
            smin(sdSuperellipse(uv - eps.xy - pos1, radius, n).x, 
                 sdSuperellipse(uv - eps.xy - pos2, radius, n).x, uBlendRadius),
            smin(sdSuperellipse(uv + eps.yx - pos1, radius, n).x, 
                 sdSuperellipse(uv + eps.yx - pos2, radius, n).x, uBlendRadius) -
            smin(sdSuperellipse(uv - eps.yx - pos1, radius, n).x, 
                 sdSuperellipse(uv - eps.yx - pos2, radius, n).x, uBlendRadius)
        );
        vec3 normal = normalize(vec3(gradient, 0.5));
        vec3 viewDir = vec3(0.0, 0.0, -1.0);
        float fresnelAmount = fresnel(viewDir, normal, uIOR);
        
        // Fresnel reflection
        vec3 fresnelColor = vec3(1.0, 0.98, 0.95);
        finalColor = mix(refractedColor, fresnelColor, fresnelAmount * 0.35);
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
`;

/**
 * Liquid Glass Demo
 */
class LiquidGlassDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#0a0812';
  }

  init() {
    super.init();

    // Initialize WebGL renderer
    this.webgl = new WebGLRenderer(this.width, this.height);

    if (!this.webgl.isAvailable()) {
      console.warn('WebGL not available, showing fallback');
      this.useFallback = true;
      return;
    }

    // Compile shader program
    this.webgl.useProgram('liquidGlass', VERTEX_SHADER, FRAGMENT_SHADER);

    // Time tracking
    this.time = 0;

    // Mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.dragging = 0;  // 0 = none, 1 = blob1, 2 = blob2
    
    // Drag offset - difference between click point and blob center
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    // Drop positions for both blobs
    // Blob 1 starts on the left
    this.dropPos1X = -0.3;
    this.dropPos1Y = 0;
    // Blob 2 starts on the right
    this.dropPos2X = 0.3;
    this.dropPos2Y = 0;
    
    // Velocity for inertia (both blobs) - billiard physics
    this.vel1X = 0;
    this.vel1Y = 0;
    this.vel2X = 0;
    this.vel2Y = 0;
    
    // Velocity tracking for throw calculation
    this.dragVelX = 0;
    this.dragVelY = 0;
    this.lastDragX = 0;
    this.lastDragY = 0;
    this.dragSamples = [];  // Rolling average for smooth throw

    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const clickY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Account for aspect ratio like the shader does
      const aspect = this.width / this.height;
      const clickXAspect = clickX * aspect;
      
      // Check distance to blob 1
      const dx1 = clickXAspect - this.dropPos1X * aspect;
      const dy1 = clickY - this.dropPos1Y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Check distance to blob 2
      const dx2 = clickXAspect - this.dropPos2X * aspect;
      const dy2 = clickY - this.dropPos2Y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      const hitRadius = CONFIG.radius * 1.2;
      
      // Determine which blob was clicked (prefer closer one if overlapping)
      if (dist1 < hitRadius && dist1 <= dist2) {
        this.dragging = 1;
        // Stop any existing velocity
        this.vel1X = 0;
        this.vel1Y = 0;
        // Store offset from click to blob center
        this.dragOffsetX = clickX - this.dropPos1X;
        this.dragOffsetY = clickY - this.dropPos1Y;
        // Immediate response - no smoothing
        this.mouseX = clickX;
        this.mouseY = clickY;
        this.targetMouseX = clickX;
        this.targetMouseY = clickY;
        // Reset drag velocity tracking
        this.dragSamples = [];
        this.lastDragX = clickX;
        this.lastDragY = clickY;
      } else if (dist2 < hitRadius) {
        this.dragging = 2;
        // Stop any existing velocity
        this.vel2X = 0;
        this.vel2Y = 0;
        this.dragOffsetX = clickX - this.dropPos2X;
        this.dragOffsetY = clickY - this.dropPos2Y;
        // Immediate response - no smoothing
        this.mouseX = clickX;
        this.mouseY = clickY;
        this.targetMouseX = clickX;
        this.targetMouseY = clickY;
        // Reset drag velocity tracking
        this.dragSamples = [];
        this.lastDragX = clickX;
        this.lastDragY = clickY;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      // Calculate throw velocity from rolling average
      let throwVelX = 0;
      let throwVelY = 0;
      
      if (this.dragSamples.length > 0) {
        // Use average of recent velocity samples for smooth throw
        for (const sample of this.dragSamples) {
          throwVelX += sample.vx;
          throwVelY += sample.vy;
        }
        throwVelX /= this.dragSamples.length;
        throwVelY /= this.dragSamples.length;
      }
      
      // Save drop position and apply velocity
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
      }
      this.dragging = 0;
    });

    this.canvas.addEventListener('mouseleave', () => {
      // Calculate throw velocity from rolling average
      let throwVelX = 0;
      let throwVelY = 0;
      
      if (this.dragSamples.length > 0) {
        for (const sample of this.dragSamples) {
          throwVelX += sample.vx;
          throwVelY += sample.vy;
        }
        throwVelX /= this.dragSamples.length;
        throwVelY /= this.dragSamples.length;
      }
      
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
      }
      this.dragging = 0;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      const touchY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
      
      // Account for aspect ratio
      const aspect = this.width / this.height;
      const touchXAspect = touchX * aspect;
      
      // Check distance to blob 1
      const dx1 = touchXAspect - this.dropPos1X * aspect;
      const dy1 = touchY - this.dropPos1Y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Check distance to blob 2
      const dx2 = touchXAspect - this.dropPos2X * aspect;
      const dy2 = touchY - this.dropPos2Y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      const hitRadius = CONFIG.radius * 1.2;
      
      // Determine which blob was touched
      if (dist1 < hitRadius && dist1 <= dist2) {
        this.dragging = 1;
        this.vel1X = 0;
        this.vel1Y = 0;
        this.dragOffsetX = touchX - this.dropPos1X;
        this.dragOffsetY = touchY - this.dropPos1Y;
        this.mouseX = touchX;
        this.mouseY = touchY;
        this.targetMouseX = touchX;
        this.targetMouseY = touchY;
        this.dragSamples = [];
        this.lastDragX = touchX;
        this.lastDragY = touchY;
      } else if (dist2 < hitRadius) {
        this.dragging = 2;
        this.vel2X = 0;
        this.vel2Y = 0;
        this.dragOffsetX = touchX - this.dropPos2X;
        this.dragOffsetY = touchY - this.dropPos2Y;
        this.mouseX = touchX;
        this.mouseY = touchY;
        this.targetMouseX = touchX;
        this.targetMouseY = touchY;
        this.dragSamples = [];
        this.lastDragX = touchX;
        this.lastDragY = touchY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetMouseX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      this.targetMouseY = -((touch.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      // Calculate throw velocity from rolling average
      let throwVelX = 0;
      let throwVelY = 0;
      
      if (this.dragSamples.length > 0) {
        for (const sample of this.dragSamples) {
          throwVelX += sample.vx;
          throwVelY += sample.vy;
        }
        throwVelX /= this.dragSamples.length;
        throwVelY /= this.dragSamples.length;
      }
      
      if (this.dragging === 1) {
        this.dropPos1X = this.mouseX - this.dragOffsetX;
        this.dropPos1Y = this.mouseY - this.dragOffsetY;
        this.vel1X = throwVelX;
        this.vel1Y = throwVelY;
      } else if (this.dragging === 2) {
        this.dropPos2X = this.mouseX - this.dragOffsetX;
        this.dropPos2Y = this.mouseY - this.dragOffsetY;
        this.vel2X = throwVelX;
        this.vel2Y = throwVelY;
      }
      this.dragging = 0;
    });
  }

  update(dt) {
    super.update(dt);
    this.time += dt * CONFIG.speed;

    // Billiard physics constants
    const friction = Math.pow(0.995, dt * 60);  // Frame-rate independent friction
    const bounce = 0.85;      // High bounce coefficient (billiard-like)
    const boundsX = 0.88;     // Horizontal boundary
    const boundsY = 0.78;     // Vertical boundary
    const maxVel = 4.0;       // Cap maximum velocity

    // When dragging, use immediate mouse position (no smoothing)
    if (this.dragging > 0) {
      // Immediate response while dragging
      this.mouseX = this.targetMouseX;
      this.mouseY = this.targetMouseY;
      
      // Calculate instantaneous velocity for throw
      const dx = this.mouseX - this.lastDragX;
      const dy = this.mouseY - this.lastDragY;
      
      if (dt > 0) {
        const vx = dx / dt;
        const vy = dy / dt;
        
        // Add to rolling samples (keep last 5 for smooth average)
        this.dragSamples.push({ vx, vy });
        if (this.dragSamples.length > 5) {
          this.dragSamples.shift();
        }
      }
      
      this.lastDragX = this.mouseX;
      this.lastDragY = this.mouseY;
    } else {
      // When not dragging, smooth mouse for shader effects
      const ease = 1 - Math.pow(0.1, dt);
      this.mouseX += (this.targetMouseX - this.mouseX) * ease;
      this.mouseY += (this.targetMouseY - this.mouseY) * ease;
    }
    
    // Blob 1 physics (billiard-style wall bouncing)
    if (this.dragging !== 1) {
      // Apply velocity
      this.dropPos1X += this.vel1X * dt;
      this.dropPos1Y += this.vel1Y * dt;
      
      // Apply friction (frame-rate independent)
      this.vel1X *= friction;
      this.vel1Y *= friction;
      
      // Clamp velocity
      const speed1 = Math.sqrt(this.vel1X * this.vel1X + this.vel1Y * this.vel1Y);
      if (speed1 > maxVel) {
        this.vel1X = (this.vel1X / speed1) * maxVel;
        this.vel1Y = (this.vel1Y / speed1) * maxVel;
      }
      
      // Stop if very slow
      if (speed1 < 0.001) {
        this.vel1X = 0;
        this.vel1Y = 0;
      }
      
      // Bounce off walls (billiard style)
      if (this.dropPos1X > boundsX) {
        this.dropPos1X = boundsX;
        this.vel1X = -Math.abs(this.vel1X) * bounce;
      } else if (this.dropPos1X < -boundsX) {
        this.dropPos1X = -boundsX;
        this.vel1X = Math.abs(this.vel1X) * bounce;
      }
      
      if (this.dropPos1Y > boundsY) {
        this.dropPos1Y = boundsY;
        this.vel1Y = -Math.abs(this.vel1Y) * bounce;
      } else if (this.dropPos1Y < -boundsY) {
        this.dropPos1Y = -boundsY;
        this.vel1Y = Math.abs(this.vel1Y) * bounce;
      }
    }
    
    // Blob 2 physics (billiard-style wall bouncing)
    if (this.dragging !== 2) {
      // Apply velocity
      this.dropPos2X += this.vel2X * dt;
      this.dropPos2Y += this.vel2Y * dt;
      
      // Apply friction (frame-rate independent)
      this.vel2X *= friction;
      this.vel2Y *= friction;
      
      // Clamp velocity
      const speed2 = Math.sqrt(this.vel2X * this.vel2X + this.vel2Y * this.vel2Y);
      if (speed2 > maxVel) {
        this.vel2X = (this.vel2X / speed2) * maxVel;
        this.vel2Y = (this.vel2Y / speed2) * maxVel;
      }
      
      // Stop if very slow
      if (speed2 < 0.001) {
        this.vel2X = 0;
        this.vel2Y = 0;
      }
      
      // Bounce off walls (billiard style)
      if (this.dropPos2X > boundsX) {
        this.dropPos2X = boundsX;
        this.vel2X = -Math.abs(this.vel2X) * bounce;
      } else if (this.dropPos2X < -boundsX) {
        this.dropPos2X = -boundsX;
        this.vel2X = Math.abs(this.vel2X) * bounce;
      }
      
      if (this.dropPos2Y > boundsY) {
        this.dropPos2Y = boundsY;
        this.vel2Y = -Math.abs(this.vel2Y) * bounce;
      } else if (this.dropPos2Y < -boundsY) {
        this.dropPos2Y = -boundsY;
        this.vel2Y = Math.abs(this.vel2Y) * bounce;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (this.useFallback) {
      this.renderFallback(ctx, w, h);
      return;
    }

    // Set shader uniforms
    this.webgl.setUniforms({
      uTime: this.time,
      uResolution: [w, h],
      uMouse: [this.mouseX, this.mouseY],
      uDragOffset: [this.dragOffsetX, this.dragOffsetY],
      uDragging: this.dragging,
      uDropPos1: [this.dropPos1X, this.dropPos1Y],
      uDropPos2: [this.dropPos2X, this.dropPos2Y],
      uIOR: CONFIG.ior,
      uBlurStrength: CONFIG.blurStrength,
      uRadius: CONFIG.radius,
      uSuperellipseN: CONFIG.superellipseN,
      uBlendRadius: CONFIG.blendRadius,
    });

    // Render
    this.webgl.clear(0, 0, 0, 1);
    this.webgl.render();

    // Composite onto main canvas
    ctx.drawImage(this.webgl.getCanvas(), 0, 0, w, h);

    // Overlay text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LIQUID GLASS', 20, 30);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('Drag & throw • Billiard bouncing off walls', 20, 50);
  }

  /**
   * Canvas 2D fallback
   */
  renderFallback(ctx, w, h) {
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const time = this.time;

    // Checker background
    const tileSize = 40;
    for (let y = 0; y < h; y += tileSize) {
      for (let x = 0; x < w; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#1a1520' : '#12101a';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Two glass blobs - both draggable (apply offset so blob doesn't jump to cursor)
    const positions = [
      { 
        x: cx + (this.dragging === 1 ? (this.mouseX - this.dragOffsetX) : this.dropPos1X) * 200, 
        y: cy + (this.dragging === 1 ? (this.mouseY - this.dragOffsetY) : this.dropPos1Y) * 200 
      },
      { 
        x: cx + (this.dragging === 2 ? (this.mouseX - this.dragOffsetX) : this.dropPos2X) * 200, 
        y: cy + (this.dragging === 2 ? (this.mouseY - this.dragOffsetY) : this.dropPos2Y) * 200 
      },
    ];

    positions.forEach((pos, i) => {
      const radius = 80;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + 15, radius * 1.1, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass blob with gradient
      const gradient = ctx.createRadialGradient(
        pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
        pos.x, pos.y, radius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.25)');
      gradient.addColorStop(0.7, 'rgba(150, 180, 220, 0.15)');
      gradient.addColorStop(1, 'rgba(200, 220, 255, 0.35)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius - 2, -0.8, 0.8, false);
      ctx.stroke();

      // Specular
      const specGradient = ctx.createRadialGradient(
        pos.x - radius * 0.4, pos.y - radius * 0.4, 0,
        pos.x - radius * 0.4, pos.y - radius * 0.4, radius * 0.35
      );
      specGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      specGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = specGradient;
      ctx.beginPath();
      ctx.arc(pos.x - radius * 0.4, pos.y - radius * 0.4, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    // Text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px "Fira Code", monospace';
    ctx.fillText('LIQUID GLASS (Canvas 2D Fallback)', 20, 30);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('WebGL not available', 20, 50);
  }

  onResize() {
    if (this.webgl && this.webgl.isAvailable()) {
      this.webgl.resize(this.width, this.height);
    }
  }

  stop() {
    if (this.webgl) {
      this.webgl.destroy();
    }
    super.stop();
  }
}

/**
 * Create Day 23 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day23(canvas) {
  const game = new LiquidGlassDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
