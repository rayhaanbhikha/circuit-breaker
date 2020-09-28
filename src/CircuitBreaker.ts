import {
  CircuitBreakerConfig,
  ICircuitBreakerConfig,
} from "./CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "./CircuitBreakerMetrics";
import { ClosedState } from "./States/CBClosed";
import { HalfOpenState } from "./States/CBHalfOpen";
import { OpenState } from "./States/CBOpen";
import { State } from "./States/State";

export class CircuitBreaker {
  private currentState?: State;
  readonly closedState: ClosedState;
  readonly openState: OpenState;
  readonly halfOpenState: HalfOpenState;
  readonly config: CircuitBreakerConfig;
  readonly metrics: CircuitBreakerMetrics;

  constructor(config: ICircuitBreakerConfig) {
    this.closedState = new ClosedState(this);
    this.openState = new OpenState(this);
    this.halfOpenState = new HalfOpenState(this);

    this.config = new CircuitBreakerConfig(config);
    this.metrics = new CircuitBreakerMetrics(this.config);
  }

  setCurrentState(newState: State) {
    this.currentState = newState;
    this.currentState.init();
  }

  async exec(cb: Function) {
    if (!this.currentState) {
      this.setCurrentState(this.closedState);
    }
    return this.currentState?.exec(cb);
  }

  getState() {
    return this.currentState;
  }

  transitionToOpenState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    this.setCurrentState(this.openState);
  }

  transitionToClosedState() {
    console.log("TRANSITIONED TO ---->>>> CLOSED STATE");
    this.setCurrentState(this.closedState);
  }

  transitionToHalfOpenState() {
    console.log("TRANSITIONED TO ---->>>> HALF_OPEN STATE");
    this.setCurrentState(this.halfOpenState);
  }

  resumeWithFallback(error?: Error) {
    if (this.config.fallback) {
      return this.config.fallback();
    } else if (error) {
      throw error;
    } else {
      // TODO: add custom error for this.
      throw new Error("Fallback not configured");
    }
  }
}
