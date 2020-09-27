import { RingBuffer } from "../Ringbuffer";

const invokeCB = (cb: Function, N: number) => {
  for (let i = 0; i < N; i++) cb();
};

const toDecimal = (binary: string) => parseInt(binary, 2);

describe("Ring Buffer", () => {
  it("should record errors correctly", () => {
    const rb = new RingBuffer(1);
    rb.recordError();
    rb.recordError();
    const expectedBuffer = [toDecimal("11")];
    expect(rb.internalBuffer).toEqual(new Uint32Array(expectedBuffer));
  });

  it("should record successes correctly", () => {
    const rb = new RingBuffer(1);
    rb.recordSuccess();
    const expectedBuffer = [toDecimal("0")];
    expect(rb.internalBuffer).toEqual(new Uint32Array(expectedBuffer));
  });

  it("should record successes + errors correctly", () => {
    const rb = new RingBuffer(1);
    rb.recordSuccess();
    rb.recordError();
    rb.recordSuccess();
    rb.recordError();
    rb.recordSuccess();
    const expectedBuffer = [toDecimal("01010")];
    expect(rb.internalBuffer).toEqual(new Uint32Array(expectedBuffer));
  });

  it("should use correct modulo arithmetic when moving to next bit in Buffer", () => {
    const rb = new RingBuffer(2);
    for (let i = 0; i < 32; i++) rb.recordSuccess();
    rb.recordError();
    expect(rb.internalBuffer).toEqual(new Uint32Array([0, 1]));
  });

  it("should cycle back round once buffer is full", () => {
    const rb = new RingBuffer(1);
    for (let i = 0; i < 32; i++) rb.recordSuccess();
    rb.recordError();
    expect(rb.internalBuffer).toEqual(new Uint32Array([1]));
  });

  it("should return correct error threshold", () => {
    const rb = new RingBuffer(1);
    const numOfErrors = 10;
    for (let i = 0; i < 10; i++) rb.recordError();

    const numOfSuccesses = 32 - numOfErrors;
    const expectedAnswer = Math.floor(
      (numOfErrors / (numOfErrors + numOfSuccesses)) * 100
    );

    expect(rb.currentErrorThreshold).toEqual(expectedAnswer);
  });

  it.only("should return correct error threshold - 2", () => {
    const rb = new RingBuffer(2);

    for (let i = 0; i < 30; i++) rb.recordSuccess();
    for (let i = 0; i < 10; i++) rb.recordError();
    for (let i = 0; i < 20; i++) rb.recordSuccess();
    for (let i = 0; i < 4; i++) rb.recordError();
    for (let i = 0; i < 2; i++) rb.recordSuccess();
    // for (let i = 0; i < 40; i++) rb.recordError();
    // for (let i = 0; i < 60; i++) rb.recordError();

    // const numOfSuccesses = 32 - numOfErrors;
    // const expectedAnswer = Math.floor(
    //   (numOfErrors / (numOfErrors + numOfSuccesses)) * 100
    // );

    expect(rb.currentErrorThreshold).toEqual(0);
  });
});
