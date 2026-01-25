/**
 * Day 31 Running Girl
 * 
 * @fileoverview Sprite-based runner for the finale scene
 * 
 * The iconic running girl from Day 4, now sprinting toward
 * the black hole in the synthwave landscape.
 * 
 * @module day31.runner
 * @author guinetik
 */

import { SpriteSheet } from '@guinetik/gcanvas';
import { CONFIG } from './day31.config.js';

/**
 * Runner sprite manager for the finale scene
 * 
 * Handles loading, animating, and rendering the running girl
 * sprite with terminal green styling.
 * 
 * @class Runner
 */
export class Runner {
  /**
   * @param {Game} game - The game instance
   */
  constructor(game) {
    this.game = game;
    this.sprite = null;
    this.loaded = false;
  }
  
  /**
   * Load the runner sprite sheet
   * @returns {Promise<void>}
   */
  async load() {
    this.sprite = new SpriteSheet(this.game, {
      src: CONFIG.runnerSrc,
      frameWidth: CONFIG.runnerFrameWidth,
      frameHeight: CONFIG.runnerFrameHeight,
      columns: CONFIG.runnerColumns,
      rows: CONFIG.runnerRows,
      frameCount: CONFIG.runnerFrameCount,
      frameRate: CONFIG.runnerFrameRate,
      loop: true,
      autoPlay: true,
      smoothing: false, // Keep pixelated
    });
    
    await this.sprite.load();
    this.loaded = true;
  }
  
  /**
   * Update runner animation
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (this.sprite && this.loaded) {
      this.sprite.update(dt);
    }
  }
  
  /**
   * Render the runner on the road
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  render(ctx, w, h) {
    if (!this.sprite || !this.loaded) return;
    
    const currentShape = this.sprite.currentShape;
    if (!currentShape || !currentShape._bitmap) return;
    
    const frameCanvas = currentShape._bitmap;
    
    // Position runner in the scene
    // Centered horizontally, on the road (lower portion of screen)
    const scale = CONFIG.runnerScale * (h / 800); // Scale with screen size
    const drawW = CONFIG.runnerFrameWidth * scale;
    const drawH = CONFIG.runnerFrameHeight * scale;
    
    // Position: centered X, feet at road level
    const x = (w - drawW) / 2 + CONFIG.runnerOffsetX;
    const y = h * CONFIG.runnerY - drawH;
    
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Keep pixelated
    
    // Terminal green outline effect
    const outlineWidth = Math.max(1, 2 * scale);
    
    // Draw green outline - offset copies with green tint
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = `brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(500%) hue-rotate(86deg) brightness(118%)`;
    
    // Draw in 8 directions for outline
    for (let ox = -outlineWidth; ox <= outlineWidth; ox += outlineWidth) {
      for (let oy = -outlineWidth; oy <= outlineWidth; oy += outlineWidth) {
        if (ox === 0 && oy === 0) continue;
        ctx.drawImage(frameCanvas, x + ox, y + oy, drawW, drawH);
      }
    }
    
    // Draw the silhouette in dark green/black
    ctx.filter = 'brightness(0.2) saturate(100%) sepia(100%) hue-rotate(80deg)';
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(frameCanvas, x, y, drawW, drawH);
    
    ctx.filter = 'none';
    ctx.restore();
  }
}
