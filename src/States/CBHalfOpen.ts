import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class HalfOpenState implements State {
  readonly state = "HALF_OPEN";

  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
    cb.setState(cb.halfOpenState);
    this.cb.metrics.resetSlidingWindow(
      this.cb.config.permittedNumberOfCallsInHalfOpenState
    );
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.cb.metrics.recordSuccess();

      if (this.isReadyToCloseCB()) this.transitionToClosedState();

      return res;
    } catch (error) {
      this.cb.metrics.recordError();
      if (this.cb.metrics.hasExceededErrorThreshold())
        this.transitionToOpenState();
      return this.cb.config.fallback(); // or throw error
    }
  }

  transitionToOpenState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    this.cb.setState(this.cb.openState);
  }

  transitionToClosedState() {
    console.log("TRANSITIONED TO ---->>>> CLOSED STATE");
    this.cb.setState(this.cb.closedState);
  }

  isReadyToCloseCB() {
    return (
      this.cb.metrics.isSlidingWindowFull() &&
      !this.cb.metrics.hasExceededErrorThreshold()
    );
  }
}
