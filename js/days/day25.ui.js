/**
 * Day 25 UI Components
 * @fileoverview Molecule browser dialog for Primordial Soup demo
 */

import {
  Scene,
  Screen,
  Text,
  Rectangle,
  ToggleButton,
  VerticalLayout,
  HorizontalLayout,
  ShapeGOFactory,
} from '@guinetik/gcanvas';

import { TAU } from './day25.config.js';
import { ATOMS, MOLECULES } from './day25.chemistry.js';

/**
 * LegendUI - Molecule browser dialog with list and 3D preview
 * @extends Scene
 */
export class LegendUI extends Scene {
  constructor(game, options = {}) {
    const isMobile = Screen.isMobile;
    const listWidth = isMobile ? 160 : 220;
    const previewWidth = isMobile ? 180 : 260;
    const dialogWidth = listWidth + previewWidth + 30;
    const dialogHeight = isMobile ? 380 : 480;

    super(game, {
      width: dialogWidth,
      height: dialogHeight,
      ...options,
    });

    this.listWidth = listWidth;
    this.previewWidth = previewWidth;
    this.dialogWidth = dialogWidth;
    this.dialogHeight = dialogHeight;
    this.fontSize = isMobile ? 10 : 12;
    this.itemHeight = isMobile ? 22 : 28;

    // Center on screen
    this.x = game.width / 2;
    this.y = game.height / 2;
    this.visible = false;

    // Preview state
    this.selectedMoleculeKey = 'water';
    this.moleculeButtons = [];
    this.previewRotX = 0;
    this.previewRotY = 0;
    this.previewRotZ = 0;

    // Random spin speeds for each axis
    this.spinSpeedX = (Math.random() - 0.5) * 0.015;
    this.spinSpeedY = (Math.random() - 0.5) * 0.02 + 0.01; // Bias toward positive
    this.spinSpeedZ = (Math.random() - 0.5) * 0.01;

    this._createUI();
  }

  _createUI() {
    const { listWidth, previewWidth, dialogWidth, dialogHeight, fontSize, itemHeight } = this;

    // Background
    const bgRect = new Rectangle({
      width: dialogWidth,
      height: dialogHeight,
      color: 'rgba(0, 10, 15, 0.95)',
      stroke: '#999',
      lineWidth: 2,
    });
    const background = ShapeGOFactory.create(this.game, bgRect, {
      name: 'legendBackground',
    });
    this.add(background);

    // Main horizontal layout for two panes
    const mainLayout = new HorizontalLayout(this.game, {
      spacing: 10,
      padding: 10,
      align: 'start',
      debug: true,
      width: dialogWidth,
      height: dialogHeight,
      autoSize: false
    });
    this.add(mainLayout);

    // === LEFT PANE: Molecule list (scrollable) ===
    const leftPane = new VerticalLayout(this.game, {
      spacing: 4,
      padding: 5,
      width: listWidth,
      scrollable: true,
      debug: true,
      debugColor: '#999',
      viewportHeight: dialogHeight - 40,
    });
    mainLayout.add(leftPane);

    // Title
    const title = new Text(this.game, "MOLECULES", {
      font: `bold ${fontSize + 2}px "Fira Code", monospace`,
      color: '#0f0',
      align: 'left',
      baseline: 'middle',
    });
    leftPane.add(title);

    // Group molecules by tier
    const tierNames = ['Primordial', 'Precursors', 'Amino Acids', 'Peptides', 'Nucleobases'];
    const moleculesByTier = {};
    for (const [key, mol] of Object.entries(MOLECULES)) {
      const tier = mol.tier;
      if (!moleculesByTier[tier]) moleculesByTier[tier] = [];
      moleculesByTier[tier].push({ key, mol });
    }

    // Add molecules grouped by tier
    for (let tier = 0; tier <= 4; tier++) {
      const molecules = moleculesByTier[tier];
      if (!molecules) continue;

      // Tier header
      const tierHeader = new Text(this.game, `─ ${tierNames[tier]} ─`, {
        font: `${fontSize - 1}px "Fira Code", monospace`,
        color: '#CCC',
        align: 'left',
        baseline: 'middle',
      });
      leftPane.add(tierHeader);

      // Molecule items as ToggleButtons
      for (const { key, mol } of molecules) {
        const itemBtn = new ToggleButton(this.game, {
          text: mol.name,
          width: listWidth - 10,
          height: itemHeight,
          font: `${fontSize}px "Fira Code", monospace`,
          startToggled: key === this.selectedMoleculeKey,
          onToggle: (isOn) => {
            if (isOn) {
              this.selectedMoleculeKey = key;
              // Reset rotation and randomize spin for new molecule
              this.previewRotX = 0;
              this.previewRotY = 0;
              this.previewRotZ = 0;
              this.spinSpeedX = (Math.random() - 0.5) * 0.015;
              this.spinSpeedY = (Math.random() - 0.5) * 0.02 + 0.01;
              this.spinSpeedZ = (Math.random() - 0.5) * 0.01;
              // Radio behavior - untoggle other buttons
              for (const btn of this.moleculeButtons) {
                if (btn !== itemBtn && btn.toggled) {
                  btn.toggle(false);
                }
              }
            }
          },
        });
        itemBtn._moleculeKey = key;
        this.moleculeButtons.push(itemBtn);
        leftPane.add(itemBtn);
      }
    }

    // === RIGHT PANE: 3D Preview ===
    const rightPane = new VerticalLayout(this.game, {
      spacing: 10,
      padding: 10,
      width: previewWidth,
      debug: true,
      debugColor: '#999',
      height: dialogHeight - 40,
      autoSize: false
    });
    mainLayout.add(rightPane);

    // Preview title (will be updated)
    this.previewTitle = new Text(this.game, "Water", {
      font: `bold ${fontSize + 2}px "Fira Code", monospace`,
      color: '#0f0',
      align: 'center',
      baseline: 'middle',
    });
    rightPane.add(this.previewTitle);

    // Preview area dimensions
    this.previewAreaWidth = previewWidth - 10;
    this.previewAreaHeight = dialogHeight - 80;

    // Store preview pane position for rendering
    this.previewPaneX = listWidth + 20;
    this.previewPaneY = 35;
  }

