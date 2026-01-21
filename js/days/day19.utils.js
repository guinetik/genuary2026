/**
 * Shared utilities for day19 neural network visualization
 * @module day19.utils
 */

/**
 * Fisher-Yates shuffle - in-place array randomization
 * @param {Array} array - Array to shuffle (mutated in place)
 * @returns {Array} The same array, shuffled
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Create a shuffled array of indices [0, 1, 2, ..., n-1]
 * @param {number} length - Number of indices to generate
 * @returns {number[]} Shuffled array of indices
 */
export function shuffledIndices(length) {
  const indices = new Array(length);
  for (let i = 0; i < length; i++) indices[i] = i;
  return shuffle(indices);
}
