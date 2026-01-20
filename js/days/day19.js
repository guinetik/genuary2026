/**
 * Day 19: 16×16
 * Prompt: "16×16"
 *
 * GROKKING NEURAL NETWORK
 *
 * A neural network learns modular arithmetic: (a + b) mod p = c
 * The 16×16 grid visualizes the hidden layer activations (256 neurons).
 * Watch the network transition from memorization to generalization (grokking).
 *
 * The network starts by memorizing training examples, then suddenly
 * discovers the underlying pattern and generalizes to unseen examples.
 *
 * Click to restart training. Hover to see current test case.
 */

import { Game, Painter, Motion, StateMachine, Tweenetik, Easing } from '@guinetik/gcanvas';
// Old MLP (kept for reference)
import {NeuralNetwork, generateDataset, splitDataset, oneHot, calculateAccuracy} from './neural';
// New Factored MLP (Google's grokking architecture)
import { FactoredNetwork, generateAllPairs, splitData, calcAccuracy } from './grokking-mlp.js';

/**
 * Neuron class to represent neuron state and rendering
 */
class Neuron {
  constructor(x, y, baseSize = 4) {
    this.x = x;
    this.y = y;
    this.targetX = x; // Target position for spawn animation
    this.targetY = y;
    this.baseSize = baseSize;
    this.activation = 0;
    this.isActive = false;
    this.isSelected = false; // For highlighting (e.g., predicted output)
    this.isTarget = false; // For highlighting (e.g., target output)
    this.isError = false; // For error state (red)
    this.spawnScale = 1; // Scale for spawn animation (0 = hidden, 1 = full)
  }
  
