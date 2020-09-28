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
  private currentState: State;
  readonly closedState: ClosedState;
  readonly openState: OpenState;
  readonly halfOpenState: HalfOpenState;
  readonly config: CircuitBreakerConfig;
  readonly metrics: CircuitBreakerMetrics;

  constructor(config: ICircuitBreakerConfig) {
    this.closedState = new ClosedState(this);
    this.openState = new OpenState(this);
    this.halfOpenState = new HalfOpenState(this);
    this.currentState = this.closedState;

    this.config = new CircuitBreakerConfig(config);
    this.metrics = new CircuitBreakerMetrics(this.config);
  }

  setState(newState: State) {
    this.currentState = newState;
  }

  exec(cb: Function) {
    return this.currentState.exec(cb);
  }

  getState() {
    return this.currentState;
  }
}
