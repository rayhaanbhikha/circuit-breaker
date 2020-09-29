import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerState } from "../CircuitBreakerState";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { EventEmitter } from "events";

import { State } from "./State";

export class ClosedState implements State {
  readonly state = "CLOSED";
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
    this.metrics.resetSlidingWindow(this.config.slidingWindowSize);
  }

  async exec(callback: Function) {
    try {
      const res = await callback();
      this.metrics.recordSuccess();
      if (this.checkIfCBshouldOpen()) {
        console.log("helo");
        this.stel.emit("TRANSITION_STATE", "OPEN");
      }
      return res;
    } catch (error) {
      // TODO: filter errors with options or status codes?
      this.metrics.recordError();
      if (this.checkIfCBshouldOpen()) {
        this.stel.emit("TRANSITION_STATE", "OPEN");
      }

      return this.config.fallback(error);
    }
  }

  checkIfCBshouldOpen() {
    return (
      this.metrics.isSlidingWindowFull() &&
      this.metrics.hasExceededErrorThreshold()
    );
  }
}
