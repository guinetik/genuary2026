/**
 * Genuary 2026 - Day 25
 * Prompt: "Organic Geometry"
 * 
 * @fileoverview PRIMORDIAL SOUP - Origin of life simulation
 * 
 * The origin of life: simple molecules in a warm ocean,
 * energized by lightning and hydrothermal vents.
 * Watch complexity emerge as molecules combine.
 * 
 * Refactored to showcase gcanvas 3D features:
 * - Scene3D for automatic depth sorting and projection
 * - Sphere3D for atoms with proper 3D lighting
 * - GameObject for molecule lifecycle management
 * 
 * @author guinetik
 * @credit Manuel Larino - Inspiration
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import {
  Game,
  Painter,
  Camera3D,
  Screen,
  heatTransferFalloff,
  SVGShape,
  Scene,
  VerticalLayout,
  HorizontalLayout,
  TileLayout,
  Text,
  ToggleButton,
  Rectangle,
  ShapeGOFactory,
} from '@guinetik/gcanvas';

// Local modules
import { TAU, CONFIG } from './day25.config.js';
import { MOLECULES, PRIMORDIAL_KEYS, REACTIONS } from './day25.chemistry.js';
import { Molecule3D } from './day25.molecule.js';
import { LegendUI } from './day25.ui.js';
import { Lightning } from './day25.lightning.js';

/**
 * Primordial Soup Demo
 * 
 * Main game class for Day 25, creating a molecular simulation where
 * simple molecules combine to form complex structures in a warm ocean.
 * 
 * @class PrimordialSoupDemo
 * @extends {Game}
 */
class PrimordialSoupDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.bgColor;
  }

  init() {
    super.init();
    Screen.init(this);  // Initialize screen detection
    Painter.init(this.ctx);

    // Setup camera
    this.camera = new Camera3D({
      perspective: CONFIG.perspective,
      rotationX: 0.2,
      rotationY: 0,
      inertia: true,
      friction: 0.95,
      clampX: false,
      clampY: false,
    });
    this.camera.enableMouseControl(this.canvas);

    // Disable double-click reset
    this.canvas.removeEventListener(
      'dblclick',
      this.camera._boundHandlers.dblclick
    );

    // Store molecules (we render manually for proper bond/atom control)
    this.molecules = [];
    
    // Screen center for rendering
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.reactionLog = [];
    this.totalTime = 0;

    // Stats
    this.stats = { reactions: 0, maxTier: 0 };

    // Discovery tracking - molecules seen at least once
    this.discovered = new Set();

    // Required molecules per tier for progression
    this.tierRequirements = {
      0: ['water', 'methane', 'ammonia', 'hydrogen', 'carbonDioxide', 'hydrogenSulfide'],
      1: ['formaldehyde', 'hydrogenCyanide'],
      2: ['glycine', 'alanine', 'serine', 'asparticAcid', 'cysteine'],
      3: ['diglycine'],
    };

    // UI state - hide info by default
    this.showInfo = false;
    this.showLegend = false;

    // Idle mode - auto-spawn when user is inactive
    this.lastInteractionTime = 0;
    this.idleSpawnTimer = 0;

    // World bounds - expanded for better spread
    this.worldWidth = this.width * CONFIG.worldWidthRatio;
    this.worldHeight = this.height * CONFIG.worldHeightRatio;

    // Use Screen.responsive for device-appropriate counts
    // Mobile: fewer for performance, Desktop/4K: more for fuller scene
    // Tuned for good density without overcrowding
    this.moleculeCount = Screen.responsive(14, 24, 50);
    const bubbleCount = Screen.responsive(15, 25, 50);
    const particleCount = Screen.responsive(25, 40, 80);

    console.log(`[Day25] Screen: ${Screen.isMobile ? 'mobile' : Screen.isTablet ? 'tablet' : 'desktop'}, molecules: ${this.moleculeCount}`);

    // Ambient bubbles
    this.bubbles = [];
    for (let i = 0; i < bubbleCount; i++) {
      this.bubbles.push(this.createBubble(true));
    }

    // Floating particles
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }

    // Reaction burst particles (temporary, spawned on reactions)
    this.reactionBursts = [];

    // Spawn primordial molecules
    for (let i = 0; i < this.moleculeCount; i++) {
      this.spawnMolecule(true);
    }

    // Load thermal vent silhouettes asynchronously
    // SVG is 2048x2048, we want vents to be ~40% of canvas height
    this.leftVent = null;
    this.rightVent = null;
    this.loadThermalVents();

    // Create lightning effect (screen-space, not affected by camera rotation)
    this.createLightning();

    // Create UI - toggle buttons at bottom left
    this.createUI();

    // Track drag vs click
    let dragStart = null;

    // Helper to check if point is inside a dialog's bounds
    const isInsideDialog = (x, y, dialog) => {
      if (!dialog) return false;
      const dx = dialog.x - dialog.width / 2;
      const dy = dialog.y - dialog.height / 2;
      return x >= dx && x <= dx + dialog.width &&
             y >= dy && y <= dy + dialog.height;
    };

    // Helper to check if point is inside legend bounds
    const isInsideLegend = (x, y) => isInsideDialog(x, y, this.legendUI);

    // Helper to check if point is inside stats bounds
    const isInsideStats = (x, y) => isInsideDialog(x, y, this.statsScene);

    // Helper to enable/disable camera drag
    this.setCameraDragEnabled = (enabled) => {
      if (!this.camera._boundHandlers) return;
      const handlers = this.camera._boundHandlers;
      if (enabled) {
        // Re-add handlers
        this.canvas.addEventListener('mousedown', handlers.mousedown);
        this.canvas.addEventListener('mousemove', handlers.mousemove);
        this.canvas.addEventListener('mouseup', handlers.mouseup);
        if (handlers.touchstart) {
          this.canvas.addEventListener('touchstart', handlers.touchstart);
          this.canvas.addEventListener('touchmove', handlers.touchmove);
          this.canvas.addEventListener('touchend', handlers.touchend);
        }
      } else {
        // Remove handlers
        this.canvas.removeEventListener('mousedown', handlers.mousedown);
        this.canvas.removeEventListener('mousemove', handlers.mousemove);
        this.canvas.removeEventListener('mouseup', handlers.mouseup);
        if (handlers.touchstart) {
          this.canvas.removeEventListener('touchstart', handlers.touchstart);
          this.canvas.removeEventListener('touchmove', handlers.touchmove);
          this.canvas.removeEventListener('touchend', handlers.touchend);
        }
      }
    };

    // Close legend when clicking outside (capture phase)
    // Stats pane stays open and allows interaction with simulation
    const handleClickOutside = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      const clickX = touch.clientX - rect.left;
      const clickY = touch.clientY - rect.top;

      // Handle legend click-outside (camera disabled, click outside closes)
      if (this.showLegend && this.legendUI && this.legendUI.visible) {
        if (!isInsideLegend(clickX, clickY)) {
          this.showLegend = false;
          this.legendUI.visible = false;
          this.legendBtn.toggle(false);
          this.setCameraDragEnabled(true);
        }
      }
      // Stats pane: no click-outside-to-close, camera stays enabled
    };

    this.canvas.addEventListener('mousedown', handleClickOutside, true);
    this.canvas.addEventListener('touchstart', handleClickOutside, true);

    this.canvas.addEventListener('mousedown', (e) => {
      dragStart = { x: e.clientX, y: e.clientY };
    });

    // Track mouse position for repulsion effect
    this.mouseWorld = { x: 0, y: 0, z: 0, active: false };

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left - this.width / 2;
      const screenY = e.clientY - rect.top - this.height / 2;

      // Unproject through camera rotation
      const cosX = Math.cos(-this.camera.rotationX);
      const sinX = Math.sin(-this.camera.rotationX);
      const cosY = Math.cos(-this.camera.rotationY);
      const sinY = Math.sin(-this.camera.rotationY);

      let x = screenX, y = screenY, z = 0;

      // Undo X rotation (tilt)
      let ty = y * cosX - z * sinX;
      let tz = y * sinX + z * cosX;
      y = ty; z = tz;

      // Undo Y rotation (spin)
      let tx = x * cosY + z * sinY;
      tz = -x * sinY + z * cosY;
      x = tx; z = tz;

      this.mouseWorld.x = x;
      this.mouseWorld.y = y;
      this.mouseWorld.z = z;
      this.mouseWorld.active = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseWorld.active = false;
    });

    // Click spawns smart molecule (what's needed for reactions)
    this.canvas.addEventListener('mouseup', (e) => {
      // Don't spawn molecules when legend is visible
      if (this.showLegend && this.legendUI && this.legendUI.visible) {
        dragStart = null;
        return;
      }

      if (dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragStart = null;
          return;
        }
      }
      dragStart = null;

      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left - this.width / 2;
      const screenY = e.clientY - rect.top - this.height / 2;

      // Unproject through camera rotation (reverse order: X then Y)
      const cosX = Math.cos(-this.camera.rotationX);
      const sinX = Math.sin(-this.camera.rotationX);
      const cosY = Math.cos(-this.camera.rotationY);
      const sinY = Math.sin(-this.camera.rotationY);

      let x = screenX;
      let y = screenY;
      let z = (Math.random() - 0.5) * 80;

      // First undo X rotation (tilt)
      let ty = y * cosX - z * sinX;
      let tz = y * sinX + z * cosX;
      y = ty;
      z = tz;

      // Then undo Y rotation (spin)
      let tx = x * cosY + z * sinY;
      tz = -x * sinY + z * cosY;
      x = tx;
      z = tz;

      // Reset idle timer on user interaction
      this.lastInteractionTime = this.totalTime;
      this.idleSpawnTimer = 0;

      // Use smart picker to spawn what's needed for reactions
      const smartKey = this.pickSmartMolecule();
      const mol = this.spawnMolecule(false, x, y, z, smartKey, true);
      if (mol) {
        this.reactionLog.unshift({
          text: `+ ${mol.label} (${mol.name})`,
          time: 2,
        });
        if (this.reactionLog.length > 5) this.reactionLog.pop();
      }
    });

    // Press R to restart simulation
    this._keyHandler = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.restart();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  /**
   * Restart the simulation - clear everything and respawn
   */
  restart() {
    // Clear molecules
    this.molecules = [];

    // Reset stats
    this.stats = { reactions: 0, maxTier: 0 };
    this.discovered = new Set();
    this.reactionLog = [];

    // Reset timers
    this.totalTime = 0;
    this.lastInteractionTime = 0;
    this.idleSpawnTimer = 0;

    // Reset lightning
    if (this.lightning) {
      this.lightning.timer = CONFIG.lightningInterval;
      this.lightning.flash = null;
    }

    // Clear reaction bursts
    this.reactionBursts = [];

    // Clear filter
    this.clearMoleculeFilter();

    // Close dialogs
    if (this.showLegend) {
      this.showLegend = false;
      this.legendUI.visible = false;
      this.legendBtn.toggle(false);
    }
    if (this.showStats) {
      this.showStats = false;
      this.statsScene.visible = false;
      this.statsBtn.toggle(false);
    }
    this.setCameraDragEnabled(true);

    // Reset camera
    this.camera.rotationX = 0.2;
    this.camera.rotationY = 0;

    // Respawn primordial molecules
    for (let i = 0; i < this.moleculeCount; i++) {
      this.spawnMolecule(true);
    }

    // Log restart
    this.reactionLog.unshift({
      text: '~ Simulation restarted',
      time: 3,
    });

    console.log('[Day25] Simulation restarted');
  }

  /**
   * Create an ambient bubble spawning from thermal vents
   * @param {boolean} randomY - Start at random Y position (for initial spawn)
   * @returns {Object}
   */
  createBubble(randomY = false) {
    // Spawn from left or right vent
    const fromLeft = Math.random() < 0.5;
    const ventX = fromLeft ? this.width * 0.08 : this.width * 0.92;
    const spread = this.width * 0.05; // Small spread around vent

    return {
      x: ventX + (Math.random() - 0.5) * spread,
      y: randomY ? Math.random() * this.height : this.height + Math.random() * 20,
      size: 2 + Math.random() * 6,
      speed: 40 + Math.random() * 60, // Slightly faster - thermal energy
      wobblePhase: Math.random() * TAU,
      wobbleSpeed: 1.5 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.35,
    };
  }

  /**
   * Create a floating particle (marine snow / bioluminescence)
   * @returns {Object}
   */
  createParticle() {
    // Mostly pale blue/cyan marine snow, occasional green bioluminescence
    const isBioluminescent = Math.random() < 0.3;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: (Math.random() - 0.5) * 400,
      size: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 4 - 2, // Slight upward drift
      alpha: 0.04 + Math.random() * 0.12,
      hue: isBioluminescent ? 160 + Math.random() * 40 : 190 + Math.random() * 30, // Green-cyan or blue
    };
  }

  /**
   * Load thermal vent SVG silhouettes asynchronously
   */
  async loadThermalVents() {
    const ventScale = (this.height * 0.4) / 2048;
    const ventHeight = 2048 * ventScale;

    try {
      // Load left vent
      this.leftVent = await SVGShape.fromURL('./thermal-vent.svg', {
        x: 0,
        y: this.height - ventHeight * 0.85,
        scale: ventScale,
        centerPath: false,
        color: '#000',
      });

      // Load right vent (mirrored) - load fresh instance
      this.rightVent = await SVGShape.fromURL('./thermal-vent.svg', {
        x: this.width,
        y: this.height - ventHeight * 0.85,
        scale: ventScale,
        centerPath: false,
        color: '#000',
        scaleX: -1, // Flip horizontally
      });

      console.log('[Day25] Thermal vents loaded');
    } catch (err) {
      console.warn('[Day25] Failed to load thermal vents:', err);
    }
  }

  /**
   * Create screen-space lightning effect
   */
  createLightning() {
    this.lightning = new Lightning(this, {
      interval: CONFIG.lightningInterval,
      variance: CONFIG.lightningVariance,
      radius: CONFIG.lightningRadius,
      energy: CONFIG.lightningEnergy,
      zIndex: 100,
      onStrike: (screenX, screenY, radius, energy) => {
        // Heat molecules that appear near the strike point on screen
        const cx = this.width / 2;
        const cy = this.height / 2;

        for (const mol of this.molecules) {
          const proj = this.camera.project(mol.x, mol.y, mol.z);
          const molScreenX = cx + proj.x;
          const molScreenY = cy + proj.y;

          const dx = molScreenX - screenX;
          const dy = molScreenY - screenY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius) {
            const intensity = 1 - dist / radius;
            mol.temperature = Math.min(1, mol.temperature + energy * intensity);
            mol.flash = Math.max(mol.flash, intensity * 0.5);
          }
        }

        // Cull redundant molecules (cooked by lightning)
        this.lightningCull(screenX, screenY);

        // Chance to spawn amino acid from lightning energy (Miller-Urey style)
        this.lightningSpawn(screenX, screenY);
      },
    });
    this.pipeline.add(this.lightning);
  }

  /**
   * Cull redundant molecules near lightning strike
   * Removes up to 3 molecules that are overrepresented
   */
  lightningCull(screenX, screenY) {
    if (this.molecules.length < 15) return; // Don't cull if population is small

    // Count molecules by type
    const counts = {};
    for (const mol of this.molecules) {
      counts[mol.templateKey] = (counts[mol.templateKey] || 0) + 1;
    }

    // Find redundant molecules (more than 5 of the same type, or tier 0 when we have higher tiers)
    const redundant = [];
    const cx = this.width / 2;
    const cy = this.height / 2;

    for (let i = 0; i < this.molecules.length; i++) {
      const mol = this.molecules[i];
      const count = counts[mol.templateKey];

      // Check if redundant: too many of same type, or low tier primordials when we've evolved
      const isTooMany = count > 5;
      const isObsoletePrimordial = mol.tier === 0 && this.stats.maxTier >= 2 && count > 3;

      if (isTooMany || isObsoletePrimordial) {
        // Calculate screen distance to strike point
        const proj = this.camera.project(mol.x, mol.y, mol.z);
        const dist = Math.sqrt(
          Math.pow(cx + proj.x - screenX, 2) +
          Math.pow(cy + proj.y - screenY, 2)
        );
        redundant.push({ index: i, dist, key: mol.templateKey });
      }
    }

    // Sort by distance to strike (closer = more likely to get zapped)
    redundant.sort((a, b) => a.dist - b.dist);

    // Remove up to 3 closest redundant molecules
    const toRemove = new Set();
    const removedTypes = {};
    for (const r of redundant) {
      if (toRemove.size >= 3) break;
      // Don't remove too many of the same type in one strike
      if ((removedTypes[r.key] || 0) >= 2) continue;

      toRemove.add(r.index);
      removedTypes[r.key] = (removedTypes[r.key] || 0) + 1;
      counts[r.key]--;
    }

    if (toRemove.size > 0) {
      this.molecules = this.molecules.filter((_, i) => !toRemove.has(i));
    }
  }

  /**
   * Chance for lightning to directly synthesize rare molecules
   * Represents Miller-Urey style abiotic synthesis - spawns the harder-to-get stuff
   */
  lightningSpawn(screenX, screenY) {
    // Only spawn if we've reached amino acid phase (maxTier >= 2)
    if (this.stats.maxTier < 2) return;

    // 15% chance to spawn rare molecule
    if (Math.random() > 0.15) return;

    // Rare molecules pool - the ones that are hard to synthesize naturally
    const rareMolecules = ['serine', 'cysteine', 'asparticAcid', 'diglycine'];

    // Add nucleobases if we've reached that tier
    if (this.stats.maxTier >= 3) {
      rareMolecules.push('adenine', 'cytosine', 'guanine', 'uracil');
    }

    const key = rareMolecules[Math.floor(Math.random() * rareMolecules.length)];

    // Convert screen position to world position (approximate)
    const worldX = screenX - this.width / 2 + (Math.random() - 0.5) * 50;
    const worldY = screenY - this.height / 2 + (Math.random() - 0.5) * 50;
    const worldZ = (Math.random() - 0.5) * 100;

    const mol = new Molecule3D(this, key, { x: worldX, y: worldY, z: worldZ });
    mol.temperature = 0.8; // Hot from lightning
    mol.flash = 1.0;
    mol.vx = (Math.random() - 0.5) * 30;
    mol.vy = (Math.random() - 0.5) * 30;
    mol.vz = (Math.random() - 0.5) * 30;

    this.molecules.push(mol);
    this.discovered.add(key);
    this.stats.maxTier = Math.max(this.stats.maxTier, mol.tier);

    // Log the synthesis
    this.reactionLog.unshift({
      text: `⚡ ${mol.label} synthesized!`,
      time: 3,
    });
    if (this.reactionLog.length > 5) this.reactionLog.pop();
  }

  /**
   * Create UI with toggle buttons and legend dialog
   */
  createUI() {
    const isMobile = Screen.isMobile;
    const btnSize = isMobile ? 36 : 44;
    const btnFont = isMobile ? '16px "Fira Code", monospace' : '18px "Fira Code", monospace';
    const btnY = this.height - 60;
    const btnStartX = 20;

    this.buttonBar = new HorizontalLayout(this, {
      anchor: 'bottom-left',
      spacing: 10,
      x: btnStartX,
      y: btnY,
    });
    this.pipeline.add(this.buttonBar);

    // Info toggle button [i]
    this.infoBtn = new ToggleButton(this, {
      text: "i",
      width: btnSize,
      height: btnSize,
      font: btnFont,
      startToggled: this.showInfo,
      onToggle: (isOn) => {
        this.showInfo = isOn;
      },
    });
    //this.infoBtn.x = btnStartX + btnSize / 2;
    //this.infoBtn.y = btnY;
    this.buttonBar.add(this.infoBtn);

    // Legend toggle button
    this.legendBtn = new ToggleButton(this, {
      text: "?",
      width: btnSize,
      height: btnSize,
      font: btnFont,
      startToggled: this.showLegend,
      onToggle: (isOn) => {
        this.showLegend = isOn;
        if (this.legendUI) {
          this.legendUI.visible = isOn;
        }
        // Disable/enable camera drag when legend is open/closed
        this.setCameraDragEnabled(!isOn);
      },
    });
    //this.legendBtn.x = btnStartX + btnSize + 10 + btnSize / 2;
    //this.legendBtn.y = btnY;
    this.buttonBar.add(this.legendBtn);

    // Stats toggle button [#]
    this.showStats = false;
    this.moleculeFilter = null; // Currently filtered molecule key
    this.statsBtn = new ToggleButton(this, {
      text: "#",
      width: btnSize,
      height: btnSize,
      font: btnFont,
      startToggled: this.showStats,
      onToggle: (isOn) => {
        this.showStats = isOn;
        if (this.statsScene) {
          this.statsScene.visible = isOn;
        }
        // Camera stays enabled for stats pane
        // Clear filter when closing
        if (!isOn) {
          this.clearMoleculeFilter();
        }
      },
    });
    //this.statsBtn.x = btnStartX + (btnSize + 10) * 2 + btnSize / 2;
    //this.statsBtn.y = btnY;
    this.buttonBar.add(this.statsBtn);

    // Create legend dialog
    this.createLegendDialog();

    // Create stats dialog
    this.createStatsDialog();
  }

  /**
   * Create the molecule browser dialog
   */
  createLegendDialog() {
    this.legendUI = new LegendUI(this);
    this.pipeline.add(this.legendUI);
  }

  /**
   * Create the stats dialog showing molecule counts by type
   */
  createStatsDialog() {
    const isMobile = Screen.isMobile;
    const btnWidth = isMobile ? 70 : 90;
    const btnHeight = isMobile ? 18 : 18;
    const columns = isMobile ? 2 : 2;
    const fontSize = isMobile ? 8 : 10;
    const dialogWidth = columns * btnWidth + 40;
    const dialogHeight = isMobile ? 380 : 480;

    // Stats scene on right side of screen
    this.statsScene = new Scene(this, {
      width: dialogWidth,
      height: dialogHeight,
    });
    this.statsScene.x = this.width - dialogWidth / 2 - 20;
    this.statsScene.y = this.height / 2;
    this.statsScene.visible = false;

    // Create background rectangle
    const bgRect = new Rectangle({
      width: dialogWidth,
      height: dialogHeight,
      color: 'rgba(0, 10, 15, 0.95)',
      stroke: '#999',
      lineWidth: 2,
    });
    const background = ShapeGOFactory.create(this, bgRect, {
      name: 'statsBackground',
    });
    this.statsScene.add(background);

    // Main vertical layout to hold title and tile grid
    const mainLayout = new VerticalLayout(this, {
      spacing: 10,
      padding: 10,
    });
    this.statsScene.add(mainLayout);

    // Title
    const title = new Text(this, "MOLECULE COUNTS", {
      font: `bold ${fontSize + 2}px "Fira Code", monospace`,
      color: '#0f0',
      align: 'center',
      baseline: 'middle',
    });
    mainLayout.add(title);

    // TileLayout for molecule buttons
    const tileLayout = new TileLayout(this, {
      columns: columns,
      spacing: 4,
      padding: 4,
    });
    mainLayout.add(tileLayout);

    // Create toggle buttons for each molecule type
    this.statsButtons = {};
    const allKeys = Object.keys(MOLECULES);

    for (const key of allKeys) {
      const mol = MOLECULES[key];
      const btn = new ToggleButton(this, {
        text: `${mol.name}: 0`,
        width: btnWidth,
        height: btnHeight,
        font: `${fontSize}px "Fira Code", monospace`,
        startToggled: false,
        onToggle: (isOn) => {
          if (isOn) {
            // Set filter to this molecule
            this.setMoleculeFilter(key);
            // Radio behavior - untoggle others
            for (const [k, b] of Object.entries(this.statsButtons)) {
              if (k !== key && b.toggled) {
                b.toggle(false);
              }
            }
          } else {
            // Clear filter when untoggling
            this.clearMoleculeFilter();
          }
        },
      });
      btn._moleculeKey = key;
      this.statsButtons[key] = btn;
      tileLayout.add(btn);
    }

    this.pipeline.add(this.statsScene);
  }

  /**
   * Update stats dialog button labels with current molecule counts
   */
  updateStatsLabels() {
    if (!this.showStats || !this.statsButtons) return;

    // Count molecules by type
    const counts = {};
    for (const mol of this.molecules) {
      counts[mol.templateKey] = (counts[mol.templateKey] || 0) + 1;
    }

    // Update button labels
    for (const key of Object.keys(MOLECULES)) {
      const mol = MOLECULES[key];
      const count = counts[key] || 0;
      const btn = this.statsButtons[key];
      if (btn && btn.label) {
        btn.label.text = `${mol.name}: ${count}`;
      }
    }
  }

  /**
   * Set molecule filter - dim non-matching molecules
   * @param {string} key - Molecule template key to highlight
   */
  setMoleculeFilter(key) {
    this.moleculeFilter = key;
    for (const mol of this.molecules) {
      mol.dimmed = mol.templateKey !== key;
    }
  }

  /**
   * Clear molecule filter - restore all molecules to full opacity
   */
  clearMoleculeFilter() {
    this.moleculeFilter = null;
    for (const mol of this.molecules) {
      mol.dimmed = false;
    }
    // Untoggle all stats buttons
    if (this.statsButtons) {
      for (const btn of Object.values(this.statsButtons)) {
        if (btn.toggled) {
          btn.toggle(false);
        }
      }
    }
  }

  /**
   * Spawn a new molecule
   * @param {boolean} primordialOnly - Only spawn primordial molecules
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {string} templateKey - Specific molecule type
   * @param {boolean} ignoreLimit - Bypass molecule limit
   * @returns {Molecule3D|null}
   */
  spawnMolecule(primordialOnly = false, x, y, z, templateKey, ignoreLimit = false) {
    // Use scaled soft limit (3x initial count, capped at maxMolecules)
    const softLimit = Math.min(CONFIG.maxMolecules, (this.moleculeCount || CONFIG.baseMolecules) * 3);
    if (!ignoreLimit && this.molecules.length >= softLimit) return null;

    const key =
      templateKey ||
      (primordialOnly
        ? PRIMORDIAL_KEYS[Math.floor(Math.random() * PRIMORDIAL_KEYS.length)]
        : Object.keys(MOLECULES)[
            Math.floor(Math.random() * Object.keys(MOLECULES).length)
          ]);

    const px = x ?? (Math.random() - 0.5) * this.worldWidth;
    const py = y ?? (Math.random() - 0.5) * this.worldHeight;
    const pz = z ?? (Math.random() - 0.5) * CONFIG.worldDepth;

    const mol = new Molecule3D(this, key, { x: px, y: py, z: pz });
    // Apply current filter if active
    if (this.moleculeFilter) {
      mol.dimmed = key !== this.moleculeFilter;
    }
    this.molecules.push(mol);

    // Track discovery
    this.discovered.add(key);

    return mol;
  }

  /**
   * Check if all molecules in a tier have been discovered
   * @param {number} tier - Tier to check (0-3)
   * @returns {boolean}
   */
  isTierDiscovered(tier) {
    const required = this.tierRequirements[tier];
    if (!required) return true;
    return required.every(key => this.discovered.has(key));
  }

  /**
   * Check if nucleobase reactions are unlocked (all tiers 0-3 discovered)
   * @returns {boolean}
   */
  areNucleobasesUnlocked() {
    return this.isTierDiscovered(0) &&
           this.isTierDiscovered(1) &&
           this.isTierDiscovered(2) &&
           this.isTierDiscovered(3);
  }

  /**
   * Analyze pool and pick a molecule that would enable more reactions
   * @returns {string} Molecule template key to spawn
   */
  pickSmartMolecule() {
    // Count current molecules by type
    const counts = {};
    for (const mol of this.molecules) {
      counts[mol.templateKey] = (counts[mol.templateKey] || 0) + 1;
    }

    // Priority order - these are checked in sequence, spawn first one that's needed
    // Key precursors first, then primordials to make more precursors
    const priority = [
      'formaldehyde',   // HCHO - KEY for glycine, serine, cytosine, guanine
      'hydrogenCyanide',// HCN - KEY for glycine, alanine, adenine, cytosine
      'glycine',        // Simplest amino acid - needed for Ser, Asp, Cys, peptides
      'methane',        // CH4 - makes formaldehyde + HCN
      'ammonia',        // NH3 - makes HCN, alanine, adenine
      'water',          // H2O - universal reactant
      'carbonDioxide',  // CO2 - for aspartic acid
      'hydrogenSulfide',// H2S - for cysteine
      'hydrogen',       // H2 - byproduct, reducing agent
      'alanine',        // Second amino acid
    ];

    // Check each in priority order - spawn first one at 0
    for (const key of priority) {
      const count = counts[key] || 0;
      if (count === 0) {
        console.log('[Spawner] ZERO:', key);
        return key;
      }
    }

    // Check each in priority order - spawn first one under 3
    for (const key of priority) {
      const count = counts[key] || 0;
      if (count < 3) {
        console.log('[Spawner] LOW (<3):', key, count);
        return key;
      }
    }

    // Check each in priority order - spawn first one under 8
    for (const key of priority) {
      const count = counts[key] || 0;
      if (count < 8) {
        console.log('[Spawner] MED (<8):', key, count);
        return key;
      }
    }

    // Everything is well-stocked, spawn lowest count from priority list
    let lowest = priority[0];
    let lowestCount = counts[priority[0]] || 0;
    for (const key of priority) {
      const count = counts[key] || 0;
      if (count < lowestCount) {
        lowest = key;
        lowestCount = count;
      }
    }
    console.log('[Spawner] LOWEST:', lowest, lowestCount);
    return lowest;
  }

  /**
   * Spawn a primordial molecule from off-screen (left or right)
   * Simulates fresh reactants being brought in by ocean currents
   */
  spawnFromOffscreen() {
    // Check soft limit before spawning
    const softLimit = Math.min(CONFIG.maxMolecules, this.moleculeCount * 3);
    if (this.molecules.length >= softLimit) return null;

    // Pick molecule that would enable more reactions
    const key = this.pickSmartMolecule();

    // Spawn off-screen left or right
    const fromLeft = Math.random() < 0.5;
    const margin = 100; // How far off-screen
    const px = fromLeft
      ? -this.worldWidth / 2 - margin
      : this.worldWidth / 2 + margin;
    const py = (Math.random() - 0.5) * this.worldHeight * 0.8; // Mostly in middle band
    const pz = (Math.random() - 0.5) * CONFIG.worldDepth * 0.6;

    const mol = new Molecule3D(this, key, { x: px, y: py, z: pz });

    // Give gentle drift velocity toward center
    mol.vx = fromLeft ? 15 + Math.random() * 10 : -15 - Math.random() * 10;
    mol.vy = (Math.random() - 0.5) * 5;
    mol.vz = (Math.random() - 0.5) * 5;

    // Start at neutral temp - will warm/cool based on position
    mol.temperature = 0.5;

    // Apply current filter if active
    if (this.moleculeFilter) {
      mol.dimmed = key !== this.moleculeFilter;
    }

    this.molecules.push(mol);
    return mol;
  }

  /**
   * Spawn burst particles at reaction site (energy release effect)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} z - World Z position
   * @param {number} energy - Reaction energy (affects particle count/speed)
   */
  spawnReactionBurst(x, y, z, energy) {
    // More particles for higher energy reactions
    const count = Math.floor(12 + energy * 25);
    const speed = 250 + energy * 200; // FAST - get out like they owe money

    for (let i = 0; i < count; i++) {
      // Random direction in 3D sphere
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      const v = speed * (0.6 + Math.random() * 0.4);

      this.reactionBursts.push({
        x,
        y,
        z,
        vx: Math.sin(phi) * Math.cos(theta) * v,
        vy: Math.sin(phi) * Math.sin(theta) * v,
        vz: Math.cos(phi) * v,
        life: 1.0,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  /**
   * Check for and process chemical reactions
   */
  checkReactions() {
    const toRemove = new Set();
    const toAdd = [];

    for (let i = 0; i < this.molecules.length; i++) {
      const mol1 = this.molecules[i];
      if (mol1.reactionCooldown > 0 || toRemove.has(i)) continue;

      for (let j = i + 1; j < this.molecules.length; j++) {
        const mol2 = this.molecules[j];
        if (mol2.reactionCooldown > 0 || toRemove.has(j)) continue;

        const dx = mol2.x - mol1.x;
        const dy = mol2.y - mol1.y;
        const dz = mol2.z - mol1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > CONFIG.reactionDistance) continue;

        const avgTemp = (mol1.temperature + mol2.temperature) / 2;

        for (const reaction of REACTIONS) {
          const [r1, r2] = reaction.reactants;
          const matches =
            (mol1.templateKey === r1 && mol2.templateKey === r2) ||
            (mol1.templateKey === r2 && mol2.templateKey === r1);

          if (!matches) continue;

          // Gate nucleobase reactions until all previous tiers discovered
          const producesNucleobase = reaction.products.some(p =>
            ['adenine', 'cytosine', 'uracil', 'guanine'].includes(p)
          );
          if (producesNucleobase && !this.areNucleobasesUnlocked()) continue;

          const chance = CONFIG.baseReactionChance * (avgTemp / reaction.minTemp);
          if (avgTemp < reaction.minTemp * 0.8 || Math.random() > chance) continue;

          // Reaction!
          toRemove.add(i);
          toRemove.add(j);

          const midX = (mol1.x + mol2.x) / 2;
          const midY = (mol1.y + mol2.y) / 2;
          const midZ = (mol1.z + mol2.z) / 2;

          for (const productKey of reaction.products) {
            if (!MOLECULES[productKey]) continue;

            const offset = (Math.random() - 0.5) * 20;
            const product = new Molecule3D(this, productKey, {
              x: midX + offset,
              y: midY + offset,
              z: midZ + offset,
            });
            product.temperature = avgTemp;
            product.flash = 1.0; // Start with full green outline effect
            product.reactionCooldown = CONFIG.reactionCooldown;
            product.vx = (mol1.vx + mol2.vx) / 2 + (Math.random() - 0.5) * 15;
            product.vy = (mol1.vy + mol2.vy) / 2 + (Math.random() - 0.5) * 15;
            product.vz = (mol1.vz + mol2.vz) / 2 + (Math.random() - 0.5) * 15;
            // Apply current filter if active
            if (this.moleculeFilter) {
              product.dimmed = productKey !== this.moleculeFilter;
            }
            toAdd.push(product);

            // Track discovery
            this.discovered.add(productKey);

            this.stats.maxTier = Math.max(this.stats.maxTier, product.tier);
          }

          // Energy burst particles at reaction site
          this.spawnReactionBurst(midX, midY, midZ, reaction.energy);

          this.stats.reactions++;
          const formatMol = (m) => `${m.label} (${m.name})`;
          const reactantLabels = [formatMol(mol1), formatMol(mol2)].join(' + ');
          const productLabels = reaction.products
            .map((k) => {
              const m = MOLECULES[k];
              return m ? `${m.label} (${m.name})` : k;
            })
            .join(' + ');
          this.reactionLog.unshift({
            text: `${reactantLabels} → ${productLabels}`,
            time: 4,
          });
          if (this.reactionLog.length > 5) this.reactionLog.pop();

          // 50% chance to spawn new primordial molecule from off-screen
          // Prevents cluttering while maintaining fresh reactant flow
          if (Math.random() < 0.5) {
            this.spawnFromOffscreen();
          }

          break;
        }
      }
    }

    // Remove reacted molecules
    this.molecules = this.molecules.filter((_, i) => !toRemove.has(i));

    // Add new products
    for (const p of toAdd) {
      this.molecules.push(p);
    }
  }

  /**
   * Apply position-based separation between overlapping molecules (3D collision)
   * Uses soft constraint resolution - molecules gently push apart over frames
   * @param {number} dt - Delta time (unused, position-based)
   */
  applySeparation(dt) {
    const padding = CONFIG.separationPadding;
    const stiffness = CONFIG.separationStiffness;
    const damping = CONFIG.collisionDamping;

    for (let i = 0; i < this.molecules.length; i++) {
      const m1 = this.molecules[i];
      const r1 = m1.boundingRadius + padding;

      for (let j = i + 1; j < this.molecules.length; j++) {
        const m2 = this.molecules[j];
        const r2 = m2.boundingRadius + padding;

        // Distance between centers
        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dz = m2.z - m1.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = r1 + r2;

        // Check for overlap
        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          
          // Normalized direction from m1 to m2
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          // Position correction - split evenly between both molecules
          const correction = overlap * stiffness * 0.5;
          
          // Push apart (m1 moves opposite to direction, m2 moves along direction)
          m1.x -= nx * correction;
          m1.y -= ny * correction;
          m1.z -= nz * correction;
          m2.x += nx * correction;
          m2.y += ny * correction;
          m2.z += nz * correction;

          // Soft velocity damping on collision (prevents molecules from rushing back)
          // Project velocities onto collision normal and dampen
          const v1n = m1.vx * nx + m1.vy * ny + m1.vz * nz; // m1 velocity along normal
          const v2n = m2.vx * nx + m2.vy * ny + m2.vz * nz; // m2 velocity along normal
          
          // Only dampen if molecules are moving toward each other
          if (v1n > v2n) {
            const relVel = v1n - v2n;
            const impulse = relVel * damping;
            
            m1.vx -= nx * impulse * 0.5;
            m1.vy -= ny * impulse * 0.5;
            m1.vz -= nz * impulse * 0.5;
            m2.vx += nx * impulse * 0.5;
            m2.vy += ny * impulse * 0.5;
            m2.vz += nz * impulse * 0.5;
          }
        }
      }
    }
  }

  /**
   * Heat transfer between nearby molecules
   */
  heatTransfer() {
    for (let i = 0; i < this.molecules.length; i++) {
      const m1 = this.molecules[i];
      for (let j = i + 1; j < this.molecules.length; j++) {
        const m2 = this.molecules[j];

        const dx = m2.x - m1.x;
        const dy = m2.y - m1.y;
        const dz = m2.z - m1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONFIG.heatTransferDist) {
          const delta = heatTransferFalloff(
            m1.temperature,
            m2.temperature,
            dist,
            CONFIG.heatTransferDist,
            CONFIG.heatTransferRate,
            1
          );
          m1.temperature = Math.max(0, Math.min(1, m1.temperature + delta));
          m2.temperature = Math.max(0, Math.min(1, m2.temperature - delta));
        }
      }
    }
  }

  /**
   * Main update loop
   * @param {number} dt - Delta time
   */
  update(dt) {
    super.update(dt);
    this.camera.update(dt);
    this.totalTime += dt;

    // Idle mode - auto-spawn molecules when user is inactive
    const timeSinceInteraction = this.totalTime - this.lastInteractionTime;
    if (timeSinceInteraction >= CONFIG.idleSpawnDelay) {
      this.idleSpawnTimer += dt;
      if (this.idleSpawnTimer >= CONFIG.idleSpawnInterval) {
        this.idleSpawnTimer = 0;
        const mol = this.spawnFromOffscreen();
        if (mol) {
          this.reactionLog.unshift({
            text: `~ ${mol.label} drifted in`,
            time: 2,
          });
          if (this.reactionLog.length > 5) this.reactionLog.pop();
        }
      }
    }

    // Update bubbles
    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.wobblePhase += b.wobbleSpeed * dt;
      b.x += Math.sin(b.wobblePhase) * 0.5;

      if (b.y < -20) {
        Object.assign(b, this.createBubble(false));
      }
    }

    // Update floating particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.vx +=
        (Math.sin(this.totalTime * 0.5 + p.y * 0.01) * 2 - p.vx * 0.1) * dt;
      p.vy +=
        (Math.cos(this.totalTime * 0.3 + p.x * 0.01) * 1 - p.vy * 0.1) * dt;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }

    // Update reaction burst particles
    for (const b of this.reactionBursts) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt * 2.5; // Quick fade - sparks not farts
      // Minimal drag - they're escaping
      b.vx *= 0.98;
      b.vy *= 0.98;
      b.vz *= 0.98;
    }
    // Remove dead particles
    this.reactionBursts = this.reactionBursts.filter(b => b.life > 0);

    // Update molecules
    for (const mol of this.molecules) {
      mol.update(dt);

      // Soft boundaries - stronger push to keep molecules in view
      const margin = 50;
      const boundaryForce = 80;
      const halfDepth = CONFIG.worldDepth / 2;
      if (mol.x < -this.worldWidth / 2 - margin) mol.vx += boundaryForce * dt;
      if (mol.x > this.worldWidth / 2 + margin) mol.vx -= boundaryForce * dt;
      if (mol.y < -this.worldHeight / 2 - margin) mol.vy += boundaryForce * dt;
      if (mol.y > this.worldHeight / 2 + margin) mol.vy -= boundaryForce * dt;
      if (mol.z < -halfDepth) mol.vz += boundaryForce * 0.6 * dt;
      if (mol.z > halfDepth) mol.vz -= boundaryForce * 0.6 * dt;

      // Position-based temperature zones (hydrothermal vent at bottom, cold at top)
      const normalizedY = (mol.y + this.worldHeight / 2) / this.worldHeight; // 0=top, 1=bottom
      if (normalizedY > CONFIG.heatZone) {
        // Near bottom vent - heat up
        const intensity = (normalizedY - CONFIG.heatZone) / (1 - CONFIG.heatZone);
        mol.temperature = Math.min(1, mol.temperature + CONFIG.heatRate * intensity * dt);
      } else if (normalizedY < CONFIG.coolZone) {
        // Near surface - cool down
        const intensity = (CONFIG.coolZone - normalizedY) / CONFIG.coolZone;
        mol.temperature = Math.max(0, mol.temperature - CONFIG.heatRate * intensity * dt);
      } else {
        // Middle zone - drift toward neutral
        const drift = (CONFIG.neutralTemp - mol.temperature) * 0.02 * dt;
        mol.temperature += drift;
      }

      // Mouse repulsion - push molecules away from cursor
      if (this.mouseWorld.active) {
        const dx = mol.x - this.mouseWorld.x;
        const dy = mol.y - this.mouseWorld.y;
        const distSq = dx * dx + dy * dy;
        const repelRadius = 150;
        const repelStrength = 400;

        if (distSq < repelRadius * repelRadius && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / repelRadius) * repelStrength * dt;
          mol.vx += (dx / dist) * force;
          mol.vy += (dy / dist) * force;
          // Small z scatter for 3D feel
          mol.vz += (Math.random() - 0.5) * force * 0.3;
        }

        // Mouse energizing - heat molecules near cursor
        const heatRadiusSq = CONFIG.mouseHeatRadius * CONFIG.mouseHeatRadius;
        if (distSq < heatRadiusSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          // Falloff: closer = more heat, uses power curve
          const intensity = Math.pow(1 - dist / CONFIG.mouseHeatRadius, CONFIG.mouseHeatFalloff);
          mol.temperature = Math.min(1, mol.temperature + CONFIG.mouseHeatRate * intensity * dt);
        }
      }
    }

    // Collision separation, heat transfer, and reactions
    this.applySeparation(dt);
    this.heatTransfer();
    this.checkReactions();

    // Decay log
    for (const log of this.reactionLog) log.time -= dt;
    this.reactionLog = this.reactionLog.filter((l) => l.time > 0);

    // Update stats labels if panel is visible
    this.updateStatsLabels();
  }

  /**
   * Main render loop
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Deep sea gradient background - dark blue depths
    const deepSeaGrad = ctx.createLinearGradient(0, 0, 0, h);
    deepSeaGrad.addColorStop(0, '#000508');    // Nearly black at top (deep water)
    deepSeaGrad.addColorStop(0.3, '#001015');  // Very dark blue-green
    deepSeaGrad.addColorStop(0.6, '#001a1a');  // Dark teal hints
    deepSeaGrad.addColorStop(0.85, '#002020'); // Slightly lighter near vents
    deepSeaGrad.addColorStop(1, '#001515');    // Bottom
    ctx.fillStyle = deepSeaGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle light rays from above (bioluminescence / distant surface)
    ctx.globalAlpha = 0.015;
    const t = this.totalTime * CONFIG.causticSpeed;
    for (let i = 0; i < 4; i++) {
      const phase = i * 1.5 + t * 0.5;
      const rayX = w * (0.2 + i * 0.2) + Math.sin(phase) * w * 0.05;
      const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + w * 0.1, h * 0.6);
      rayGrad.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      rayGrad.addColorStop(0.5, 'rgba(50, 150, 200, 0.3)');
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.fillRect(rayX - 20, 0, 40, h * 0.6);
    }
    ctx.globalAlpha = 1;

    // Left thermal vent glow (orange/red heat)
    const leftVentX = w * 0.08;
    const leftVentGrad = ctx.createRadialGradient(
      leftVentX, h + 30, 0,
      leftVentX, h + 30, h * 0.45
    );
    leftVentGrad.addColorStop(0, `rgba(255, 100, 20, ${CONFIG.ventGlow * 0.6})`);
    leftVentGrad.addColorStop(0.2, `rgba(255, 60, 10, ${CONFIG.ventGlow * 0.4})`);
    leftVentGrad.addColorStop(0.5, `rgba(100, 40, 10, ${CONFIG.ventGlow * 0.2})`);
    leftVentGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = leftVentGrad;
    ctx.fillRect(0, 0, w, h);

    // Right thermal vent glow
    const rightVentX = w * 0.92;
    const rightVentGrad = ctx.createRadialGradient(
      rightVentX, h + 30, 0,
      rightVentX, h + 30, h * 0.45
    );
    rightVentGrad.addColorStop(0, `rgba(255, 80, 15, ${CONFIG.ventGlow * 0.5})`);
    rightVentGrad.addColorStop(0.2, `rgba(255, 50, 10, ${CONFIG.ventGlow * 0.35})`);
    rightVentGrad.addColorStop(0.5, `rgba(80, 30, 10, ${CONFIG.ventGlow * 0.15})`);
    rightVentGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rightVentGrad;
    ctx.fillRect(0, 0, w, h);

    // Ambient green bioluminescence scattered in water
    ctx.globalAlpha = 0.02;
    const causticScale = 100;
    for (let i = 0; i < 3; i++) {
      const phase = i * 2.1 + t;
      const bx = w * (0.3 + i * 0.2) + Math.sin(phase) * w * 0.15;
      const by = h * (0.3 + i * 0.1) + Math.cos(phase * 0.7) * h * 0.1;

      const bioGrad = ctx.createRadialGradient(bx, by, 0, bx, by, causticScale);
      bioGrad.addColorStop(0, 'rgba(0, 255, 150, 1)');
      bioGrad.addColorStop(0.5, 'rgba(0, 200, 100, 0.5)');
      bioGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bioGrad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Bubbles rising from thermal vents (behind vent silhouettes)
    for (const b of this.bubbles) {
      // Bubble body - translucent with subtle refraction
      const grad = ctx.createRadialGradient(
        b.x - b.size * 0.3,
        b.y - b.size * 0.3,
        0,
        b.x,
        b.y,
        b.size
      );
      // More realistic bubble colors - slight blue tint, mostly transparent
      grad.addColorStop(0, `rgba(200, 230, 255, ${b.alpha * 0.4})`);
      grad.addColorStop(0.4, `rgba(150, 200, 230, ${b.alpha * 0.15})`);
      grad.addColorStop(0.8, `rgba(100, 180, 220, ${b.alpha * 0.1})`);
      grad.addColorStop(1, `rgba(80, 150, 200, ${b.alpha * 0.05})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, TAU);
      ctx.fill();

      // Bubble outline/rim
      ctx.strokeStyle = `rgba(180, 220, 255, ${b.alpha * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Highlight reflection
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.35, b.size * 0.2, 0, TAU);
      ctx.fill();
    }

    // Thermal vent silhouettes (in front of bubbles, behind molecules)
    if (this.leftVent) this.leftVent.render();
    if (this.rightVent) this.rightVent.render();

    // Floating particles (marine snow / bioluminescent plankton)
    for (const p of this.particles) {
      const depthScale = 0.5 + ((p.z + 200) / 400) * 0.5;
      // Mix of pale blue particles and occasional green bioluminescence
      ctx.fillStyle = `hsla(${p.hue}, ${p.hue > 150 ? 60 : 30}%, ${p.hue > 150 ? 60 : 70}%, ${p.alpha * depthScale})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * depthScale, 0, TAU);
      ctx.fill();
    }

    // Lightning is now rendered by the Lightning GameObject in the pipeline

    // Render molecules with depth sorting
    const sorted = [...this.molecules].sort((a, b) => {
      const projA = this.camera.project(a.x, a.y, a.z);
      const projB = this.camera.project(b.x, b.y, b.z);
      return projA.z - projB.z;
    });

    for (const mol of sorted) {
      if (mol.dimmed) {
        ctx.globalAlpha = 0.15;
      }
      mol.render(cx, cy);
      if (mol.dimmed) {
        ctx.globalAlpha = 1;
      }
    }

    // Reaction burst particles (energy release - white sparks)
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.reactionBursts) {
      const proj = this.camera.project(b.x, b.y, b.z);
      if (proj.scale <= 0) continue;

      const screenX = cx + proj.x;
      const screenY = cy + proj.y;
      const size = b.size * proj.scale;
      const alpha = b.life;

      // White hot core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Vignette overlay - deep sea darkness at edges
    const vignetteGrad = ctx.createRadialGradient(
      cx, cy, Math.min(w, h) * 0.35,
      cx, cy, Math.max(w, h) * 0.85
    );
    vignetteGrad.addColorStop(0, 'transparent');
    vignetteGrad.addColorStop(0.7, 'rgba(0, 5, 15, 0.3)');
    vignetteGrad.addColorStop(1, 'rgba(0, 2, 8, 0.7)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);

    // UI - scale for mobile (only show if showInfo is true)
    if (this.showInfo) {
      const isMobile = Screen.isMobile;
      const fontSize = isMobile ? 9 : 11;
      const lineHeight = isMobile ? 14 : 18;
      const maxLogWidth = isMobile ? w - 30 : w * 0.5;

      ctx.font = `${fontSize}px "Fira Code", monospace`;
      ctx.textAlign = 'left';

      // Reaction log (compact on mobile) - terminal green
      let y = 25;
      for (const log of this.reactionLog) {
        const alpha = Math.min(1, log.time);
        ctx.fillStyle = `rgba(0, 255, 100, ${alpha * 0.9})`;

        // Truncate if too wide for mobile
        let text = log.text;
        if (isMobile && ctx.measureText(text).width > maxLogWidth) {
          // Truncate with ellipsis
          while (ctx.measureText(text + '…').width > maxLogWidth && text.length > 10) {
            text = text.slice(0, -1);
          }
          text += '…';
        }
        ctx.fillText(text, 15, y);
        y += lineHeight;
      }

      // Stats - terminal green
      ctx.fillStyle = 'rgba(0, 255, 120, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(`Molecules: ${this.molecules.length}`, w - 15, 25);
      ctx.fillText(`Reactions: ${this.stats.reactions}`, w - 15, 25 + lineHeight);

      const tierNames = ['Primordial', 'Precursors', 'Amino Acids', 'Peptides', 'Nucleobases'];
      ctx.fillText(`Max tier: ${tierNames[this.stats.maxTier] || '???'}`, w - 15, 25 + lineHeight * 2);
    }

    // Render pipeline objects (UI buttons, legend dialog)
    this.pipeline.render(ctx);

    // Render 3D molecule preview on top of legend dialog
    if (this.legendUI) {
      this.legendUI.renderPreview(ctx);
    }
  }

  /**
   * Clean up when stopping
   */
  stop() {
    // Remove keyboard listener
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
    }
    super.stop();
  }
}

/**
 * Create Day 25 visualization
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {PrimordialSoupDemo} returns.game - The game instance
 */
export default function day25(canvas) {
  const game = new PrimordialSoupDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
