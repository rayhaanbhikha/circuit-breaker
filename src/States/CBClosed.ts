import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class ClosedState implements State {
  readonly state = "CLOSED";
  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
    cb.setState(cb.closedState);
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.cb.metrics.recordSuccess();
      return res;
    } catch (error) {
      this.cb.metrics.recordError();
      if (this.cb.metrics.hasExceededErrorThreshold())
        this.transitionToNextState();
      // should a cb throw the error?
      return this.cb.config.fallback(); // or throw error
    }
  }

  transitionToNextState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    this.cb.setState(this.cb.openState);
  }
}
