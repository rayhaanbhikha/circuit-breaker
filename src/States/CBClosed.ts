import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class ClosedState implements State {
  readonly state = "CLOSED";
  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
  }

  init() {
    this.cb.metrics.resetSlidingWindow(this.cb.config.slidingWindowSize);
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.cb.metrics.recordSuccess();
      return res;
    } catch (error) {
      // TODO: filter errors with options or status codes?
      this.cb.metrics.recordError();
      if (
        this.cb.metrics.isSlidingWindowFull() &&
        this.cb.metrics.hasExceededErrorThreshold()
      )
        this.cb.transitionToOpenState();

      return this.cb.resumeWithFallback(error);
    }
  }
}
