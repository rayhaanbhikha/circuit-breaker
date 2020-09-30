import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../../CircuitBreakerMetrics";
import { State } from "./State";
import { EventEmitter } from "events";
import { CLOSED_STATE } from "./Closed";
import { OPEN } from "./Open";

export const HALF_OPEN = "HALF_OPEN";

export class HalfOpenState implements State {
  readonly state = HALF_OPEN;
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private stel: EventEmitter;

  constructor(
    config: CircuitBreakerConfig,
    metrics: CircuitBreakerMetrics,
    stel: EventEmitter
  ) {
    this.config = config;
    this.metrics = metrics;
    this.stel = stel;
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

      if (this.isReadyToCloseCB())
        this.stel.emit("TRANSITION_STATE", CLOSED_STATE);

      return res;
    } catch (error) {
      this.metrics.recordError();
      if (
        this.metrics.isSlidingWindowFull() &&
        this.metrics.hasExceededErrorThreshold()
      )
        this.stel.emit("TRANSITION_STATE", OPEN);

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
