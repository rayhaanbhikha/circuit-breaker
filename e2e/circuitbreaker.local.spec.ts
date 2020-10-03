import { CircuitBreaker } from "../src/CircuitBreaker";

describe("LOCAL Circuit breaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    jest.useFakeTimers();

    cb = new CircuitBreaker({
      failureRateThreshold: 50,
      waitDurationInOpenState: 10_000,
      permittedNumberOfCallsInHalfOpenState: 10,
      slidingWindowSize: 20,
    });
  });

  it("should be in a closed state", async () => {
    const res = await cb.exec(jest.fn().mockResolvedValue("hello world"));
    const { state } = await cb.currentStateManager.getState();
    expect(res).toEqual("hello world");
    expect(state).toEqual("CLOSED");
  });

  it("should transition circuit breaker to OPEN state", async () => {
    for (let i = 0; i < 15; i++)
      await cb
        .exec(jest.fn().mockRejectedValue("some-error"))
        .catch((err) => {});

    for (let i = 0; i < 6; i++)
      await cb
        .exec(jest.fn().mockResolvedValue("hello world"))
        .catch((err) => {});

    const { state } = await cb.currentStateManager.getState();
    expect(state).toEqual("OPEN");
  });

  it("should transition circuit breaker to HALF_OPEN state after 10s", async () => {
    for (let i = 0; i < 15; i++)
      await cb
        .exec(jest.fn().mockRejectedValue("some-error"))
        .catch((err) => {});

    for (let i = 0; i < 6; i++)
      await cb
        .exec(jest.fn().mockResolvedValue("hello world"))
        .catch((err) => {});

    jest.runTimersToTime(10_000);
    const { state } = await cb.currentStateManager.getState();
    expect(state).toEqual("HALF_OPEN");
  });
});
