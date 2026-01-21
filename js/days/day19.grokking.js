/**
 * Factored MLP for Grokking - Based on Google's implementation
 * https://pair.withgoogle.com/explorables/grokking/
 * 
 * Architecture:
 *   Input (a, b) → Embed(tied) → Hidden(tied, no bias) → ReLU(h_a + h_b) → Out → Unembed(tied transpose)
 * 
 * Key features:
 *   - Tied embeddings (same matrix for input a, b, and output)
 *   - Tied hidden projection (same weights for both inputs)
 *   - No biases in linear layers
 *   - Hidden = ReLU(hidden_a + hidden_b) - element-wise addition BEFORE ReLU
 */

import { shuffle } from './day19.utils.js';

/**
 * Factored Network for modular addition grokking
 */
class FactoredNetwork {
  /**
   * @param {Object} config Network configuration
   * @param {number} config.nTokens - Modulus value (number of possible outputs)
   * @param {number} config.embedSize - Embedding dimension
   * @param {number} config.hiddenSize - Hidden layer size (can be different from display)
   * @param {number} config.learningRate - Learning rate for AdamW
   * @param {number} config.weightDecay - Weight decay (L2 regularization) - KEY for grokking!
   * @param {number} config.beta1 - AdamW beta1 (default 0.9)
   * @param {number} config.beta2 - AdamW beta2 (default 0.98)
   */
  constructor(config) {
    this.nTokens = config.nTokens || 16;
    this.embedSize = config.embedSize || 128;
    this.hiddenSize = config.hiddenSize || 24;
    this.learningRate = config.learningRate || 0.001;
    this.weightDecay = config.weightDecay || 1.0; // High weight decay is key!
    this.beta1 = config.beta1 || 0.9;
    this.beta2 = config.beta2 || 0.98;
    this.epsilon = 1e-8;
    
    // Initialize weights with variance scaling (like Haiku's VarianceScaling(2))
    const embedScale = Math.sqrt(2.0 / this.nTokens);
    const hiddenScale = Math.sqrt(2.0 / this.embedSize);
    const outScale = Math.sqrt(2.0 / this.hiddenSize);
    
    // Embedding matrix: (nTokens, embedSize) - TIED for input and output
    this.embed = this.initMatrix(this.nTokens, this.embedSize, embedScale);
    
    // Hidden projection: (embedSize, hiddenSize) - TIED for both inputs, NO BIAS
    this.Whidden = this.initMatrix(this.embedSize, this.hiddenSize, hiddenScale);
    
    // Output projection: (hiddenSize, embedSize) - NO BIAS
    this.Wout = this.initMatrix(this.hiddenSize, this.embedSize, outScale);
    
    // Store actual hidden activations
    this._actualHiddenActivations = new Float32Array(this.hiddenSize);
    // Store 256-element grid-mapped activations for 16x16 visualization
    this.hiddenActivations = new Float32Array(256);
    this.outputActivations = new Float32Array(this.nTokens);
    
    // For synapse visualization compatibility
    this.weights1 = null; // Will be computed as embed @ Whidden
    this.weights2 = null; // Will be computed as Wout @ embed.T
    
    // Initialize AdamW optimizer state
    this.initAdamState();
    this.adamT = 0;
  }
  
