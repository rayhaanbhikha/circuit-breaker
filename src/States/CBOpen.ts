import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerState } from "../CircuitBreakerLocalState";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { State } from "./State";

export class OpenState implements State {
  readonly state = "OPEN";
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private cbState: CircuitBreakerState;

  constructor(
    config: CircuitBreakerConfig,
    metrics: CircuitBreakerMetrics,
    cbState: CircuitBreakerState
  ) {
    this.config = config;
    this.metrics = metrics;
    this.cbState = cbState;
  }

  init() {
    this.startTimerToHalfOpenState();
  }

  startTimerToHalfOpenState() {
    setTimeout(async () => {
      await this.cbState.transitionToHalfOpenState();
    }, this.config.waitDurationInOpenState);
  }

  async exec(cb: Function) {
    console.log("CB currently open");
    return this.config.fallback();
  }
}
