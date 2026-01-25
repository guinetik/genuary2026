/**
 * Day 31 Flying Posters
 * 
 * @fileoverview 3D billboard poster system for roadside effect
 * 
 * Manages individual poster instances that spawn on alternating sides
 * of the road and fly past the camera with perspective projection.
 * 
 * @module day31.posters
 * @author guinetik
 */

import { Easing } from '@guinetik/gcanvas';
import { CONFIG } from './day31.config.js';

/**
 * Represents a roadside billboard poster in 3D space
 * 
 * Each poster spawns at a distance, moves toward the camera,
 * and renders with perspective scaling and fade effects.
 * 
 * @class FlyingPoster
 */
export class FlyingPoster {
    /**
     * @param {HTMLImageElement} image - The poster image
     * @param {number} index - Poster index for positioning
     */
    constructor(image, index) {
        this.image = image;
        this.index = index;
        this.loaded = image.complete && image.naturalWidth > 0;

        // Start inactive - will be spawned by timer
        this.active = false;
        this.z = -1000; // Off-screen
        this.side = 1;  // 1 = right, -1 = left

        // Visual properties
        this.scale = 1;
        this.tilt = 0; // Slight rotation toward viewer
    }

    /**
     * Spawn poster on a specific side of the road
     * @param {number} cameraZ - Current camera Z
     * @param {number} side - 1 for right, -1 for left
     */
    spawn(cameraZ, side) {
        this.active = true;
        this.side = side;
        this.z = cameraZ + CONFIG.spawnZ;

        // Random visual properties
        this.scale = 0.9 + Math.random() * 0.2;
        // Tilt slightly toward center (facing the road)
        this.tilt = side * -0.15;
    }

    /**
     * Update poster - check if it should be deactivated
     * @param {number} cameraZ - Current camera Z position
     * @returns {boolean} - True if poster just became inactive (flew past)
     */
    update(cameraZ) {
        if (!this.active) return false;

        const relativeZ = this.z - cameraZ;

        // Deactivate if behind camera
        if (relativeZ < CONFIG.cullZ) {
            this.active = false;
            return true;
        }

        return false;
    }

    /**
     * Render the poster with simple perspective (no camera rotation)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} cameraZ - Camera position for relative positioning
     * @param {number} centerX - Screen center X
     * @param {number} centerY - Screen center Y
     * @param {number} h - Screen height
     */
    render(ctx, cameraZ, centerX, centerY, h) {
        if (!this.active || !this.loaded) return;

        const relZ = this.z - cameraZ;

        // Don't render if behind camera or too far
        if (relZ < -50 || relZ > CONFIG.spawnZ + 200) return;

        // Simple perspective calculation (independent of mouse/camera)
        const perspective = CONFIG.perspective;
        const scale = perspective / (perspective + Math.max(relZ, 1));

        // Skip if too small
        if (scale <= 0.03) return;

        // X position - fixed offset from center, scaled by perspective
        const xOffset = CONFIG.sideOffset * this.side * scale;
        const screenX = centerX + xOffset;

        // Y position - interpolate from horizon (where road meets sky) to lower as approaching
        // Use screen ratios: horizonRatio at far, closeRatio when near
        const depthProgress = 1 - Math.min(1, relZ / CONFIG.spawnZ);
        const yRatio = CONFIG.horizonRatio + (CONFIG.closeRatio - CONFIG.horizonRatio) * depthProgress;
        const screenY = h * yRatio;

        // Poster size with perspective
        const posterW = CONFIG.posterWidth * this.scale * scale;
        const posterH = CONFIG.posterHeight * this.scale * scale;

        // Skip very small posters
        if (posterW < 8 || posterH < 8) return;

        // Fade in/out
        const fadeIn = Easing.easeOutQuad(Math.min(1, (CONFIG.spawnZ - relZ) / 1200));
        const fadeOut = relZ > 100 ? 1.0 : Easing.easeInQuad(Math.max(0, (relZ + 300) / 400));
        const alpha = fadeIn * fadeOut;

        if (alpha <= 0.02) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screenX, screenY);

        // Slight tilt toward center
        ctx.rotate(this.tilt * scale);

        // Terminal green glow - matched to terrain grid color
        if (CONFIG.posterGlow && alpha > 0.3) {
            ctx.shadowColor = 'rgba(0, 255, 77, 0.5)';
            ctx.shadowBlur = 25 * scale;
        }

        // Draw poster frame - matches terrain grid: vec3(0.0, 1.0, 0.3)
        ctx.strokeStyle = `rgba(0, 255, 77, ${alpha})`;
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.strokeRect(-posterW / 2 - 4, -posterH / 2 - 4, posterW + 8, posterH + 8);

        // Draw the image
        ctx.drawImage(this.image, -posterW / 2, -posterH / 2, posterW, posterH);

        ctx.restore();
    }
}
