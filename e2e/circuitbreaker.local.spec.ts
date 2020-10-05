import nock from "nock";
import axios from "axios";

import { CircuitBreaker } from "../src/CircuitBreaker";
import { CallsNotPermittedException } from "../src/Exceptions/CallsNotPermittedException";

const resourceURL = "http://localhost:8000";

const successfulAPICall = () => axios.get(`${resourceURL}/success`);
const failedAPICall = () => axios.get(`${resourceURL}/error`);
const timeoutAPICall = () => axios.get(`${resourceURL}/timeout`);

describe("LOCAL Circuit breaker", () => {
  let cb: CircuitBreaker;

  nock(resourceURL).get("/success").reply(200, "resource found").persist();
  nock(resourceURL).get("/error").reply(500, "internal server error").persist();
  nock(resourceURL).get("/timeout").delay(20_000).reply(200);

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
    const { data } = await cb.exec(successfulAPICall);
    const { state } = await cb.currentStateManager.getState();
    expect(data).toEqual("resource found");
    expect(state).toEqual("CLOSED");
  });

  it("should transition circuit breaker to OPEN state", async () => {
    for (let i = 0; i < 15; i++) await cb.exec(failedAPICall).catch(() => {});

    for (let i = 0; i < 6; i++)
      await cb.exec(successfulAPICall).catch(() => {});

    const { state } = await cb.currentStateManager.getState();
    expect(state).toEqual("OPEN");
  });

  it("should transition circuit breaker to HALF_OPEN state after 10s", async () => {
    for (let i = 0; i < 15; i++) await cb.exec(failedAPICall).catch(() => {});

    for (let i = 0; i < 6; i++)
      await cb.exec(successfulAPICall).catch(() => {});

    jest.runTimersToTime(10_000);
    const { state } = await cb.currentStateManager.getState();
    expect(state).toEqual("HALF_OPEN");
  });

  it("should throw CallNotPermittedException", async () => {
    for (let i = 0; i < 21; i++) await cb.exec(failedAPICall).catch(() => {});

    await expect(cb.exec(failedAPICall)).rejects.toThrow(
      CallsNotPermittedException
    );
  });

  // should transition circuit breaker to OPEN state if calls timeout
});
