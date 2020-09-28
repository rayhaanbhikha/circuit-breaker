import {
  CircuitBreakerConfig,
  ICircuitBreakerConfig,
} from "./CircuitBreakerConfig";
import {
  CircuitBreakerLocalState,
  CircuitBreakerState,
} from "./CircuitBreakerLocalState";
import { CircuitBreakerMetrics } from "./CircuitBreakerMetrics";
import { ClosedState } from "./States/CBClosed";
import { HalfOpenState } from "./States/CBHalfOpen";
import { OpenState } from "./States/CBOpen";
import { State } from "./States/State";

export class CircuitBreaker {
  readonly config: CircuitBreakerConfig;
  readonly metrics: CircuitBreakerMetrics;
  readonly currentStateManager: CircuitBreakerState;

  constructor(configOptions: ICircuitBreakerConfig) {
    this.config = new CircuitBreakerConfig(configOptions);
    this.metrics = new CircuitBreakerMetrics(this.config);
    this.currentStateManager = new CircuitBreakerLocalState(
      this.config,
      this.metrics
    );
  }

  async exec(cb: Function) {
    const currentState = await this.currentStateManager.getState();
    return currentState.exec(cb);
  }
}
