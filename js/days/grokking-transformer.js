/**
 * Grokking transformer utilities for modular arithmetic.
 * Shared between main thread and worker.
 */

/**
 * Create a 2D matrix of Float32Array rows.
 * @param {number} rows
 * @param {number} cols
 * @param {number} [fillValue=0]
 * @returns {Float32Array[]}
 */
function createMatrix(rows, cols, fillValue = 0) {
  const matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    const row = new Float32Array(cols);
    if (fillValue !== 0) {
      row.fill(fillValue);
    }
    matrix[i] = row;
  }
  return matrix;
}

/**
 * Create a Float32Array vector.
 * @param {number} length
 * @param {number} [fillValue=0]
 * @returns {Float32Array}
 */
function createVector(length, fillValue = 0) {
  const vec = new Float32Array(length);
  if (fillValue !== 0) {
    vec.fill(fillValue);
  }
  return vec;
}

/**
 * Initialize matrix with Xavier/Glorot-style scaling.
 * @param {number} rows
 * @param {number} cols
 * @returns {Float32Array[]}
 */
function randomMatrix(rows, cols) {
  const scale = Math.sqrt(2 / (rows + cols));
  const matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    const row = new Float32Array(cols);
    for (let j = 0; j < cols; j++) {
      row[j] = (Math.random() * 2 - 1) * scale;
    }
    matrix[i] = row;
  }
  return matrix;
}

/**
 * Approximate GELU activation.
 * @param {number} x
 * @returns {number}
 */
function gelu(x) {
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x * x * x)));
}

/**
 * Derivative of approximate GELU activation.
 * @param {number} x
 * @returns {number}
 */
function geluDerivative(x) {
  const c = Math.sqrt(2 / Math.PI);
  const x3 = x * x * x;
  const tanhArg = c * (x + 0.044715 * x3);
  const tanhVal = Math.tanh(tanhArg);
  const sech2 = 1 - tanhVal * tanhVal;
  const inner = c * (1 + 0.134145 * x * x);
  return 0.5 * (1 + tanhVal) + 0.5 * x * sech2 * inner;
}

/**
 * Apply softmax to a row with a causal mask.
 * @param {Float32Array} row
 * @param {number} maxIndex
 * @returns {Float32Array}
 */
function softmaxMasked(row, maxIndex) {
  let maxVal = -Infinity;
  for (let i = 0; i <= maxIndex; i++) {
    if (row[i] > maxVal) maxVal = row[i];
  }
  const out = new Float32Array(row.length);
  let sum = 0;
  for (let i = 0; i <= maxIndex; i++) {
    const v = Math.exp(row[i] - maxVal);
    out[i] = v;
    sum += v;
  }
  const inv = sum > 0 ? 1 / sum : 0;
  for (let i = 0; i <= maxIndex; i++) {
    out[i] *= inv;
  }
  return out;
}

/**
 * Transformer block with causal self-attention and FFN.
 */
class TransformerBlock {
  /**
   * @param {number} dimModel
   * @param {number} numHeads
   * @param {number} ffnDim
   */
  constructor(dimModel, numHeads, ffnDim) {
    this.dimModel = dimModel;
    this.numHeads = numHeads;
    this.headDim = Math.floor(dimModel / numHeads);
    this.ffnDim = ffnDim;
    
    this.Wq = randomMatrix(dimModel, dimModel);
    this.Wk = randomMatrix(dimModel, dimModel);
    this.Wv = randomMatrix(dimModel, dimModel);
    this.Wo = randomMatrix(dimModel, dimModel);
    
    this.bq = createVector(dimModel);
    this.bk = createVector(dimModel);
    this.bv = createVector(dimModel);
    this.bo = createVector(dimModel);
    
    this.W1 = randomMatrix(dimModel, ffnDim);
    this.b1 = createVector(ffnDim);
    this.W2 = randomMatrix(ffnDim, dimModel);
    this.b2 = createVector(dimModel);
    
    this.resetGradients();
    this.initAdamState();
  }
  
  /**
   * Reset accumulated gradients.
   */
  resetGradients() {
    this.dWq = createMatrix(this.dimModel, this.dimModel);
    this.dWk = createMatrix(this.dimModel, this.dimModel);
    this.dWv = createMatrix(this.dimModel, this.dimModel);
    this.dWo = createMatrix(this.dimModel, this.dimModel);
    this.dbq = createVector(this.dimModel);
    this.dbk = createVector(this.dimModel);
    this.dbv = createVector(this.dimModel);
    this.dbo = createVector(this.dimModel);
    
    this.dW1 = createMatrix(this.dimModel, this.ffnDim);
    this.db1 = createVector(this.ffnDim);
    this.dW2 = createMatrix(this.ffnDim, this.dimModel);
    this.db2 = createVector(this.dimModel);
  }
  
