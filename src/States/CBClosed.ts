import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerState } from "../CircuitBreakerLocalState";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { State } from "./State";

export class ClosedState implements State {
  readonly state = "CLOSED";
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
    this.metrics.resetSlidingWindow(this.config.slidingWindowSize);
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.metrics.recordSuccess();
      return res;
    } catch (error) {
      // TODO: filter errors with options or status codes?
      this.metrics.recordError();
      if (
        this.metrics.isSlidingWindowFull() &&
        this.metrics.hasExceededErrorThreshold()
      )
        this.cbState.transitionToOpenState();

      return this.config.fallback(error);
    }
  }
}
