'use strict';

const { Semaphore, TokenBucket } = require('../lib/limiter');

require('chai').should();

describe('Semaphore', () => {
  context('given a limit of 2', () => {
    it('should resolve immediately when under the limit', () => {
      const sem = new Semaphore(2);
      return sem.acquire()
        .then(() => sem.acquire())
        .then(() => sem.running.should.equal(2));
    });

    it('should block the third acquire until a release', done => {
      const sem = new Semaphore(2);

      sem.acquire();
      sem.acquire();

      let resolved = false;
      sem.acquire().then(() => { resolved = true; });

      setTimeout(() => {
        resolved.should.equal(false);
        sem.release();

        setTimeout(() => {
          resolved.should.equal(true);
          done();
        }, 10);
      }, 20);
    });

    it('should decrement running on release', () => {
      const sem = new Semaphore(1);
      return sem.acquire()
        .then(() => {
          sem.running.should.equal(1);
          sem.release();
          sem.running.should.equal(0);
        });
    });

    it('should process queued acquires in order', () => {
      const sem = new Semaphore(1);
      const order = [];

      return sem.acquire().then(() => {
        const p1 = sem.acquire().then(() => { order.push(1); sem.release(); });
        const p2 = sem.acquire().then(() => { order.push(2); sem.release(); });

        sem.release();

        return Promise.all([p1, p2]).then(() => {
          order.should.deep.equal([1, 2]);
        });
      });
    });
  });
});

describe('TokenBucket', () => {
  context('given a rate of 10 tokens per second', () => {
    it('should consume up to capacity immediately', () => {
      const bucket = new TokenBucket(10);
      const start = Date.now();
      const consumptions = [];
      for (let i = 0; i < 10; i++) {
        consumptions.push(bucket.consume());
      }
      return Promise.all(consumptions).then(() => {
        (Date.now() - start).should.be.below(100);
      });
    });

    it('should wait when tokens are exhausted', () => {
      const bucket = new TokenBucket(10);
      const consumptions = [];
      for (let i = 0; i < 10; i++) {
        consumptions.push(bucket.consume());
      }
      return Promise.all(consumptions).then(() => {
        const start = Date.now();
        return bucket.consume().then(() => {
          (Date.now() - start).should.be.at.least(80);
        });
      });
    });

    it('should refill tokens over time', done => {
      const bucket = new TokenBucket(10);
      const consumptions = [];
      for (let i = 0; i < 10; i++) {
        consumptions.push(bucket.consume());
      }
      Promise.all(consumptions).then(() => {
        setTimeout(() => {
          bucket._refill();
          bucket.tokens.should.be.at.least(1.5);
          done();
        }, 200);
      });
    });

    it('should not exceed capacity on refill', done => {
      const bucket = new TokenBucket(5);
      setTimeout(() => {
        bucket._refill();
        bucket.tokens.should.be.at.most(5);
        done();
      }, 300);
    });
  });
});