  /**
   * Initialize AdamW state.
   */
  initAdamState() {
    const initM = (rows, cols) => createMatrix(rows, cols);
    const initV = (rows, cols) => createMatrix(rows, cols);
    this.m_Wq = initM(this.dimModel, this.dimModel);
    this.v_Wq = initV(this.dimModel, this.dimModel);
    this.m_Wk = initM(this.dimModel, this.dimModel);
    this.v_Wk = initV(this.dimModel, this.dimModel);
    this.m_Wv = initM(this.dimModel, this.dimModel);
    this.v_Wv = initV(this.dimModel, this.dimModel);
    this.m_Wo = initM(this.dimModel, this.dimModel);
    this.v_Wo = initV(this.dimModel, this.dimModel);
    
    this.m_bq = createVector(this.dimModel);
    this.v_bq = createVector(this.dimModel);
    this.m_bk = createVector(this.dimModel);
    this.v_bk = createVector(this.dimModel);
    this.m_bv = createVector(this.dimModel);
    this.v_bv = createVector(this.dimModel);
    this.m_bo = createVector(this.dimModel);
    this.v_bo = createVector(this.dimModel);
    
    this.m_W1 = initM(this.dimModel, this.ffnDim);
    this.v_W1 = initV(this.dimModel, this.ffnDim);
    this.m_b1 = createVector(this.ffnDim);
    this.v_b1 = createVector(this.ffnDim);
    this.m_W2 = initM(this.ffnDim, this.dimModel);
    this.v_W2 = initV(this.ffnDim, this.dimModel);
    this.m_b2 = createVector(this.dimModel);
    this.v_b2 = createVector(this.dimModel);
  }
  
