/**
 * Day 31 Configuration
 * 
 * @fileoverview Configuration constants for Day 31 finale demo
 * 
 * Contains all tunable parameters for poster spawning, bird flocks,
 * camera settings, and visual effects.
 * 
 * @module day31.config
 * @author guinetik
 */

/**
 * Configuration object for Day 31 finale
 * 
 * @type {Object}
 * @property {number} posterCount - Total number of poster images available
 * @property {number} posterSpeed - Forward movement speed of posters
 * @property {number} posterWidth - Width of each poster in pixels
 * @property {number} posterHeight - Height of each poster in pixels
 * @property {number} spawnDelay - Seconds between poster spawns
 * @property {number} maxVisible - Maximum posters visible simultaneously
 * @property {number} sideOffset - Horizontal offset from center (roadside position)
 * @property {number} horizonRatio - Y position ratio at horizon (0.5 = center)
 * @property {number} closeRatio - Y position ratio when close to camera
 * @property {number} spawnZ - Z distance to spawn posters
 * @property {number} cullZ - Z distance to remove posters (behind camera)
 * @property {number} perspective - Camera perspective value
 * @property {boolean} posterGlow - Enable green glow effect on posters
 * @property {Object} birdFlockSize - Min/max birds per flock
 * @property {Object} birdFlockInterval - Min/max seconds between flocks
 * @property {number} birdSpeed - Base speed of birds
 * @property {number} birdSize - Size of bird silhouette
 * @property {string} runnerSrc - Path to runner sprite sheet
 * @property {number} runnerFrameWidth - Width of each frame in sprite sheet
 * @property {number} runnerFrameHeight - Height of each frame in sprite sheet
 * @property {number} runnerColumns - Number of columns in sprite sheet
 * @property {number} runnerRows - Number of rows in sprite sheet
 * @property {number} runnerFrameCount - Total number of animation frames
 * @property {number} runnerFrameRate - Animation frames per second
 * @property {number} runnerScale - Scale factor for runner sprite
 * @property {number} runnerY - Y position ratio (0-1, where 1 is bottom)
 * @property {number} runnerOffsetX - Horizontal offset from center
 * @property {number} runnerTilt - Tilt angle in degrees (negative = leaning forward)
 * @property {number} runnerSquish - Horizontal squish ratio for foreshortening (0.35 = 35% width)
 * @property {number} runnerSkew - Skew amount for 3/4 back view perspective effect
 */
export const CONFIG = {
    // Poster settings
    posterCount: 30,
    posterSpeed: 1200,       // Fast
    posterWidth: 160,        // Medium size
    posterHeight: 200,       // Medium size

    // Timing - overlap so next fades in small while current is big
    spawnDelay: 2.8,         // More time between spawns
    maxVisible: 3,           // Less overlap

    // Positioning - roadside billboards
    sideOffset: 350,         // How far to the side (like roadside)
    horizonRatio: 0.48,      // Y ratio at horizon (0.5 = center, higher = lower on screen)
    closeRatio: 0.75,        // Y ratio when close (lower on screen, in the road area)
    spawnZ: 4000,            // Far spawn
    cullZ: -400,             // Come close before culling

    // Visual
    perspective: 500,        // More dramatic perspective
    posterGlow: true,

    // Bird flocks
    birdFlockSize: { min: 4, max: 8 },
    birdFlockInterval: { min: 8, max: 15 }, // seconds between flocks
    birdSpeed: 120,
    birdSize: 6,
    
    // Runner sprite (back view, running toward black hole)
    runnerSrc: './runner_back.png',
    runnerFrameWidth: 120,
    runnerFrameHeight: 120,
    runnerColumns: 10,
    runnerRows: 5,
    runnerFrameCount: 50,
    runnerFrameRate: 100,       // Animation fps (absurdly fast test)
    runnerScale: 1.5,           // Scale relative to screen
    runnerY: 0.92,              // Y position ratio (on the road)
    runnerOffsetX: 0,           // Horizontal offset from center
    
    // Matrix rain effect
    matrixCellW: 14,            // Character cell width
    matrixCellH: 20,            // Character cell height
    matrixOpacity: 0.4,         // Overall opacity when active
    matrixInitialDelay: 12,     // Seconds before first appearance
    matrixDuration: 6,          // Seconds the rain is visible
    matrixFadeTime: 2,          // Seconds to fade in/out
    matrixInterval: { min: 20, max: 40 }, // Seconds between appearances
};