  /**
   * Render the neuron
   */
  render(ctx, colors) {
    const { neuronIdle, neuronActive, neuronBright } = colors;
    
    if (this.isActive) {
      // Activated neuron: white core with small green glow
      const size = this.baseSize;
      const glowRadius = size * 1.1;
      const glowAlpha = 0.2;
      
      ctx.fillStyle = `rgba(0, 255, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Determine color based on selection/target
      let color = neuronActive;
      if (this.isSelected || this.isTarget) {
        color = neuronBright; // White for selected/target
      }
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Inactive neuron: dim dot
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * Render as grid neuron with flash effect when synapse arrives
   * @param {number} grokMode - 0=green, 1=rainbow (smooth transition)
   * @param {number} row - Grid row for rainbow hue calculation
   * @param {number} col - Grid column for rainbow hue calculation
   * @param {number} time - Animation time for rainbow shimmer
   */
  renderGrid(ctx, colors, maxActivation = 1, flashIntensity = 0, scale = 1, grokMode = 0, row = 0, col = 0, time = 0) {
    // Skip if not spawned yet
    if (this.spawnScale <= 0.01) return;
    
    const { neuronActive, neuronBright } = colors;
    
    // Normalize activation and combine with flash
    const normalizedActivation = Math.min(1, this.activation / maxActivation);
    const effectiveActivation = Math.min(1, normalizedActivation + flashIntensity * 0.5);
    const isFlashing = flashIntensity > 0.1;
    
    // Base sizes scaled (including spawn scale)
    const spawnMult = this.spawnScale;
    const baseSize = 4 * scale * spawnMult;
    const minDotSize = 2 * scale * spawnMult;
    
    // Calculate rainbow hue based on grid position (like day23)
    const hue = (row * 0.1 + col * 0.15 + time * 0.1) % 1;
    const rainbowR = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28)) * 255);
    const rainbowG = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28 + 2.09)) * 255);
    const rainbowB = Math.floor((0.5 + 0.5 * Math.sin(hue * 6.28 + 4.18)) * 255);
    
    // In GROK MODE: ALL neurons are colored (not just activated)
    // Dim neurons get their rainbow color at lower brightness
    if (effectiveActivation < 0.05 && !isFlashing) {
      if (grokMode > 0.5) {
        // Grok mode: dim colored dots (rainbow at low brightness)
        const dimBrightness = 0.3 + grokMode * 0.2; // Brighter in grok mode
        const r = Math.floor(rainbowR * dimBrightness);
        const g = Math.floor(rainbowG * dimBrightness);
        const b = Math.floor(rainbowB * dimBrightness);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, minDotSize * (1 + grokMode * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (grokMode > 0.01) {
        // Transitioning: blend green to rainbow
        const dimAlpha = (0.1 + grokMode * 0.4) * spawnMult;
        const g = Math.floor(255 * (1 - grokMode) + rainbowG * grokMode);
        const r = Math.floor(0 * (1 - grokMode) + rainbowR * grokMode);
        const b = Math.floor(0 * (1 - grokMode) + rainbowB * grokMode);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dimAlpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, minDotSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal green mode
        ctx.fillStyle = `rgba(0, 255, 0, ${0.1 * spawnMult})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, minDotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    
    // Size: base + activation + flash boost (all scaled)
    const size = (baseSize + effectiveActivation * 3 * scale + flashIntensity * 2 * scale) * spawnMult;
    
    // Determine colors - blend between green theme and rainbow based on grokMode
    let coreColor, glowColor;
    
    if (grokMode > 0.5) {
      // FULL GROK MODE: pure rainbow colors, glow with own color
      if (isFlashing) {
        // Flash: brighter version of rainbow color
        const brightR = Math.min(255, rainbowR + Math.floor(flashIntensity * 100));
        const brightG = Math.min(255, rainbowG + Math.floor(flashIntensity * 100));
        const brightB = Math.min(255, rainbowB + Math.floor(flashIntensity * 100));
        coreColor = `rgb(${brightR}, ${brightG}, ${brightB})`;
        glowColor = `rgba(${rainbowR}, ${rainbowG}, ${rainbowB}, ${(0.4 + flashIntensity * 0.5) * spawnMult})`;
      } else {
        // Normal: pure rainbow
        coreColor = `rgb(${rainbowR}, ${rainbowG}, ${rainbowB})`;
        glowColor = `rgba(${rainbowR}, ${rainbowG}, ${rainbowB}, ${(0.15 + effectiveActivation * 0.3) * spawnMult})`;
      }
    } else if (isFlashing) {
      const flashWhite = Math.floor(flashIntensity * 255);
      // Flash color blends to rainbow
      const fr = Math.floor(flashWhite * (1 - grokMode) + Math.min(255, rainbowR + 100) * grokMode);
      const fg = Math.floor(255 * (1 - grokMode) + Math.min(255, rainbowG + 100) * grokMode);
      const fb = Math.floor(flashWhite * (1 - grokMode) + Math.min(255, rainbowB + 100) * grokMode);
      coreColor = `rgb(${fr}, ${fg}, ${fb})`;
      
      const gr = Math.floor(0 * (1 - grokMode) + rainbowR * grokMode);
      const gg = Math.floor(255 * (1 - grokMode) + rainbowG * grokMode);
      const gb = Math.floor(255 * (1 - grokMode) + rainbowB * grokMode);
      glowColor = `rgba(${gr}, ${gg}, ${gb}, ${(0.3 + flashIntensity * 0.4) * spawnMult})`;
    } else if (effectiveActivation > 0.5) {
      // Bright neuron - blend to rainbow
      if (grokMode > 0.01) {
        coreColor = `rgb(${rainbowR}, ${rainbowG}, ${rainbowB})`;
        glowColor = `rgba(${rainbowR}, ${rainbowG}, ${rainbowB}, ${(0.1 + effectiveActivation * 0.25) * spawnMult})`;
      } else {
        coreColor = neuronBright;
        glowColor = `rgba(0, 255, 0, ${(0.1 + effectiveActivation * 0.25) * spawnMult})`;
      }
    } else {
      // Active neuron - blend to rainbow
      if (grokMode > 0.01) {
        const sat = 0.7; // Slightly desaturated for lower activation
        const r = Math.floor(rainbowR * sat);
        const g = Math.floor(rainbowG * sat);
        const b = Math.floor(rainbowB * sat);
        coreColor = `rgb(${r}, ${g}, ${b})`;
        glowColor = `rgba(${rainbowR}, ${rainbowG}, ${rainbowB}, ${(0.1 + effectiveActivation * 0.25) * spawnMult})`;
      } else {
        coreColor = neuronActive;
        glowColor = `rgba(0, 255, 0, ${(0.1 + effectiveActivation * 0.25) * spawnMult})`;
      }
    }
    
    // Draw glow (with rainbow color in grok mode)
    const glowMult = 1.6 + flashIntensity * 0.5;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * glowMult, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw neuron core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // White center dot - ONLY in non-grok mode
    if (grokMode < 0.5 && (effectiveActivation > 0.2 || isFlashing) && spawnMult > 0.5) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * Render as output neuron with flash/blink effect
   * Size and brightness driven by flashIntensity, color by target/error state
   */
  renderOutput(ctx, colors, flashIntensity = 0, scale = 1) {
    // Skip if not spawned yet
    if (this.spawnScale <= 0.01) return;
    
    const spawnMult = this.spawnScale;
    const baseSize = 4 * scale * spawnMult;
    const minDotSize = 2 * scale * spawnMult;
    
    // Use flashIntensity directly for blink effect
    const brightness = flashIntensity;
    
    // Always show a dim dot when not flashing
    if (brightness < 0.05) {
      // Dim base dot - slightly brighter for target/selected
      const dimAlpha = (this.isTarget || this.isSelected) ? 0.25 : 0.1;
      ctx.fillStyle = this.isError ? `rgba(255, 0, 0, ${dimAlpha * spawnMult})` 
                                   : `rgba(0, 255, 0, ${dimAlpha * spawnMult})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, minDotSize, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    // Size grows with brightness (flash intensity)
    const size = (baseSize + brightness * 5 * scale) * spawnMult;
    
    // Determine colors based on state
    let coreColor, glowColor;
    
    if (this.isError) {
      // Red for error (wrong prediction)
      const r = Math.floor(200 + brightness * 55);
      coreColor = `rgb(${r}, ${Math.floor(brightness * 50)}, ${Math.floor(brightness * 50)})`;
      glowColor = `rgba(255, 50, 50, ${brightness * 0.5 * spawnMult})`;
    } else if (this.isTarget && this.isSelected) {
      // Bright green for correct prediction
      const g = Math.floor(200 + brightness * 55);
      coreColor = `rgb(${Math.floor(brightness * 200)}, ${g}, ${Math.floor(brightness * 200)})`;
      glowColor = `rgba(100, 255, 100, ${brightness * 0.5 * spawnMult})`;
    } else {
      // Cyan flash for other
      const flashWhite = Math.floor(brightness * 255);
      coreColor = `rgb(${flashWhite}, 255, ${flashWhite})`;
      glowColor = `rgba(0, 255, 255, ${brightness * 0.5 * spawnMult})`;
    }
    
    // Draw glow (size based on brightness)
    const glowMult = 1.5 + brightness * 0.8;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * glowMult, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw neuron core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // White center dot when bright
    if (brightness > 0.3) {
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const CONFIG = {
  background: '#000',
  // Factored MLP architecture (from Google's grokking implementation)
  // Architecture: Embed → Hidden(tied) → ReLU(h_a + h_b) → Out → Unembed(tied)
  network: {
    nTokens: 67,         // Modulus (number of possible outputs) - KEEP 16!
    embedSize: 500,      // Embedding dimension (Google used 500)
    hiddenSize: 24,      // Hidden layer size (Google used 24, we use more for visualization)
    learningRate: 0.001, // Standard AdamW LR
    weightDecay: 1.0,    // HIGH weight decay - THE key to grokking!
    beta1: 0.9,          // AdamW beta1
    beta2: 0.9,         // AdamW beta2 (from Google)
    symmetric: true,     // Only use pairs where a <= b (like Google)
    trainFraction: 0.4,  // 40% train, 60% test (from Google)
  },
  // Training
  training: {
    batchSize: 64,       // Full batch per step
    epochsPerFrame: 16,  // Epochs per animation frame
    showGrokking: true,  // Track grokking transition
    useWorker: true,     // Use Web Worker for training
  },
  // Grid visualization
  grid: {
    rows: 16,
    cols: 16,
    baseSpacing: 38, // Larger spacing for better visibility
    referenceSize: 800, // Reference canvas size for scaling
  },
  // Colors
  colors: {
    neuronIdle: '#0a0',
    neuronActive: '#0f0',
    neuronBright: '#fff',
    text: '#0f0',
    testCase: 'rgba(0, 255, 0, 0.3)',
  },
};

/**
 * Grokking Neural Network Demo
 */
class Day19Demo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = CONFIG.background;
  }

  init() {
    super.init();
    
    // Initialize Factored Network (Google's grokking architecture)
    console.log('[Day19] Creating FactoredNetwork...');
    const startTime = performance.now();
    
    try {
      this.network = new FactoredNetwork(CONFIG.network);
      console.log(`[Day19] Network created in ${(performance.now() - startTime).toFixed(1)}ms`);
    } catch (err) {
      console.error('[Day19] Failed to create network:', err);
      return;
    }
    
    // Generate datasets using Google's methodology
    const { nTokens, symmetric, trainFraction } = CONFIG.network;
    const allData = generateAllPairs(nTokens, symmetric);
    const split = splitData(allData, trainFraction);
    this.trainData = split.train;
    this.testData = split.test;
    console.log(`Generated ${allData.length} pairs (symmetric=${symmetric}): ${this.trainData.length} train, ${this.testData.length} test`);
    
    // Legacy compatibility - not used with factored network
    if (false) {
      const { trainSize, testSize } = CONFIG.training;
      this.trainData = generateDataset(trainSize, nTokens, false, false);
      this.testData = generateDataset(testSize, outputSize, false, useOneHot);
    }
    
    // Training state
    this.epoch = 0;
    this.trainAccuracy = 0;
    this.testAccuracy = 0;
    this.trainLoss = 0;
    this.testLoss = 0;
    
    // Grokking tracking
    this.grokkingDetected = false;
    this.grokkingEpoch = -1;
    this.accuracyHistory = [];
    
    // Current test case for visualization
    this.currentTestCase = null;
    this.testCaseTime = 0;
    
    // Scale factor for responsive sizing
    const minDim = Math.min(this.width, this.height);
    this.scale = minDim / CONFIG.grid.referenceSize;
    this.gridSpacing = CONFIG.grid.baseSpacing * this.scale;
    
    // Synapse animation
    this.synapseAnimationTime = 0;
    this.outputFlashes = new Map(); // Track flash effects on output neurons
    this.gridFlashes = new Map(); // Track flash effects on grid neurons
    this.synapseTrails = new Map(); // Track fading synapse trails
    this.lastGridFlashIdx = -1; // Track last grid neuron that was flashed
    this.lastOutputFlashIdx = -1; // Track last output neuron that was flashed
    this.lastOutputSourceFlashKey = null; // Track source neuron flash for output synapses
    
    // Track activated neurons for current test case (persist until new input)
    this.activatedGridNeurons = new Set(); // Grid neurons that have been activated
    this.activatedOutputNeurons = new Set(); // Output neurons that have been activated
    this.currentTestCaseId = null; // Track which test case we're visualizing
    
    // Grok mode - rainbow colors when model achieves high test accuracy
    this.grokMode = 0; // 0 = green, 1 = full rainbow (smooth transition)
    this.grokThreshold = 0.60; // Test accuracy threshold to trigger grok mode (60%)
    
    // Cached output neurons (avoid creating new objects every frame)
    this.outputNeurons = [];
    this.outputNeuronsInitialized = false;
    
    // Animation time for stateless animations
    this.animTime = 0;
    
    // Cache forward pass results to avoid multiple calls
    this.cachedOutput = null;
    this.cachedPrediction = null;
    
    // Initialize with a forward pass so grid shows something immediately
    if (this.trainData.length > 0) {
      const sample = this.trainData[0];
      this.network.forward(sample.a, sample.b);
    }
    
    // Grid positioning
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    
    // Web Worker for training (if enabled)
    this.useWorker = CONFIG.training.useWorker;
    this.workerReady = false;
    this.workerTraining = false;
    
    if (this.useWorker) {
      this.initWorker();
    }
    
    // Input dots for spawn animation
    this.inputDots = [];
    this.outputDots = [];
    
    // State machine for intro → training
    this.fsm = new StateMachine({
      initial: 'intro',
      context: this,
      states: {
        intro: {
          enter: () => this.startIntroAnimation(),
          update: (dt) => this.updateIntro(dt),
        },
        training: {
          enter: () => this.startTraining(),
          update: (dt) => this.updateTraining(dt),
        }
      }
    });
    
    // Training UI opacity (for fade-in)
    this.trainingOpacity = 0;
    this.synapseOpacity = 0; // Separate slower fade for synapses
    
    // Click to restart
    this.canvas.addEventListener('click', () => {
      this.restart();
    });
    
    // Debug: Press 'g' to toggle grok mode
    // Instead of just visuals, swap test set with train set so accuracy rises naturally
    this.grokModeOverride = false;
    this.originalTestData = null; // Store original test data for restoration
    window.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        this.grokModeOverride = !this.grokModeOverride;
        
        if (this.grokModeOverride) {
          // Enable grok mode: swap test set with train set
          this.originalTestData = this.testData;
          this.testData = [...this.trainData]; // Use train data for testing
          this.grokMode = 1;
          console.log(`[DEBUG] Grok mode ON - test set = train set (${this.testData.length} examples)`);
          
          // Tell worker to do the same
          if (this.worker) {
            this.worker.postMessage({ type: 'grokMode', enabled: true });
          }
        } else {
          // Disable grok mode: restore original test set
          if (this.originalTestData) {
            this.testData = this.originalTestData;
            this.originalTestData = null;
          }
          this.grokMode = 0;
          console.log(`[DEBUG] Grok mode OFF - original test set restored (${this.testData.length} examples)`);
          
          // Tell worker to restore
          if (this.worker) {
            this.worker.postMessage({ type: 'grokMode', enabled: false });
          }
        }
      }
    });
  }
  
  /**
   * Initialize Web Worker for training
   */
  initWorker() {
    try {
      // Create worker from separate file
      this.worker = new Worker(new URL('./day19.worker.js', import.meta.url), { type: 'module' });
      
      // Handle messages from worker
      this.worker.onmessage = (e) => {
        const { type } = e.data;
        
        switch (type) {
          case 'state':
            // Update local state from worker
            this.epoch = e.data.epoch;
            this.trainAccuracy = e.data.trainAccuracy;
            this.testAccuracy = e.data.testAccuracy;
            
            // Update network activations for visualization (256 values for 16x16 grid)
            if (this.network) {
              // The worker sends 256 grid-mapped activations
              this.network.hiddenActivations = new Float32Array(e.data.hiddenActivations);
              this.network.outputActivations = new Float32Array(e.data.outputActivations);
            }
            
            this.workerTraining = false;
            this.workerReady = true;
            break;
            
          case 'forward':
            // Update activations from forward pass
            if (this.network) {
              this.network.hiddenActivations = new Float32Array(e.data.hiddenActivations);
              this.network.outputActivations = new Float32Array(e.data.outputActivations);
            }
            this.cachedOutput = new Float32Array(e.data.outputActivations);
            this.cachedPrediction = e.data.prediction;
            break;
        }
      };
      
      this.worker.onerror = (err) => {
        console.error('Worker error:', err);
        this.useWorker = false;
        this.workerReady = false;
      };
      
      // Initialize worker with network config
      // Worker generates its own data from the same config
      this.worker.postMessage({
        type: 'init',
        data: {
          config: CONFIG.network,
        }
      });
      
      console.log('Web Worker initialized for training');
    } catch (err) {
      console.warn('Failed to create Web Worker, falling back to main thread:', err);
      this.useWorker = false;
    }
  }
  
  /**
   * Start the intro spawn animation
   */
  startIntroAnimation() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const { rows, cols } = CONFIG.grid;
    
    // Track pending tweens - only transition when all complete
    this.pendingTweens = 0;
    
    // Calculate final positions
    this.gridOffsetX = this.width / 2 - (cols * this.gridSpacing) / 2;
    this.gridOffsetY = this.height / 2 - (rows * this.gridSpacing) / 2;
    
    // Create grid neurons at center with scale 0
    this.gridNeurons = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const targetX = this.gridOffsetX + col * this.gridSpacing;
        const targetY = this.gridOffsetY + row * this.gridSpacing;
        const neuron = new Neuron(centerX, centerY, 4 * this.scale);
        neuron.targetX = targetX;
        neuron.targetY = targetY;
        neuron.spawnScale = 0;
        this.gridNeurons.push(neuron);
        
        // Staggered spawn animation - fast wave from center
        const distFromCenter = Math.sqrt(
          Math.pow(col - cols/2, 2) + Math.pow(row - rows/2, 2)
        );
        const delay = distFromCenter * 0.04; // Much faster stagger
        
        this.pendingTweens++;
        Tweenetik.to(neuron, { 
          x: targetX, 
          y: targetY, 
          spawnScale: 1 
        }, 0.4, Easing.easeOutBack, { 
          delay: 0.1 + delay,
          onComplete: () => this.onTweenComplete()
        });
      }
    }
    
    // Create input dots at center
    const gridWidth = cols * this.gridSpacing;
    const leftX = centerX - gridWidth / 2 - 100 * this.scale;
    const rightX = centerX + gridWidth / 2 + 100 * this.scale;
    
    // Input A dots (7 bits) - faster spawn
    this.inputDots = [];
    for (let i = 0; i < 14; i++) { // 7 bits for A, 7 bits for B
      const dot = { x: centerX, y: centerY, spawnScale: 0 };
      this.inputDots.push(dot);
      this.pendingTweens++;
      Tweenetik.to(dot, { spawnScale: 1 }, 0.3, Easing.easeOutBack, { 
        delay: 0.05 + i * 0.01,
        onComplete: () => this.onTweenComplete()
      });
    }
    
    // Output dots (7 bits) - faster spawn
    this.outputDots = [];
    for (let i = 0; i < 7; i++) {
      const dot = { x: centerX, y: centerY, spawnScale: 0 };
      this.outputDots.push(dot);
      this.pendingTweens++;
      Tweenetik.to(dot, { spawnScale: 1 }, 0.3, Easing.easeOutBack, { 
        delay: 0.1 + i * 0.01,
        onComplete: () => this.onTweenComplete()
      });
    }
  }
  
  /**
   * Called when a tween completes - transition to training when all done
   */
  onTweenComplete() {
    this.pendingTweens--;
    if (this.pendingTweens <= 0 && this.fsm.is('intro')) {
      this.fsm.setState('training');
    }
  }
  
  /**
   * Update intro state
   */
  updateIntro(dt) {
    
  }
  
  /**
   * Start training state - fade in UI elements
   */
  startTraining() {
    this.trainingOpacity = 0;
    this.synapseOpacity = 0;
    // Fade in stats/input/output quickly
    Tweenetik.to(this, { trainingOpacity: 1 }, 0.8, Easing.easeOutQuad);
    // Fade in synapses more slowly with a delay
    Tweenetik.to(this, { synapseOpacity: 1 }, 1.5, Easing.easeInOutQuad, { delay: 0.5 });
  }
  
  /**
   * Update training state
   */
  updateTraining(dt) {
    // Update tweens (for fade-in)
    Tweenetik.updateAll(dt);
    // Normal training logic
    this.trainNetwork();
    this.synapseAnimationTime += dt;
  }
  
  restart() {
    // Create new FactoredNetwork
    this.network = new FactoredNetwork(CONFIG.network);
    
    // Generate datasets using Google's methodology
    const { nTokens, symmetric, trainFraction } = CONFIG.network;
    const allData = generateAllPairs(nTokens, symmetric);
    const split = splitData(allData, trainFraction);
    this.trainData = split.train;
    this.testData = split.test;
    
    this.epoch = 0;
    this.trainAccuracy = 0;
    this.testAccuracy = 0;
    this.grokkingDetected = false;
    this.grokkingEpoch = -1;
    this.accuracyHistory = [];
    this.grokMode = 0; // Reset rainbow mode
    this.grokModeOverride = false; // Re-enable auto detection
    this.outputNeuronsInitialized = false;
    this.outputNeuronsKeys = null;
    this.gridNeurons = null;
    this.animTime = 0;
    this.cachedOutput = null;
    this.cachedPrediction = null;
    this.synapseTrails = new Map(); // Reset synapse trails
    this.trainingOpacity = 0; // Reset opacity for fade-in
    this.synapseOpacity = 0; // Reset synapse opacity
    
    // Reset worker if using
    if (this.useWorker && this.worker) {
      this.workerReady = false;
      this.workerTraining = false;
      this.worker.postMessage({
        type: 'reset',
        data: {
          config: CONFIG.network,
        }
      });
    }
    
    // Kill any active tweens and restart intro
    Tweenetik.killAll();
    this.fsm.setState('intro');
  }

  update(dt) {
    super.update(dt);
    
    // Calculate scale factor based on canvas size
    const minDim = Math.min(this.width, this.height);
    this.scale = minDim / CONFIG.grid.referenceSize;
    
    // Calculate dynamic grid spacing
    this.gridSpacing = CONFIG.grid.baseSpacing * this.scale;
    
    // Update grid offset
    this.gridOffsetX = this.width / 2 - (CONFIG.grid.cols * this.gridSpacing) / 2;
    this.gridOffsetY = this.height / 2 - (CONFIG.grid.rows * this.gridSpacing) / 2;
    
    // Update state machine
    this.fsm.update(dt);
    
    // Update animation time for stateless animations
    this.animTime += dt;
    
    // Update test case visualization (cycle through examples)
    this.testCaseTime += dt;
    if (this.testCaseTime > 2.0) {
      this.testCaseTime = 0;
      // Pick random test case
      const idx = Math.floor(Math.random() * this.testData.length);
      this.currentTestCase = this.testData[idx];
      this.currentTestCaseId = idx; // Track which test case
      // Reset output neurons when test case changes
      this.outputNeuronsInitialized = false;
      this.cachedOutput = null;
      this.cachedPrediction = null;
      // Reset activated neuron tracking for new input
      this.activatedGridNeurons.clear();
      this.activatedOutputNeurons.clear();
      this.gridFlashes.clear();
      this.outputFlashes.clear();
      this.lastGridFlashIdx = -1;
      this.lastOutputFlashIdx = -1;
      this.lastOutputSourceFlashKey = null;
    }
    
    // Do forward pass ONCE per frame and cache results
    // Always update so we see changes as network trains
    if (this.currentTestCase) {
      // Recalculate - network weights are changing during training!
      const { probs } = this.network.forward(this.currentTestCase.a, this.currentTestCase.b);
      this.cachedOutput = probs;
      this.cachedPrediction = this.network.predict(this.currentTestCase.a, this.currentTestCase.b);
    } else if (this.trainData.length > 0) {
      // Initialize with first example
      this.currentTestCase = this.trainData[0];
      const { probs } = this.network.forward(this.currentTestCase.a, this.currentTestCase.b);
      this.cachedOutput = probs;
      this.cachedPrediction = this.network.predict(this.currentTestCase.a, this.currentTestCase.b);
      this.outputNeuronsInitialized = false;
    }
  }
  
  trainNetwork() {
    const { epochsPerFrame, batchSize } = CONFIG.training;
    const { nTokens } = CONFIG.network;
    
    // Use Web Worker if available
    if (this.useWorker && this.workerReady && !this.workerTraining) {
      this.workerTraining = true;
      this.worker.postMessage({
        type: 'train',
        data: { epochsPerFrame, batchSize }
      });
      
      // Track grokking from worker state (push every epoch for faster graph)
      this.accuracyHistory.push({
        epoch: this.epoch,
        train: this.trainAccuracy,
        test: this.testAccuracy,
      });
      
      if (this.accuracyHistory.length > 500) {
        this.accuracyHistory.shift();
      }
      
      // Grok mode detection - only when train is ~100% AND test is high
      // Skip if manual override is active (press G to toggle)
      if (!this.grokModeOverride) {
        const hasMemorized = this.trainAccuracy >= 0.95; // Train must be ~100%
        const hasGrokked = hasMemorized && this.testAccuracy >= this.grokThreshold;
        const targetGrok = hasGrokked ? 1 : 0;
        this.grokMode += (targetGrok - this.grokMode) * 0.05; // Smooth transition to rainbow
      }
      
      return;
    }
    
    // Fallback: train on main thread
    if (this.useWorker) return; // Wait for worker to be ready
    
    // Main thread fallback using FactoredNetwork
    this.network.resetGradients();
    for (let e = 0; e < epochsPerFrame; e++) {
      // Process all training data each epoch (full batch)
      for (let i = 0; i < this.trainData.length; i++) {
        const ex = this.trainData[i];
        const { cache } = this.network.forward(ex.a, ex.b);
        this.network.backward(ex.target, cache);
      }
      this.network.applyAdamW(this.trainData.length);
      this.epoch++;
    }
    
    if (this.epoch % 20 === 0) {
      const trainSample = this.trainData.slice(0, Math.min(100, this.trainData.length));
      const testSample = this.testData.slice(0, Math.min(100, this.testData.length));
      this.trainAccuracy = calcAccuracy(this.network, trainSample);
      this.testAccuracy = calcAccuracy(this.network, testSample);
    }
    
    // Push every epoch for faster graph updates
    this.accuracyHistory.push({
      epoch: this.epoch,
      train: this.trainAccuracy,
      test: this.testAccuracy,
    });
    
    if (this.accuracyHistory.length > 500) {
      this.accuracyHistory.shift();
    }
    
    // Detect grokking: test accuracy suddenly jumps while train is already high
    if (!this.grokkingDetected && this.epoch > 100) {
      const recent = this.accuracyHistory.slice(-50);
      if (recent.length >= 50) {
        const oldTest = recent[0].test;
        const newTest = recent[recent.length - 1].test;
        // Grokking: test accuracy jumps significantly (>0.3) while train is high (>0.8)
        if (this.trainAccuracy > 0.8 && newTest - oldTest > 0.3) {
          this.grokkingDetected = true;
          this.grokkingEpoch = this.epoch;
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // Motion blur trail (lighter for better performance)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    
    // Draw synapses (connections) first, behind neurons
    this.drawSynapses(ctx);
    
    // Draw grid of hidden neurons
    this.drawNeuronGrid(ctx);
    
    // Draw input/output neurons
    this.drawInputOutputNeurons(ctx);
    
    // Draw input/output/result around grid
    this.drawInputOutput(ctx);
    
    // Draw stats (compact)
    this.drawStats(ctx);
  }
  
  drawNeuronGrid(ctx) {
    const { rows, cols } = CONFIG.grid;
    const spacing = this.gridSpacing;
    
    // Get current activations (from last forward pass)
    const activations = this.network.hiddenActivations;
    
    if (!activations || activations.length === 0) return;
    
    // Cache normalization calculation (only recalculate every few frames)
    if (!this._normCache || this._normFrameCount % 5 === 0) {
      const sorted = [...activations].sort((a, b) => a - b);
      this._normCache = Math.max(sorted[Math.floor(sorted.length * 0.95)], 0.001);
      this._normFrameCount = 0;
    }
    this._normFrameCount++;
    
    // Reinitialize grid neurons if spacing changed significantly (but not during intro)
    const spacingChanged = this._lastSpacing && Math.abs(this._lastSpacing - spacing) > 1;
    this._lastSpacing = spacing;
    const isIntro = this.fsm.is('intro');
    
    // Initialize grid neurons cache if needed (skip during intro - already created)
    if (!this.gridNeurons || this.gridNeurons.length !== rows * cols || (spacingChanged && !isIntro)) {
      this.gridNeurons = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = this.gridOffsetX + col * spacing;
          const y = this.gridOffsetY + row * spacing;
          this.gridNeurons.push(new Neuron(x, y, 4 * this.scale));
        }
      }
    }
    
    // Update and render cached neurons
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const neuron = this.gridNeurons[idx];
        
        // Update position (in case grid offset changed)
        neuron.x = this.gridOffsetX + col * spacing;
        neuron.y = this.gridOffsetY + row * spacing;
        
        // Check for synapse flash effect - always fade out (blink effect)
        let flashIntensity = 0;
        if (this.gridFlashes && this.gridFlashes.has(idx)) {
          const flashTime = this.gridFlashes.get(idx);
          const flashAge = this.synapseAnimationTime - flashTime;
          const flashDuration = 0.5; // Faster fade for blink effect
          if (flashAge < flashDuration) {
            // Smooth fade out using ease-out curve
            const t = flashAge / flashDuration;
            flashIntensity = 1 - (t * t); // Quadratic ease-out
            this.activatedGridNeurons.add(idx);
          } else {
            this.gridFlashes.delete(idx);
            this.activatedGridNeurons.delete(idx);
          }
        }
        
        if (isIntro) {
          neuron.activation = 0;
          neuron.isActive = false;
        } else {
          // Always use flash intensity - neurons blink and fade
          neuron.activation = flashIntensity;
          neuron.isActive = flashIntensity > 0.1;
        }
        
        neuron.renderGrid(ctx, CONFIG.colors, this._normCache, flashIntensity, this.scale, this.grokMode, row, col, this.animTime);
      }
    }
  }
  
  /**
   * Draw input and output neurons (left and right of grid)
   */
  drawInputOutputNeurons(ctx) {
    if (!this.currentTestCase) return;
    if (!this.cachedOutput) return;
    if (!this.fsm.is('training')) return; // Only show during training
    if (this.trainingOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;
    
    const gridCenterX = this.width / 2;
    const gridCenterY = this.height / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;
    const gridHeight = CONFIG.grid.rows * this.gridSpacing;
    
    // Position output column closer to grid (scaled)
    const outputX = gridCenterX + gridWidth / 2 + 8 * this.scale;
    
    // Note: Input neurons are now represented by binary dots in drawInputOutput()
    // We only draw output neurons here
    
    // Use cached output from update() - no forward pass here!
    const output = this.cachedOutput;
    const prediction = this.cachedPrediction;
    
    // Get top 10 outputs sorted by activation
    // Note: output is Float32Array, must convert to Array first for .map to return objects
    const outputWithIndices = Array.from(output, (val, idx) => ({ value: val, index: idx }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    const outputSpacing = this.gridSpacing; // Use same spacing as grid
    const outputStartY = gridCenterY - (outputWithIndices.length - 1) * outputSpacing / 2;
    
    // Always recreate neurons when order changes (outputs are sorted by activation)
    // Use a key based on the sorted indices to detect changes
    const currentKeys = outputWithIndices.map(o => o.index).join(',');
    if (!this.outputNeuronsKeys || this.outputNeuronsKeys !== currentKeys) {
      this.outputNeurons = [];
      for (let i = 0; i < outputWithIndices.length; i++) {
        const outputY = outputStartY + i * outputSpacing;
        this.outputNeurons.push(new Neuron(outputX, outputY, 4 * this.scale));
      }
      this.outputNeuronsKeys = currentKeys;
    }
    
    // Update neuron states and render
    for (let i = 0; i < outputWithIndices.length; i++) {
      const outputIdx = outputWithIndices[i].index;
      const neuron = this.outputNeurons[i];
      
      // Update neuron position
      neuron.x = outputX;
      neuron.y = outputStartY + i * outputSpacing;
      
      // Check for synapse flash effect - always fade out (blink effect)
      let flashIntensity = 0;
      if (this.outputFlashes.has(i)) {
        const flashTime = this.outputFlashes.get(i);
        const flashAge = this.synapseAnimationTime - flashTime;
        const flashDuration = 0.5; // Faster fade for blink effect
        if (flashAge < flashDuration) {
          // Smooth fade out using ease-out curve
          const t = flashAge / flashDuration;
          flashIntensity = 1 - (t * t); // Quadratic ease-out
          this.activatedOutputNeurons.add(i);
        } else {
          this.outputFlashes.delete(i);
          this.activatedOutputNeurons.delete(i);
        }
      }
      
      // Always use flash intensity - neurons blink and fade
      neuron.activation = flashIntensity;
      
      neuron.isTarget = (outputIdx === this.currentTestCase.target);
      neuron.isSelected = (outputIdx === prediction);
      
      // Error state: show when currently flashing and there's a mismatch
      const isMismatch = (neuron.isTarget && !neuron.isSelected) || (!neuron.isTarget && neuron.isSelected);
      neuron.isError = flashIntensity > 0.1 && isMismatch;
      
      // Render using Neuron class with flash and scale
      neuron.renderOutput(ctx, CONFIG.colors, flashIntensity, this.scale);
    }
    
    ctx.restore();
  }
  
  /**
   * Draw synapses - FAST burst-style to show batched training
   * Targets rotate through grid over time, neurons deactivate after short duration
   */
  drawSynapses(ctx) {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return;
    if (this.synapseOpacity <= 0) return;
    if (!this.cachedOutput) return;
    if (!this.gridNeurons) return;
    
    ctx.save();
    ctx.globalAlpha = this.synapseOpacity;
    
    const gridCenterX = this.width / 2;
    const gridCenterY = this.height / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;
    const { rows, cols } = CONFIG.grid;
    const spacing = this.gridSpacing;
    const t = this.synapseAnimationTime;
    
    // Clear old activations - neurons deactivate after 0.4 seconds
    const activationDuration = 0.4;
    for (const [idx, flashTime] of this.gridFlashes.entries()) {
      if (t - flashTime > activationDuration) {
        this.gridFlashes.delete(idx);
        this.activatedGridNeurons.delete(idx);
      }
    }
    for (const [pos, flashTime] of this.outputFlashes.entries()) {
      if (t - flashTime > activationDuration) {
        this.outputFlashes.delete(pos);
        this.activatedOutputNeurons.delete(pos);
      }
    }
    
    // Get current network activations
    const activations = this.network.hiddenActivations;
    const maxAct = activations ? Math.max(...activations, 0.001) : 1;
    
    // Build list of neurons with their actual positions, weighted by activation
    // Time-based rotation selects different neurons each frame
    const getGridTarget = (burstIndex) => {
      // Use time + burst index to rotate through grid
      const timeOffset = Math.floor(t * 8); // Changes target every 125ms
      const idx = (timeOffset * 17 + burstIndex * 31) % 256; // Spread across 16x16
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      return {
        index: idx,
        x: this.gridOffsetX + col * spacing,
        y: this.gridOffsetY + row * spacing
      };
    };
    
    // Input positions - match drawInputOutput layout exactly
    const leftX = gridCenterX - gridWidth / 2 - 100 * this.scale;
    const inputAX = leftX; // Center X of input A dots
    const inputAY = gridCenterY - 40 * this.scale; // Input A Y position
    const inputBX = leftX; // Center X of input B dots
    const inputBY = gridCenterY + 40 * this.scale; // Input B Y position
    
    ctx.lineCap = 'round';
    
    const numInputBursts = 12;
    const numOutputBursts = 8;
    
    // Input → Grid synapses (FAST bursts, rotating through grid)
    for (let b = 0; b < numInputBursts; b++) {
      const phase = ((t * 6 + b * 0.083) % 1); // Fast cycle
      
      // Get target - rotates through grid over time
      const targetNeuron = getGridTarget(b);
      
      // Alternate inputs
      const isA = b % 2 === 0;
      const startX = isA ? inputAX : inputBX;
      const startY = isA ? inputAY : inputBY;
      
      // Fast ease-out
      const progress = Math.min(1, phase * 3);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const traceX = startX + (targetNeuron.x - startX) * eased;
      const traceY = startY + (targetNeuron.y - startY) * eased;
      
      let alpha = (1 - phase) * 0.6;
      
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = Math.max(0.5, 1.0 * this.scale);
      ctx.globalAlpha = this.synapseOpacity * alpha;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(traceX, traceY);
      ctx.stroke();
      
      // Glow at head
      if (progress < 1 && alpha > 0.1) {
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(traceX, traceY, 2 * this.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Flash neuron when synapse arrives
      if (progress > 0.9) {
        this.gridFlashes.set(targetNeuron.index, t);
        this.activatedGridNeurons.add(targetNeuron.index);
      }
    }
    
    // Get output neurons that should receive synapses
    // Target prediction neuron and target neuron (the ones shown as active)
    const outputTargets = [];
    if (this.outputNeurons && this.outputNeurons.length > 0) {
      for (let i = 0; i < this.outputNeurons.length; i++) {
        const neuron = this.outputNeurons[i];
        // Only target prediction or target neurons
        if (neuron.isSelected || neuron.isTarget) {
          outputTargets.push({
            position: i,
            x: neuron.x,
            y: neuron.y,
            isPrimary: neuron.isSelected // Prediction is primary target
          });
        }
      }
    }
    
    // Grid → Output synapses (from recently-activated grid neurons to prediction/target)
    if (outputTargets.length > 0) {
      // Use recently activated grid neurons as sources
      const sources = Array.from(this.activatedGridNeurons).slice(-8).map(idx => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        return {
          index: idx,
          x: this.gridOffsetX + col * spacing,
          y: this.gridOffsetY + row * spacing
        };
      });
      
      // If no activated neurons yet, use grid targets we're currently hitting
      if (sources.length === 0) {
        for (let b = 0; b < 4; b++) {
          sources.push(getGridTarget(b));
        }
      }
      
      for (let b = 0; b < numOutputBursts; b++) {
        const phase = ((t * 5 + b * 0.125 + 0.15) % 1);
        
        const sourceNeuron = sources[b % sources.length];
        const targetOutput = outputTargets[b % outputTargets.length];
        
        const progress = Math.min(1, phase * 3);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const traceX = sourceNeuron.x + (targetOutput.x - sourceNeuron.x) * eased;
        const traceY = sourceNeuron.y + (targetOutput.y - sourceNeuron.y) * eased;
        
        let alpha = (1 - phase) * 0.5;
        
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = Math.max(0.5, 1.0 * this.scale);
        ctx.globalAlpha = this.synapseOpacity * alpha;
        
        ctx.beginPath();
        ctx.moveTo(sourceNeuron.x, sourceNeuron.y);
        ctx.lineTo(traceX, traceY);
        ctx.stroke();
        
        if (progress < 1 && alpha > 0.1) {
          ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(traceX, traceY, 2 * this.scale, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Flash source at start, target at end
        if (progress > 0.1 && progress < 0.3) {
          this.gridFlashes.set(sourceNeuron.index, t);
        }
        if (progress > 0.9) {
          // Flash output neuron when synapse arrives
          this.outputFlashes.set(targetOutput.position, t);
          this.activatedOutputNeurons.add(targetOutput.position);
        }
      }
    }
    
    ctx.restore();
  }
  
  /**
   * DEPRECATED: Old weight-based synapse drawing (kept for reference)
   */
  drawSingleInputToHidden_OLD(ctx, fromX, fromY, gridOffsetX, gridOffsetY, rows, cols, spacing, weights, activations, maxActivation, animPhase, color) {
    if (!weights) return; // Skip if no weights (FactoredNetwork)
    const connections = [];
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      const activation = activations[i] / maxActivation;
      const strength = Math.abs(weight) * activation;
      connections.push({ index: i, strength, weight, activation });
    }
    connections.sort((a, b) => b.strength - a.strength);
    const topConnections = connections.slice(0, 20);
    
    if (topConnections.length === 0) return;
    
    // Cycle through connections: show one at a time
    const connectionDuration = 0.5;
    const totalCycleTime = topConnections.length * connectionDuration;
    const cyclePhase = (this.synapseAnimationTime % totalCycleTime) / connectionDuration;
    const currentConnectionIndex = Math.floor(cyclePhase);
    const connectionProgress = cyclePhase % 1;
    
    // Draw only the current connection
    const conn = topConnections[currentConnectionIndex % topConnections.length];
    
    // Draw all connections faintly for context
    for (const c of topConnections) {
      const idx = c.index;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      
      const toX = gridOffsetX + col * spacing;
      const toY = gridOffsetY + row * spacing;
      
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
    
    // Draw the active connection with animation
    const idx = conn.index;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    
    const toX = gridOffsetX + col * spacing;
    const toY = gridOffsetY + row * spacing;
    
    // Line properties based on weight and activation
    const lineWidth = Math.max(0.5, Math.min(2, Math.abs(conn.weight) * 1.5));
    const alpha = Math.min(0.8, conn.activation * 0.9);
    
    // Animated tracing effect
    const traceLength = 0.4;
    const traceStart = connectionProgress;
    const traceEnd = (connectionProgress + traceLength) % 1;
    
    // Draw animated trace segment
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    
    if (traceEnd > traceStart) {
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else {
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(toX, toY);
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(endX, endY);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Trigger flash when synapse reaches the grid neuron (only once per synapse)
    const shouldFlash = traceEnd >= 0.95 || (traceEnd < traceStart && traceStart > 0.9);
    if (shouldFlash && this.lastGridFlashIdx !== idx) {
      this.gridFlashes.set(idx, this.synapseAnimationTime);
      this.lastGridFlashIdx = idx;
    } else if (!shouldFlash && this.lastGridFlashIdx === idx) {
      // Reset when synapse moves away from completion zone
      this.lastGridFlashIdx = -1;
    }
  }
  
  /**
   * Draw connections FROM activated binary dots TO hidden neurons
   * Each activated bit connects to hidden neurons it activates
   */
  drawInputToHiddenConnections(ctx, number, centerX, centerY, dotSize, dotSpacing, dotsPerRow, gridOffsetX, gridOffsetY, rows, cols, spacing, weights, activations, maxActivation, animPhase, color) {
    // Convert to binary to find activated bits
    const mod = CONFIG.network.nTokens;
    const bits = Math.max(3, Math.ceil(Math.log2(mod + 1)));
    const binary = [];
    let temp = number;
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (temp >> i) & 1;
      binary.push(bit);
    }
    
    // Calculate dot positions
    const totalRows = Math.ceil(bits / dotsPerRow);
    const startY = centerY - ((totalRows - 1) * dotSpacing) / 2;
    
    // Find activated bits and their positions
    const activatedBits = [];
    for (let i = 0; i < bits; i++) {
      if (binary[i] === 1) {
        const row = Math.floor(i / dotsPerRow);
        const col = i % dotsPerRow;
        const dotsInRow = Math.min(dotsPerRow, bits - row * dotsPerRow);
        const rowWidth = (dotsInRow - 1) * dotSpacing;
        const x = centerX - rowWidth / 2 + col * dotSpacing;
        const y = startY + row * dotSpacing;
        activatedBits.push({ index: i, x, y });
      }
    }
    
    if (activatedBits.length === 0) return;
    
    // Cycle through connections: show one at a time
    const connectionDuration = 0.5;
    const totalCycleTime = activatedBits.length * connectionDuration;
    const cyclePhase = (this.synapseAnimationTime % totalCycleTime) / connectionDuration;
    const currentBitIndex = Math.floor(cyclePhase);
    const connectionProgress = cyclePhase % 1;
    
    const activeBit = activatedBits[currentBitIndex % activatedBits.length];
    
    // Draw all connections faintly for context
    for (const bit of activatedBits) {
      // Connect this bit to top hidden neurons (by weight strength)
      const connections = [];
      for (let i = 0; i < weights.length; i++) {
        const weight = weights[i];
        const activation = activations[i] / maxActivation;
        const strength = Math.abs(weight) * activation;
        connections.push({ index: i, strength, weight, activation });
      }
      
      connections.sort((a, b) => b.strength - a.strength);
      const topConnections = connections.slice(0, 10); // Top 10 per bit
      
      for (const conn of topConnections) {
        const hiddenIdx = conn.index;
        const hiddenRow = Math.floor(hiddenIdx / cols);
        const hiddenCol = hiddenIdx % cols;
        const toX = gridOffsetX + hiddenCol * spacing;
        const toY = gridOffsetY + hiddenRow * spacing;
        
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.03;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(bit.x, bit.y);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      }
    }
    
    // Draw active connection with animation
    const connections = [];
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      const activation = activations[i] / maxActivation;
      const strength = Math.abs(weight) * activation;
      connections.push({ index: i, strength, weight, activation });
    }
    
    connections.sort((a, b) => b.strength - a.strength);
    const topConnections = connections.slice(0, 10);
    
    for (const conn of topConnections) {
      const hiddenIdx = conn.index;
      const hiddenRow = Math.floor(hiddenIdx / cols);
      const hiddenCol = hiddenIdx % cols;
      const toX = gridOffsetX + hiddenCol * spacing;
      const toY = gridOffsetY + hiddenRow * spacing;
      
      const lineWidth = Math.max(0.5, Math.min(2, Math.abs(conn.weight) * 1.5));
      const alpha = Math.min(0.6, conn.activation * 0.7);
      
      const traceLength = 0.4;
      const traceStart = connectionProgress;
      const traceEnd = (connectionProgress + traceLength) % 1;
      
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      
      ctx.beginPath();
      
      if (traceEnd > traceStart) {
        const startX = activeBit.x + (toX - activeBit.x) * traceStart;
        const startY = activeBit.y + (toY - activeBit.y) * traceStart;
        const endX = activeBit.x + (toX - activeBit.x) * traceEnd;
        const endY = activeBit.y + (toY - activeBit.y) * traceEnd;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      } else {
        const startX = activeBit.x + (toX - activeBit.x) * traceStart;
        const startY = activeBit.y + (toY - activeBit.y) * traceStart;
        const endX = activeBit.x + (toX - activeBit.x) * traceEnd;
        const endY = activeBit.y + (toY - activeBit.y) * traceEnd;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(toX, toY);
        ctx.moveTo(activeBit.x, activeBit.y);
        ctx.lineTo(endX, endY);
      }
      
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }
  
  /**
   * Draw connections FROM a single point TO a grid with animated tracing
   * Shows only ONE synapse at a time, cycling through them
   */
  drawLayerConnectionsToGrid(ctx, fromX, fromY, gridOffsetX, gridOffsetY, rows, cols, spacing, weights, activations, maxActivation, animPhase, maxConnections, color) {
    // Collect strongest connections
    const connections = [];
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      const activation = activations[i] / maxActivation;
      const strength = Math.abs(weight) * activation;
      connections.push({ index: i, strength, weight, activation });
    }
    
    // Sort by strength and take top N
    connections.sort((a, b) => b.strength - a.strength);
    const topConnections = connections.slice(0, maxConnections);
    
    if (topConnections.length === 0) return;
    
    // Cycle through connections: show one at a time
    const connectionDuration = 0.5; // Time per connection in seconds
    const totalCycleTime = topConnections.length * connectionDuration;
    const cyclePhase = (this.synapseAnimationTime % totalCycleTime) / connectionDuration;
    const currentConnectionIndex = Math.floor(cyclePhase);
    const connectionProgress = cyclePhase % 1;
    
    // Draw only the current connection
    const conn = topConnections[currentConnectionIndex % topConnections.length];
    
    // Draw all connections faintly for context
    for (const c of topConnections) {
      const idx = c.index;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      
      const toX = gridOffsetX + col * spacing;
      const toY = gridOffsetY + row * spacing;
      
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
    
    // Draw the active connection with animation
    const idx = conn.index;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    
    const toX = gridOffsetX + col * spacing;
    const toY = gridOffsetY + row * spacing;
    
    // Line properties based on weight and activation
    const lineWidth = Math.max(0.5, Math.min(2, Math.abs(conn.weight) * 1.5));
    const alpha = Math.min(0.8, conn.activation * 0.9);
    
    // Animated tracing effect - use connectionProgress instead of animPhase
    const traceLength = 0.4;
    const traceStart = connectionProgress;
    const traceEnd = (connectionProgress + traceLength) % 1;
    
    // Draw animated trace segment
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    
    if (traceEnd > traceStart) {
      // Normal case: trace from start to end
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else {
      // Wrapped case: draw two segments
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(toX, toY);
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(endX, endY);
    }
    
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }
  
  /**
   * Draw unified output synapses - ONE trace at a time across ALL output neurons
   * This creates the same visual style as input synapses
   */
  drawUnifiedOutputSynapses(ctx, gridOffsetX, gridOffsetY, rows, cols, spacing, topOutputs, outputX, outputStartY, outputSpacing, activations, maxActivation, color) {
    // Collect ALL strongest connections across ALL output neurons
    const allConnections = [];
    
    for (let outIdx = 0; outIdx < topOutputs.length; outIdx++) {
      const outputIdx = topOutputs[outIdx].index;
      const outputY = outputStartY + outIdx * outputSpacing;
      const weights = this.network.weights2.map(row => row[outputIdx]);
      
      for (let i = 0; i < weights.length; i++) {
        const weight = weights[i];
        const activation = activations[i] / maxActivation;
        const strength = Math.abs(weight) * activation;
        
        if (strength > 0.01) { // Only include significant connections
          const row = Math.floor(i / cols);
          const col = i % cols;
          const fromX = gridOffsetX + col * spacing;
          const fromY = gridOffsetY + row * spacing;
          
          allConnections.push({
            fromX, fromY,
            toX: outputX, toY: outputY,
            strength, weight, activation,
            outputIdx: outIdx
          });
        }
      }
    }
    
    // Sort by strength and take top connections
    allConnections.sort((a, b) => b.strength - a.strength);
    const topConnections = allConnections.slice(0, 30); // Top 30 across all outputs
    
    if (topConnections.length === 0) return;
    
    // Cycle through connections: show ONE at a time
    const connectionDuration = 0.3; // Faster cycling
    const totalCycleTime = topConnections.length * connectionDuration;
    const cyclePhase = (this.synapseAnimationTime % totalCycleTime) / connectionDuration;
    const currentConnectionIndex = Math.floor(cyclePhase);
    const connectionProgress = cyclePhase % 1;
    
    // Draw all connections very faintly for context
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.03;
    ctx.lineWidth = 0.5;
    for (const conn of topConnections) {
      ctx.beginPath();
      ctx.moveTo(conn.fromX, conn.fromY);
      ctx.lineTo(conn.toX, conn.toY);
      ctx.stroke();
    }
    
    // Draw the active connection with animated trace
    const conn = topConnections[currentConnectionIndex % topConnections.length];
    
    const lineWidth = Math.max(0.5, Math.min(2, Math.abs(conn.weight) * 1.5));
    const alpha = Math.min(0.8, conn.activation * 0.9);
    
    // Animated tracing effect
    const traceLength = 0.4;
    const traceStart = connectionProgress;
    const traceEnd = Math.min(1, connectionProgress + traceLength);
    
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    
    if (traceEnd > traceStart) {
      const startX = conn.fromX + (conn.toX - conn.fromX) * traceStart;
      const startY = conn.fromY + (conn.toY - conn.fromY) * traceStart;
      const endX = conn.fromX + (conn.toX - conn.fromX) * traceEnd;
      const endY = conn.fromY + (conn.toY - conn.fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Calculate source grid neuron index from connection position (cols is already a parameter)
    const sourceGridIdx = this.getGridIndexFromPosition(conn.fromX, conn.fromY, gridOffsetX, gridOffsetY, spacing, cols);
    
    // Trigger flash on SOURCE grid neuron when synapse STARTS (leaves the neuron)
    const sourceFlashKey = `out-src-${currentConnectionIndex}`;
    if (traceStart < 0.15 && this.lastOutputSourceFlashKey !== sourceFlashKey && sourceGridIdx >= 0) {
      this.gridFlashes.set(sourceGridIdx, this.synapseAnimationTime);
      this.lastOutputSourceFlashKey = sourceFlashKey;
    } else if (traceStart >= 0.3 && this.lastOutputSourceFlashKey === sourceFlashKey) {
      this.lastOutputSourceFlashKey = null;
    }
    
    // Trigger flash when synapse reaches the output neuron (only once per synapse)
    const outputNeuronIdx = conn.outputIdx;
    const flashKey = `${currentConnectionIndex}-${outputNeuronIdx}`;
    if (traceEnd >= 0.95 && this.lastOutputFlashIdx !== flashKey) {
      this.outputFlashes.set(outputNeuronIdx, this.synapseAnimationTime);
      this.lastOutputFlashIdx = flashKey;
    } else if (traceEnd < 0.5 && this.lastOutputFlashIdx === flashKey) {
      // Reset when synapse moves away from completion zone
      this.lastOutputFlashIdx = null;
    }
  }
  
  /**
   * Get grid neuron index from screen position
   */
  getGridIndexFromPosition(x, y, gridOffsetX, gridOffsetY, spacing, cols) {
    const col = Math.round((x - gridOffsetX) / spacing);
    const row = Math.round((y - gridOffsetY) / spacing);
    if (col < 0 || row < 0 || col >= cols || row >= CONFIG.grid.rows) return -1;
    return row * cols + col;
  }
  
  /**
   * Draw connections FROM a grid TO a single point with animated tracing
   * Shows only ONE synapse at a time, cycling through them
   */
  drawLayerConnectionsFromGrid(ctx, gridOffsetX, gridOffsetY, rows, cols, spacing, toX, toY, weights, activations, maxActivation, animPhase, maxConnections, color) {
    // Collect strongest connections
    const connections = [];
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      const activation = activations[i] / maxActivation;
      const strength = Math.abs(weight) * activation;
      connections.push({ index: i, strength, weight, activation });
    }
    
    // Sort by strength and take top N
    connections.sort((a, b) => b.strength - a.strength);
    const topConnections = connections.slice(0, maxConnections);
    
    if (topConnections.length === 0) return;
    
    // Cycle through connections: show one at a time
    const connectionDuration = 0.5; // Time per connection in seconds
    const totalCycleTime = topConnections.length * connectionDuration;
    const cyclePhase = (this.synapseAnimationTime % totalCycleTime) / connectionDuration;
    const currentConnectionIndex = Math.floor(cyclePhase);
    const connectionProgress = cyclePhase % 1;
    
    // Initialize synapse trail tracking if needed
    if (!this.synapseTrails) {
      this.synapseTrails = new Map();
    }
    
    // Draw only the current connection
    const conn = topConnections[currentConnectionIndex % topConnections.length];
    
    const idx = conn.index;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    
    const fromX = gridOffsetX + col * spacing;
    const fromY = gridOffsetY + row * spacing;
    
    // Create a unique key for this synapse trail
    const trailKey = `${fromX},${fromY},${toX},${toY}`;
    
    // Draw fading trails for all synapses (fade out over time)
    const fadeDuration = 1.5; // Seconds to fade out
    const trailsToRemove = [];
    
    for (const [key, trail] of this.synapseTrails.entries()) {
      const age = this.synapseAnimationTime - trail.startTime;
      const fadeAlpha = Math.max(0, 1 - (age / fadeDuration));
      
      if (fadeAlpha <= 0) {
        trailsToRemove.push(key);
        continue;
      }
      
      // Draw faded trail - MUST reach toX, toY
      ctx.strokeStyle = color;
      ctx.globalAlpha = fadeAlpha * 0.4; // Fade to 40% max
      ctx.lineWidth = Math.max(0.5, Math.min(1.5, Math.abs(trail.weight) * fadeAlpha));
      ctx.beginPath();
      ctx.moveTo(trail.fromX, trail.fromY);
      ctx.lineTo(trail.toX, trail.toY); // Always draw full line to destination
      ctx.stroke();
    }
    
    // Remove faded trails
    for (const key of trailsToRemove) {
      this.synapseTrails.delete(key);
    }
    
    // Draw the active connection with animation - MUST reach toX, toY
    const lineWidth = Math.max(0.5, Math.min(2, Math.abs(conn.weight) * 1.5));
    const alpha = Math.min(0.8, conn.activation * 0.9);
    
    // Animated tracing effect - trace from fromX,fromY to toX,toY
    const traceLength = 0.4;
    const traceStart = connectionProgress;
    const traceEnd = Math.min(1, connectionProgress + traceLength);
    
    // Draw animated trace segment - ensure it reaches toX, toY
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    
    if (traceEnd > traceStart) {
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else {
      // Handle wrap-around case
      const startX = fromX + (toX - fromX) * traceStart;
      const startY = fromY + (toY - fromY) * traceStart;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(toX, toY); // Always reach the destination
      ctx.moveTo(fromX, fromY);
      const endX = fromX + (toX - fromX) * traceEnd;
      const endY = fromY + (toY - fromY) * traceEnd;
      ctx.lineTo(endX, endY);
    }
    
    ctx.stroke();
    
    // Track when this synapse completes (reaches destination) - add to trails
    if (connectionProgress >= 0.95 && !this.synapseTrails.has(trailKey)) {
      this.synapseTrails.set(trailKey, { 
        startTime: this.synapseAnimationTime,
        fromX, fromY, toX, toY,
        weight: conn.weight,
        activation: conn.activation
      });
    }
    
    ctx.globalAlpha = 1;
  }
  
  drawInputOutput(ctx) {
    if (!this.currentTestCase) return;
    if (!this.fsm.is('training')) return; // Only show during training
    if (this.trainingOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;
    
    const { text, neuronActive, neuronBright } = CONFIG.colors;
    // Use a, b directly (new format) or fall back to original array
    const aOrig = this.currentTestCase.a ?? this.currentTestCase.original?.[0] ?? 0;
    const bOrig = this.currentTestCase.b ?? this.currentTestCase.original?.[1] ?? 0;
    const target = this.currentTestCase.target;
    const prediction = this.network.predict(aOrig, bOrig);
    const correct = prediction === target;
    
    const gridCenterX = this.width / 2;
    const gridCenterY = this.height / 2;
    const gridWidth = CONFIG.grid.cols * this.gridSpacing;
    const gridHeight = CONFIG.grid.rows * this.gridSpacing;
    
    // All positions and sizes scaled
    const leftX = gridCenterX - gridWidth / 2 - 100 * this.scale;
    const rightX = gridCenterX + gridWidth / 2 + 100 * this.scale;
    const dotSize = 4 * this.scale;
    const dotSpacing = 18 * this.scale;
    const dotsPerRow = 10;
    
    // Draw input 'a' as dots on left side (top)
    const aStartY = gridCenterY - 40 * this.scale;
    this.drawNumberAsDots(ctx, aOrig, leftX, aStartY, dotSize, dotSpacing, dotsPerRow, neuronActive);
    
    // Draw '+' symbol (scaled font)
    ctx.fillStyle = text;
    ctx.font = `bold ${Math.round(32 * this.scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', leftX, gridCenterY);
    
    // Draw input 'b' as dots on left side (bottom)
    const bStartY = gridCenterY + 40 * this.scale;
    this.drawNumberAsDots(ctx, bOrig, leftX, bStartY, dotSize, dotSpacing, dotsPerRow, neuronActive);
    
    // Draw output 'target' as dots on right side
    this.drawNumberAsDots(ctx, target, rightX, gridCenterY, dotSize, dotSpacing, dotsPerRow, neuronBright);
    
    // Result text - left-aligned below the graph area
    const statsX = 40 * this.scale;
    const graphBottomY = 40 * this.scale + 22 * this.scale * 6 + 40 * this.scale; // Below graph
    const resultY = graphBottomY + 30 * this.scale;
    
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.round(14 * this.scale)}px monospace`;
    ctx.fillStyle = text;
    
    // Input sum
    const sum = aOrig + bOrig;
    ctx.fillText(`${aOrig} + ${bOrig} = ${sum}`, statsX, resultY);
    
    // Mod operation
    ctx.font = `${Math.round(12 * this.scale)}px monospace`;
    ctx.fillText(`mod ${CONFIG.network.nTokens} = ${target}`, statsX, resultY + 18 * this.scale);
    
    // Prediction (with color)
    ctx.font = `bold ${Math.round(12 * this.scale)}px monospace`;
    ctx.fillStyle = correct ? '#0ff' : '#f00';
    ctx.fillText(`Predicted: ${prediction} ${correct ? '✓' : '✗'}`, statsX, resultY + 36 * this.scale);
    
    ctx.restore();
  }
  
  /**
   * Draw a number as dots representing binary representation
   * Each bit position gets a dot (1 = bright dot, 0 = dim/empty)
   */
  drawNumberAsDots(ctx, number, centerX, centerY, dotSize, spacing, dotsPerRow, color) {
    // Calculate bits needed based on mod (outputSize)
    // mod 8 needs 3 bits (0-7), mod 16 needs 4 bits (0-15), mod 97 needs 7 bits (0-96)
    const mod = CONFIG.network.nTokens;
    const bits = Math.max(1, Math.ceil(Math.log2(mod))); // Exact bits needed for values 0 to mod-1
    
    const binary = [];
    let temp = number;
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (temp >> i) & 1;
      binary.push(bit);
    }
    
    // Calculate layout (arrange in rows)
    const totalRows = Math.ceil(bits / dotsPerRow);
    const startY = centerY - ((totalRows - 1) * spacing) / 2;
    
    ctx.globalAlpha = 1;
    
    for (let i = 0; i < bits; i++) {
      const bit = binary[i];
      const row = Math.floor(i / dotsPerRow);
      const col = i % dotsPerRow;
      
      // Center the dots horizontally
      const dotsInRow = Math.min(dotsPerRow, bits - row * dotsPerRow);
      const rowWidth = (dotsInRow - 1) * spacing;
      const x = centerX - rowWidth / 2 + col * spacing;
      const y = startY + row * spacing;
      
      // Use Neuron class for binary dots
      const neuron = new Neuron(x, y, dotSize);
      neuron.isActive = (bit === 1);
      neuron.activation = bit === 1 ? 1.0 : 0.0;
      neuron.render(ctx, CONFIG.colors);
    }
  }
  
  drawStats(ctx) {
    // Only show stats during training
    if (!this.fsm.is('training')) return;
    if (this.trainingOpacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.trainingOpacity;
    
    const x = 40 * this.scale;
    const y = 40 * this.scale;
    const lineHeight = 22 * this.scale;
    
    // Gray text for stats (less prominent)
    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(14 * this.scale)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.fillText(`Epoch: ${this.epoch}`, x, y);
    ctx.fillText(`Train: ${(this.trainAccuracy * 100).toFixed(1)}%`, x, y + lineHeight);
    ctx.fillText(`Test: ${(this.testAccuracy * 100).toFixed(1)}%`, x, y + lineHeight * 2);
    
    // Show grok mode status
    if (this.grokMode > 0.5) {
      ctx.fillStyle = '#f0f'; // Magenta for rainbow mode
      ctx.fillText(`✨ GROKKED!`, x, y + lineHeight * 3);
    } else if (this.grokkingDetected) {
      ctx.fillStyle = '#0ff';
      ctx.fillText(`✓ GROKKING!`, x, y + lineHeight * 3);
    }
    
    // Draw compact accuracy graph (scaled) - more space below text
    if (this.accuracyHistory.length > 2) {
      const graphW = 150 * this.scale;
      const graphH = 40 * this.scale;
      const graphX = x;
      const graphY = y + lineHeight * 6; // More space between text and graph
      
      // Sample history for performance (every Nth point)
      const sampleRate = Math.max(1, Math.floor(this.accuracyHistory.length / 100));
      
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < this.accuracyHistory.length; i += sampleRate) {
        const point = this.accuracyHistory[i];
        const px = graphX + (i / this.accuracyHistory.length) * graphW;
        const py = graphY - point.train * graphH;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      first = true;
      for (let i = 0; i < this.accuracyHistory.length; i += sampleRate) {
        const point = this.accuracyHistory[i];
        const px = graphX + (i / this.accuracyHistory.length) * graphW;
        const py = graphY - point.test * graphH;
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

/**
 * Mount Day 19 into the provided canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ stop: () => void, game: Day19Demo }}
 */
export default function day19(canvas) {
  const game = new Day19Demo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
