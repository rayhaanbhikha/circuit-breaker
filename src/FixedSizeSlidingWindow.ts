export class FixedSizeSlidingWindow {
  private buffer: number[];
  private currentBufferIndex = 0;
  private bufferMaxSize: number;

  constructor(size: number) {
    this.bufferMaxSize = size;
    this.buffer = [];
  }

  get isFull() {
    return this.buffer.length === this.bufferMaxSize;
  }

  get currentErrorThreshold() {
    let successes = 0;
    let errors = 0;

    this.buffer.forEach((item) => {
      if (item === 0) {
        successes++;
      } else {
        errors++;
      }
    });

    return Math.floor((errors / (successes + errors)) * 100);
  }

  add(num: number) {
    const index = this.currentBufferIndex % this.bufferMaxSize;
    this.buffer[index] = num;
    this.currentBufferIndex++;
  }
}