  /**
   * Forward pass through block.
   * @param {Float32Array[]} x
   * @returns {{ output: Float32Array[], cache: object, attentionWeights: Float32Array[] }}
   */
  forward(x) {
    const seqLen = x.length;
    const dim = this.dimModel;
    const headDim = this.headDim;
    
    const Q = createMatrix(seqLen, dim);
    const K = createMatrix(seqLen, dim);
    const V = createMatrix(seqLen, dim);
    
    for (let i = 0; i < seqLen; i++) {
      const xi = x[i];
      for (let d = 0; d < dim; d++) {
        let q = this.bq[d];
        let k = this.bk[d];
        let v = this.bv[d];
        for (let j = 0; j < dim; j++) {
          const val = xi[j];
          q += val * this.Wq[j][d];
          k += val * this.Wk[j][d];
          v += val * this.Wv[j][d];
        }
        Q[i][d] = q;
        K[i][d] = k;
        V[i][d] = v;
      }
    }
    
    const attentionWeights = new Array(seqLen);
    const context = createMatrix(seqLen, dim);
    const scale = 1 / Math.sqrt(headDim);
    
    for (let h = 0; h < this.numHeads; h++) {
      for (let i = 0; i < seqLen; i++) {
        const scores = new Float32Array(seqLen);
        for (let j = 0; j <= i; j++) {
          let dot = 0;
          const qiOffset = h * headDim;
          const kjOffset = h * headDim;
          for (let k = 0; k < headDim; k++) {
            dot += Q[i][qiOffset + k] * K[j][kjOffset + k];
          }
          scores[j] = dot * scale;
        }
        const weights = softmaxMasked(scores, i);
        if (!attentionWeights[i]) {
          attentionWeights[i] = new Float32Array(seqLen);
        }
        for (let j = 0; j < seqLen; j++) {
          attentionWeights[i][j] += weights[j] / this.numHeads;
        }
        for (let k = 0; k < headDim; k++) {
          let sum = 0;
          for (let j = 0; j <= i; j++) {
            sum += weights[j] * V[j][h * headDim + k];
          }
          context[i][h * headDim + k] = sum;
        }
      }
    }
    
    const attnOut = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        let sum = this.bo[d];
        for (let j = 0; j < dim; j++) {
          sum += context[i][j] * this.Wo[j][d];
        }
        attnOut[i][d] = sum;
      }
    }
    
    const x1 = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        x1[i][d] = x[i][d] + attnOut[i][d];
      }
    }
    
    const ffnPre = createMatrix(seqLen, this.ffnDim);
    const ffnHidden = createMatrix(seqLen, this.ffnDim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < this.ffnDim; d++) {
        let sum = this.b1[d];
        for (let j = 0; j < dim; j++) {
          sum += x1[i][j] * this.W1[j][d];
        }
        ffnPre[i][d] = sum;
        ffnHidden[i][d] = gelu(sum);
      }
    }
    
    const ffnOut = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        let sum = this.b2[d];
        for (let j = 0; j < this.ffnDim; j++) {
          sum += ffnHidden[i][j] * this.W2[j][d];
        }
        ffnOut[i][d] = sum;
      }
    }
    
    const out = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        out[i][d] = x1[i][d] + ffnOut[i][d];
      }
    }
    
    return {
      output: out,
      attentionWeights,
      cache: { x, Q, K, V, context, attnOut, x1, ffnPre, ffnHidden, ffnOut }
    };
  }
  
  /**
   * Backward pass through block.
   * @param {Float32Array[]} dOut
   * @param {object} cache
   * @returns {Float32Array[]}
   */
  backward(dOut, cache) {
    const seqLen = dOut.length;
    const dim = this.dimModel;
    const headDim = this.headDim;
    const { x, Q, K, V, context, x1, ffnPre, ffnHidden } = cache;
    
    const dX1 = createMatrix(seqLen, dim);
    const dFfnOut = createMatrix(seqLen, dim);
    
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        dX1[i][d] = dOut[i][d];
        dFfnOut[i][d] = dOut[i][d];
      }
    }
    
    const dFfnHidden = createMatrix(seqLen, this.ffnDim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        for (let j = 0; j < this.ffnDim; j++) {
          dFfnHidden[i][j] += dFfnOut[i][d] * this.W2[j][d];
          this.dW2[j][d] += ffnHidden[i][j] * dFfnOut[i][d];
        }
        this.db2[d] += dFfnOut[i][d];
      }
    }
    
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < this.ffnDim; j++) {
        const dPre = dFfnHidden[i][j] * geluDerivative(ffnPre[i][j]);
        this.db1[j] += dPre;
        for (let d = 0; d < dim; d++) {
          this.dW1[d][j] += x1[i][d] * dPre;
          dX1[i][d] += dPre * this.W1[d][j];
        }
      }
    }
    
    const dContext = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        for (let j = 0; j < dim; j++) {
          dContext[i][j] += dX1[i][d] * this.Wo[j][d];
          this.dWo[j][d] += context[i][j] * dX1[i][d];
        }
        this.dbo[d] += dX1[i][d];
      }
    }
    
    const dQ = createMatrix(seqLen, dim);
    const dK = createMatrix(seqLen, dim);
    const dV = createMatrix(seqLen, dim);
    const scale = 1 / Math.sqrt(headDim);
    
    for (let h = 0; h < this.numHeads; h++) {
      for (let i = 0; i < seqLen; i++) {
        const scores = new Float32Array(seqLen);
        for (let j = 0; j <= i; j++) {
          let dot = 0;
          for (let k = 0; k < headDim; k++) {
            dot += Q[i][h * headDim + k] * K[j][h * headDim + k];
          }
          scores[j] = dot * scale;
        }
        const weights = softmaxMasked(scores, i);
        const dWeights = new Float32Array(seqLen);
        
        for (let j = 0; j <= i; j++) {
          let dot = 0;
          for (let k = 0; k < headDim; k++) {
            dot += dContext[i][h * headDim + k] * V[j][h * headDim + k];
          }
          dWeights[j] = dot;
          for (let k = 0; k < headDim; k++) {
            dV[j][h * headDim + k] += weights[j] * dContext[i][h * headDim + k];
          }
        }
        
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          sum += dWeights[j] * weights[j];
        }
        
        for (let j = 0; j <= i; j++) {
          const dScore = weights[j] * (dWeights[j] - sum);
          for (let k = 0; k < headDim; k++) {
            dQ[i][h * headDim + k] += dScore * K[j][h * headDim + k] * scale;
            dK[j][h * headDim + k] += dScore * Q[i][h * headDim + k] * scale;
          }
        }
      }
    }
    
    const dX = createMatrix(seqLen, dim);
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < dim; d++) {
        let sum = dX1[i][d];
        for (let j = 0; j < dim; j++) {
          sum += dQ[i][j] * this.Wq[d][j];
          sum += dK[i][j] * this.Wk[d][j];
          sum += dV[i][j] * this.Wv[d][j];
          this.dWq[d][j] += x[i][d] * dQ[i][j];
          this.dWk[d][j] += x[i][d] * dK[i][j];
          this.dWv[d][j] += x[i][d] * dV[i][j];
        }
        this.dbq[d] += dQ[i][d];
        this.dbk[d] += dK[i][d];
        this.dbv[d] += dV[i][d];
        dX[i][d] = sum;
      }
    }
    
    return dX;
  }
  
  /**
   * Apply AdamW updates to block parameters.
   * @param {number} lr
   * @param {number} weightDecay
   * @param {number} beta1
   * @param {number} beta2
   * @param {number} epsilon
   * @param {number} step
   */
  applyAdamW(lr, weightDecay, beta1, beta2, epsilon, step) {
    const updateMatrix = (param, grad, m, v) => {
      for (let i = 0; i < param.length; i++) {
        const row = param[i];
        const grow = grad[i];
        const mrow = m[i];
        const vrow = v[i];
        for (let j = 0; j < row.length; j++) {
          const g = grow[j];
          mrow[j] = beta1 * mrow[j] + (1 - beta1) * g;
          vrow[j] = beta2 * vrow[j] + (1 - beta2) * g * g;
          const mHat = mrow[j] / (1 - Math.pow(beta1, step));
          const vHat = vrow[j] / (1 - Math.pow(beta2, step));
          row[j] -= lr * (mHat / (Math.sqrt(vHat) + epsilon) + weightDecay * row[j]);
          grow[j] = 0;
        }
      }
    };
    
    const updateVector = (param, grad, m, v) => {
      for (let i = 0; i < param.length; i++) {
        const g = grad[i];
        m[i] = beta1 * m[i] + (1 - beta1) * g;
        v[i] = beta2 * v[i] + (1 - beta2) * g * g;
        const mHat = m[i] / (1 - Math.pow(beta1, step));
        const vHat = v[i] / (1 - Math.pow(beta2, step));
        param[i] -= lr * (mHat / (Math.sqrt(vHat) + epsilon) + weightDecay * param[i]);
        grad[i] = 0;
      }
    };
    
    updateMatrix(this.Wq, this.dWq, this.m_Wq, this.v_Wq);
    updateMatrix(this.Wk, this.dWk, this.m_Wk, this.v_Wk);
    updateMatrix(this.Wv, this.dWv, this.m_Wv, this.v_Wv);
    updateMatrix(this.Wo, this.dWo, this.m_Wo, this.v_Wo);
    updateVector(this.bq, this.dbq, this.m_bq, this.v_bq);
    updateVector(this.bk, this.dbk, this.m_bk, this.v_bk);
    updateVector(this.bv, this.dbv, this.m_bv, this.v_bv);
    updateVector(this.bo, this.dbo, this.m_bo, this.v_bo);
    
    updateMatrix(this.W1, this.dW1, this.m_W1, this.v_W1);
    updateVector(this.b1, this.db1, this.m_b1, this.v_b1);
    updateMatrix(this.W2, this.dW2, this.m_W2, this.v_W2);
    updateVector(this.b2, this.db2, this.m_b2, this.v_b2);
  }
}

