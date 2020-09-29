import { State } from "./States/State";
import { ClosedState } from "./States/CBClosed";
import { HalfOpenState } from "./States/CBHalfOpen";
import { OpenState } from "./States/CBOpen";
import { CircuitBreakerConfig } from "./CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "./CircuitBreakerMetrics";
import { CircuitBreakerState } from "./CircuitBreakerState";

export class LocalState implements CircuitBreakerState {
  private currentState?: State;
  private closedState: ClosedState;
  private openState: OpenState;
  private halfOpenState: HalfOpenState;

  constructor(config: CircuitBreakerConfig, metrics: CircuitBreakerMetrics) {
    this.closedState = new ClosedState(config, metrics, this);
    this.openState = new OpenState(config, metrics, this);
    this.halfOpenState = new HalfOpenState(config, metrics, this);
  }

  async setCurrentState(newState: State) {
    this.currentState = newState;
    this.currentState.init();
  }

  init() {
    if (!this.currentState) {
      this.setCurrentState(this.closedState);
    }
  }

  getState() {
    this.init();
    return Promise.resolve(this.currentState as State);
  }

  async transitionToOpenState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    return this.setCurrentState(this.openState);
  }

  async transitionToClosedState() {
    console.log("TRANSITIONED TO ---->>>> CLOSED STATE");
    return this.setCurrentState(this.closedState);
  }

  async transitionToHalfOpenState() {
    console.log("TRANSITIONED TO ---->>>> HALF_OPEN STATE");
    return this.setCurrentState(this.halfOpenState);
  }
}
