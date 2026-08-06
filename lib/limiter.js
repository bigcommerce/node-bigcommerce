'use strict';

/**
 * Rate limiter primitives for controlling API request concurrency and throughput.
 */

/**
 * Semaphore limits the number of concurrent in-flight operations.
 */
class Semaphore {
  constructor(limit) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  acquire() {
    if (this.running < this.limit) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release() {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

/**
 * TokenBucket limits the rate of operations to tokensPerSecond.
 * Starts full, allowing an initial burst up to capacity.
 */
class TokenBucket {
  constructor(tokensPerSecond) {
    this.tokensPerSecond = tokensPerSecond;
    this.tokens = tokensPerSecond;
    this.lastRefill = Date.now();
  }

  async consume() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = 1000 / this.tokensPerSecond;
    await new Promise(resolve => setTimeout(resolve, waitMs));
    return this.consume();
  }

  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.tokensPerSecond, this.tokens + (elapsed * this.tokensPerSecond));
    this.lastRefill = now;
  }
}

module.exports = { Semaphore, TokenBucket };