/**
 * Transformer network for modular arithmetic grokking.
 */
class TransformerNetwork {
  /**
   * @param {object} config
   */
  constructor(config) {
    const {
      numLayers,
      dimModel,
      numHeads,
      numTokens,
      seqLen,
      learningRate,
      weightDecay,
      ffnDim
    } = config;
    
    this.numLayers = numLayers;
    this.dimModel = dimModel;
    this.numHeads = numHeads;
    this.numTokens = numTokens;
    this.seqLen = seqLen;
    this.learningRate = learningRate;
    this.weightDecay = weightDecay;
    this.ffnDim = ffnDim ?? dimModel * 4;
    
    this.tokenEmbedding = randomMatrix(numTokens, dimModel);
    this.positionEmbedding = randomMatrix(seqLen, dimModel);
    
    this.blocks = [];
    for (let i = 0; i < numLayers; i++) {
      this.blocks.push(new TransformerBlock(dimModel, numHeads, this.ffnDim));
    }
    
    this.Wout = randomMatrix(dimModel, numTokens);
    this.bout = createVector(numTokens);
    
    this.dTokenEmbedding = createMatrix(numTokens, dimModel);
    this.dPositionEmbedding = createMatrix(seqLen, dimModel);
    this.dWout = createMatrix(dimModel, numTokens);
    this.dbout = createVector(numTokens);
    
    this.m_tokenEmbedding = createMatrix(numTokens, dimModel);
    this.v_tokenEmbedding = createMatrix(numTokens, dimModel);
    this.m_positionEmbedding = createMatrix(seqLen, dimModel);
    this.v_positionEmbedding = createMatrix(seqLen, dimModel);
    this.m_Wout = createMatrix(dimModel, numTokens);
    this.v_Wout = createMatrix(dimModel, numTokens);
    this.m_bout = createVector(numTokens);
    this.v_bout = createVector(numTokens);
    
    this.step = 0;
    this.hiddenActivations = createVector(dimModel);
    this.outputActivations = createVector(numTokens);
    this.attentionWeights = null;
  }
  
