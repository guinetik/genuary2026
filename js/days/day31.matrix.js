/**
 * Day 31 Matrix Rain
 * 
 * @fileoverview Periodic matrix code rain effect
 * 
 * Matrix-style falling characters that appear periodically,
 * creating a cyberpunk atmosphere over the synthwave scene.
 * 
 * @module day31.matrix
 * @author guinetik
 */

import { CONFIG } from './day31.config.js';

// Matrix characters - mix of katakana-like and terminal symbols
const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>{}[]';

/**
 * Single falling column of characters
 * @class MatrixDrop
 */
class MatrixDrop {
  constructor(x, numRows, cellH) {
    this.x = x;
    this.numRows = numRows;
    this.cellH = cellH;
    this.reset();
  }
  
  reset() {
    this.y = -Math.random() * 20;
    this.speed = 0.3 + Math.random() * 0.4;
    this.tailLen = 8 + Math.floor(Math.random() * 12);
    this.chars = [];
    for (let i = 0; i < this.tailLen; i++) {
      this.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
    }
  }
  
  update() {
    this.y += this.speed;
    
    // Occasionally change a character
    if (Math.random() < 0.05) {
      const idx = Math.floor(Math.random() * this.chars.length);
      this.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    
    // Reset if off screen
    if (this.y - this.tailLen > this.numRows) {
      this.reset();
    }
  }
}

/**
 * Matrix rain effect manager
 * 
 * Handles the periodic appearance and rendering of Matrix-style
 * falling code rain over the scene.
 * 
 * @class MatrixRain
 */
export class MatrixRain {
  constructor() {
    this.drops = [];
    this.active = false;
    this.alpha = 0;
    this.timer = 0;
    this.phase = 'waiting'; // 'waiting', 'fading_in', 'active', 'fading_out'
    this.cellW = CONFIG.matrixCellW || 14;
    this.cellH = CONFIG.matrixCellH || 20;
  }
  
  /**
   * Initialize drops for the given canvas size
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  init(w, h) {
    this.drops = [];
    const numCols = Math.ceil(w / this.cellW);
    const numRows = Math.ceil(h / this.cellH);
    
    for (let i = 0; i < numCols; i++) {
      // Only create drops for ~40% of columns for sparser effect
      if (Math.random() < 0.4) {
        this.drops.push(new MatrixDrop(i * this.cellW, numRows, this.cellH));
      }
    }
    
    // Start waiting for first appearance
    this.timer = CONFIG.matrixInitialDelay || 10;
    this.phase = 'waiting';
  }
  
  /**
   * Update the matrix rain state
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.timer -= dt;
    
    switch (this.phase) {
      case 'waiting':
        if (this.timer <= 0) {
          this.phase = 'fading_in';
          this.timer = CONFIG.matrixFadeTime || 2;
        }
        break;
        
      case 'fading_in':
        this.alpha = 1 - (this.timer / (CONFIG.matrixFadeTime || 2));
        if (this.timer <= 0) {
          this.phase = 'active';
          this.alpha = 1;
          this.timer = CONFIG.matrixDuration || 8;
        }
        break;
        
      case 'active':
        if (this.timer <= 0) {
          this.phase = 'fading_out';
          this.timer = CONFIG.matrixFadeTime || 2;
        }
        break;
        
      case 'fading_out':
        this.alpha = this.timer / (CONFIG.matrixFadeTime || 2);
        if (this.timer <= 0) {
          this.phase = 'waiting';
          this.alpha = 0;
          this.timer = (CONFIG.matrixInterval?.min || 15) + 
            Math.random() * ((CONFIG.matrixInterval?.max || 30) - (CONFIG.matrixInterval?.min || 15));
        }
        break;
    }
    
    // Update drops when visible
    if (this.alpha > 0) {
      for (const drop of this.drops) {
        drop.update();
      }
    }
  }
  
  /**
   * Render the matrix rain
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  render(ctx, w, h) {
    if (this.alpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha * (CONFIG.matrixOpacity || 0.3);
    ctx.font = `${this.cellH - 4}px 'Fira Code', monospace`;
    ctx.textBaseline = 'top';
    
    for (const drop of this.drops) {
      for (let i = 0; i < drop.chars.length; i++) {
        const row = Math.floor(drop.y) - i;
        const y = row * this.cellH;
        
        if (y < 0 || y > h) continue;
        
        const char = drop.chars[i];
        const fade = 1 - (i / drop.tailLen);
        
        if (i === 0) {
          // Head - bright
          ctx.fillStyle = `rgba(200, 255, 200, ${fade})`;
        } else {
          // Tail - green fade
          const g = Math.floor(180 * fade);
          ctx.fillStyle = `rgba(0, ${g}, 50, ${fade * 0.8})`;
        }
        
        ctx.fillText(char, drop.x, y);
      }
    }
    
    ctx.restore();
  }
}
