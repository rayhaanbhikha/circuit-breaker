const hammingWeight = (v: any) => {
  v -= (v >>> 1) & 0x55555555; // works with signed or unsigned shifts
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
};

export class RingBuffer {
  private buffer: Uint32Array;
  private currentByteIndex = 0;
  private currentBufferIndex = 0;
  private bufferFull = false;
  private maxBufferCellSize = 32;

  constructor(size: number) {
    // size / 32
    this.buffer = new Uint32Array(size);
  }

  get bufferSize() {
    return this.currentBufferIndex;
  }

  get internalBuffer() {
    return this.buffer;
  }

  recordError() {
    this.add(1);
  }

  recordSuccess() {
    this.add(0);
  }

  get currentErrorThreshold() {
    let successes = 0;
    let errors = 0;
    const n = Math.min(this.buffer.length - 1, this.currentBufferIndex);
    // console.log(this.buffer);
    this.buffer.forEach((byte) => console.log(byte.toString(2)));
    for (let i = 0; i <= n; i++) {
      const byte = this.buffer[i];
      // c;
      const errorsBitCount = hammingWeight(byte);
      const successesBitCount = hammingWeight(~byte);
      errors += errorsBitCount;
      successes += successesBitCount;
    }
    // for (let i = 0; i <= this.currentBufferIndex; i++) {}
    return Math.floor((errors / (successes + errors)) * 100);
  }

  private add(num: number) {
    if (this.currentByteIndex === this.maxBufferCellSize) {
      this.currentBufferIndex++;
      this.currentByteIndex = 0;
    }

    const index = this.currentBufferIndex % this.buffer.length;
    const newByte = this.buffer[index] << 1;
    this.buffer[index] = num === 0 ? newByte : newByte | 1;
    this.currentByteIndex++;
  }
}

// const rb = new RingBuffer(32);

// rb.recordError();

// console.log(rb);
