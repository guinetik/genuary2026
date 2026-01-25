precision highp float;

varying vec2 vUv;
uniform sampler2D uVideoTexture;
uniform vec2 uResolution;
uniform float uTime;

// Audio → Visual effects
uniform float uBassLevel;      // Bass → blur/zoom pulse
uniform float uMidLevel;        // Mids → hue rotation
uniform float uHighLevel;       // Highs → edge detection
uniform float uAmplitude;       // Amplitude → saturation
uniform float uSilence;         // Silence → solarization

// Visual → Audio feedback
uniform vec3 uDominantColor;    // Dominant color tint
uniform float uMotionAmount;    // Motion particles
uniform float uBrightness;      // Brightness reverb

// Spectrum analyzer
uniform float uSpectrumBars;      // Number of bars (float to avoid WebGL uniform type mismatch)
uniform float uAudioFrequencies[64];  // Audio frequency data (normalized 0-1) - must match spectrumBars
uniform float uVideoFrequencies[64]; // Video frequency data (normalized 0-1) - must match spectrumBars

// Mouse ripple effect
uniform vec2 uMouse;            // Mouse position (normalized 0-1)
uniform float uMouseDown;        // Mouse button down (1.0 or 0.0)
uniform float uRippleTime;      // Time since last ripple

// Hash function for noise
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

// FBM (Fractal Brownian Motion)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
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

