import{G as M,W as w}from"./gcanvas.es-BF2N4r4i.js";const y=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,A=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;

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
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Centered coordinates
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= aspect;

    float t = uTime * 0.5;

    // Mouse in same coordinate space, scaled by activity
    vec2 mouse = uMouse * vec2(aspect, 1.0);
    float mouseDist = length(p - mouse);
    float mouseInf = smoothstep(1.0, 0.0, mouseDist) * uMouseActive;

    // === DOMAIN WARPING ===

    // Base position with mouse push
    vec2 pp = p - mouse * mouseInf * 0.3;

    // Layer 1
    vec2 q = vec2(
        fbm(pp * 1.5 + t * 0.2),
        fbm(pp * 1.5 + vec2(5.2, 1.3) + t * 0.25)
    );

    // Layer 2 - warp with q
    vec2 r = vec2(
        fbm(pp + q * 3.0 + vec2(1.7, 9.2) + t * 0.3),
        fbm(pp + q * 3.0 + vec2(8.3, 2.8) + t * 0.28)
    );

    // Mouse injects energy into the warp
    float mouseEnergy = mouseInf * 2.0;
    r += mouseEnergy * vec2(
        sin(t * 5.0 + mouseDist * 8.0),
        cos(t * 5.0 + mouseDist * 8.0)
    ) * 0.5;

    // Layer 3
    vec2 s = vec2(
        fbm(pp + r * 2.0 + vec2(3.1, 7.4) + t * 0.15),
        fbm(pp + r * 2.0 + vec2(6.8, 1.2) + t * 0.18)
    );

    // Final pattern with all layers
    float f = fbm(pp + q + r * 1.5 + s * 0.5);
    float f2 = fbm(pp * 2.0 + r * 2.0 + t * 0.2);

    // === COLORS ===

    vec3 col1 = vec3(0.02, 0.02, 0.08);  // Deep black-blue
    vec3 col2 = vec3(0.0, 0.25, 0.35);   // Deep teal
    vec3 col3 = vec3(0.6, 0.1, 0.4);     // Magenta
    vec3 col4 = vec3(1.0, 0.5, 0.1);     // Orange
    vec3 col5 = vec3(0.1, 0.7, 0.5);     // Seafoam

    // Color mixing
    vec3 color = col1;
    color = mix(color, col2, smoothstep(0.2, 0.5, f));
    color = mix(color, col3, smoothstep(0.4, 0.7, q.x) * 0.8);
    color = mix(color, col4, smoothstep(0.5, 0.9, r.y) * f);
    color = mix(color, col5, smoothstep(0.3, 0.6, s.x) * f2 * 0.5);

    // Bright streaks
    float streak = smoothstep(0.55, 0.6, f) * smoothstep(0.65, 0.6, f);
    color += vec3(1.0, 0.85, 0.7) * streak * 1.5;

    // Mouse glow - bright and visible
    vec3 glowCol = mix(col4, col5, sin(t * 2.0) * 0.5 + 0.5);
    color += glowCol * mouseInf * 1.5;

    // Mouse ripple rings
    float ripple = sin(mouseDist * 15.0 - t * 8.0) * 0.5 + 0.5;
    ripple *= mouseInf * smoothstep(0.0, 0.8, mouseDist);
    color += vec3(0.5, 0.8, 0.7) * ripple * 0.4;

    // Overall brightness boost
    color *= 1.2;

    // Subtle vignette
    float vig = 1.0 - length(uv - 0.5) * 0.5;
    color *= vig;

    // Clamp
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;class R extends M{constructor(e){super(e),this.backgroundColor="#000"}init(){if(super.init(),this.webgl=new w(this.width,this.height),!this.webgl.isAvailable()){console.warn("WebGL not available, showing fallback"),this.useFallback=!0;return}this.webgl.useProgram("tunnel",y,A),this.time=0,this.mouseX=0,this.mouseY=0,this.targetMouseX=0,this.targetMouseY=0,this.mouseActive=0,this.mouseMoving=!1,this.canvas.addEventListener("mousemove",e=>{const t=this.canvas.getBoundingClientRect();this.targetMouseX=((e.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((e.clientY-t.top)/t.height-.5)*2,this.mouseActive=1,this.mouseMoving=!0}),this.canvas.addEventListener("mouseleave",()=>{this.mouseMoving=!1}),this.canvas.addEventListener("mouseenter",()=>{this.mouseMoving=!0,this.mouseActive=1}),this.canvas.addEventListener("touchmove",e=>{const t=this.canvas.getBoundingClientRect(),o=e.touches[0];this.targetMouseX=((o.clientX-t.left)/t.width-.5)*2,this.targetMouseY=-((o.clientY-t.top)/t.height-.5)*2},{passive:!0}),this.canvas.addEventListener("touchend",()=>{this.targetMouseX=0,this.targetMouseY=0})}update(e){super.update(e),this.time+=e;const t=1-Math.pow(.05,e);this.mouseX+=(this.targetMouseX-this.mouseX)*t,this.mouseY+=(this.targetMouseY-this.mouseY)*t,this.mouseMoving||(this.mouseActive=Math.max(0,this.mouseActive-e*.5))}render(){const e=this.ctx,t=this.width,o=this.height;if(this.useFallback){this.renderFallback(e,t,o);return}this.webgl.setUniforms({uTime:this.time,uResolution:[t,o],uMouse:[this.mouseX,this.mouseY],uMouseActive:this.mouseActive}),this.webgl.clear(0,0,0,1),this.webgl.render(),e.drawImage(this.webgl.getCanvas(),0,0,t,o),e.fillStyle="rgba(255, 255, 255, 0.5)",e.font='14px "Fira Code", monospace',e.textAlign="left",e.fillText("DOMAIN WARPING",20,30),e.fillStyle="rgba(255, 255, 255, 0.3)",e.fillText("Move mouse to disturb",20,50)}renderFallback(e,t,o){e.fillStyle="#000",e.fillRect(0,0,t,o);const s=t/2+this.mouseX*t*.1,i=o/2+this.mouseY*o*.1,u=this.time,v=20;for(let l=v;l>0;l--){const m=(l/v+u*.3)%1,a=m*Math.max(t,o)*.8,f=(1-m)*.8;if(e.strokeStyle=`rgba(0, 255, 100, ${f})`,e.lineWidth=2,e.beginPath(),e.arc(s,i,a,0,Math.PI*2),e.stroke(),l%3===0)for(let c=0;c<12;c++){const n=c/12*Math.PI*2+u*.2,p=s+Math.cos(n)*a*.8,g=i+Math.sin(n)*a*.8,b=s+Math.cos(n)*a,d=i+Math.sin(n)*a;e.beginPath(),e.moveTo(p,g),e.lineTo(b,d),e.stroke()}}const r=e.createRadialGradient(s,i,0,s,i,100);r.addColorStop(0,"rgba(0, 255, 100, 0.5)"),r.addColorStop(1,"transparent"),e.fillStyle=r,e.beginPath(),e.arc(s,i,100,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.5)",e.font='14px "Fira Code", monospace',e.textAlign="left",e.fillText("DOMAIN WARPING (Fallback)",20,30),e.fillStyle="rgba(255, 255, 255, 0.3)",e.fillText("WebGL not available",20,50)}onResize(){this.webgl&&this.webgl.isAvailable()&&this.webgl.resize(this.width,this.height)}stop(){this.webgl&&this.webgl.destroy(),super.stop()}}function I(h){const e=new R(h);return e.start(),{stop:()=>e.stop(),game:e}}export{I as default};