  /**
   * Reset accumulated gradients.
   */
  resetGradients() {
    for (let i = 0; i < this.dTokenEmbedding.length; i++) {
      this.dTokenEmbedding[i].fill(0);
    }
    for (let i = 0; i < this.dPositionEmbedding.length; i++) {
      this.dPositionEmbedding[i].fill(0);
    }
    for (let i = 0; i < this.dWout.length; i++) {
      this.dWout[i].fill(0);
    }
    this.dbout.fill(0);
    for (const block of this.blocks) {
      block.resetGradients();
    }
  }
  
  /**
   * Forward pass for a single token sequence.
   * @param {number[]} tokens
   * @returns {{ logits: Float32Array[], probs: Float32Array, hidden: Float32Array, cache: object }}
   */
  forward(tokens) {
    const seqLen = tokens.length;
    const x = createMatrix(seqLen, this.dimModel);
    for (let i = 0; i < seqLen; i++) {
      const token = tokens[i];
      const tokenRow = this.tokenEmbedding[token];
      const posRow = this.positionEmbedding[i];
      for (let d = 0; d < this.dimModel; d++) {
        x[i][d] = tokenRow[d] + posRow[d];
      }
    }
    
    const blockCaches = [];
    let out = x;
    let attentionWeights = null;
    for (const block of this.blocks) {
      const result = block.forward(out);
      out = result.output;
      attentionWeights = result.attentionWeights;
      blockCaches.push(result.cache);
    }
    
    const logits = createMatrix(seqLen, this.numTokens);
    for (let i = 0; i < seqLen; i++) {
      for (let t = 0; t < this.numTokens; t++) {
        let sum = this.bout[t];
        for (let d = 0; d < this.dimModel; d++) {
          sum += out[i][d] * this.Wout[d][t];
        }
        logits[i][t] = sum;
      }
    }
    
    const last = logits[seqLen - 1];
    let maxVal = -Infinity;
    for (let i = 0; i < last.length; i++) {
      if (last[i] > maxVal) maxVal = last[i];
    }
    let sum = 0;
    const probs = new Float32Array(last.length);
    for (let i = 0; i < last.length; i++) {
      const v = Math.exp(last[i] - maxVal);
      probs[i] = v;
      sum += v;
    }
    const inv = sum > 0 ? 1 / sum : 0;
    for (let i = 0; i < probs.length; i++) {
      probs[i] *= inv;
    }
    
    this.hiddenActivations = out[seqLen - 1];
    this.outputActivations = probs;
    this.attentionWeights = attentionWeights;
    
    return {
      logits,
      probs,
      hidden: out[seqLen - 1],
      cache: { tokens, x, out, logits, blockCaches }
    };
  }
  
  /**
   * Backward pass for a single sequence.
   * @param {number[]} tokens
   * @param {number} target
   * @param {object} cache
   */
  backward(tokens, target, cache) {
    const seqLen = tokens.length;
    const dLogits = createMatrix(seqLen, this.numTokens);
    const probs = this.outputActivations;
    for (let i = 0; i < probs.length; i++) {
      dLogits[seqLen - 1][i] = probs[i] - (i === target ? 1 : 0);
    }
    
    const dOut = createMatrix(seqLen, this.dimModel);
    for (let i = 0; i < seqLen; i++) {
      for (let t = 0; t < this.numTokens; t++) {
        const grad = dLogits[i][t];
        for (let d = 0; d < this.dimModel; d++) {
          dOut[i][d] += grad * this.Wout[d][t];
          this.dWout[d][t] += cache.out[i][d] * grad;
        }
        this.dbout[t] += grad;
      }
    }
    
    let dX = dOut;
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      dX = this.blocks[i].backward(dX, cache.blockCaches[i]);
    }
    