// Rotation matrix (like Shadertoy rot function)
mat2 rot(float a) {
  float c = cos(a + 3.14159265359 * 0.25);
  float s = sin(a + 3.14159265359 * 0.25);
  return mat2(c, -s, s, c);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// === 3D PERLIN NOISE FUNCTIONS (from Shadertoy) ===
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

vec3 hash3(vec3 p) {
  // rand in [-1,1]
  p = vec3(
    dot(p, vec3(127.1, 311.7, 213.6)),
    dot(p, vec3(327.1, 211.7, 113.6)),
    dot(p, vec3(269.5, 183.3, 351.1))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise3(in vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(
      mix(dot(hash3(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
         dot(hash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(hash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
         dot(hash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(
      mix(dot(hash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
         dot(hash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(hash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
         dot(hash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z
  );
}

// Perlin ripple effect using 3D noise
vec3 perlinRippleEffect(vec2 uv, float time, sampler2D videoTex, vec2 videoUV, float aspect) {
  // Scale screenspace to something that looks good (similar to Shadertoy)
  // Convert normalized UV (0-1) to centered coordinates (-1 to 1)
  vec2 centeredUV = (uv - 0.5) * 2.0;
  centeredUV.x *= aspect; // Account for aspect ratio
  
  // Scale to match Shadertoy's scaling
  vec2 scaledUV = centeredUV * 20.0;
  
  // Position vector uses (normalized):
  // (1,1,1) for time
  // (-2,1,1) for X
  // (0,1,-1) for Y
  vec3 pos = vec3(time);
  pos += scaledUV.x * vec3(-0.816496581, 0.40824829, 0.40824829);
  pos += scaledUV.y * vec3(0.0, 0.707106781, -0.707106781);
  
  // Taking sine of noise gives us those nice ripples
  float n = smoothstep(-0.5, 0.5, sin(20.0 * noise3(pos)) - length(scaledUV) * 0.07);
  
  // Tonemap to give it some color
  vec3 tm = pow(vec3(n), vec3(0.861500049, 0.119706701, 0.002050083));
  
  // Sample video texture and blend with ripple pattern
  vec3 videoColor = texture2D(videoTex, videoUV).rgb;
  
  // Blend ripple pattern with video (ripple acts as overlay/mask)
  return mix(videoColor, tm, n * 0.6);
}

// === RAYMARCHED TUNNEL EFFECT FUNCTIONS ===

// Alternative hash function for tunnel noise
float hashTunnel(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

// Alternative noise function for tunnel
float noiseTunnel(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(hashTunnel(i + vec2(0.0, 0.0)), hashTunnel(i + vec2(1.0, 0.0)), u.x),
    mix(hashTunnel(i + vec2(0.0, 1.0)), hashTunnel(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Rotate function for tunnel
vec2 rotateTunnel(vec2 uv, float r) {
  float s = sin(r);
  float c = cos(r);
  return uv * mat2(c, -s, s, c);
}

// Raymarch tunnel and sample video texture
vec3 raymarchTunnel(vec2 uv, float time, sampler2D videoTex, vec2 videoUV, float isVertical) {
  const float PI = 3.14159265359;
  float fovzoom = 0.4;
  
  // Create rotation based on time
  float rot = smoothstep(-0.005, 0.005, sin(0.1 * time + 4.0)) * PI * 0.5;
  uv = rotateTunnel(uv, rot);
  
  // Calculate render parameters
  float pOscillation = 0.1 * sin(time * 1.137) * (1.0 + 0.1 * cos(time * 0.37));
  vec3 camPos = vec3(pOscillation, sin(time * 17.39) * abs(pOscillation * pOscillation), -1.0);
  vec3 f = normalize(mix(-camPos, vec3(0.0, 0.0, 1.0), 0.6));
  vec3 u = vec3(0.0, 1.0, 0.0);
  vec3 r = cross(f, u);
  vec3 sCenter = camPos + f * fovzoom;
  vec3 screenPoint = sCenter + uv.x * r + uv.y * u;
  vec3 rayDir = normalize(screenPoint - camPos);
  
  // Raymarch - check horizontal or vertical walls based on orientation
  vec3 ray;
  float rayL = 0.0;
  float rayStep = 0.0;
  for (int i = 0; i < 250; i++) {
    ray = camPos + rayDir * rayL;
    // Vertical tunnel: check Y walls, Horizontal: check X walls
    float verticalStep = min(abs(ray.y - 1.0), abs(ray.y + 1.0));
    float horizontalStep = min(abs(ray.x - 1.0), abs(ray.x + 1.0));
    rayStep = mix(horizontalStep, verticalStep, isVertical);
    if (rayStep < 0.001) break;
    rayL += rayStep;
  }
  
  // Calculate wall UVs and sample from video texture
  vec3 col = vec3(0.7) + 0.5 * cos(time + uv.xyx + vec3(0.0, 2.0, 4.0));
  vec2 oUV = vec2(0.0);
  
  if (rayStep < 0.001) {
    // Ray hit wall - sample from video texture
    // Use mix to select vertical or horizontal mapping
    vec2 oUV_horizontal = vec2(ray.z, ray.y + step(ray.x, 0.0) * 33.1 + (time * 0.097));
    vec2 oUV_vertical = vec2(ray.z, ray.x + step(ray.y, 0.0) * 33.1 + (time * 0.097));
    oUV = mix(oUV_horizontal, oUV_vertical, isVertical);
    oUV.x += time * 7.0;
    
    // Map tunnel UVs to video texture coordinates
    vec2 videoSampleUV = fract(oUV * 0.1) * 0.5 + 0.25;
    videoSampleUV = clamp(videoSampleUV, 0.0, 1.0);
    
    // Sample video texture for wall color
    vec3 wallCol = texture2D(videoTex, videoSampleUV).rgb;
    
    // Add noise-based pattern from video
    float noiseVal = noiseTunnel(oUV * 2.2);
    vec3 noiseCol = texture2D(videoTex, fract(videoSampleUV + noiseVal * 0.1)).rgb;
    
    // Mix wall color with noise pattern
    float mixFactor = 0.6 + 0.35 * sin(0.253 * time);
    wallCol = mix(noiseCol, wallCol, mixFactor);
    
    // Apply perspective fade (horizontal or vertical based on orientation)
    float fadeX = min(7.0 * abs(uv.x), 1.0);
    float fadeY = min(7.0 * abs(uv.y), 1.0);
    float fade = mix(fadeX, fadeY, isVertical);
    wallCol *= fade;
    
    col = mix(col, wallCol, fade);
  }
  
  return col;
}

void main() {
  // Flip UV vertically (video textures are often upside down in WebGL)
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  
  // Centered coordinates for distortion
  vec2 p = (uv - 0.5) * 2.0;
  float aspect = uResolution.x / uResolution.y;
  p.x *= aspect;
  
  // === DOMAIN WARPING ===
  // Audio-reactive warping intensity (increased)
  float warpIntensity = uBassLevel * 0.8 + uAmplitude * 0.5 + uHighLevel * 0.3;
  float t = uTime * 0.5;
  
  // Rotating domain warp (like finale.frag)
  vec2 pp = rotate(p, t * 0.1);
  
  // Layer 1: FBM noise for warping
  vec2 q = vec2(
    fbm(pp * 2.0 + t * 0.3),
    fbm(pp * 2.0 + vec2(5.2, 1.3) + t * 0.35)
  );
  
  // Layer 2: More complex warping
  vec2 r = vec2(
    fbm(pp + q * 2.5 + vec2(1.7, 9.2) + t * 0.4),
    fbm(pp + q * 2.5 + vec2(8.3, 2.8) + t * 0.38)
  );
  
  // Apply warping to UV coordinates
  vec2 warpedUV = uv + (q + r) * warpIntensity * 0.1;
  
  // Barrel/pincushion distortion (bass reactive)
  float dist = length(p);
  float barrelDistortion = 1.0 + uBassLevel * dist * dist * 0.2;
  vec2 distortedUV = (p * barrelDistortion) / vec2(aspect, 1.0) * 0.5 + 0.5;
  
  // Combine warping and barrel distortion
  vec2 finalUV = mix(warpedUV, distortedUV, uBassLevel * 0.4);
  
  // === AUDIO-REACTIVE WAVE DISTORTION ===
  // Waves pulse with the rhythm - frequency and amplitude react to audio (tuned down)
  // Use amplitude for overall rhythm, bass for pulse strength, mids for wave frequency
  float rhythmPulse = uAmplitude; // Overall rhythm intensity
  float waveSpeed = 1.5 + uMidLevel * 2.0; // Wave speed reacts to mids (reduced)
  float waveStrength = uBassLevel * 0.02 + uAmplitude * 0.015; // Wave strength reduced (was 0.05/0.03)
  
  // Wave distortion that pulses with the music rhythm (less intense)
  float waveX = sin(finalUV.y * 10.0 + t * waveSpeed) * waveStrength * rhythmPulse * 0.6; // Additional 0.6 multiplier
  float waveY = cos(finalUV.x * 10.0 + t * waveSpeed * 1.2) * waveStrength * rhythmPulse * 0.6;
  finalUV += vec2(waveX, waveY);
  
  // === MOUSE RIPPLE EFFECT ===
  // Create water ripple effect from mouse position
  vec2 mousePos = uMouse;
  vec2 toPixel = finalUV - mousePos;
  float distToMouse = length(toPixel);
  
  // Ripple parameters
  const float RIPPLE_SPEED = 2.0;
  const float RIPPLE_FREQUENCY = 20.0;
  const float RIPPLE_DAMPING = 0.8;
  const float RIPPLE_STRENGTH = 0.15;
  const float RIPPLE_RADIUS = 0.3;
  
  // Calculate ripple wave
  float rippleAge = uRippleTime * RIPPLE_SPEED;
  float rippleDist = distToMouse - rippleAge;
  
  // Create multiple ripple rings
  float ripple = 0.0;
  for (int i = 0; i < 3; i++) {
    float ringDist = rippleDist + float(i) * 0.15;
    float ringAge = rippleAge - float(i) * 0.15;
    
    if (ringAge > 0.0 && ringDist < RIPPLE_RADIUS && ringDist > -RIPPLE_RADIUS) {
      // Wave function with damping
      float wave = sin(ringDist * RIPPLE_FREQUENCY) * exp(-ringAge * RIPPLE_DAMPING);
      wave *= smoothstep(RIPPLE_RADIUS, 0.0, abs(ringDist));
      ripple += wave * RIPPLE_STRENGTH * (1.0 - float(i) * 0.3);
    }
  }
  
  // Apply ripple displacement (radial outward)
  if (uMouseDown > 0.5 && distToMouse > 0.001) {
    vec2 rippleDir = normalize(toPixel);
    finalUV += rippleDir * ripple;
  }
  
  // Continuous ripple while mouse is down (for dragging effect)
  if (uMouseDown > 0.5) {
    float continuousRipple = sin(distToMouse * RIPPLE_FREQUENCY - uTime * RIPPLE_SPEED * 2.0);
    continuousRipple *= exp(-distToMouse * 2.0) * RIPPLE_STRENGTH * 0.3;
    if (distToMouse > 0.001 && distToMouse < RIPPLE_RADIUS) {
      vec2 rippleDir = normalize(toPixel);
      finalUV += rippleDir * continuousRipple;
    }
  }
  
  // === SPECTRUM ANALYZER DISTORTION ===
  // Use spectrum bars to distort the image (bars push/pull the image)
  if (uSpectrumBars > 0.0) {
    // Calculate which bar affects this pixel
    float barIndex = floor(finalUV.x * float(uSpectrumBars));
    float barWidth = 1.0 / float(uSpectrumBars);
    float barCenter = (barIndex + 0.5) * barWidth;
    float barDist = abs(finalUV.x - barCenter) / barWidth;
    
    // Get frequency values for this bar
    float audioFreq = 0.0;
    float videoFreq = 0.0;
    int targetBar = int(clamp(barIndex, 0.0, float(uSpectrumBars) - 1.0));
    
    // Loop through bars to find the matching one (constant index access)
    int numBars = int(uSpectrumBars);
    for (int i = 0; i < 64; i++) {
      if (i >= numBars) break;
      if (i == targetBar) {
        audioFreq = uAudioFrequencies[i];
        videoFreq = uVideoFrequencies[i];
        break;
      }
    }
    
    // Combine audio and video frequencies
    float combinedFreq = audioFreq * 0.7 + videoFreq * 0.3;
    
    // Wave speed pulses with overall rhythm (amplitude) - reduced
    float waveSpeed = 2.0 + uAmplitude * 1.5; // Reduced from 3.0 + 2.0
    
    // Distort Y coordinate based on frequency (bars push image up/down)
    // Wave strength pulses with rhythm - tuned down
    float distortionAmount = combinedFreq * 0.08 * uAmplitude; // Reduced from 0.15
    float distortionWave = sin(finalUV.y * 20.0 + t * waveSpeed) * distortionAmount;
    finalUV.y += distortionWave;
    
    // Distort X coordinate based on bar position (bars create vertical waves)
    // Also pulses with rhythm - tuned down
    float xDistortion = sin(finalUV.y * 15.0 + barIndex * 0.5 + t * waveSpeed * 0.8) * combinedFreq * 0.04 * uAmplitude; // Reduced from 0.08
    finalUV.x += xDistortion;
  }
  
  // Sample video with distorted UV (before special effects)
  vec4 baseColor = texture2D(uVideoTexture, finalUV);
  
  // === EFFECT STATE MACHINE ===
  // States: 0 = No effect, 1 = Kaleidoscope, 2 = Tunnel/Stargate, 3 = Perlin
  // Cycle: No effect (6s) -> Perlin (6s) -> Stargate (4s) -> No effect (6s) -> repeat
  // Audio overrides: Very loud = Kaleidoscope, Quiet = Stargate
  
  const float STATE_NO_EFFECT = 0.0;
  const float STATE_KALEIDO = 1.0;
  const float STATE_STARGATE = 2.0;
  const float STATE_PERLIN = 3.0;
  
  // State durations (seconds)
  const float DURATION_NO_EFFECT = 6.0;
  const float DURATION_STARGATE = 4.0; // Shorter - show less often
  const float DURATION_PERLIN = 6.0;
  
  // Calculate total cycle duration
  const float CYCLE_DURATION = DURATION_NO_EFFECT + DURATION_PERLIN + DURATION_STARGATE + DURATION_NO_EFFECT;
  
  // Determine which state we're in based on time
  float cycleTime = mod(uTime, CYCLE_DURATION);
  float currentState = STATE_NO_EFFECT;
  
  if (cycleTime < DURATION_NO_EFFECT) {
    currentState = STATE_NO_EFFECT;
  } else if (cycleTime < DURATION_NO_EFFECT + DURATION_PERLIN) {
    currentState = STATE_PERLIN;
  } else if (cycleTime < DURATION_NO_EFFECT + DURATION_PERLIN + DURATION_STARGATE) {
    currentState = STATE_STARGATE;
  } else {
    currentState = STATE_NO_EFFECT; // Second no-effect period
  }
  
  // Audio-based overrides
  // Kaleidoscope: Brief blink/flash effect - only show for ~0.3 seconds when triggered
  // Use a fast pulse pattern so it blinks instead of staying on
  float kaleidoTrigger = step(0.6, uAmplitude) * step(0.65, uBassLevel);
  
  // Create a brief pulse: fast on/off cycle (blink effect)
  // Pulse every 0.5 seconds, on for 0.15 seconds
  float kaleidoPulse = mod(uTime, 0.5);
  float kaleidoBlink = step(kaleidoPulse, 0.15); // On for first 0.15s of each 0.5s cycle
  
  // Only show kaleidoscope if audio triggers AND we're in the blink window
  if (kaleidoTrigger > 0.5 && kaleidoBlink > 0.5) {
    currentState = STATE_KALEIDO;
  }
  // Stargate: When quiet OR already in stargate period
  else if (uAmplitude < 0.2 && uBassLevel < 0.25) {
    currentState = STATE_STARGATE;
  }
  
  // Transition: Simple fade at state boundaries
  float transition = 1.0;
  const float FADE_TIME = 0.8; // Fade duration in seconds
  
  // Calculate fade based on position in cycle
  float cycleProgress = mod(cycleTime, CYCLE_DURATION) / CYCLE_DURATION;
  // Fade in/out at cycle boundaries
  float fadeIn = smoothstep(0.0, FADE_TIME / CYCLE_DURATION, cycleProgress);
  float fadeOut = smoothstep(1.0, 1.0 - FADE_TIME / CYCLE_DURATION, cycleProgress);
  transition = fadeIn * fadeOut;
  transition = max(transition, 0.95); // Keep effects visible
  
  vec4 color = baseColor;
  
  // Apply selected effect based on state
  if (currentState < 0.5) {
    // STATE_NO_EFFECT: Just base color (no effect applied)
    // color stays as baseColor
    
  } else if (currentState < 1.5) {
    // STATE_KALEIDO: Kaleidoscope (only when loud)
    // KALEIDOSCOPIC EFFECT - Always visible when selected
    vec2 kaleidoUV = (uv - 0.5) * 2.0;
    kaleidoUV.x *= aspect;
    kaleidoUV *= (cos(t * 0.5) + 1.5) * 1.2;
    
    vec3 kaleidoColor = vec3(0.0);
    const float PI = 3.14159265359;
    float scale = PI / 3.0;
    float m = 0.5;
    
    vec2 iterUV = kaleidoUV;
    for (int i = 0; i < 10; i++) {
      float scaleFactor = float(i) + (sin(t * 0.05) + 1.5);
      iterUV *= rot(t * scaleFactor * 0.01);
      
      float theta = atan(iterUV.x, iterUV.y) + PI;
      theta = (floor(theta / scale) + 0.5) * scale;
      vec2 dir = vec2(sin(theta), cos(theta));
      vec2 codir = dir.yx * vec2(-1.0, 1.0);
      iterUV = vec2(dot(dir, iterUV), dot(codir, iterUV));
      
      iterUV.xy += vec2(sin(t), cos(t * 1.1)) * scaleFactor * 0.035;
      iterUV = abs(fract(iterUV + 0.5) * 2.0 - 1.0) * 0.7;
      
      vec2 sampleUV = iterUV / vec2(aspect, 1.0) * 0.5 + 0.5;
      sampleUV = clamp(sampleUV, 0.0, 1.0);
      vec4 sampleColor = texture2D(uVideoTexture, sampleUV);
      
      vec3 p = vec3(1.0, 5.0, 9.0);
      float pattern = exp(-min(iterUV.x, iterUV.y) * 16.0);
      vec3 colorMod = (cos(p * float(i) + t * 0.5) * 0.5 + 0.5) * m;
      kaleidoColor += sampleColor.rgb * pattern * colorMod;
      
      m *= 0.9;
    }
    
    kaleidoColor *= 1.1;
    
    // Fast blink pulse: creates brief flash/blink effect
    // Pulse every 0.2 seconds, visible for only 0.05 seconds (quick blink)
    float blinkCycle = mod(uTime, 0.2);
    float blinkPulse = smoothstep(0.0, 0.02, blinkCycle) * smoothstep(0.2, 0.05, blinkCycle);
    blinkPulse = clamp(blinkPulse, 0.0, 1.0);
    
    // Apply blink pulse - makes kaleidoscope flash briefly like a blink
    // Only show during the pulse window (very brief)
    float kaleidoIntensity = transition * 0.9 * blinkPulse;
    color.rgb = mix(baseColor.rgb, kaleidoColor, kaleidoIntensity);
    
  } else if (currentState < 2.5) {
    // STATE_STARGATE: Tunnel/Stargate (show more often)
    // Alternate between horizontal and vertical every 4 seconds
    float tunnelOrientation = mod(floor(uTime / 4.0), 2.0); // 0 = horizontal, 1 = vertical
    vec2 tunnelUV = (uv - 0.5) * 2.0;
    tunnelUV.x *= aspect;
    vec3 tunnelColor = raymarchTunnel(tunnelUV, uTime, uVideoTexture, finalUV, tunnelOrientation);
    color.rgb = mix(baseColor.rgb, tunnelColor, transition * 0.95);
    
  } else {
    // STATE_PERLIN: Perlin ripple effect
    vec3 rippleColor = perlinRippleEffect(uv, uTime, uVideoTexture, finalUV, aspect);
    color.rgb = mix(color.rgb, rippleColor, transition * 0.85);
  }
  
  // === CHROMATIC ABERRATION ===
  // RGB channel separation - audio-reactive (subtle, preserve effects)
  // Only apply when audio is significant - calmer when quiet
  float chromaAmount = uHighLevel * 0.03 + uAmplitude * 0.015 + uBassLevel * 0.008; // Reduced
  if (chromaAmount > 0.005) { // Higher threshold - only when audio is noticeable
    vec2 chromaOffsetX = vec2(chromaAmount * 2.5, 0.0); // Reduced from 3.0
    vec2 chromaOffsetY = vec2(0.0, chromaAmount * 0.4); // Reduced from 0.5
    
    // Sample video texture with offsets for RGB separation
    vec4 colorR = texture2D(uVideoTexture, finalUV - chromaOffsetX - chromaOffsetY);
    vec4 colorG = texture2D(uVideoTexture, finalUV);
    vec4 colorB = texture2D(uVideoTexture, finalUV + chromaOffsetX + chromaOffsetY);
    
    // Blend scaled with audio level (less intense when quiet)
    vec3 chromaColor = vec3(colorR.r, colorG.g, colorB.b);
    color.rgb = mix(color.rgb, chromaColor, chromaAmount * 1.2); // Reduced from 1.5
  }
  
  // Bass → Blur/zoom pulse (enhanced) - blend with effect color
  if (uBassLevel > 0.2) {
    float blur = uBassLevel * 0.3; // Reduced to preserve effects
    vec2 texelSize = 1.0 / uResolution;
    vec2 offset = vec2(blur * texelSize.x * 2.0, 0.0);
    vec4 blurred = (
      texture2D(uVideoTexture, finalUV + offset) +
      texture2D(uVideoTexture, finalUV - offset) +
      texture2D(uVideoTexture, finalUV + offset.yx) +
      texture2D(uVideoTexture, finalUV - offset.yx)
    ) * 0.25;
    color = mix(color, blurred, blur * 0.5); // Blend, don't replace
  }
  
  // Mids → Hue rotation (with spatial variation, smoother) - works on effect color
  // Scale intensity with audio level - calmer when quiet
  if (uMidLevel > 0.15) {
    vec3 hsv = rgb2hsv(color.rgb);
    // Scale rotation speed with audio level (slower when quiet)
    float rotationSpeed = uMidLevel * 0.5; // Reduced from 1.0
    float hueShift = rotationSpeed * uTime * 0.8;
    // Scale spatial variation with audio level
    hueShift += fbm(finalUV * 3.0 + t * 0.5) * uMidLevel * 0.2; // Reduced from 0.3
    hsv.x = mod(hsv.x + hueShift, 1.0);
    // Blend hue rotation based on audio level (less intense when quiet)
    vec3 rotatedColor = hsv2rgb(hsv);
    color.rgb = mix(color.rgb, rotatedColor, uMidLevel * 0.6); // Blend based on level
  }
  
  // Highs → Edge detection/sharpening (enhanced with noise) - blend with effect color
  // Scale intensity with audio level
  if (uHighLevel > 0.25) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 top = texture2D(uVideoTexture, finalUV + vec2(0.0, texelSize.y));
    vec4 bottom = texture2D(uVideoTexture, finalUV - vec2(0.0, texelSize.y));
    vec4 left = texture2D(uVideoTexture, finalUV - vec2(texelSize.x, 0.0));
    vec4 right = texture2D(uVideoTexture, finalUV + vec2(texelSize.x, 0.0));
    
    vec4 edge = abs(color - top) + abs(color - bottom) + abs(color - left) + abs(color - right);
    float edgeStrength = length(edge.rgb) * uHighLevel * 0.5; // Reduced from 0.8
    
    // Add noise-based edge enhancement (scaled with audio level)
    float noiseEdge = fbm(finalUV * 20.0 + t) * uHighLevel * 0.2; // Reduced from 0.3
    edgeStrength += noiseEdge;
    
    // Blend based on audio level (less intense when quiet)
    color.rgb = mix(color.rgb, color.rgb * (1.0 + edgeStrength), uHighLevel * 0.4); // Reduced from 0.6
  }
  
  // Amplitude → Saturation boost (scaled - only boost when loud)
  // Only apply significant saturation boost when amplitude is high
  if (uAmplitude > 0.3) {
    float satBoost = 1.0 + (uAmplitude * 0.8); // Reduced from 1.5, and only when loud
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.y = min(1.0, hsv.y * satBoost);
    color.rgb = hsv2rgb(hsv);
  }
  
  // Silence → Solarization
  if (uSilence > 0.5) {
    float solar = uSilence * 0.8;
    color.rgb = mix(
      color.rgb,
      vec3(1.0) - abs(color.rgb - vec3(0.5)) * 2.0,
      solar
    );
  }
  
  // Visual → Audio: Dominant color tint
  color.rgb = mix(
    color.rgb,
    color.rgb * (uDominantColor / 255.0),
    0.3
  );
  
  // Motion particles (visual → audio feedback) - enhanced with noise
  if (uMotionAmount > 0.1) {
    float particle = step(0.98, fract(sin(dot(finalUV, vec2(12.9898, 78.233)) + t) * 43758.5453));
    // Add noise-based particles
    float noiseParticle = step(0.95, fbm(finalUV * 30.0 + t * 2.0)) * uMotionAmount;
    particle = max(particle, noiseParticle);
    color.rgb += vec3(0.0, 1.0, 0.0) * particle * uMotionAmount * 0.3;
  }
  
  // === ADDITIONAL DISTORTION EFFECTS ===
  
  // Glitch effect (amplitude reactive)
  if (uAmplitude > 0.7) {
    float glitch = step(0.98, fbm(finalUV * vec2(100.0, 1.0) + t * 10.0));
    vec2 glitchUV = finalUV + vec2(glitch * 0.05, 0.0);
    vec4 glitchColor = texture2D(uVideoTexture, glitchUV);
    color = mix(color, glitchColor, glitch * uAmplitude * 0.5);
  }
  
  // Scanlines (highs reactive)
  if (uHighLevel > 0.4) {
    float scanline = sin(finalUV.y * uResolution.y * 0.5) * 0.5 + 0.5;
    scanline = pow(scanline, 10.0);
    color.rgb *= 1.0 - scanline * uHighLevel * 0.1;
  }
  
  // === TV STATIC EFFECT (Perlin noise-based) ===
  // Generate TV static using FBM noise
  float staticNoise = fbm(finalUV * vec2(200.0, 150.0) + uTime * 5.0);
  staticNoise = fract(staticNoise * 1000.0); // High frequency noise
  
  // TV static appears randomly and during transitions
  float staticChance = sin(uTime * 0.5) * 0.5 + 0.5;
  staticChance = smoothstep(0.7, 1.0, staticChance); // Sharp transitions
  
  // Static intensity - stronger during glitches and transitions
  float staticIntensity = staticChance * 0.3;
  staticIntensity += step(0.95, fbm(finalUV * vec2(50.0, 1.0) + uTime * 2.0)) * 0.5; // Random bursts
  
  // Apply TV static (black and white noise)
  vec3 staticColor = vec3(staticNoise);
  color.rgb = mix(color.rgb, staticColor, staticIntensity);
  
  // === TV-STYLE GLITCH TRANSITIONS ===
  // Periodic glitch transitions that happen from time to time
  float glitchTime = mod(uTime, 8.0); // Every 8 seconds
  float glitchPhase = smoothstep(0.0, 0.1, glitchTime) * smoothstep(0.3, 0.2, glitchTime); // Quick burst
  
  if (glitchPhase > 0.01) {
    // Horizontal scanline glitch
    float scanlineGlitch = step(0.98, fbm(finalUV * vec2(1.0, 200.0) + uTime * 10.0));
    if (scanlineGlitch > 0.5) {
      vec2 glitchUV = finalUV + vec2(0.0, sin(finalUV.y * 50.0 + uTime * 20.0) * 0.02);
      vec4 glitchColor = texture2D(uVideoTexture, glitchUV);
      color = mix(color, glitchColor, glitchPhase * 0.8);
    }
    
    // RGB channel separation (chromatic aberration glitch)
    float chromaGlitch = glitchPhase * 0.05;
    vec4 colorR = texture2D(uVideoTexture, finalUV + vec2(chromaGlitch, 0.0));
    vec4 colorB = texture2D(uVideoTexture, finalUV - vec2(chromaGlitch, 0.0));
    color.r = mix(color.r, colorR.r, glitchPhase);
    color.b = mix(color.b, colorB.b, glitchPhase);
    
    // Vertical slice displacement
    float sliceGlitch = step(0.95, fbm(finalUV * vec2(200.0, 1.0) + uTime * 15.0));
    if (sliceGlitch > 0.5) {
      vec2 sliceUV = finalUV + vec2(sin(finalUV.x * 100.0 + uTime * 30.0) * 0.03, 0.0);
      vec4 sliceColor = texture2D(uVideoTexture, sliceUV);
      color = mix(color, sliceColor, glitchPhase * sliceGlitch * 0.6);
    }
  }
  
  // Vignette with audio-reactive intensity (more feathered, shows more video)
  float vigDist = length(p);
  // Start vignette further out (0.9 instead of 0.7) and make it more gradual
  float vignette = 1.0 - smoothstep(0.9, 1.6, vigDist);
  // Reduce audio-reactive boost
  vignette += uAmplitude * 0.1;
  // Make vignette more subtle (less darkening)
  vignette = mix(1.0, vignette, 0.4); // Only apply 40% of vignette darkness
  color.rgb *= vignette;
  
  gl_FragColor = color;
}
