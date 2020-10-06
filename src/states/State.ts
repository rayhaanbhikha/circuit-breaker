import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";

export interface State {
  state: string;
  init: () => void;
  exec: (cb: Function) => Promise<any>;
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
