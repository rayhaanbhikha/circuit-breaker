import {
  CircuitBreakerConfig,
  ICircuitBreakerConfig,
} from "./CircuitBreakerConfig";
import { LocalState } from "./LocalState";
import { CircuitBreakerMetrics } from "./CircuitBreakerMetrics";
import { CircuitBreakerState } from "./CircuitBreakerState";

export class CircuitBreaker {
  readonly config: CircuitBreakerConfig;
  readonly metrics: CircuitBreakerMetrics;
  readonly currentStateManager: CircuitBreakerState;

  constructor(configOptions: ICircuitBreakerConfig) {
    this.config = new CircuitBreakerConfig(configOptions);
    this.metrics = new CircuitBreakerMetrics(this.config);
    this.currentStateManager = new LocalState(this.config, this.metrics);
  }

  async exec(cb: Function) {
    const currentState = await this.currentStateManager.getState();
    return currentState.exec(cb);
  }
}
