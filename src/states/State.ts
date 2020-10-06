import { CircuitBreakerMetrics } from "../metrics/CircuitBreakerMetrics";

export interface State {
  state: CIRCUIT_BREAKER_STATES;
  init: () => void;
  exec: (cb: Function) => Promise<any>;
}

export enum CIRCUIT_BREAKER_STATES {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export class BaseState {
  protected metrics: CircuitBreakerMetrics;
  constructor(metrics: CircuitBreakerMetrics) {
    this.metrics = metrics;
  }

  protected isReadyToOpenCB() {
    return (
      (this.metrics.isErrorSlidingWindowFull &&
        this.metrics.hasExceededErrorThreshold()) ||
      (this.metrics.isSlowDurationSlidingWindowFull &&
        this.metrics.hasExceededSlowRateThreshold())
    );
  }

  protected isReadyToCloseCB() {
    return (
      this.metrics.isErrorSlidingWindowFull &&
      !this.metrics.hasExceededErrorThreshold() &&
      this.metrics.isSlowDurationSlidingWindowFull &&
      !this.metrics.hasExceededSlowRateThreshold()
    );
  }
}
