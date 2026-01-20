/**
 * Day 19: 16×16
 * Prompt: "16×16"
 *
 * THE ATLAS - No Man's Sky inspired cosmic entity
 *
 * In NMS lore, 16 is sacred: 16 minutes until reset, 16 iterations of the simulation.
 * The Atlas is the cosmic overseer, an ancient machine-god running the universe.
 *
 * A rotating octahedron with glowing red core and circuit glyphs.
 * Click to commune with the Atlas.
 */

import { Game, Camera3D, Painter, StickFigure, StateMachine, Easing } from '@guinetik/gcanvas';

const CONFIG = {
  background: '#000',

  // Atlas geometry
  atlas: {
    size: 120,              // Octahedron size
    rotationSpeed: 0.15,    // Slow, ominous rotation
    hoverAmplitude: 5,      // Gentle floating motion
    hoverSpeed: 0.4,
  },

  // Central orb (the "eye")
  orb: {
    radius: 25,
    pulseMin: 0.8,
    pulseMax: 1.2,
    pulseSpeed: 1.5,
    glowRadius: 80,
  },

  // Circuit glyphs on faces
  glyphs: {
    nodeCount: 16,          // The sacred number
    lineWidth: 1.5,
    glowIntensity: 0.6,
    flickerSpeed: 3,
  },

  // Starfield
  stars: {
    count: 200,
    radius: 500,
  },

  // Orbiting figures (the 16 travelers)
  figures: {
    count: 16,                // The sacred number
    orbitRadius: 220,         // Distance from Atlas
    orbitSpeed: 0.08,         // How fast they orbit
    scale: 0.15,              // Small stick figures
  },

  // Colors - Atlas red palette
  colors: {
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
    edge: '#333',
    glow: '#ff2200',
    glowBright: '#ff4422',
    orb: '#ff0000',
    orbCore: '#ffffff',
    glyph: '#ff3311',
    glyphDim: '#661100',
    nebula: 'rgba(255, 20, 0, 0.03)',
  },

  // Commune effect (click response)
  commune: {
    duration: 2.0,
    flashIntensity: 3,
  },

  // Transcendence (16 clicks triggers psychedelic journey)
  transcendence: {
    clicksRequired: 16,
    zoomInDuration: 6.0,     // Atlas faces camera and zooms in (longer for full rotation)
    flashDuration: 1.5,      // Crossfade to tunnel
    tunnelDuration: 10.0,    // Psychedelic tunnel phase
    fadeToBlackDuration: 2.0, // Tunnel fades to black
    iterationDuration: 3.0,  // "ITERATION #XXXXX" display
    atlasAppearDuration: 2.0, // Atlas fades in
    starsAppearDuration: 1.5, // Stars fade in
    figuresAppearDuration: 5.0, // Figures arrive one by one
  },

  // Camera
  camera: {
    perspective: 600,
    distance: 400,
    autoRotateSpeed: 0.08,
    friction: 0.95,
    initialTilt: 0,       // Slight downward tilt to see orb
    initialRotationY: -2.3879,  // Face the orb on start (22.5 degrees)
  },
};

// ============================================================================
// OCTAHEDRON GEOMETRY
// ============================================================================

class Octahedron {
  constructor(size) {
    this.size = size;

    // 6 vertices - stretched bottom like the Atlas reference
    const topHeight = size * 0.7;      // Shorter top pyramid
    const bottomHeight = size * 1.6;   // Elongated bottom point
    const waistWidth = size * 0.9;     // Slightly narrower waist

    this.vertices = [
      { x: 0, y: -topHeight, z: 0 },       // Top (shorter)
      { x: 0, y: bottomHeight, z: 0 },     // Bottom (elongated)
      { x: -waistWidth, y: 0, z: 0 },      // Left
      { x: waistWidth, y: 0, z: 0 },       // Right
      { x: 0, y: 0, z: -waistWidth },      // Back
      { x: 0, y: 0, z: waistWidth },       // Front
    ];

    // 8 triangular faces (vertex indices)
    this.faces = [
      [0, 5, 3],  // Top-front-right
      [0, 3, 4],  // Top-right-back
      [0, 4, 2],  // Top-back-left
      [0, 2, 5],  // Top-left-front
      [1, 3, 5],  // Bottom-front-right
      [1, 4, 3],  // Bottom-right-back
      [1, 2, 4],  // Bottom-back-left
      [1, 5, 2],  // Bottom-left-front
    ];

    // Generate circuit glyph patterns for each face
    this.glyphs = this.faces.map(() => this.generateGlyphPattern());
  }

  generateGlyphPattern() {
    // Generate angular circuit-like pattern
    const nodes = [];
    const lines = [];
    const nodeCount = Math.floor(CONFIG.glyphs.nodeCount / 8) + 2; // Per face

    // Random nodes within triangle (using barycentric coords)
    for (let i = 0; i < nodeCount; i++) {
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      nodes.push({ u, v, w: 1 - u - v, flicker: Math.random() * Math.PI * 2 });
    }

    // Connect some nodes with angular lines
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() < 0.7) {
        const j = Math.min(i + 1 + Math.floor(Math.random() * 2), nodes.length - 1);
        lines.push({ from: i, to: j });
      }
    }

    // Add some edge-aligned segments
    if (Math.random() < 0.5) {
      lines.push({ edge: true, t1: Math.random() * 0.3, t2: 0.3 + Math.random() * 0.4, side: Math.floor(Math.random() * 3) });
    }

    return { nodes, lines };
  }
}

// ============================================================================
// ATLAS DEMO
// ============================================================================

