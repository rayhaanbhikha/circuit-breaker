import { CircuitBreaker } from "../CircuitBreaker";
import { State } from "./State";

export class OpenState implements State {
  readonly state = "OPEN";
  private cb: CircuitBreaker;
  constructor(cb: CircuitBreaker) {
    this.cb = cb;
    cb.setState(cb.openState);
    this.startTimerToHalfOpenState();
  }

  startTimerToHalfOpenState() {
    setTimeout(
      this.transitionToNextState,
      this.cb.config.waitDurationInOpenState
    );
  }

  transitionToNextState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    this.cb.setState(this.cb.halfOpenState);
  }

  exec(cb: Function) {
    return this.cb.config.fallback();
  }
}