  /**
   * Initialize a matrix with variance scaling
   * @param {number} rows 
   * @param {number} cols 
   * @param {number} scale 
   * @returns {Float32Array[]}
   */
  initMatrix(rows, cols, scale) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = new Float32Array(cols);
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() * 2 - 1) * scale;
      }
    }
    return matrix;
  }
  
  /**
   * Initialize AdamW optimizer state (first and second moments)
   */
  initAdamState() {
    // Moments for embed
    this.m_embed = this.embed.map(row => new Float32Array(row.length));
    this.v_embed = this.embed.map(row => new Float32Array(row.length));
    
    // Moments for Whidden
    this.m_Whidden = this.Whidden.map(row => new Float32Array(row.length));
    this.v_Whidden = this.Whidden.map(row => new Float32Array(row.length));
    
    // Moments for Wout
    this.m_Wout = this.Wout.map(row => new Float32Array(row.length));
    this.v_Wout = this.Wout.map(row => new Float32Array(row.length));
    
    // Gradient accumulators
    this.grad_embed = this.embed.map(row => new Float32Array(row.length));
    this.grad_Whidden = this.Whidden.map(row => new Float32Array(row.length));
    this.grad_Wout = this.Wout.map(row => new Float32Array(row.length));
    
    this.gradCount = 0;
  }
  
  /**
   * Reset gradient accumulators
   */
  resetGradients() {
    for (let i = 0; i < this.nTokens; i++) {
      this.grad_embed[i].fill(0);
    }
    for (let i = 0; i < this.embedSize; i++) {
      this.grad_Whidden[i].fill(0);
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      this.grad_Wout[i].fill(0);
    }
    this.gradCount = 0;
  }
  
  /**
   * Forward pass
   * @param {number} a - First input token (0 to nTokens-1)
   * @param {number} b - Second input token (0 to nTokens-1)
   * @returns {Object} { probs, hidden, cache }
   */
  forward(a, b) {
    // 1. Embedding lookup (one-hot @ embed = just selecting rows)
    const embedded_a = this.embed[a]; // (embedSize,)
    const embedded_b = this.embed[b]; // (embedSize,)
    
    // 2. Hidden projection: embedded @ Whidden
    const hidden_a = new Float32Array(this.hiddenSize);
    const hidden_b = new Float32Array(this.hiddenSize);
    
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum_a = 0, sum_b = 0;
      for (let i = 0; i < this.embedSize; i++) {
        sum_a += embedded_a[i] * this.Whidden[i][j];
        sum_b += embedded_b[i] * this.Whidden[i][j];
      }
      hidden_a[j] = sum_a;
      hidden_b[j] = sum_b;
    }
    
    // 3. Combine and ReLU: ReLU(hidden_a + hidden_b)
    const hidden = new Float32Array(this.hiddenSize);
    const hidden_preact = new Float32Array(this.hiddenSize); // Pre-activation for backward
    for (let j = 0; j < this.hiddenSize; j++) {
      hidden_preact[j] = hidden_a[j] + hidden_b[j];
      hidden[j] = Math.max(0, hidden_preact[j]); // ReLU
    }
    
    // Store actual hidden activations
    this._actualHiddenActivations = hidden;
    // Map to 256 elements for 16x16 grid visualization
    this._updateGridActivations();
    
    // 4. Output projection: hidden @ Wout (row-first for cache locality)
    const out = new Float32Array(this.embedSize);
    for (let i = 0; i < this.hiddenSize; i++) {
      const h = hidden[i];
      const woutRow = this.Wout[i];
      for (let j = 0; j < this.embedSize; j++) {
        out[j] += h * woutRow[j];
      }
    }
    
    // 5. Unembedding: out @ embed.T (tied weights!)
    const logits = new Float32Array(this.nTokens);
    for (let j = 0; j < this.nTokens; j++) {
      let sum = 0;
      for (let i = 0; i < this.embedSize; i++) {
        sum += out[i] * this.embed[j][i]; // embed[j] is the j-th row, treating as column
      }
      logits[j] = sum;
    }
    
    // 6. Softmax
    const probs = this.softmax(logits);
    this.outputActivations = probs;
    
    // Cache for backward pass
    const cache = {
      a, b,
      embedded_a, embedded_b,
      hidden_a, hidden_b,
      hidden_preact,
      hidden,
      out,
      logits,
      probs
    };
    
    return { probs, hidden, cache };
  }
  
  /**
   * Stable softmax
   * @param {Float32Array} logits 
   * @returns {Float32Array}
   */
  softmax(logits) {
    let maxVal = logits[0];
    for (let i = 1; i < logits.length; i++) {
      if (logits[i] > maxVal) maxVal = logits[i];
    }
    
    const exp = new Float32Array(logits.length);
    let sum = 0;
    for (let i = 0; i < logits.length; i++) {
      exp[i] = Math.exp(logits[i] - maxVal);
      sum += exp[i];
    }
    
    const probs = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      probs[i] = exp[i] / sum;
    }
    return probs;
  }
  
  /**
   * Backward pass - accumulate gradients
   * @param {number} target - Target class (0 to nTokens-1)
   * @param {Object} cache - Cache from forward pass
   */
  backward(target, cache) {
    const { a, b, embedded_a, embedded_b, hidden_preact, hidden, out, probs } = cache;
    
    // 1. Output gradient: dL/dlogits = probs - one_hot(target)
    const dLogits = new Float32Array(this.nTokens);
    for (let i = 0; i < this.nTokens; i++) {
      dLogits[i] = probs[i] - (i === target ? 1 : 0);
    }
    
    // 2. Gradient through unembed: dL/dout = dLogits @ embed
    //    Also accumulate dL/dembed from unembed: out.T @ dLogits
    //    Split into row-first loops for cache locality
    
    // First: accumulate grad_embed (row-first access)
    for (let j = 0; j < this.nTokens; j++) {
      const dL = dLogits[j];
      const gradRow = this.grad_embed[j];
      for (let i = 0; i < this.embedSize; i++) {
        gradRow[i] += dL * out[i];
      }
    }
    
    // Second: compute dOut (row-first access to embed)
    const dOut = new Float32Array(this.embedSize);
    for (let j = 0; j < this.nTokens; j++) {
      const dL = dLogits[j];
      const embedRow = this.embed[j];
      for (let i = 0; i < this.embedSize; i++) {
        dOut[i] += dL * embedRow[i];
      }
    }
    
    // 3. Gradient through Wout: dL/dWout = hidden.T @ dOut
    //    dL/dhidden = dOut @ Wout.T
    const dHidden = new Float32Array(this.hiddenSize);
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = 0;
      for (let j = 0; j < this.embedSize; j++) {
        this.grad_Wout[i][j] += hidden[i] * dOut[j];
        sum += dOut[j] * this.Wout[i][j];
      }
      dHidden[i] = sum;
    }
    
    // 4. Gradient through ReLU
    const dHiddenPreact = new Float32Array(this.hiddenSize);
    for (let j = 0; j < this.hiddenSize; j++) {
      dHiddenPreact[j] = hidden_preact[j] > 0 ? dHidden[j] : 0;
    }
    
    // 5. Gradient through hidden projection (tied for both a and b)
    //    dL/dWhidden = embedded_a.T @ dHiddenPreact + embedded_b.T @ dHiddenPreact
    //    dL/dembedded_a = dHiddenPreact @ Whidden.T
    //    dL/dembedded_b = dHiddenPreact @ Whidden.T
    const dEmbedded_a = new Float32Array(this.embedSize);
    const dEmbedded_b = new Float32Array(this.embedSize);
    
    for (let i = 0; i < this.embedSize; i++) {
      let sum = 0;
      for (let j = 0; j < this.hiddenSize; j++) {
        // Accumulate Whidden gradient (from both a and b paths)
        this.grad_Whidden[i][j] += embedded_a[i] * dHiddenPreact[j];
        this.grad_Whidden[i][j] += embedded_b[i] * dHiddenPreact[j];
        sum += dHiddenPreact[j] * this.Whidden[i][j];
      }
      dEmbedded_a[i] = sum;
      dEmbedded_b[i] = sum;
    }
    
    // 6. Gradient through embedding lookup (accumulate at token indices)
    for (let i = 0; i < this.embedSize; i++) {
      this.grad_embed[a][i] += dEmbedded_a[i];
      this.grad_embed[b][i] += dEmbedded_b[i];
    }
    
    this.gradCount++;
  }
  
  /**
   * Apply AdamW optimizer
   * @param {number} batchSize - Batch size for gradient averaging
   */
  applyAdamW(batchSize) {
    if (this.gradCount === 0) return;
    
    this.adamT++;
    const lr = this.learningRate;
    const wd = this.weightDecay;
    const scale = 1.0 / batchSize;
    
    // Bias correction
    const bc1 = 1 - Math.pow(this.beta1, this.adamT);
    const bc2 = 1 - Math.pow(this.beta2, this.adamT);
    
    // Update embed
    for (let i = 0; i < this.nTokens; i++) {
      for (let j = 0; j < this.embedSize; j++) {
        const g = this.grad_embed[i][j] * scale;
        this.m_embed[i][j] = this.beta1 * this.m_embed[i][j] + (1 - this.beta1) * g;
        this.v_embed[i][j] = this.beta2 * this.v_embed[i][j] + (1 - this.beta2) * g * g;
        const m_hat = this.m_embed[i][j] / bc1;
        const v_hat = this.v_embed[i][j] / bc2;
        // AdamW: decoupled weight decay
        this.embed[i][j] -= lr * (m_hat / (Math.sqrt(v_hat) + this.epsilon) + wd * this.embed[i][j]);
        this.grad_embed[i][j] = 0;
      }
    }
    
    // Update Whidden
    for (let i = 0; i < this.embedSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const g = this.grad_Whidden[i][j] * scale;
        this.m_Whidden[i][j] = this.beta1 * this.m_Whidden[i][j] + (1 - this.beta1) * g;
        this.v_Whidden[i][j] = this.beta2 * this.v_Whidden[i][j] + (1 - this.beta2) * g * g;
        const m_hat = this.m_Whidden[i][j] / bc1;
        const v_hat = this.v_Whidden[i][j] / bc2;
        this.Whidden[i][j] -= lr * (m_hat / (Math.sqrt(v_hat) + this.epsilon) + wd * this.Whidden[i][j]);
        this.grad_Whidden[i][j] = 0;
      }
    }
    
    // Update Wout
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.embedSize; j++) {
        const g = this.grad_Wout[i][j] * scale;
        this.m_Wout[i][j] = this.beta1 * this.m_Wout[i][j] + (1 - this.beta1) * g;
        this.v_Wout[i][j] = this.beta2 * this.v_Wout[i][j] + (1 - this.beta2) * g * g;
        const m_hat = this.m_Wout[i][j] / bc1;
        const v_hat = this.v_Wout[i][j] / bc2;
        this.Wout[i][j] -= lr * (m_hat / (Math.sqrt(v_hat) + this.epsilon) + wd * this.Wout[i][j]);
        this.grad_Wout[i][j] = 0;
      }
    }
    
    this.gradCount = 0;
  }
  
  /**
   * Predict the output class
   * @param {number} a - First input token
   * @param {number} b - Second input token
   * @returns {number} Predicted class
   */
  predict(a, b) {
    const { probs } = this.forward(a, b);
    let maxIdx = 0;
    let maxVal = probs[0];
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > maxVal) {
        maxVal = probs[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }
  
  /**
   * Update the 256-element grid activations from actual hidden activations
   * Maps the actual hidden size to 256 for 16x16 grid visualization
   * @private
   */
  _updateGridActivations() {
    const gridSize = 256;
    const actual = this._actualHiddenActivations;
    
    if (this.hiddenSize === gridSize) {
      // Perfect match - copy directly
      for (let i = 0; i < gridSize; i++) {
        this.hiddenActivations[i] = actual[i];
      }
    } else if (this.hiddenSize < gridSize) {
      // Tile/repeat to fill grid
      for (let i = 0; i < gridSize; i++) {
        this.hiddenActivations[i] = actual[i % this.hiddenSize];
      }
    } else {
      // Downsample (take every nth)
      const step = this.hiddenSize / gridSize;
      for (let i = 0; i < gridSize; i++) {
        this.hiddenActivations[i] = actual[Math.floor(i * step)];
      }
    }
  }
  
  /**
   * Get hidden activations mapped to 256 values for 16x16 grid display
   * @returns {Float32Array} 256 activation values
   */
  getGridActivations() {
    return new Float32Array(this.hiddenActivations);
  }
}

