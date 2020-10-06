import {
  CircuitBreakerConfig,
  ICircuitBreakerConfig,
} from "./CircuitBreakerConfig";
import { LocalState } from "./state-manager/internal/LocalState";
import { CircuitBreakerMetrics } from "./metrics/CircuitBreakerMetrics";
import { CircuitBreakerStateManager } from "./state-manager/CircuitBreakerStateManager";
import { DistributedState } from "./state-manager/distributed/DistributedState";

export class CircuitBreaker {
  readonly config: CircuitBreakerConfig;
  readonly metrics: CircuitBreakerMetrics;
  readonly currentStateManager: CircuitBreakerStateManager;

  constructor(configOptions: ICircuitBreakerConfig) {
    this.config = new CircuitBreakerConfig(configOptions);
    this.metrics = new CircuitBreakerMetrics(this.config);
    if (configOptions.distributedStateConfig) {
      this.currentStateManager = new DistributedState(
        this.config,
        this.metrics
      );
    } else {
      this.currentStateManager = new LocalState(this.config, this.metrics);
    }
  }

  async exec(cb: Function) {
    const currentState = await this.currentStateManager.getState();
    return currentState.exec(cb);
  }
}
