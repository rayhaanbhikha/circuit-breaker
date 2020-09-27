import { RingBuffer } from "../Ringbuffer";

const invokeCB = (cb: Function, N: number) => {
  for (let i = 0; i < N; i++) cb();
};

const toDecimal = (binary: string) => parseInt(binary, 2);

describe("Ring Buffer", () => {
  it("should record errors correctly", () => {
    const rb = new RingBuffer(10);
    rb.recordError();
    rb.recordError();
    expect(rb.internalBuffer).toEqual([1, 1]);
  });

  it("should record successes correctly", () => {
    const rb = new RingBuffer(10);
    rb.recordSuccess();
    expect(rb.internalBuffer).toEqual([0]);
  });

  it("should record successes + errors correctly", () => {
    const rb = new RingBuffer(10);
    rb.recordSuccess();
    rb.recordError();
    rb.recordSuccess();
    rb.recordError();
    rb.recordSuccess();
    expect(rb.internalBuffer).toEqual([0, 1, 0, 1, 0]);
  });

  it("should cycle back round once buffer is full", () => {
    const rb = new RingBuffer(5);
    for (let i = 0; i < 10; i++) rb.recordSuccess();
    rb.recordError();
    expect(rb.internalBuffer).toEqual([1, 0, 0, 0, 0]);
  });

  it("should return correct error threshold", () => {
    const rb = new RingBuffer(100);
    const numOfErrors = 10;
    const numOfSuccesses = 30;
    for (let i = 0; i < numOfErrors; i++) rb.recordError();
    for (let i = 0; i < numOfSuccesses; i++) rb.recordSuccess();

    const expectedAnswer = Math.floor(
      (numOfErrors / (numOfErrors + numOfSuccesses)) * 100
    );

    expect(rb.currentErrorThreshold).toEqual(expectedAnswer);
  });
});
