import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerState } from "../CircuitBreakerLocalState";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { State } from "./State";

export class HalfOpenState implements State {
  readonly state = "HALF_OPEN";
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
    this.metrics.resetSlidingWindow(
      this.config.permittedNumberOfCallsInHalfOpenState
    );
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.metrics.recordSuccess();

      if (this.isReadyToCloseCB()) await this.cbState.transitionToClosedState();

      return res;
    } catch (error) {
      this.metrics.recordError();
      if (
        this.metrics.isSlidingWindowFull() &&
        this.metrics.hasExceededErrorThreshold()
      )
        await this.cbState.transitionToOpenState();
      return this.config.fallback(error);
    }
  }

  isReadyToCloseCB() {
    return (
      this.metrics.isSlidingWindowFull() &&
      !this.metrics.hasExceededErrorThreshold()
    );
  }
}
