import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class OpenState implements State {
  readonly state = "OPEN";
  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
  }

  init() {
    this.startTimerToHalfOpenState();
  }

  startTimerToHalfOpenState() {
    setTimeout(
      () => this.cb.transitionToHalfOpenState(),
      this.cb.config.waitDurationInOpenState
    );
  }

  async exec(cb: Function) {
    console.log("CB currently open");
    return this.cb.resumeWithFallback();
  }
}