  /**
   * Render the 3D molecule preview
   * Call this after pipeline.render() in the main game render loop
   */
  renderPreview(ctx) {
    if (!this.visible || !this.selectedMoleculeKey) return;

    const template = MOLECULES[this.selectedMoleculeKey];
    if (!template) return;

    // Update title
    if (this.previewTitle) {
      this.previewTitle.text = `${template.label}`;
    }

    // Calculate preview center in screen space
    const dialogX = this.x - this.width / 2;
    const dialogY = this.y - this.height / 2;
    const cx = dialogX + this.previewPaneX + this.previewAreaWidth / 2;
    const cy = dialogY + this.previewPaneY + this.previewAreaHeight / 2;

    // Auto-rotate preview with multi-axis spin
    this.previewRotX += this.spinSpeedX;
    this.previewRotY += this.spinSpeedY;
    this.previewRotZ += this.spinSpeedZ;

    // Calculate scale to fit molecule in preview area
    let maxDist = 0;
    for (const atom of template.atoms) {
      const dist = Math.sqrt(atom.x ** 2 + atom.y ** 2 + atom.z ** 2);
      const props = ATOMS[atom.element];
      maxDist = Math.max(maxDist, dist + (props?.radius || 10));
    }
    const scale = Math.min(this.previewAreaWidth, this.previewAreaHeight) / (maxDist * 2.5);

    // Transform and project atoms
    const cosX = Math.cos(this.previewRotX);
    const sinX = Math.sin(this.previewRotX);
    const cosY = Math.cos(this.previewRotY);
    const sinY = Math.sin(this.previewRotY);
    const cosZ = Math.cos(this.previewRotZ);
    const sinZ = Math.sin(this.previewRotZ);

    const projectedAtoms = template.atoms.map((atom, i) => {
      let x = atom.x, y = atom.y, z = atom.z;

      // Rotate around Z axis (roll)
      let tx = x * cosZ - y * sinZ;
      let ty = x * sinZ + y * cosZ;
      x = tx; y = ty;

      // Rotate around Y axis (yaw)
      tx = x * cosY - z * sinY;
      let tz = x * sinY + z * cosY;
      x = tx; z = tz;

      // Rotate around X axis (pitch)
      ty = y * cosX - z * sinX;
      tz = y * sinX + z * cosX;
      y = ty; z = tz;

      const props = ATOMS[atom.element];
      return {
        index: i,
        x: x * scale,
        y: y * scale,
        z: z * scale,
        radius: (props?.radius || 10) * scale * 0.8,
        hue: props?.hue ?? 135,
        sat: props?.sat ?? 50,
        light: props?.light ?? 50,
        element: atom.element,
      };
    });

    // Sort by z for proper depth ordering
    projectedAtoms.sort((a, b) => a.z - b.z);

    // Draw bonds first
    ctx.lineCap = 'round';
    for (const bond of template.bonds) {
      const a1 = projectedAtoms.find(a => a.index === bond.from);
      const a2 = projectedAtoms.find(a => a.index === bond.to);
      if (!a1 || !a2) continue;

      const avgZ = (a1.z + a2.z) / 2;
      const depthLight = 40 + avgZ * 0.3;

      ctx.strokeStyle = `hsl(135, 50%, ${depthLight}%)`;
      ctx.lineWidth = bond.order === 1 ? 2 : 1.5;

      if (bond.order === 1) {
        ctx.beginPath();
        ctx.moveTo(cx + a1.x, cy + a1.y);
        ctx.lineTo(cx + a2.x, cy + a2.y);
        ctx.stroke();
      } else {
        // Multiple bonds - offset lines
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * 2;
        const ny = dx / len * 2;

        for (let i = 0; i < bond.order; i++) {
          const offset = (i - (bond.order - 1) / 2) * 3;
          ctx.beginPath();
          ctx.moveTo(cx + a1.x + nx * offset, cy + a1.y + ny * offset);
          ctx.lineTo(cx + a2.x + nx * offset, cy + a2.y + ny * offset);
          ctx.stroke();
        }
      }
    }

    // Draw atoms
    for (const atom of projectedAtoms) {
      const depthLight = Math.min(90, Math.max(20, atom.light + atom.z * 0.5));

      // Gradient for 3D effect
      const grad = ctx.createRadialGradient(
        cx + atom.x - atom.radius * 0.3,
        cy + atom.y - atom.radius * 0.3,
        0,
        cx + atom.x,
        cy + atom.y,
        atom.radius
      );
      grad.addColorStop(0, `hsl(${atom.hue}, ${atom.sat + 20}%, ${depthLight + 20}%)`);
      grad.addColorStop(0.5, `hsl(${atom.hue}, ${atom.sat}%, ${depthLight}%)`);
      grad.addColorStop(1, `hsl(${atom.hue}, ${atom.sat + 10}%, ${depthLight - 15}%)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + atom.x, cy + atom.y, atom.radius, 0, TAU);
      ctx.fill();

      // Subtle outline
      ctx.strokeStyle = `hsla(${atom.hue}, ${atom.sat}%, ${depthLight - 10}%, 0.5)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Molecule formula below preview
    ctx.fillStyle = '#888';
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(template.name, cx, cy + this.previewAreaHeight / 2 - 10);
  }
}
