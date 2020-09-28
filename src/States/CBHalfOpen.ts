import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class HalfOpenState implements State {
  readonly state = "HALF_OPEN";

  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
  }

  init() {
    this.cb.metrics.resetSlidingWindow(
      this.cb.config.permittedNumberOfCallsInHalfOpenState
    );
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.cb.metrics.recordSuccess();

      if (this.isReadyToCloseCB()) this.cb.transitionToClosedState();

      return res;
    } catch (error) {
      this.cb.metrics.recordError();
      if (
        this.cb.metrics.isSlidingWindowFull() &&
        this.cb.metrics.hasExceededErrorThreshold()
      )
        this.cb.transitionToOpenState();
      return this.cb.resumeWithFallback(error);
    }
  }

  isReadyToCloseCB() {
    return (
      this.cb.metrics.isSlidingWindowFull() &&
      !this.cb.metrics.hasExceededErrorThreshold()
    );
  }
}