    for (let i = 0; i < seqLen; i++) {
      const token = tokens[i];
      for (let d = 0; d < this.dimModel; d++) {
        this.dTokenEmbedding[token][d] += dX[i][d];
        this.dPositionEmbedding[i][d] += dX[i][d];
      }
    }
  }
  
  /**
   * Apply AdamW updates.
   * @param {number} batchSize
   */
  applyAdamW(batchSize) {
    this.step++;
    const lr = this.learningRate / Math.max(1, batchSize);
    const wd = this.weightDecay;
    const beta1 = 0.9;
    const beta2 = 0.98;
    const eps = 1e-8;
    
    const updateMatrix = (param, grad, m, v) => {
      for (let i = 0; i < param.length; i++) {
        const row = param[i];
        const grow = grad[i];
        const mrow = m[i];
        const vrow = v[i];
        for (let j = 0; j < row.length; j++) {
          const g = grow[j];
          mrow[j] = beta1 * mrow[j] + (1 - beta1) * g;
          vrow[j] = beta2 * vrow[j] + (1 - beta2) * g * g;
          const mHat = mrow[j] / (1 - Math.pow(beta1, this.step));
          const vHat = vrow[j] / (1 - Math.pow(beta2, this.step));
          row[j] -= lr * (mHat / (Math.sqrt(vHat) + eps) + wd * row[j]);
          grow[j] = 0;
        }
      }
    };
    
    const updateVector = (param, grad, m, v) => {
      for (let i = 0; i < param.length; i++) {
        const g = grad[i];
        m[i] = beta1 * m[i] + (1 - beta1) * g;
        v[i] = beta2 * v[i] + (1 - beta2) * g * g;
        const mHat = m[i] / (1 - Math.pow(beta1, this.step));
        const vHat = v[i] / (1 - Math.pow(beta2, this.step));
        param[i] -= lr * (mHat / (Math.sqrt(vHat) + eps) + wd * param[i]);
        grad[i] = 0;
      }
    };
    
    updateMatrix(this.tokenEmbedding, this.dTokenEmbedding, this.m_tokenEmbedding, this.v_tokenEmbedding);
    updateMatrix(this.positionEmbedding, this.dPositionEmbedding, this.m_positionEmbedding, this.v_positionEmbedding);
    updateMatrix(this.Wout, this.dWout, this.m_Wout, this.v_Wout);
    updateVector(this.bout, this.dbout, this.m_bout, this.v_bout);
    
    for (const block of this.blocks) {
      block.applyAdamW(lr, wd, beta1, beta2, eps, this.step);
    }
  }
  
  /**
   * Predict the output token for a sequence.
   * @param {number[]} tokens
   * @returns {number}
   */
  predict(tokens) {
    const { probs } = this.forward(tokens);
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
}

/**
 * Generate transformer-friendly dataset for modular addition.
 * @param {number} mod
 * @returns {Array<{input: number[], target: number, original: number[]}>}
 */
function generateAllPairsDataset(mod) {
  const data = [];
  const eqToken = mod;
  const opToken = mod + 1;
  for (let a = 0; a < mod; a++) {
    for (let b = 0; b < mod; b++) {
      data.push({
        input: [a, opToken, b, eqToken],
        target: (a + b) % mod,
        original: [a, b]
      });
    }
  }
  return data;
}

/**
 * Split dataset into train and test partitions.
 * @param {Array} dataset
 * @param {number} trainSplit
 * @returns {{train: Array, test: Array}}
 */
function splitDataset(dataset, trainSplit) {
  const shuffled = [...dataset];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const splitIdx = Math.floor(shuffled.length * trainSplit);
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx)
  };
}

/**
 * Calculate accuracy for a dataset.
 * @param {TransformerNetwork} network
 * @param {Array} dataset
 * @returns {number}
 */
function calculateAccuracy(network, dataset) {
  let correct = 0;
  for (const example of dataset) {
    if (network.predict(example.input) === example.target) {
      correct++;
    }
  }
  return correct / dataset.length;
}

export {
  TransformerNetwork,
  generateAllPairsDataset,
  splitDataset,
  calculateAccuracy
};
