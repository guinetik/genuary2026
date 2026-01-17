/**
 * Genuary 2026 - Day 17
 * Prompt: "Wallpaper group"
 *
 * INFINITE WALLPAPER
 * One of the 17 periodic wallpaper groups that tile the plane.
 * Features p6m (hexagonal) symmetry - the most symmetric of all groups.
 *
 * Performance: Pattern is rendered ONCE to an offscreen canvas,
 * then scaled/positioned for the infinite zoom effect.
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Zoom
  zoomSpeed: 0.3,
  
  // Pattern tile size (rendered once)
  tileSize: 400,
  cellSize: 50,
  lineWidth: 1.5,
  
  // Colors
  hueSpeed: 15,
  saturation: 100,
  lightness: 50,
};

class WallpaperGroupDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    this.time = 0;
    this.hue = 120;
    this.lastHue = -1;
    
    // Pre-compute trig for hexagon (6) and star (12)
    this._hexCos = [];
    this._hexSin = [];
    this._starCos = [];
    this._starSin = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      this._hexCos[i] = Math.cos(angle);
      this._hexSin[i] = Math.sin(angle);
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      this._starCos[i] = Math.cos(angle);
      this._starSin[i] = Math.sin(angle);
    }
    
    // Offscreen canvas for the repeating tile (rendered once per hue change)
    this._tileCanvas = document.createElement('canvas');
    this._tileCanvas.width = CONFIG.tileSize;
    this._tileCanvas.height = CONFIG.tileSize;
    this._tileCtx = this._tileCanvas.getContext('2d');
    
    // Second tile for crossfade (different hue)
    this._tileCanvas2 = document.createElement('canvas');
    this._tileCanvas2.width = CONFIG.tileSize;
    this._tileCanvas2.height = CONFIG.tileSize;
    this._tileCtx2 = this._tileCanvas2.getContext('2d');

    // Mouse panning
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.targetOffsetX = (mx - this.width / 2) * 0.3;
      this.targetOffsetY = (my - this.height / 2) * 0.3;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.targetOffsetX = 0;
      this.targetOffsetY = 0;
    });

    this.canvas.addEventListener('click', () => {
      this.hue = (this.hue + 60) % 360;
    });
    
    // Initial tile render
    this._renderTile(this._tileCtx, this.hue);
    this._renderTile(this._tileCtx2, (this.hue + 30) % 360);
  }

  /**
   * Render the wallpaper pattern tile (called only when hue changes significantly)
   */
  _renderTile(ctx, hue) {
    const size = CONFIG.tileSize;
    const cell = CONFIG.cellSize;
    const motifSize = cell * 0.4;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    
    // Hexagonal grid vectors
    const a1x = cell;
    const a2x = cell * 0.5;
    const a2y = cell * 0.8660254037844387;
    
    const gridRange = Math.ceil(size / cell) + 2;
    const cx = size / 2;
    const cy = size / 2;
    
    // Draw p6m pattern
    for (let i = -gridRange; i <= gridRange; i++) {
      for (let j = -gridRange; j <= gridRange; j++) {
        const px = cx + i * a1x + j * a2x;
        const py = cy + j * a2y;
        
        // Only draw if within tile bounds (with margin)
        if (px < -cell || px > size + cell || py < -cell || py > size + cell) continue;
        
        this._drawMotif(ctx, px, py, motifSize, hue);
      }
    }
  }

  /**
   * Draw single hexagonal motif
   */
  _drawMotif(ctx, x, y, size, hue) {
    const hexCos = this._hexCos;
    const hexSin = this._hexSin;
    const starCos = this._starCos;
    const starSin = this._starSin;
    const innerSize = size * 0.5;
    const lw = CONFIG.lineWidth;

    // Outer hexagon
    ctx.strokeStyle = `hsla(${hue}, ${CONFIG.saturation}%, ${CONFIG.lightness}%, 0.8)`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x + hexCos[0] * size, y + hexSin[0] * size);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(x + hexCos[i] * size, y + hexSin[i] * size);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner star
    const hue2 = (hue + 60) % 360;
    ctx.strokeStyle = `hsla(${hue2}, ${CONFIG.saturation}%, ${CONFIG.lightness + 10}%, 0.7)`;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    const r0 = innerSize, r1 = innerSize * 0.4;
    ctx.moveTo(x + starCos[0] * r0, y + starSin[0] * r0);
    for (let i = 1; i < 12; i++) {
      ctx.lineTo(x + starCos[i] * (i % 2 === 0 ? r0 : r1), y + starSin[i] * (i % 2 === 0 ? r0 : r1));
    }
    ctx.closePath();
    ctx.stroke();

    // Connecting lines
    const hue3 = (hue + 120) % 360;
    ctx.strokeStyle = `hsla(${hue3}, ${CONFIG.saturation}%, ${CONFIG.lightness - 10}%, 0.4)`;
    ctx.lineWidth = lw * 0.5;
    const ext = size * 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + hexCos[i] * ext, y + hexSin[i] * ext);
    }
    ctx.stroke();

    // Center dot
    const hue4 = (hue + 180) % 360;
    ctx.fillStyle = `hsla(${hue4}, ${CONFIG.saturation}%, ${CONFIG.lightness + 20}%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.hue = (this.hue + CONFIG.hueSpeed * dt) % 360;
    
    // Re-render tiles when hue changes enough (every ~10 degrees)
    const hueFloor = Math.floor(this.hue / 10) * 10;
    if (hueFloor !== this.lastHue) {
      this.lastHue = hueFloor;
      this._renderTile(this._tileCtx, hueFloor);
      this._renderTile(this._tileCtx2, (hueFloor + 30) % 360);
    }

    // Smooth pan
    const ease = 1 - Math.pow(0.05, dt);
    this.offsetX += (this.targetOffsetX - this.offsetX) * ease;
    this.offsetY += (this.targetOffsetY - this.offsetY) * ease;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    const cycleTime = 1 / CONFIG.zoomSpeed;
    const t = (this.time % cycleTime) / cycleTime;
    
    // Two layers crossfading for infinite zoom
    // Layer A: 1x → 2x, alpha 1 → 0
    // Layer B: 0.5x → 1x, alpha 0 → 1
    const zoomA = 1 + t;
    const alphaA = 1 - t;
    const zoomB = 0.5 + t * 0.5;
    const alphaB = t;
    
    // Draw both layers using the cached tile
    this._drawTiledLayer(ctx, w, h, zoomB, alphaB, this._tileCanvas2);
    this._drawTiledLayer(ctx, w, h, zoomA, alphaA, this._tileCanvas);
  }

  /**
   * Draw a tiled layer by repeating the cached tile canvas
   */
  _drawTiledLayer(ctx, w, h, zoom, alpha, tileCanvas) {
    if (alpha <= 0.01) return;
    
    const tileSize = CONFIG.tileSize * zoom;
    const cx = w / 2 + this.offsetX;
    const cy = h / 2 + this.offsetY;
    
    // How many tiles needed to cover screen
    const tilesX = Math.ceil(w / tileSize) + 2;
    const tilesY = Math.ceil(h / tileSize) + 2;
    
    // Offset so pattern stays centered
    const startX = cx - Math.ceil(tilesX / 2) * tileSize;
    const startY = cy - Math.ceil(tilesY / 2) * tileSize;
    
    ctx.globalAlpha = alpha * 0.9;
    
    // Draw tiles
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x = startX + tx * tileSize;
        const y = startY + ty * tileSize;
        
        // Skip tiles completely off-screen
        if (x + tileSize < 0 || x > w || y + tileSize < 0 || y > h) continue;
        
        ctx.drawImage(tileCanvas, x, y, tileSize, tileSize);
      }
    }
    
    ctx.globalAlpha = 1;
  }
}

/**
 * Create Day 17 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day17(canvas) {
  const game = new WallpaperGroupDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
