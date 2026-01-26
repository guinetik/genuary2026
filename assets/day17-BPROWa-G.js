import{G as g,W as d}from"./index-3oaVaAML.js";const c=`
attribute vec2 aPosition;
attribute vec2 aUv;
varying vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,f=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform float uZoom;
uniform vec2 uOffset;
uniform float uRotation;
uniform float uHue;
uniform int uN1;  // Polygon sides
uniform int uN2;  // Polygons at vertex

const float PI = 3.14159265359;
const int MAX_ITER = 80;

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 2D rotation matrix
mat2 rot2D(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

// Tessellate point into fundamental domain
// Returns: xy = transformed point, z = iteration count
vec3 tessellate(vec2 p, float a1, float tana1, float cosda1, float sinda1, float radius, vec2 center) {
  float radius2 = radius * radius;
  float iterations = 0.0;
  
  for (int j = 0; j < MAX_ITER; j++) {
    vec2 ctop = p - center;
    float ctop2 = dot(ctop, ctop);
    
    if (p.y > tana1 * p.x) {
      // Reflect about line L1
      p = vec2(p.x * cosda1 + p.y * sinda1, p.x * sinda1 - p.y * cosda1);
      iterations += 1.0;
    } else if (p.y < 0.0) {
      // Reflect about line L2
      p.y = -p.y;
      iterations += 1.0;
    } else if (ctop2 < radius2) {
      // Invert about circle C
      p = ctop * radius2 / ctop2 + center;
      iterations += 1.0;
    } else {
      break;
    }
  }
  
  return vec3(p, iterations);
}

void main() {
  // Normalized coordinates centered at origin
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y);
  
  // Apply zoom and pan
  uv = uv * uZoom + uOffset;
  
  // Apply rotation
  uv *= rot2D(uRotation);
  
  // Calculate tiling geometry based on n1, n2
  float n1f = float(uN1);
  float n2f = float(uN2);
  float a1 = PI / n1f;
  float a2 = PI / n2f;
  
  float cosa2 = cos(a2);
  float sina1 = sin(a1);
  float denom = cosa2 * cosa2 - sina1 * sina1;
  
  // Handle edge case where tiling isn't hyperbolic
  if (denom <= 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  float coeff = 1.0 / sqrt(denom);
  float radius = sina1 * coeff;
  vec2 center = vec2(cosa2 * coeff, 0.0);
  
  // Pre-compute values
  float da1 = a1 * 2.0;
  float cosda1 = cos(da1);
  float sinda1 = sin(da1);
  float tana1 = tan(a1);
  
  // INFINITE NESTED DISKS - works in both zoom directions
  // Use log-polar coordinates for seamless infinite tiling
  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  
  // Protect against log(0)
  float safeR = max(r, 1e-10);
  
  // Map radius to repeating bands using log
  // This creates infinite disks both inward and outward
  float logR = log(safeR);
  float diskScale = log(3.0); // e^diskScale = ratio between disk radii (3x)
  
  // Get which "level" we're on and position within that level
  float levelF = logR / diskScale;
  float level = floor(levelF);
  float frac = fract(levelF); // 0-1 position within this disk band
  
  // Map frac back to radius within unit disk
  // Use non-linear mapping to show more of the visible pattern
  // frac 0->1 maps to localR 0.2->0.98 (avoid very center where tiles are tiny)
  float localR = 0.2 + frac * 0.78;
  
  // Reconstruct point within normalized disk
  vec2 localP = vec2(cos(angle), sin(angle)) * localR;
  
  // Tessellate the point
  vec3 result = tessellate(localP, a1, tana1, cosda1, sinda1, radius, center);
  vec2 tp = result.xy;
  float iter = result.z;
  
  // Distance from inversion circle (for edge highlighting)
  float distToCircle = abs(length(tp - center) - radius);
  float edgeFactor = exp(-distToCircle * 20.0);
  
  // Color based on iteration count, position, and nesting level
  float hue = mod(uHue + iter * 0.07 + level * 0.12, 1.0);
  float sat = 0.7 + edgeFactor * 0.2;
  float val = 0.4 + edgeFactor * 0.5;
  
  // Draw circle boundaries at each disk edge
  // Boundaries occur where frac is near 0 or 1
  float boundaryWidth = 0.02;
  float nearInner = smoothstep(boundaryWidth, 0.0, frac);
  float nearOuter = smoothstep(1.0 - boundaryWidth, 1.0, frac);
  float boundaryLine = max(nearInner, nearOuter) * 0.6;
  val += boundaryLine;
  
  vec3 col = hsv2rgb(vec3(hue, sat, val));
  
  // Edge lines within tiling
  float line = smoothstep(0.02, 0.0, distToCircle);
  col = mix(col, vec3(1.0), line * 0.4);
  
  gl_FragColor = vec4(col, 1.0);
}
`,a={tilings:[{n1:3,n2:7,name:"Triangles"},{n1:7,n2:3,name:"Heptagons"},{n1:5,n2:4,name:"Pentagons"},{n1:4,n2:5,name:"Squares"},{n1:6,n2:4,name:"Hexagons"},{n1:8,n2:3,name:"Octagons"}],currentTiling:0,rotationSpeed:.1,hueSpeed:.02};class m extends g{constructor(t){super(t),this.backgroundColor="#000"}init(){if(super.init(),this.time=0,this.hue=.38,this.zoom=10,this.targetZoom=10,this.offsetX=0,this.offsetY=0,this.targetOffsetX=0,this.targetOffsetY=0,this.rotation=0,this.isDragging=!1,this.lastMouseX=0,this.lastMouseY=0,this._glRenderer=new d(this.width,this.height),!this._glRenderer.isAvailable()){console.warn("WebGL not available, falling back to basic render"),this._webglAvailable=!1;return}this._webglAvailable=!0,this._glRenderer.useProgram("poincare",c,f),this._hasDragged=!1,this._lastTilingChange=0,this._mouseDownTime=0,this.canvas.addEventListener("mousedown",t=>{this.isDragging=!0,this._hasDragged=!1,this._mouseDownTime=Date.now();const e=this.canvas.getBoundingClientRect();this.lastMouseX=t.clientX-e.left,this.lastMouseY=t.clientY-e.top}),this.canvas.addEventListener("mousemove",t=>{if(!this.isDragging)return;const e=this.canvas.getBoundingClientRect(),i=t.clientX-e.left,s=t.clientY-e.top,o=Math.abs(i-this.lastMouseX),n=Math.abs(s-this.lastMouseY);(o>5||n>5)&&(this._hasDragged=!0);const h=(i-this.lastMouseX)/Math.min(this.width,this.height)*this.zoom*2,l=(s-this.lastMouseY)/Math.min(this.width,this.height)*this.zoom*2;this.targetOffsetX-=h,this.targetOffsetY+=l,this.lastMouseX=i,this.lastMouseY=s}),this.canvas.addEventListener("mouseup",()=>{const t=Date.now(),e=t-this._mouseDownTime,i=t-this._lastTilingChange;!this._hasDragged&&e<300&&i>500&&(a.currentTiling=(a.currentTiling+1)%a.tilings.length,this._lastTilingChange=t),this.isDragging=!1}),this.canvas.addEventListener("mouseleave",()=>{this.isDragging=!1}),this.canvas.addEventListener("wheel",t=>{t.preventDefault();const e=t.deltaY>0?1.1:.9;this.targetZoom*=e,this.targetZoom=Math.min(50,this.targetZoom)},{passive:!1}),this._touches=new Map,this._lastPinchDist=0,this._touchStartTime=0,this._touchMoved=!1,this.canvas.addEventListener("touchstart",t=>{t.preventDefault(),this._touchStartTime=Date.now(),this._touchMoved=!1;for(const e of t.changedTouches)this._touches.set(e.identifier,{x:e.clientX,y:e.clientY});if(this._touches.size===2){const[e,i]=Array.from(this._touches.values());this._lastPinchDist=Math.hypot(i.x-e.x,i.y-e.y),this._lastPinchCenterX=(e.x+i.x)/2,this._lastPinchCenterY=(e.y+i.y)/2,this.isDragging=!1}if(this._touches.size===1){this.isDragging=!0;const e=t.touches[0],i=this.canvas.getBoundingClientRect();this.lastMouseX=e.clientX-i.left,this.lastMouseY=e.clientY-i.top}},{passive:!1}),this.canvas.addEventListener("touchmove",t=>{t.preventDefault();for(const e of t.changedTouches)this._touches.has(e.identifier)&&this._touches.set(e.identifier,{x:e.clientX,y:e.clientY});if(this._touches.size===2){const[e,i]=Array.from(this._touches.values()),s=Math.hypot(i.x-e.x,i.y-e.y),o=(e.x+i.x)/2,n=(e.y+i.y)/2;if(this._lastPinchDist>0){const h=this._lastPinchDist/s;this.targetZoom*=h,this.targetZoom=Math.min(50,this.targetZoom),this._touchMoved=!0,this.canvas.getBoundingClientRect();const l=(o-this._lastPinchCenterX)/Math.min(this.width,this.height)*this.zoom*2,r=(n-this._lastPinchCenterY)/Math.min(this.width,this.height)*this.zoom*2;this.targetOffsetX-=l,this.targetOffsetY+=r}this._lastPinchDist=s,this._lastPinchCenterX=o,this._lastPinchCenterY=n}else if(this._touches.size===1&&this.isDragging){const e=t.touches[0],i=this.canvas.getBoundingClientRect(),s=e.clientX-i.left,o=e.clientY-i.top,n=Math.abs(s-this.lastMouseX),h=Math.abs(o-this.lastMouseY);(n>5||h>5)&&(this._touchMoved=!0);const l=(s-this.lastMouseX)/Math.min(this.width,this.height)*this.zoom*2,r=(o-this.lastMouseY)/Math.min(this.width,this.height)*this.zoom*2;this.targetOffsetX-=l,this.targetOffsetY+=r,this.lastMouseX=s,this.lastMouseY=o}},{passive:!1}),this.canvas.addEventListener("touchend",t=>{t.preventDefault();for(const e of t.changedTouches)this._touches.delete(e.identifier);if(this._touches.size<2&&(this._lastPinchDist=0),this._touches.size===0){this.isDragging=!1;const e=Date.now(),i=e-this._touchStartTime,s=e-this._lastTilingChange;!this._touchMoved&&i<300&&s>500&&(a.currentTiling=(a.currentTiling+1)%a.tilings.length,this._lastTilingChange=e)}},{passive:!1}),this.canvas.addEventListener("touchcancel",()=>{this._touches.clear(),this._lastPinchDist=0,this.isDragging=!1})}update(t){super.update(t),this.time+=t,this.hue=(this.hue+a.hueSpeed*t)%1,this.rotation+=a.rotationSpeed*t,this.isDragging||(this.targetOffsetX*=.98,this.targetOffsetY*=.98),this.zoom+=(this.targetZoom-this.zoom)*.1,this.offsetX+=(this.targetOffsetX-this.offsetX)*.1,this.offsetY+=(this.targetOffsetY-this.offsetY)*.1,this._webglAvailable&&(this._glRenderer.width!==this.width||this._glRenderer.height!==this.height)&&(this._glRenderer.resize(this.width,this.height),this._glRenderer.useProgram("poincare",c,f))}render(){const t=this.ctx;if(this._webglAvailable){const e=a.tilings[a.currentTiling],i=this._glRenderer,s=i.gl;i.useProgram("poincare",c,f),i.setUniforms({uTime:this.time,uResolution:[this.width,this.height],uZoom:this.zoom,uOffset:[this.offsetX,this.offsetY],uRotation:this.rotation,uHue:this.hue});const o=i.programs.get("poincare");s.uniform1i(s.getUniformLocation(o,"uN1"),e.n1),s.uniform1i(s.getUniformLocation(o,"uN2"),e.n2),i.clear(0,0,0,1),i.render(),i.compositeOnto(t,0,0),t.font='14px "Fira Code", monospace',t.fillStyle=`hsl(${this.hue*360}, 70%, 60%)`,t.textAlign="left",t.fillText(`{${e.n1}, ${e.n2}} ${e.name.toUpperCase()}`,15,25),t.fillStyle="rgba(255,255,255,0.5)";const h=this._touches&&this._touches.size>0||"ontouchstart"in window?"TAP: CHANGE · DRAG: PAN · PINCH: ZOOM":"CLICK: CHANGE · DRAG: PAN · SCROLL: ZOOM";t.fillText(h,15,45)}else t.fillStyle="#000",t.fillRect(0,0,this.width,this.height),t.fillStyle="#0f0",t.font="20px monospace",t.textAlign="center",t.fillText("WebGL not available",this.width/2,this.height/2)}stop(){super.stop(),this._glRenderer&&this._glRenderer.destroy()}}function p(u){const t=new m(u);return t.start(),{stop:()=>t.stop(),game:t}}export{p as default};