class Day19Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = null; // Manual clear for effects
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // Camera setup
    this.camera = new Camera3D({
      perspective: CONFIG.camera.perspective,
      rotationX: CONFIG.camera.initialTilt,
      rotationY: CONFIG.camera.initialRotationY,
      autoRotate: true,
      autoRotateSpeed: CONFIG.camera.autoRotateSpeed,
      autoRotateAxis: 'y',
      inertia: true,
      friction: CONFIG.camera.friction,
      sensitivity: 0.003,
    });
    this.camera.enableMouseControl(this.canvas);

    // Disable double-click reset
    if (this.camera._boundHandlers?.dblclick) {
      this.canvas.removeEventListener('dblclick', this.camera._boundHandlers.dblclick);
    }

    // Create octahedron
    this.octahedron = new Octahedron(CONFIG.atlas.size);

    // The orb is fixed to face index 4 (bottom-front-right, on the inverted pyramid)
    this.orbFaceIndex = 4;

    // Animation state
    this.time = 0;
    this.communeTime = -10; // Time since last commune
    this.communeActive = false;

    // Transcendence state (16 clicks = psychedelic journey)
    this.clickCount = 0;
    this.transcendenceFSM = null;
    this.tunnelTime = 0;
    this.tunnelParticles = [];

    // Generate starfield
    this.stars = [];
    for (let i = 0; i < CONFIG.stars.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = CONFIG.stars.radius * (0.8 + Math.random() * 0.4);
      this.stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }

    // Generate the 16 orbiting figures (travelers/worshippers)
    this.figures = [];
    for (let i = 0; i < CONFIG.figures.count; i++) {
      const angle = (i / CONFIG.figures.count) * Math.PI * 2;
      // Distribute in a tilted ring around the Atlas
      const tilt = (i % 2 === 0) ? 0.2 : -0.2; // Alternating slight tilt
      this.figures.push({
        index: i,
        baseAngle: angle,
        tilt: tilt,
        figure: new StickFigure(CONFIG.figures.scale, {
          stroke: '#ffffff',
          headColor: '#ffffff',
          jointColor: '#ffffff',
          lineWidth: 1,
          showJoints: false,
        }),
      });
    }

    // Debug: print camera rotation on mouse release
    this.canvas.addEventListener('mouseup', () => {
      console.log(`Camera rotation - X: ${this.camera.rotationX.toFixed(4)}, Y: ${this.camera.rotationY.toFixed(4)}`);
      console.log(`CONFIG: initialTilt: ${this.camera.rotationX.toFixed(4)}, initialRotationY: ${this.camera.rotationY.toFixed(4)}`);
    });

    // Mouse tracking for tunnel effect
    this.tunnelMouseX = this.width / 2;
    this.tunnelMouseY = this.height / 2;
    this.tunnelOffsetX = 0;
    this.tunnelOffsetY = 0;
    this.tunnelTargetOffsetX = 0;
    this.tunnelTargetOffsetY = 0;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.tunnelMouseX = e.clientX - rect.left;
      this.tunnelMouseY = e.clientY - rect.top;

      // Offset based on mouse distance from center
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.tunnelTargetOffsetX = (this.tunnelMouseX - cx) * 0.5;
      this.tunnelTargetOffsetY = (this.tunnelMouseY - cy) * 0.5;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tunnelTargetOffsetX = 0;
      this.tunnelTargetOffsetY = 0;
    });

    // Click to commune (16 clicks triggers transcendence)
    this.canvas.addEventListener('click', () => {
      if (this.transcendenceFSM) return; // Ignore during transcendence

      this.clickCount++;
      this.communeTime = this.time;
      this.communeActive = true;

      // Check for transcendence trigger
      if (this.clickCount >= CONFIG.transcendence.clicksRequired) {
        this.startTranscendence();
      }
    });
  }

  startTranscendence() {
    const { transcendence } = CONFIG;

    // Track restore animation state
    this.restoreState = {
      atlasAlpha: 0,
      starsAlpha: 0,
      visibleFigures: 0,
    };

    // Generate iteration number (big random number, increments each transcendence)
    if (!this.iterationBase) {
      this.iterationBase = 10000 + Math.floor(Math.random() * 90000);
    }
    this.iterationBase++;
    this.iterationNumber = this.iterationBase;

    // Store initial camera state for zoom-in animation
    this.zoomInState = {
      startRotationX: this.camera.rotationX,
      startRotationY: this.camera.rotationY,
      scale: 1,
    };

    // Stop auto rotation
    this.camera.autoRotate = false;

    // Create state machine for transcendence sequence
    this.transcendenceFSM = StateMachine.fromSequence([
      {
        name: 'zoomIn',
        duration: transcendence.zoomInDuration,
        update: (dt) => this.updateZoomIn(dt),
      },
      {
        name: 'flash',
        duration: transcendence.flashDuration,
        enter: () => this.initFlashPhase(),
      },
      {
        name: 'tunnel',
        duration: transcendence.tunnelDuration,
        enter: () => this.initTunnelPhase(),
        update: (dt) => this.updateTunnel(dt),
      },
      {
        name: 'fadeToBlack',
        duration: transcendence.fadeToBlackDuration,
        update: (dt) => this.updateTunnel(dt), // Keep tunnel updating
      },
      {
        name: 'iteration',
        duration: transcendence.iterationDuration,
      },
      {
        name: 'atlasAppear',
        duration: transcendence.atlasAppearDuration,
        enter: () => { this.restoreState.atlasAlpha = 0; },
      },
      {
        name: 'starsAppear',
        duration: transcendence.starsAppearDuration,
        enter: () => { this.restoreState.starsAlpha = 0; },
      },
      {
        name: 'figuresAppear',
        duration: transcendence.figuresAppearDuration,
        enter: () => {
          this.restoreState.visibleFigures = 0;
          // Store current camera rotation for smooth transition back
          this.restoreState.startRotationX = this.camera.rotationX;
          this.restoreState.startRotationY = this.camera.rotationY;
        },
        update: (dt) => this.updateFiguresAppear(dt),
      },
    ], {
      context: this,
      onComplete: () => this.resetScene(),
    });
  }

  initFlashPhase() {
    // Nothing special needed, render handles it
  }

  updateZoomIn(dt) {
    const progress = this.transcendenceFSM.progress;
    const { startRotationX, startRotationY } = this.zoomInState;

    // Use easeInBack for dramatic zoom effect
    const eased = Easing.easeInBack(progress);

    // Rotate camera to face the orb on face 4 (bottom-front-right)
    const targetRotationY = -2.3879;  // 45 degrees to the right
    const targetRotationX = 0.3;           // Slight downward tilt to see bottom face
    this.camera.rotationX = startRotationX + (targetRotationX - startRotationX) * eased;
    this.camera.rotationY = startRotationY + (targetRotationY - startRotationY) * eased;

    // Zoom into the Atlas during this phase
    this.zoomInState.scale = 1 + eased * 2; // Zoom from 1x to 3x

    // Offset zoom center toward the orb (lower on screen)
    this.zoomInState.offsetY = eased * 80; // Move zoom center down toward orb
  }

  initTunnelPhase() {
    this.tunnelTime = 2; // Start with some time so things are already moving

    // Generate tunnel particles - lots of them for crazy effect
    this.tunnelParticles = [];
    for (let i = 0; i < 500; i++) {
      this.tunnelParticles.push({
        angle: Math.random() * Math.PI * 2,
        z: Math.random() * 1000,       // Depth in tunnel
        radius: 50 + Math.random() * 300,
        speed: 100 + Math.random() * 400,
        hue: Math.random() * 360,
        size: 2 + Math.random() * 8,
        type: Math.floor(Math.random() * 4), // Different shapes
      });
    }

    // Generate kaleidoscope segments
    this.kaleidoSegments = 8 + Math.floor(Math.random() * 8);

    // Ring waves
    this.tunnelRings = [];
    for (let i = 0; i < 20; i++) {
      this.tunnelRings.push({
        z: i * 100,
        hue: (i * 30) % 360,
        thickness: 2 + Math.random() * 6,
      });
    }
  }

  updateFiguresAppear(dt) {
    const progress = this.transcendenceFSM.progress;
    const { startRotationX, startRotationY } = this.restoreState;

    // Smooth ease out for camera transition back to initial position
    const eased = 1 - Math.pow(1 - progress, 2);

    // Animate camera back to initial rotation
    const targetX = CONFIG.camera.initialTilt;
    const targetY = CONFIG.camera.initialRotationY;

    this.camera.rotationX = startRotationX + (targetX - startRotationX) * eased;
    this.camera.rotationY = startRotationY + (targetY - startRotationY) * eased;
  }

  updateTunnel(dt) {
    this.tunnelTime += dt * 3; // 3x faster animation time

    // Smooth mouse offset for tunnel panning
    const ease = 1 - Math.pow(0.05, dt);
    this.tunnelOffsetX += (this.tunnelTargetOffsetX - this.tunnelOffsetX) * ease;
    this.tunnelOffsetY += (this.tunnelTargetOffsetY - this.tunnelOffsetY) * ease;

    // Move particles toward viewer (faster)
    for (const p of this.tunnelParticles) {
      p.z -= p.speed * dt * 2.5;
      if (p.z < -100) {
        p.z = 1000;
        p.hue = (p.hue + 30) % 360;
      }
      // Spiral motion (faster)
      p.angle += dt * (1.5 + p.speed / 300);
    }

    // Move rings toward viewer (faster)
    for (const r of this.tunnelRings) {
      r.z -= 500 * dt;
      if (r.z < -50) {
        r.z = 2000;
        r.hue = (r.hue + 60) % 360;
      }
    }
  }

  resetScene() {
    // Reset all state
    this.clickCount = 0;
    this.transcendenceFSM = null;
    this.communeActive = false;
    this.communeTime = -10;
    this.tunnelParticles = [];
    this.tunnelRings = [];
    this.tunnelTime = 0;

    // Restore camera settings
    this.camera.autoRotate = true;
    this.camera.perspective = CONFIG.camera.perspective;
    this.camera.rotationX = CONFIG.camera.initialTilt;
    this.camera.rotationY = CONFIG.camera.initialRotationY;

    // Regenerate glyphs for fresh look
    this.octahedron.glyphs = this.octahedron.faces.map(() =>
      this.octahedron.generateGlyphPattern()
    );
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Update camera during normal play and restore phases (not during zoomIn - we control that manually)
    const inRestorePhase = this.transcendenceFSM &&
      ['atlasAppear', 'starsAppear', 'figuresAppear'].includes(this.transcendenceFSM.state);
    if (!this.transcendenceFSM || inRestorePhase) {
      this.camera.update(dt);
    }

    // Check commune end
    if (this.communeActive && this.time - this.communeTime > CONFIG.commune.duration) {
      this.communeActive = false;
    }

    // Update transcendence state machine
    if (this.transcendenceFSM) {
      this.transcendenceFSM.update(dt);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // If in transcendence, render ONLY the transcendence effect
    if (this.transcendenceFSM) {
      this.renderTranscendence(ctx, cx, cy, w, h);
      return;
    }

    // === NORMAL SCENE RENDERING ===

    // Clear
    ctx.fillStyle = CONFIG.background;
    ctx.fillRect(0, 0, w, h);

    // Red nebula ambience
    const nebulaGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    nebulaGradient.addColorStop(0, 'rgba(60, 5, 0, 0.3)');
    nebulaGradient.addColorStop(0.5, 'rgba(30, 2, 0, 0.2)');
    nebulaGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, w, h);

    // Render starfield
    this.renderStars(ctx, cx, cy);

    // Render orbiting figures (sorted by depth with Atlas)
    this.renderFigures(ctx, cx, cy);

    // Floating motion offset
    const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;

    // Get projected and sorted faces (back to front)
    const projectedFaces = this.projectFaces(cx, cy, hover);

    // Find the orb face (fixed to bottom-front-right face on the inverted pyramid)
    const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
    const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
    const orbFaceDepth = orbFace ? orbFace.depth : 0;

    // Render faces in depth order, inserting orb at correct depth
    let orbRendered = false;

    for (const face of projectedFaces) {
      // If this face is in front of the orb face and orb hasn't been rendered yet, render orb first
      if (!orbRendered && face.depth < orbFaceDepth) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
        orbRendered = true;
      }

      // Render face (orb face gets special treatment - slightly transparent)
      const isOrbFace = face.faceIndex === this.orbFaceIndex;
      this.renderFace(ctx, face, isOrbFace);
    }

    // If orb is on the front-most face, render it last
    if (!orbRendered) {
      this.renderOrb(ctx, orbPosition.x, orbPosition.y);
    }

    // Commune flash effect
    if (this.communeActive) {
      this.renderCommuneEffect(ctx, orbPosition.x, orbPosition.y);
    }

    // Subtle vignette
    const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.7, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Click counter display (subtle)
    if (this.clickCount > 0) {
      ctx.fillStyle = `rgba(255, 50, 20, ${0.3 + this.clickCount / 32})`;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.clickCount}/16`, cx, h - 20);
    }
  }

  getFaceCenter(verts) {
    return {
      x: (verts[0].x + verts[1].x + verts[2].x) / 3,
      y: (verts[0].y + verts[1].y + verts[2].y) / 3,
    };
  }

  // Get orb position on the face
  // For bottom faces (4-7): verts[0] is the bottom tip, verts[1] and verts[2] are waist points
  // Position the orb near the top of the bottom face (near the waist)
  getOrbPosition(verts) {
    // For bottom faces: low weight on tip (verts[0]), high weight on waist (verts[1], verts[2])
    // This places the orb near the top edge of the bottom face
    const tipWeight = 0.15;      // Small weight toward the elongated bottom tip
    const waistWeight = (1 - tipWeight) / 2;  // Split remaining between waist vertices
    return {
      x: verts[0].x * tipWeight + verts[1].x * waistWeight + verts[2].x * waistWeight,
      y: verts[0].y * tipWeight + verts[1].y * waistWeight + verts[2].y * waistWeight,
    };
  }

  renderStars(ctx, cx, cy) {
    for (const star of this.stars) {
      const proj = this.camera.project(star.x, star.y, star.z);
      const x = cx + proj.x;
      const y = cy + proj.y;

      // Skip if behind camera
      if (proj.scale <= 0) continue;

      const size = star.size * proj.scale;
      const alpha = star.brightness * Math.min(1, proj.scale);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 220, ${alpha})`;
      ctx.fill();
    }
  }

  renderFigures(ctx, cx, cy) {
    const { figures } = CONFIG;
    const communeFlash = this.communeActive
      ? Math.max(0, 1 - (this.time - this.communeTime) / CONFIG.commune.duration)
      : 0;

    // Calculate 3D positions for all figures and sort by depth
    const projectedFigures = this.figures.map(fig => {
      // Orbit around Y axis
      const angle = fig.baseAngle + this.time * figures.orbitSpeed;
      const tiltAngle = fig.tilt;

      // Position on tilted orbit ring (no vertical bobbing)
      const x = Math.cos(angle) * figures.orbitRadius;
      const z = Math.sin(angle) * figures.orbitRadius;
      const y = Math.sin(angle) * figures.orbitRadius * tiltAngle;

      // Project to screen
      const proj = this.camera.project(x, y, z);

      return {
        ...fig,
        screenX: cx + proj.x,
        screenY: cy + proj.y,
        scale: proj.scale,
        depth: proj.z,
      };
    });

    // Sort back to front (render furthest first)
    projectedFigures.sort((a, b) => b.depth - a.depth);

    // Render each figure
    for (const fig of projectedFigures) {
      if (fig.scale <= 0) continue; // Behind camera

      const figScale = fig.scale * (1 + communeFlash * 0.3);
      const alpha = Math.min(1, fig.scale) * (0.7 + communeFlash * 0.3);

      ctx.save();
      ctx.translate(fig.screenX, fig.screenY);
      ctx.scale(figScale, figScale);
      ctx.globalAlpha = alpha;

      // Add subtle white glow
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5 + communeFlash * 15;

      // Draw the stick figure
      fig.figure.draw();

      ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Render only first N figures (for arrival animation)
  renderFiguresPartial(ctx, cx, cy, count, overallProgress) {
    const { figures } = CONFIG;

    // Calculate 3D positions for figures
    const projectedFigures = this.figures.slice(0, count).map((fig, i) => {
      const angle = fig.baseAngle + this.time * figures.orbitSpeed;
      const tiltAngle = fig.tilt;

      const x = Math.cos(angle) * figures.orbitRadius;
      const z = Math.sin(angle) * figures.orbitRadius;
      const y = Math.sin(angle) * figures.orbitRadius * tiltAngle;

      const proj = this.camera.project(x, y, z);

      // Calculate individual figure's fade-in
      const figureProgress = overallProgress * CONFIG.figures.count;
      const figureIndex = i;
      const localProgress = Math.min(1, Math.max(0, figureProgress - figureIndex));

      return {
        ...fig,
        screenX: cx + proj.x,
        screenY: cy + proj.y,
        scale: proj.scale,
        depth: proj.z,
        fadeIn: localProgress,
      };
    });

    // Sort back to front
    projectedFigures.sort((a, b) => b.depth - a.depth);

    // Render each visible figure
    for (const fig of projectedFigures) {
      if (fig.scale <= 0 || fig.fadeIn <= 0) continue;

      // Scale up from 0 as figure arrives
      const arrivalScale = 0.5 + fig.fadeIn * 0.5;
      const figScale = fig.scale * arrivalScale;
      const alpha = Math.min(1, fig.scale) * fig.fadeIn * 0.7;

      ctx.save();
      ctx.translate(fig.screenX, fig.screenY);
      ctx.scale(figScale, figScale);
      ctx.globalAlpha = alpha;

      // Brighter glow for newly arriving figures
      const glowIntensity = fig.fadeIn < 1 ? 15 : 5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = glowIntensity;

      fig.figure.draw();
      ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  projectFaces(cx, cy, hover = 0) {
    const oct = this.octahedron;
    const projected = [];

    for (let fi = 0; fi < oct.faces.length; fi++) {
      const face = oct.faces[fi];
      const verts = face.map(vi => {
        const v = oct.vertices[vi];
        // Apply hover offset to Y before projection
        const proj = this.camera.project(v.x, v.y + hover, v.z);
        return {
          x: cx + proj.x,
          y: cy + proj.y,
          z: proj.z,
          scale: proj.scale,
          world: v,
        };
      });

      // Calculate face center depth for sorting
      const avgZ = verts.reduce((sum, v) => sum + v.z, 0) / 3;

      // Calculate face normal for lighting (in world space, before projection)
      const normal = this.calculateNormal(
        oct.vertices[face[0]],
        oct.vertices[face[1]],
        oct.vertices[face[2]]
      );

      projected.push({
        verts,
        depth: avgZ,
        normal,
        faceIndex: fi,
        glyph: oct.glyphs[fi],
      });
    }

    // Sort back to front (highest depth = furthest = render first)
    projected.sort((a, b) => b.depth - a.depth);

    return projected;
  }

  calculateNormal(v0, v1, v2) {
    const ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
    const bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  renderFace(ctx, face, isFrontFace = false) {
    const communeFlash = this.communeActive
      ? Math.max(0, 1 - (this.time - this.communeTime) / CONFIG.commune.duration)
      : 0;

    const { verts, normal, glyph } = face;

    // Simple lighting based on normal
    const lightDir = { x: 0.3, y: -0.5, z: 0.8 };
    const dot = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;
    const lighting = 0.3 + Math.max(0, dot) * 0.4;

    // Face color with lighting
    const baseColor = Math.floor(26 * (lighting + communeFlash * 0.5));

    // Front face is more transparent to show orb
    const alpha = isFrontFace ? 0.7 : 1.0;
    const faceColor = isFrontFace
      ? `rgba(${baseColor + communeFlash * 40}, ${baseColor}, ${baseColor}, ${alpha})`
      : `rgb(${baseColor + communeFlash * 40}, ${baseColor}, ${baseColor})`;

    // Draw face
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    ctx.lineTo(verts[1].x, verts[1].y);
    ctx.lineTo(verts[2].x, verts[2].y);
    ctx.closePath();

    ctx.fillStyle = faceColor;
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = `rgba(100, 100, 100, ${0.6 + communeFlash * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Render glyphs on face
    this.renderGlyphs(ctx, verts, glyph, communeFlash);
  }

  renderGlyphs(ctx, verts, glyph, communeFlash) {
    const { nodes, lines } = glyph;
    const intensity = CONFIG.glyphs.glowIntensity + communeFlash * 0.4;

    // Convert barycentric to screen coords
    const toScreen = (u, v, w) => ({
      x: verts[0].x * w + verts[1].x * u + verts[2].x * v,
      y: verts[0].y * w + verts[1].y * u + verts[2].y * v,
    });

    // Draw lines
    ctx.strokeStyle = CONFIG.colors.glyph;
    ctx.lineWidth = CONFIG.glyphs.lineWidth;
    ctx.shadowColor = CONFIG.colors.glow;
    ctx.shadowBlur = 8 + communeFlash * 12;

    for (const line of lines) {
      if (line.edge) {
        // Edge-aligned segment
        const side = line.side;
        const v1 = verts[side];
        const v2 = verts[(side + 1) % 3];
        const x1 = v1.x + (v2.x - v1.x) * line.t1;
        const y1 = v1.y + (v2.y - v1.y) * line.t1;
        const x2 = v1.x + (v2.x - v1.x) * line.t2;
        const y2 = v1.y + (v2.y - v1.y) * line.t2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else {
        // Node to node
        const from = nodes[line.from];
        const to = nodes[line.to];
        const p1 = toScreen(from.u, from.v, from.w);
        const p2 = toScreen(to.u, to.v, to.w);

        // Angular path (not straight line)
        const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 5;
        const midY = (p1.y + p2.y) / 2;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(midX, p1.y);
        ctx.lineTo(midX, p2.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const p = toScreen(node.u, node.v, node.w);
      const flicker = Math.sin(this.time * CONFIG.glyphs.flickerSpeed + node.flicker);
      const alpha = 0.4 + flicker * 0.3 + communeFlash * 0.3;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + communeFlash * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 20, ${alpha})`;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  renderOrb(ctx, cx, cy) {
    const { orb, colors } = CONFIG;
    const communeFlash = this.communeActive
      ? Math.max(0, 1 - (this.time - this.communeTime) / CONFIG.commune.duration)
      : 0;

    // Pulse animation
    const pulse = orb.pulseMin + (Math.sin(this.time * orb.pulseSpeed) * 0.5 + 0.5) * (orb.pulseMax - orb.pulseMin);
    const radius = orb.radius * pulse * (1 + communeFlash * 0.5);

    // Project orb center (at origin)
    const proj = this.camera.project(0, 0, 0);
    const orbX = cx + proj.x;
    const orbY = cy + proj.y;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orb.glowRadius * (1 + communeFlash));
    glowGradient.addColorStop(0, `rgba(255, 30, 0, ${0.6 + communeFlash * 0.4})`);
    glowGradient.addColorStop(0.3, `rgba(255, 20, 0, ${0.3 + communeFlash * 0.2})`);
    glowGradient.addColorStop(0.6, `rgba(200, 10, 0, ${0.1 + communeFlash * 0.1})`);
    glowGradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(orbX, orbY, orb.glowRadius * (1 + communeFlash), 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Inner orb
    const orbGradient = ctx.createRadialGradient(
      orbX - radius * 0.2, orbY - radius * 0.2, 0,
      orbX, orbY, radius
    );
    orbGradient.addColorStop(0, colors.orbCore);
    orbGradient.addColorStop(0.3, colors.glowBright);
    orbGradient.addColorStop(0.7, colors.orb);
    orbGradient.addColorStop(1, 'rgba(150, 0, 0, 0.8)');

    ctx.beginPath();
    ctx.arc(orbX, orbY, radius, 0, Math.PI * 2);
    ctx.fillStyle = orbGradient;
    ctx.fill();

    // Inner swirl detail
    ctx.save();
    ctx.translate(orbX, orbY);
    ctx.rotate(this.time * 0.5);

    ctx.strokeStyle = `rgba(255, 100, 50, ${0.3 + communeFlash * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const r1 = radius * 0.3;
      const r2 = radius * 0.7;
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.5) * radius * 0.5,
        Math.sin(angle + 0.5) * radius * 0.5,
        Math.cos(angle + 1) * r2,
        Math.sin(angle + 1) * r2
      );
    }
    ctx.stroke();
    ctx.restore();
  }

  renderCommuneEffect(ctx, cx, cy) {
    const progress = (this.time - this.communeTime) / CONFIG.commune.duration;
    const flash = Math.pow(1 - progress, 2);

    // Screen flash
    ctx.fillStyle = `rgba(255, 50, 20, ${flash * 0.15})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Expanding ring
    const ringRadius = progress * 300;
    const ringAlpha = (1 - progress) * 0.5;

    ctx.strokeStyle = `rgba(255, 100, 50, ${ringAlpha})`;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderTranscendence(ctx, cx, cy, w, h) {
    const state = this.transcendenceFSM.state;
    const progress = this.transcendenceFSM.progress;
    const t = this.tunnelTime;

    // === ZOOM IN: Atlas faces camera and zooms in, fading to white ===
    if (state === 'zoomIn') {
      // Clear background
      ctx.fillStyle = CONFIG.background;
      ctx.fillRect(0, 0, w, h);

      // Apply zoom transform - scale toward the orb
      const zoomScale = this.zoomInState.scale || 1;
      const zoomOffsetY = this.zoomInState.offsetY || 0;
      ctx.save();
      ctx.translate(cx, cy + zoomOffsetY);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-cx, -(cy + zoomOffsetY));

      // Red nebula
      const nebulaGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      nebulaGradient.addColorStop(0, 'rgba(60, 5, 0, 0.3)');
      nebulaGradient.addColorStop(0.5, 'rgba(30, 2, 0, 0.2)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, w, h);

      // Stars
      this.renderStars(ctx, cx, cy);

      // Figures
      this.renderFigures(ctx, cx, cy);

      // Atlas
      const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;
      const projectedFaces = this.projectFaces(cx, cy, hover);
      const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
      const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
      const orbFaceDepth = orbFace ? orbFace.depth : 0;

      let orbRendered = false;
      for (const face of projectedFaces) {
        if (!orbRendered && face.depth < orbFaceDepth) {
          this.renderOrb(ctx, orbPosition.x, orbPosition.y);
          orbRendered = true;
        }
        this.renderFace(ctx, face, face.faceIndex === this.orbFaceIndex);
      }
      if (!orbRendered) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
      }

      ctx.restore();
      return;
    }

    // === FLASH STATE: Crossfade - Atlas fades out, tunnel fades in ===
    if (state === 'flash') {
      // Initialize tunnel if not already
      if (!this.tunnelParticles || this.tunnelParticles.length === 0) {
        this.initTunnelPhase();
      }

      // Speed ramps up quickly during crossfade (easeInQuad)
      const speedMultiplier = 0.2 + progress * progress * 0.8; // 0.2 -> 1.0
      const dt = 0.016; // Approximate frame time
      this.tunnelTime += dt * 3 * speedMultiplier;

      // Update particle/ring positions with ramping speed
      for (const p of this.tunnelParticles) {
        p.z -= p.speed * dt * 2.5 * speedMultiplier;
        if (p.z < -100) {
          p.z = 1000;
          p.hue = (p.hue + 30) % 360;
        }
        p.angle += dt * (1.5 + p.speed / 300) * speedMultiplier;
      }
      for (const r of this.tunnelRings) {
        r.z -= 500 * dt * speedMultiplier;
        if (r.z < -50) {
          r.z = 2000;
          r.hue = (r.hue + 60) % 360;
        }
      }

      // Render tunnel fading in
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = progress;
      const tcx = cx + (this.tunnelOffsetX || 0);
      const tcy = cy + (this.tunnelOffsetY || 0);
      this.renderDomainWarp(ctx, tcx, tcy, w, h, this.tunnelTime);
      this.renderKaleidoscope(ctx, tcx, tcy, w, h, this.tunnelTime);
      this.renderTunnelRings(ctx, tcx, tcy, w, h, this.tunnelTime);
      this.renderTunnelParticles(ctx, tcx, tcy, w, h, this.tunnelTime);
      this.renderVortex(ctx, tcx, tcy, this.tunnelTime);
      ctx.restore();

      // Render Atlas fading out on top
      ctx.save();
      ctx.globalAlpha = 1 - progress;

      const zoomScale = this.zoomInState.scale || 1;
      const zoomOffsetY = this.zoomInState.offsetY || 0;
      ctx.translate(cx, cy + zoomOffsetY);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-cx, -(cy + zoomOffsetY));

      // Render Atlas scene
      const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;
      const projectedFaces = this.projectFaces(cx, cy, hover);
      const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
      const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
      const orbFaceDepth = orbFace ? orbFace.depth : 0;

      let orbRendered = false;
      for (const face of projectedFaces) {
        if (!orbRendered && face.depth < orbFaceDepth) {
          this.renderOrb(ctx, orbPosition.x, orbPosition.y);
          orbRendered = true;
        }
        this.renderFace(ctx, face, face.faceIndex === this.orbFaceIndex);
      }
      if (!orbRendered) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
      }
      ctx.restore();
      return;
    }

    // === TUNNEL STATE: PURE PSYCHEDELIC MADNESS ===
    if (state === 'tunnel') {
      // Trail effect - semi-transparent black overlay instead of full clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Mouse-reactive center offset
      const tcx = cx + this.tunnelOffsetX;
      const tcy = cy + this.tunnelOffsetY;

      // Zoom gradually from 1x to 3x during tunnel (slow zoom)
      const tunnelZoom = 1 + progress * 2; // Zoom from 1x to 3x
      ctx.save();
      ctx.translate(tcx, tcy);
      ctx.scale(tunnelZoom, tunnelZoom);
      ctx.translate(-tcx, -tcy);

      this.renderDomainWarp(ctx, tcx, tcy, w, h, t);
      this.renderKaleidoscope(ctx, tcx, tcy, w, h, t);
      this.renderTunnelRings(ctx, tcx, tcy, w, h, t);
      this.renderTunnelParticles(ctx, tcx, tcy, w, h, t);
      this.renderVortex(ctx, tcx, tcy, t);

      ctx.restore();

      this.renderScreenEffects(ctx, cx, cy, w, h, t);

      // Fade to white at end
      if (progress > 0.9) {
        const fadeOut = (progress - 0.9) / 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeOut})`;
        ctx.fillRect(0, 0, w, h);
      }
      return;
    }

    // === FADE TO BLACK: White fades to black ===
    if (state === 'fadeToBlack') {
      // Fade from white to black
      const whiteAlpha = 1 - progress;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // === ITERATION: Display "ITERATION #XXXXX" on black ===
    if (state === 'iteration') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Fade in then out
      let alpha;
      if (progress < 0.3) {
        alpha = progress / 0.3; // Fade in
      } else if (progress > 0.7) {
        alpha = (1 - progress) / 0.3; // Fade out
      } else {
        alpha = 1; // Full visibility
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff2200';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glowing text effect
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 20;

      ctx.fillText(`ITERATION #${this.iterationNumber}`, cx, cy);

      // Double render for stronger glow
      ctx.fillText(`ITERATION #${this.iterationNumber}`, cx, cy);

      ctx.restore();
      return;
    }

    // === ATLAS APPEAR: Black background, Atlas fades in ===
    if (state === 'atlasAppear') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Atlas fades in
      ctx.globalAlpha = progress;
      const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;
      const projectedFaces = this.projectFaces(cx, cy, hover);
      const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
      const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
      const orbFaceDepth = orbFace ? orbFace.depth : 0;

      let orbRendered = false;
      for (const face of projectedFaces) {
        if (!orbRendered && face.depth < orbFaceDepth) {
          this.renderOrb(ctx, orbPosition.x, orbPosition.y);
          orbRendered = true;
        }
        this.renderFace(ctx, face, face.faceIndex === this.orbFaceIndex);
      }
      if (!orbRendered) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // === STARS APPEAR: Atlas visible, stars fade in ===
    if (state === 'starsAppear') {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Red nebula fades in
      ctx.globalAlpha = progress;
      const nebulaGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      nebulaGradient.addColorStop(0, 'rgba(60, 5, 0, 0.3)');
      nebulaGradient.addColorStop(0.5, 'rgba(30, 2, 0, 0.2)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, w, h);

      // Stars fade in
      this.renderStars(ctx, cx, cy);
      ctx.globalAlpha = 1;

      // Atlas fully visible
      const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;
      const projectedFaces = this.projectFaces(cx, cy, hover);
      const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
      const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
      const orbFaceDepth = orbFace ? orbFace.depth : 0;

      let orbRendered = false;
      for (const face of projectedFaces) {
        if (!orbRendered && face.depth < orbFaceDepth) {
          this.renderOrb(ctx, orbPosition.x, orbPosition.y);
          orbRendered = true;
        }
        this.renderFace(ctx, face, face.faceIndex === this.orbFaceIndex);
      }
      if (!orbRendered) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
      }
      return;
    }

    // === FIGURES APPEAR: Everything visible, figures arrive one by one ===
    if (state === 'figuresAppear') {
      // Full background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const nebulaGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      nebulaGradient.addColorStop(0, 'rgba(60, 5, 0, 0.3)');
      nebulaGradient.addColorStop(0.5, 'rgba(30, 2, 0, 0.2)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, w, h);

      // Stars
      this.renderStars(ctx, cx, cy);

      // Figures arriving one by one
      const totalFigures = CONFIG.figures.count;
      const figuresVisible = Math.floor(progress * totalFigures) + 1;
      this.renderFiguresPartial(ctx, cx, cy, Math.min(figuresVisible, totalFigures), progress);

      // Atlas
      const hover = Math.sin(this.time * CONFIG.atlas.hoverSpeed) * CONFIG.atlas.hoverAmplitude;
      const projectedFaces = this.projectFaces(cx, cy, hover);
      const orbFace = projectedFaces.find(f => f.faceIndex === this.orbFaceIndex);
      const orbPosition = orbFace ? this.getOrbPosition(orbFace.verts) : { x: cx, y: cy };
      const orbFaceDepth = orbFace ? orbFace.depth : 0;

      let orbRendered = false;
      for (const face of projectedFaces) {
        if (!orbRendered && face.depth < orbFaceDepth) {
          this.renderOrb(ctx, orbPosition.x, orbPosition.y);
          orbRendered = true;
        }
        this.renderFace(ctx, face, face.faceIndex === this.orbFaceIndex);
      }
      if (!orbRendered) {
        this.renderOrb(ctx, orbPosition.x, orbPosition.y);
      }

      // Vignette
      const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(0.7, 'transparent');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      return;
    }
  }

  // Trippy domain-warped background
  renderDomainWarp(ctx, cx, cy, w, h, t) {
    const cellSize = 40;
    const cols = Math.ceil(w / cellSize) + 2;
    const rows = Math.ceil(h / cellSize) + 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * cellSize;
        const y = j * cellSize;

        // Warped coordinates
        const warpX = Math.sin(y * 0.01 + t * 2) * 30 + Math.sin(t * 3 + i * 0.5) * 20;
        const warpY = Math.cos(x * 0.01 + t * 1.5) * 30 + Math.cos(t * 2.5 + j * 0.5) * 20;

        const wx = x + warpX;
        const wy = y + warpY;

        // Distance from center affects color
        const dx = wx - cx;
        const dy = wy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const hue = (dist * 0.5 + t * 100 + i * 10 + j * 10) % 360;
        const lightness = 30 + Math.sin(dist * 0.02 - t * 3) * 20;

        ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.3)`;
        ctx.fillRect(wx - cellSize / 2, wy - cellSize / 2, cellSize, cellSize);
      }
    }
  }

  // Kaleidoscope mirror effect
  renderKaleidoscope(ctx, cx, cy, w, h, t) {
    const segments = this.kaleidoSegments || 12;
    const angleStep = (Math.PI * 2) / segments;

    ctx.save();
    ctx.translate(cx, cy);

    for (let s = 0; s < segments; s++) {
      ctx.save();
      ctx.rotate(s * angleStep + t * 0.3);

      // Mirror every other segment
      if (s % 2 === 1) {
        ctx.scale(-1, 1);
      }

      // Draw fractal-like patterns
      for (let i = 0; i < 8; i++) {
        const dist = 50 + i * 40 + Math.sin(t * 2 + i) * 20;
        const size = 20 + Math.sin(t * 3 + i * 0.5) * 10;
        const hue = (t * 50 + i * 45 + s * 30) % 360;

        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
        ctx.beginPath();

        // Alternate between shapes
        const shape = (i + s) % 4;
        if (shape === 0) {
          ctx.arc(dist, 0, size, 0, Math.PI * 2);
        } else if (shape === 1) {
          ctx.rect(dist - size / 2, -size / 2, size, size);
        } else if (shape === 2) {
          // Triangle
          ctx.moveTo(dist, -size);
          ctx.lineTo(dist + size, size);
          ctx.lineTo(dist - size, size);
          ctx.closePath();
        } else {
          // Star
          for (let p = 0; p < 5; p++) {
            const angle = (p * Math.PI * 2) / 5 - Math.PI / 2;
            const r = p % 2 === 0 ? size : size / 2;
            const px = dist + Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // Rings flying toward viewer
  renderTunnelRings(ctx, cx, cy, w, h, t) {
    if (!this.tunnelRings) return;

    const maxDist = Math.max(w, h);

    for (const ring of this.tunnelRings) {
      const scale = 1000 / (ring.z + 100);
      if (scale < 0.1 || scale > 20) continue;

      const radius = 100 * scale;
      const hue = (ring.hue + t * 30) % 360;
      const alpha = Math.min(1, scale * 0.3);

      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
      ctx.lineWidth = ring.thickness * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.2);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Particle storm
  renderTunnelParticles(ctx, cx, cy, w, h, t) {
    if (!this.tunnelParticles) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.tunnelParticles) {
      const scale = 800 / (p.z + 50);
      if (scale < 0.05 || scale > 30) continue;

      const x = cx + Math.cos(p.angle) * p.radius * scale;
      const y = cy + Math.sin(p.angle) * p.radius * scale;

      const size = p.size * scale;
      const hue = (p.hue + t * 60) % 360;
      const alpha = Math.min(1, scale * 0.5);

      ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;

      ctx.beginPath();
      if (p.type === 0) {
        ctx.arc(x, y, size, 0, Math.PI * 2);
      } else if (p.type === 1) {
        ctx.rect(x - size / 2, y - size / 2, size, size);
      } else if (p.type === 2) {
        // Draw as streak toward center
        const streakLen = size * 3;
        const angle = Math.atan2(cy - y, cx - x);
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * streakLen, y + Math.sin(angle) * streakLen);
        ctx.lineWidth = size / 2;
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
        ctx.stroke();
      } else {
        // Diamond
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
      }
      ctx.fill();
    }

    ctx.restore();
  }

  // Central vortex/singularity
  renderVortex(ctx, cx, cy, t) {
    const spirals = 6;
    const turns = 3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 2);
    ctx.globalCompositeOperation = 'lighter';

    for (let s = 0; s < spirals; s++) {
      const baseAngle = (s / spirals) * Math.PI * 2;
      const hue = (s * 60 + t * 100) % 360;

      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        const angle = baseAngle + progress * turns * Math.PI * 2;
        const radius = progress * 150 + Math.sin(t * 5 + progress * 10) * 10;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Central bright point
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.3, `hsla(${(t * 100) % 360}, 100%, 70%, 0.8)`);
    coreGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(-50, -50, 100, 100);

    ctx.restore();
  }

  // Screen distortion effects
  renderScreenEffects(ctx, cx, cy, w, h, t) {
    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Pulsing vignette
    const pulse = 0.5 + Math.sin(t * 3) * 0.2;
    const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.5, 'transparent');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${pulse})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Random flicker
    if (Math.random() < 0.05) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

export default function day19(canvas) {
  const game = new Day19Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
