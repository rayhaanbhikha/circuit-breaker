import nock from "nock";
import axios from "axios";

import { CircuitBreaker } from "../src/CircuitBreaker";
import { CallsNotPermittedException } from "../src/Exceptions/CallsNotPermittedException";
import { Time } from "../src/time";

const resourceURL = "http://localhost:8000";

const successfulAPICall = () => axios.get(`${resourceURL}/success`);
const failedAPICall = () => axios.get(`${resourceURL}/error`);
const timeoutAPICall = () => axios.get(`${resourceURL}/timeout`);

describe("LOCAL Circuit breaker", () => {
  let cb: CircuitBreaker;

  nock(resourceURL).get("/success").reply(200, "resource found").persist();
  nock(resourceURL).get("/error").reply(500, "internal server error").persist();
  // nock(resourceURL).get("/timeout").delay(1_000).reply(200).persist();

  beforeEach(() => {
    jest.useFakeTimers();

    cb = new CircuitBreaker({
      failureRateThreshold: 50,
      waitDurationInOpenState: 10_000,
      permittedNumberOfCallsInHalfOpenState: 10,
      slidingWindowSize: 20,
      slowCallDurationThreshold: 3_000,
      slowCallRateThreshold: 10,
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

  describe("Slow Requests", () => {
    it("should transition circuit breaker to OPEN state if calls timeout", async () => {
      const { state: prevState } = await cb.currentStateManager.getState();
      expect(prevState).toEqual("CLOSED");

      for (let i = 0; i < 20; i++) {
        jest.spyOn(Time, "differenceInMilliseconds").mockReturnValue(5_000);
        await cb.exec(successfulAPICall);
      }

      const { state } = await cb.currentStateManager.getState();
      expect(state).toEqual("OPEN");
    });

    it.only("should transition circuit breaker from OPEN -> HALF_OPEN -> OPEN", async () => {
      const { state: prevState } = await cb.currentStateManager.getState();
      expect(prevState).toEqual("CLOSED");

      for (let i = 0; i < 20; i++) {
        jest.spyOn(Time, "differenceInMilliseconds").mockReturnValue(5_000);
        await cb.exec(successfulAPICall);
      }

      const { state } = await cb.currentStateManager.getState();
      expect(state).toEqual("OPEN");

      jest.runTimersToTime(10_000);

      const {
        state: intermiediatteState,
      } = await cb.currentStateManager.getState();
      expect(intermiediatteState).toEqual("HALF_OPEN");

      for (let i = 0; i < 20; i++) {
        jest.spyOn(Time, "differenceInMilliseconds").mockReturnValue(5_000);
        await cb.exec(successfulAPICall);
      }

      const { state: finalState } = await cb.currentStateManager.getState();
      expect(finalState).toEqual("OPEN");
    });
  });
});
