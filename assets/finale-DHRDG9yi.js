import{G as s,W as i}from"./index-CyJvuFm5.js";const r=`precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,c=`precision highp float;

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
    // More distinct color palette with dark contrast
    vec3 col1 = vec3(0.0, 0.0, 0.0);        // Black
    vec3 col2 = vec3(0.0, 0.2, 0.05);       // Very dark green
    vec3 col3 = vec3(0.0, 0.6, 0.15);       // Medium green
    vec3 col4 = vec3(0.0, 0.9, 0.3);        // Bright green (terminal)
    vec3 col5 = vec3(1.0, 0.4, 0.0);        // Orange (celebration)
    vec3 col6 = vec3(1.0, 0.0, 0.4);        // Pink (celebration)
    vec3 col7 = vec3(0.4, 0.0, 0.9);        // Purple (celebration)
    
    // Color mixing - green base with celebration colors and dark areas
    vec3 color = col1;
    
    // Dark areas first for contrast
    float darkMask = smoothstep(0.0, 0.2, f);
    color = mix(color, col2, darkMask * 0.8);
    
    // Medium green
    color = mix(color, col3, smoothstep(0.2, 0.5, f));
    
    // Bright green with celebration boost
    color = mix(color, col4, smoothstep(0.4, 0.7, f) * (0.6 + celebrationBoost * 0.4));
    
    // Celebration colors - more distinct
    color = mix(color, col5, smoothstep(0.5, 0.85, q.x) * celebration * 0.8);
    color = mix(color, col6, smoothstep(0.45, 0.75, r.y) * celebration * 0.7);
    color = mix(color, col7, smoothstep(0.65, 0.95, f2) * celebration * 0.6);
    
    // Dark vortex areas - add dark spots for contrast
    float darkVortex = smoothstep(0.7, 0.5, f) * smoothstep(0.3, 0.5, f);
    color = mix(color, col1, darkVortex * 0.4);
    
    // Bright celebration streaks - cyan-green with dark contrast
    float streak = smoothstep(0.6, 0.65, f) * smoothstep(0.7, 0.65, f);
    color += vec3(0.0, 0.8, 0.6) * streak * 2.0 * celebration;
    
    // Celebration rings - brighter green with dark gaps
    color += vec3(0.0, 0.9, 0.25) * rings * 0.9 * celebration;
    
    // Mouse glow - CYAN with dark core for contrast
    vec3 glowCol = vec3(0.0, 0.85, 1.0);  // Bright cyan
    float glowIntensity = mouseInf * 1.8;
    // Add dark core in center of mouse glow
    float darkCore = smoothstep(0.15, 0.0, mouseDist) * mouseInf;
    color = mix(color, col1, darkCore * 0.3);
    color += glowCol * glowIntensity;
    
    // Mouse ripple rings - cyan with dark gaps
    float ripple = sin(mouseDist * 20.0 - t * 10.0) * 0.5 + 0.5;
    ripple *= mouseInf * smoothstep(0.0, 1.0, mouseDist);
    // Add dark gaps between ripples
    float darkRipple = smoothstep(0.05, 0.0, abs(sin(mouseDist * 20.0 - t * 10.0))) * mouseInf;
    color = mix(color, col1, darkRipple * 0.2);
    color += vec3(0.0, 0.7, 1.0) * ripple * 0.9;
    
    // Overall brightness - brighter when complete
    color *= 1.0 + celebrationBoost * 0.5;
    
    // Vignette
    float vig = 1.0 - length(uv - 0.5) * 0.4;
    color *= vig;
    
    // Clamp
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`,a={background:"#000"};class l extends s{constructor(e){super(e),this.backgroundColor=a.background}init(){if(super.init(),this.webgl=new i(this.width,this.height),!this.webgl.isAvailable()){console.warn("WebGL not available"),this.useFallback=!0;return}this.webgl.useProgram("finale",r,c),this.time=0,this.completion=1,this.mouseX=0,this.mouseY=0,this.mouseActive=0,this.canvas.addEventListener("mousemove",e=>{const n=this.canvas.getBoundingClientRect();this.mouseX=(e.clientX-n.left)/n.width*2-1,this.mouseY=-((e.clientY-n.top)/n.height*2-1),this.mouseActive=1}),this.canvas.addEventListener("mouseleave",()=>{this.mouseActive=0}),this.canvas.addEventListener("touchmove",e=>{e.preventDefault();const n=this.canvas.getBoundingClientRect(),t=e.touches[0];this.mouseX=(t.clientX-n.left)/n.width*2-1,this.mouseY=-((t.clientY-n.top)/n.height*2-1),this.mouseActive=1},{passive:!1}),this.canvas.addEventListener("touchend",()=>{this.mouseActive=0})}update(e){super.update(e),this.time+=e}render(){const e=this.ctx,n=this.width,t=this.height;if(this.useFallback){e.fillStyle="#000",e.fillRect(0,0,n,t),e.fillStyle="#0f0",e.font="16px monospace",e.textAlign="center",e.fillText("WebGL not available",n/2,t/2);return}this.webgl.setUniforms({uTime:this.time,uResolution:[n,t],uMouse:[this.mouseX,this.mouseY],uMouseActive:this.mouseActive,uCompletion:this.completion}),this.webgl.clear(0,0,0,1),this.webgl.render(),e.drawImage(this.webgl.getCanvas(),0,0,n,t)}onResize(e,n){super.onResize(e,n),this.webgl&&!this.useFallback&&this.webgl.resize(e,n)}}function m(o){const e=new l(o);return e.start(),{stop:()=>e.stop(),game:e}}export{m as default};
