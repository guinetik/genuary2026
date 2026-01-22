import{G as v,W as m}from"./gcanvas.es-DYEWWlgH.js";const c={speed:.3,ior:1.5,blurStrength:1.5,radius:.28,superellipseN:4,blendRadius:.15},b=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,X=`
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
`;class Y extends v{constructor(s){super(s),this.backgroundColor="#0a0812"}init(){if(super.init(),this.webgl=new m(this.width,this.height),!this.webgl.isAvailable()){console.warn("WebGL not available, showing fallback"),this.useFallback=!0;return}this.webgl.useProgram("liquidGlass",b,X),this.time=0,this.mouseX=0,this.mouseY=0,this.targetMouseX=0,this.targetMouseY=0,this.dragging=0,this.dragOffsetX=0,this.dragOffsetY=0,this.dropPos1X=-.3,this.dropPos1Y=0,this.dropPos2X=.3,this.dropPos2Y=0,this.vel1X=0,this.vel1Y=0,this.vel2X=0,this.vel2Y=0,this.dragVelX=0,this.dragVelY=0,this.lastDragX=0,this.lastDragY=0,this.dragSamples=[],this.canvas.addEventListener("mousemove",s=>{const t=this.canvas.getBoundingClientRect();this.targetMouseX=((s.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((s.clientY-t.top)/t.height-.5)*2}),this.canvas.addEventListener("mousedown",s=>{const t=this.canvas.getBoundingClientRect(),e=((s.clientX-t.left)/t.width-.5)*2,i=-((s.clientY-t.top)/t.height-.5)*2,a=this.width/this.height,l=e*a,r=l-this.dropPos1X*a,o=i-this.dropPos1Y,n=Math.sqrt(r*r+o*o),d=l-this.dropPos2X*a,h=i-this.dropPos2Y,g=Math.sqrt(d*d+h*h),u=c.radius*1.2;n<u&&n<=g?(this.dragging=1,this.vel1X=0,this.vel1Y=0,this.dragOffsetX=e-this.dropPos1X,this.dragOffsetY=i-this.dropPos1Y,this.mouseX=e,this.mouseY=i,this.targetMouseX=e,this.targetMouseY=i,this.dragSamples=[],this.lastDragX=e,this.lastDragY=i):g<u&&(this.dragging=2,this.vel2X=0,this.vel2Y=0,this.dragOffsetX=e-this.dropPos2X,this.dragOffsetY=i-this.dropPos2Y,this.mouseX=e,this.mouseY=i,this.targetMouseX=e,this.targetMouseY=i,this.dragSamples=[],this.lastDragX=e,this.lastDragY=i)}),this.canvas.addEventListener("mouseup",()=>{let s=0,t=0;if(this.dragSamples.length>0){for(const e of this.dragSamples)s+=e.vx,t+=e.vy;s/=this.dragSamples.length,t/=this.dragSamples.length}this.dragging===1?(this.dropPos1X=this.mouseX-this.dragOffsetX,this.dropPos1Y=this.mouseY-this.dragOffsetY,this.vel1X=s,this.vel1Y=t):this.dragging===2&&(this.dropPos2X=this.mouseX-this.dragOffsetX,this.dropPos2Y=this.mouseY-this.dragOffsetY,this.vel2X=s,this.vel2Y=t),this.dragging=0}),this.canvas.addEventListener("mouseleave",()=>{let s=0,t=0;if(this.dragSamples.length>0){for(const e of this.dragSamples)s+=e.vx,t+=e.vy;s/=this.dragSamples.length,t/=this.dragSamples.length}this.dragging===1?(this.dropPos1X=this.mouseX-this.dragOffsetX,this.dropPos1Y=this.mouseY-this.dragOffsetY,this.vel1X=s,this.vel1Y=t):this.dragging===2&&(this.dropPos2X=this.mouseX-this.dragOffsetX,this.dropPos2Y=this.mouseY-this.dragOffsetY,this.vel2X=s,this.vel2Y=t),this.dragging=0}),this.canvas.addEventListener("touchstart",s=>{const t=this.canvas.getBoundingClientRect(),e=s.touches[0],i=((e.clientX-t.left)/t.width-.5)*2,a=-((e.clientY-t.top)/t.height-.5)*2,l=this.width/this.height,r=i*l,o=r-this.dropPos1X*l,n=a-this.dropPos1Y,d=Math.sqrt(o*o+n*n),h=r-this.dropPos2X*l,g=a-this.dropPos2Y,u=Math.sqrt(h*h+g*g),p=c.radius*1.2;d<p&&d<=u?(this.dragging=1,this.vel1X=0,this.vel1Y=0,this.dragOffsetX=i-this.dropPos1X,this.dragOffsetY=a-this.dropPos1Y,this.mouseX=i,this.mouseY=a,this.targetMouseX=i,this.targetMouseY=a,this.dragSamples=[],this.lastDragX=i,this.lastDragY=a):u<p&&(this.dragging=2,this.vel2X=0,this.vel2Y=0,this.dragOffsetX=i-this.dropPos2X,this.dragOffsetY=a-this.dropPos2Y,this.mouseX=i,this.mouseY=a,this.targetMouseX=i,this.targetMouseY=a,this.dragSamples=[],this.lastDragX=i,this.lastDragY=a)},{passive:!0}),this.canvas.addEventListener("touchmove",s=>{const t=this.canvas.getBoundingClientRect(),e=s.touches[0];this.targetMouseX=((e.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((e.clientY-t.top)/t.height-.5)*2},{passive:!0}),this.canvas.addEventListener("touchend",()=>{let s=0,t=0;if(this.dragSamples.length>0){for(const e of this.dragSamples)s+=e.vx,t+=e.vy;s/=this.dragSamples.length,t/=this.dragSamples.length}this.dragging===1?(this.dropPos1X=this.mouseX-this.dragOffsetX,this.dropPos1Y=this.mouseY-this.dragOffsetY,this.vel1X=s,this.vel1Y=t):this.dragging===2&&(this.dropPos2X=this.mouseX-this.dragOffsetX,this.dropPos2Y=this.mouseY-this.dragOffsetY,this.vel2X=s,this.vel2Y=t),this.dragging=0})}update(s){super.update(s),this.time+=s*c.speed;const t=Math.pow(.995,s*60),e=.85,i=.88,a=.78,l=4;if(this.dragging>0){this.mouseX=this.targetMouseX,this.mouseY=this.targetMouseY;const r=this.mouseX-this.lastDragX,o=this.mouseY-this.lastDragY;if(s>0){const n=r/s,d=o/s;this.dragSamples.push({vx:n,vy:d}),this.dragSamples.length>5&&this.dragSamples.shift()}this.lastDragX=this.mouseX,this.lastDragY=this.mouseY}else{const r=1-Math.pow(.1,s);this.mouseX+=(this.targetMouseX-this.mouseX)*r,this.mouseY+=(this.targetMouseY-this.mouseY)*r}if(this.dragging!==1){this.dropPos1X+=this.vel1X*s,this.dropPos1Y+=this.vel1Y*s,this.vel1X*=t,this.vel1Y*=t;const r=Math.sqrt(this.vel1X*this.vel1X+this.vel1Y*this.vel1Y);r>l&&(this.vel1X=this.vel1X/r*l,this.vel1Y=this.vel1Y/r*l),r<.001&&(this.vel1X=0,this.vel1Y=0),this.dropPos1X>i?(this.dropPos1X=i,this.vel1X=-Math.abs(this.vel1X)*e):this.dropPos1X<-i&&(this.dropPos1X=-i,this.vel1X=Math.abs(this.vel1X)*e),this.dropPos1Y>a?(this.dropPos1Y=a,this.vel1Y=-Math.abs(this.vel1Y)*e):this.dropPos1Y<-a&&(this.dropPos1Y=-a,this.vel1Y=Math.abs(this.vel1Y)*e)}if(this.dragging!==2){this.dropPos2X+=this.vel2X*s,this.dropPos2Y+=this.vel2Y*s,this.vel2X*=t,this.vel2Y*=t;const r=Math.sqrt(this.vel2X*this.vel2X+this.vel2Y*this.vel2Y);r>l&&(this.vel2X=this.vel2X/r*l,this.vel2Y=this.vel2Y/r*l),r<.001&&(this.vel2X=0,this.vel2Y=0),this.dropPos2X>i?(this.dropPos2X=i,this.vel2X=-Math.abs(this.vel2X)*e):this.dropPos2X<-i&&(this.dropPos2X=-i,this.vel2X=Math.abs(this.vel2X)*e),this.dropPos2Y>a?(this.dropPos2Y=a,this.vel2Y=-Math.abs(this.vel2Y)*e):this.dropPos2Y<-a&&(this.dropPos2Y=-a,this.vel2Y=Math.abs(this.vel2Y)*e)}}render(){const s=this.ctx,t=this.width,e=this.height;if(this.useFallback){this.renderFallback(s,t,e);return}this.webgl.setUniforms({uTime:this.time,uResolution:[t,e],uMouse:[this.mouseX,this.mouseY],uDragOffset:[this.dragOffsetX,this.dragOffsetY],uDragging:this.dragging,uDropPos1:[this.dropPos1X,this.dropPos1Y],uDropPos2:[this.dropPos2X,this.dropPos2Y],uIOR:c.ior,uBlurStrength:c.blurStrength,uRadius:c.radius,uSuperellipseN:c.superellipseN,uBlendRadius:c.blendRadius}),this.webgl.clear(0,0,0,1),this.webgl.render(),s.drawImage(this.webgl.getCanvas(),0,0,t,e),s.fillStyle="rgba(255, 255, 255, 0.4)",s.font='14px "Fira Code", monospace',s.textAlign="left",s.fillText("LIQUID GLASS",20,30),s.fillStyle="rgba(255, 255, 255, 0.25)",s.fillText("Drag & throw • Billiard bouncing off walls",20,50)}renderFallback(s,t,e){s.fillStyle=this.backgroundColor,s.fillRect(0,0,t,e);const i=t/2,a=e/2;this.time;const l=40;for(let o=0;o<e;o+=l)for(let n=0;n<t;n+=l){const d=(n/l+o/l)%2===0;s.fillStyle=d?"#1a1520":"#12101a",s.fillRect(n,o,l,l)}[{x:i+(this.dragging===1?this.mouseX-this.dragOffsetX:this.dropPos1X)*200,y:a+(this.dragging===1?this.mouseY-this.dragOffsetY:this.dropPos1Y)*200},{x:i+(this.dragging===2?this.mouseX-this.dragOffsetX:this.dropPos2X)*200,y:a+(this.dragging===2?this.mouseY-this.dragOffsetY:this.dropPos2Y)*200}].forEach((o,n)=>{s.fillStyle="rgba(0, 0, 0, 0.2)",s.beginPath(),s.ellipse(o.x,o.y+15,80*1.1,80*.3,0,0,Math.PI*2),s.fill();const h=s.createRadialGradient(o.x-80*.3,o.y-80*.3,0,o.x,o.y,80);h.addColorStop(0,"rgba(255, 255, 255, 0.4)"),h.addColorStop(.3,"rgba(200, 220, 255, 0.25)"),h.addColorStop(.7,"rgba(150, 180, 220, 0.15)"),h.addColorStop(1,"rgba(200, 220, 255, 0.35)"),s.fillStyle=h,s.beginPath(),s.arc(o.x,o.y,80,0,Math.PI*2),s.fill(),s.strokeStyle="rgba(255, 255, 255, 0.5)",s.lineWidth=2,s.beginPath(),s.arc(o.x,o.y,78,-.8,.8,!1),s.stroke();const g=s.createRadialGradient(o.x-80*.4,o.y-80*.4,0,o.x-80*.4,o.y-80*.4,80*.35);g.addColorStop(0,"rgba(255, 255, 255, 0.7)"),g.addColorStop(1,"transparent"),s.fillStyle=g,s.beginPath(),s.arc(o.x-80*.4,o.y-80*.4,80*.35,0,Math.PI*2),s.fill()}),s.fillStyle="rgba(255, 255, 255, 0.4)",s.font='14px "Fira Code", monospace',s.fillText("LIQUID GLASS (Canvas 2D Fallback)",20,30),s.fillStyle="rgba(255, 255, 255, 0.25)",s.fillText("WebGL not available",20,50)}onResize(){this.webgl&&this.webgl.isAvailable()&&this.webgl.resize(this.width,this.height)}stop(){this.webgl&&this.webgl.destroy(),super.stop()}}function P(f){const s=new Y(f);return s.start(),{stop:()=>s.stop(),game:s}}export{P as default};