/**
 * Generate all pairs dataset for modular addition
 * @param {number} mod - Modulus value
 * @param {boolean} symmetric - If true, only use pairs where a <= b
 * @returns {Array} Dataset
 */
function generateAllPairs(mod, symmetric = true) {
  const data = [];
  for (let a = 0; a < mod; a++) {
    for (let b = 0; b < mod; b++) {
      if (symmetric && a > b) continue; // Skip if using symmetric pairs
      const c = (a + b) % mod;
      data.push({
        a,
        b,
        target: c,
        original: [a, b]
      });
    }
  }
  return data;
}

/**
 * Split dataset into train/test
 * @param {Array} dataset 
 * @param {number} trainFraction - Fraction for training (0-1)
 * @returns {Object} { train, test }
 */
function splitData(dataset, trainFraction = 0.4) {
  const shuffled = shuffle([...dataset]);
  const splitIdx = Math.floor(shuffled.length * trainFraction);
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx)
  };
}

/**
 * Calculate accuracy
 * @param {FactoredNetwork} network 
 * @param {Array} dataset 
 * @returns {number} Accuracy 0-1
 */
function calcAccuracy(network, dataset) {
  let correct = 0;
  for (const ex of dataset) {
    const pred = network.predict(ex.a, ex.b);
    if (pred === ex.target) correct++;
  }
  return correct / dataset.length;
}

export { FactoredNetwork, generateAllPairs, splitData, calcAccuracy };
